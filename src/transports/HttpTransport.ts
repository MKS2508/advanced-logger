import type {
    TransportRecord,
    TransportOptions,
    ITransport,
    IBufferedTransport,
    HookEvent,
    HookLogEntry
} from '../types/index.js';

/**
 * Configuración para {@link HttpTransport}. Extiende {@link TransportOptions}
 * con parámetros HTTP: URL destino, headers custom, buffer acotado,
 * retry con backoff para fallos transitorios, timeout de fetch por intento, y
 * un hook `onError` que reporta drops (overflow / 4xx / retry exhausto)
 * sin escalar excepciones al caller.
 *
 * @example
 * // Mínimo: solo URL
 * new HttpTransport({ url: 'https://logs.example.com/ingest' });
 *
 * @example
 * // Con retry/backoff ajustado y hook de errores
 * new HttpTransport({
 *   url: 'https://logs.example.com/ingest',
 *   headers: { Authorization: 'Bearer <REDACTED>' },
 *   maxRetries: 5,
 *   initialBackoffMs: 500,
 *   maxBackoffMs: 30_000,
 *   fetchTimeoutMs: 5_000,
 *   onError: (entry) => metrics.increment('log_drop', { reason: entry.message })
 * });
 */
export interface HttpTransportOptions extends TransportOptions {
    /** URL destino. Se usa POST con body JSON. */
    url?: string;
    /** Headers extra de la request (ej. `Authorization: Bearer ...`). */
    headers?: Record<string, string>;
    /** Tope máximo de records en buffer. En overflow se dropea el más viejo. */
    maxBufferSize?: number;
    /** Reintentos consecutivos por batch antes de dropear los records. */
    maxRetries?: number;
    /** Backoff inicial en ms. Duplica por intento hasta `maxBackoffMs`. */
    initialBackoffMs?: number;
    /** Techo de backoff en ms. */
    maxBackoffMs?: number;
    /** Timeout del fetch en ms (por intento). Default 10_000. */
    fetchTimeoutMs?: number;
    /**
     * Hook opcional que se dispara cuando el buffer hace overflow o un batch
     * se dropea tras `maxRetries`. Recibe una entrada {@link HookLogEntry}
     * sintética.
     */
    onError?: (entry: HookLogEntry) => void | Promise<void>;
}

const DEFAULT_MAX_BUFFER = 10_000;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF = 250;
const DEFAULT_MAX_BACKOFF = 5_000;
const DEFAULT_FETCH_TIMEOUT = 10_000;

/**
 * Transport basado en HTTP. Bufferea records, los batcha por tamaño o
 * intervalo, POSTea el batch como JSON, y reporta fallos vía retry, buffer
 * acotado y un hook `onError` — nunca un `.catch(() => {})` silencioso.
 *
 * Lifecycle de cada batch (driveado internamente por `sendWithRetry`):
 *  1. `fetch(url, { method: 'POST', body, signal })` con un `AbortController`
 *     que aborta tras `fetchTimeoutMs`.
 *  2. Si `response.ok` → batch considerado entregado.
 *  3. Si `4xx` → dropeado sin reintento: el cliente nunca se recupera de un
 *     error de URL/auth/payload mal formado. Se dispara `onError`.
 *  4. Si `5xx` o `fetch` lanza (red caída / abort por timeout) → reintento con
 *     backoff exponencial: arranca en `initialBackoffMs`, duplica por intento,
 *     techo `maxBackoffMs`, hasta `maxRetries` intentos. Tras el agotamiento
 *     el batch se re-bufferiza (o se trimea contra `maxBufferSize`) y se
 *     dispara `onError` con `droppedCount`.
 *
 * El body por defecto es el envelope JSON `{ logs: TransportRecord[] }`.
 * Para cambiar el wire format, sobrescribe los hooks `protected`
 * {@link HttpTransport.serializeBody} y {@link HttpTransport.buildHeaders}
 * (referencia: {@link OtlpTransport}).
 *
 * Extender esta clase es la vía recomendada para shippear un transport
 * nuevo orientado a HTTP.
 *
 * @example
 * // Registro en un logger
 * import logger from '@mks2508/better-logger';
 * import { HttpTransport } from '@mks2508/better-logger/transports';
 *
 * logger.addTransport({
 *   target: new HttpTransport({
 *     url: 'https://logs.example.com/ingest',
 *     flushInterval: 5_000,
 *     batchSize: 100,
 *     onError: (entry) => console.error('[log-drop]', entry.message)
 *   })
 * });
 *
 * @see {@link HttpTransportOptions}
 * @see {@link OtlpTransport}
 */
export class HttpTransport implements IBufferedTransport {
    /** Identificador del transport. Los loggers lo usan para lookup, dedup y logs de diagnóstico. */
    readonly name: string = 'http';

    private buffer: TransportRecord[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private closed = false;

    /** Bag de options — `protected` para que subclasses (ej. {@link OtlpTransport}) puedan leerlo o extenderlo. */
    protected options: HttpTransportOptions;

    /**
     * Crea una instancia de {@link HttpTransport}.
     *
     * Los campos omitidos en `options` se rellenan con defaults sensatos
     * (`batchSize=50`, `maxBufferSize=10_000`, `maxRetries=3`,
     * `initialBackoffMs=250`, `maxBackoffMs=5_000`, `fetchTimeoutMs=10_000`).
     * Si se pasa `flushInterval`, arranca un `setInterval` que flushea cada
     * N ms; si se omite, el flush solo dispara por llenado de `batchSize`.
     *
     * @param {HttpTransportOptions} [options] - Configuración opcional. Si se omite por completo, el transport queda inactivo hasta que se setee `options.url` por otra vía (subclasses).
     *
     * @example
     * const t = new HttpTransport({
     *   url: 'https://logs.example.com/ingest',
     *   flushInterval: 5_000
     * });
     */
    constructor(options?: HttpTransportOptions) {
        this.options = {
            batchSize: DEFAULT_BATCH_SIZE,
            maxBufferSize: DEFAULT_MAX_BUFFER,
            maxRetries: DEFAULT_MAX_RETRIES,
            initialBackoffMs: DEFAULT_INITIAL_BACKOFF,
            maxBackoffMs: DEFAULT_MAX_BACKOFF,
            fetchTimeoutMs: DEFAULT_FETCH_TIMEOUT,
            ...(options ?? {})
        };

        if (this.options.flushInterval) {
            this.flushTimer = setInterval(() => {
                void this.flush();
            }, this.options.flushInterval);
        }
    }

    /** Records actualmente encolados esperando el próximo flush. */
    get bufferSize(): number {
        return this.buffer.length;
    }

    /** Capacidad máxima del buffer. Al superarla, el registro más viejo se dropea y se notifica vía `onError`. */
    get maxBufferSize(): number {
        return this.options.maxBufferSize ?? DEFAULT_MAX_BUFFER;
    }

    /**
     * Indica si el transport está listo para aceptar y entregar records.
     * Devuelve `false` tras {@link close} o si no se configuró `url`.
     *
     * @returns {boolean} `true` si el transport puede enviar.
     */
    isReady(): boolean {
        return !this.closed && Boolean(this.options.url);
    }

    /**
     * Encola un record en el buffer. Si el buffer está lleno, aplica la
     * política de overflow (dropea el más viejo + dispara `onError`). Si tras
     * el push se alcanza `batchSize`, dispara un flush asíncrono (sin await).
     *
     * No-op si el transport ya fue cerrado ({@link close}).
     *
     * @param {TransportRecord} record - Registro a encolar.
     */
    write(record: TransportRecord): void {
        if (this.closed) return;

        if (this.buffer.length >= this.maxBufferSize) {
            this.applyOverflowPolicy();
        }

        this.buffer.push(record);

        const batchSize = this.options.batchSize ?? DEFAULT_BATCH_SIZE;
        if (this.buffer.length >= batchSize) {
            void this.flush();
        }
    }

    /**
     * Serializa un batch al body de la request. Las subclasses sobrescriben
     * para cambiar la codificación (ej. {@link OtlpTransport} produce OTLP/HTTP
     * JSON en vez del envelope default `{ logs: [...] }`).
     *
     */
    protected serializeBody(records: TransportRecord[]): string {
        return JSON.stringify({ logs: records });
    }

    /**
     * Construye los headers de la request. Las subclasses pueden prependear
     * headers transport-specific (ej. `signoz-ingestion-key`).
     *
     */
    protected buildHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            ...(this.options.headers ?? {})
        };
    }

    private applyOverflowPolicy(): void {
        const dropped = this.buffer.shift();
        if (dropped && this.options.onError) {
            const entry: HookLogEntry = {
                level: 'warn',
                message: 'HttpTransport buffer overflow: oldest record dropped',
                args: [dropped],
                timestamp: new Date().toISOString(),
                hookEvent: 'onError' as HookEvent,
                error: new Error('HttpTransport buffer overflow'),
                extra: { droppedRecord: dropped }
            };
            void this.options.onError(entry);
        }
    }

    /**
     * Flushea el buffer actual: toma un snapshot de los records pendientes,
     * los envía con retry/backoff vía `sendWithRetry`, y ante fallo los
     * re-bufferiza preservando el orden. Si la re-bufferización excede
     * `maxBufferSize`, trimea los más viejos y dispara `onError` con
     * `droppedCount`.
     *
     * No-op si el transport está cerrado, el buffer está vacío o no hay
     * `url` configurada.
     *
     * @returns {Promise<void>} Resuelve cuando el intento de entrega del batch actual terminó (success, drop definitivo o no-op).
     *
     * @see {@link HttpTransportOptions.onError}
     */
    async flush(): Promise<void> {
        if (this.closed || this.buffer.length === 0 || !this.options.url) return;

        const records = [...this.buffer];
        this.buffer = [];

        const success = await this.sendWithRetry(records);
        if (!success) {
            // Re-bufferiza al frente para preservar orden; si volviera a hacer
            // overflow, applyOverflowPolicy trimea el más viejo y lo reporta.
            const combined = records.concat(this.buffer);
            if (combined.length > this.maxBufferSize) {
                const trimmed = combined.slice(combined.length - this.maxBufferSize);
                const droppedCount = combined.length - trimmed.length;
                if (droppedCount > 0 && this.options.onError) {
                    const entry: HookLogEntry = {
                        level: 'error',
                        message: `HttpTransport dropped ${droppedCount} records after retry exhaustion`,
                        args: [],
                        timestamp: new Date().toISOString(),
                        hookEvent: 'onError' as HookEvent,
                        error: new Error('HttpTransport retry exhaustion'),
                        extra: { droppedCount }
                    };
                    void this.options.onError(entry);
                }
                this.buffer = trimmed;
            } else {
                this.buffer = combined;
            }
        }
    }

    private async sendWithRetry(records: TransportRecord[]): Promise<boolean> {
        const url = this.options.url;
        if (!url) return false;

        const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
        const initialBackoff = this.options.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF;
        const maxBackoff = this.options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF;
        const fetchTimeout = this.options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT;
        const body = this.serializeBody(records);
        const headers = this.buildHeaders();

        let attempt = 0;
        let backoff = initialBackoff;

        while (attempt <= maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    return true;
                }

                // Non-2xx es fallo lógico — NO se reintenta en 4xx (errores
                // de cliente no son transitorios). 5xx sí se reintenta.
                if (response.status >= 400 && response.status < 500) {
                    if (this.options.onError) {
                        const entry: HookLogEntry = {
                            level: 'error',
                            message: `HttpTransport ${response.status} ${response.statusText} (not retried)`,
                            args: [],
                            timestamp: new Date().toISOString(),
                            hookEvent: 'onError' as HookEvent,
                            error: new Error(`HTTP ${response.status}`),
                            extra: { responseStatus: response.status }
                        };
                        void this.options.onError(entry);
                    }
                    return false;
                }

                // 5xx → retry con backoff
                if (attempt === maxRetries) break;
                await sleep(backoff);
                backoff = Math.min(backoff * 2, maxBackoff);
            } catch (error) {
                if (attempt === maxRetries) {
                    if (this.options.onError) {
                        const entry: HookLogEntry = {
                            level: 'error',
                            message: `HttpTransport fetch failed after ${maxRetries + 1} attempts`,
                            args: [],
                            timestamp: new Date().toISOString(),
                            hookEvent: 'onError' as HookEvent,
                            error: error instanceof Error ? error : new Error(String(error))
                        };
                        void this.options.onError(entry);
                    }
                    return false;
                }
                await sleep(backoff);
                backoff = Math.min(backoff * 2, maxBackoff);
            }
            attempt++;
        }
        return false;
    }

    /**
     * Cierra el transport: marca el flag `closed`, detiene el timer de
     * `flushInterval` si estaba corriendo, y ejecuta un flush final para
     * entregar lo pendiente.
     *
     * Tras `close()`, todo {@link write} posterior es no-op y
     * {@link isReady} devuelve `false`.
     *
     * @returns {Promise<void>} Resuelve cuando el flush final termina.
     *
     * @see {@link flush}
     */
    async close(): Promise<void> {
        this.closed = true;
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        await this.flush();
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}