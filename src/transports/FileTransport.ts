import type {
    TransportRecord,
    TransportOptions,
    ITransport,
    IBufferedTransport,
    HookLogEntry,
    HookEvent
} from '../types/index.js';

const MAX_BUFFER_DEFAULT = 10_000;
const BATCH_SIZE_DEFAULT = 100;
const FS_PROMISES_LOAD_TIMEOUT_MS = 50;
const LOCAL_STORAGE_KEY_PREFIX = 'better-logger:';

/**
 * Opciones para {@link FileTransport}. El campo `destination` se interpreta
 * como ruta de fichero en Node y como clave de `localStorage` en el browser
 * (componente saneado a `[a-zA-Z0-9_-]`).
 *
 * Hereda los defaults de {@link TransportOptions}: `batchSize=100`,
 * `maxBufferSize=10000`.
 *
 * @example
 * const transport = new FileTransport({
 *   destination: 'logs/app.log',
 *   batchSize: 200,
 *   flushInterval: 2000,
 *   maxBufferSize: 5000,
 *   onError: (entry) => captureFailure(entry)
 * });
 */
export interface FileTransportOptions extends TransportOptions {
    /**
     * Destino de escritura. En Node es una ruta de fichero (resuelta relativa
     * a `process.cwd()` y saneada contra path traversal). En el browser es una
     * clave de `localStorage` (saneada a alfanumérico + `-_`).
     * @default 'app.log' (Node) | 'better-logger:default' (browser)
     */
    destination?: string;
    /**
     * Hook opcional que se dispara cuando el transport no puede escribir
     * (error de FS, quota agotada, tab del browser en modo privado, ...).
     * Recibe un {@link HookLogEntry} sintético.
     */
    onError?: (entry: HookLogEntry) => void | Promise<void>;
}

/**
 * Transport que escribe registros a fichero (Node) o `localStorage` (browser).
 *
 * En Node, hace `appendFile` asíncrono vía `fs.promises` cargado con dynamic
 * import (no bloquea el event loop, no envía código Node-only al bundle del
 * browser). En el browser, acumula en `localStorage` con prefijo `better-logger:`
 * y degrada a no-op silencioso si el storage no está disponible (modo privado,
 * sandbox de iframes, quota agotada).
 *
 * El buffer es bounded: al llegar a `maxBufferSize` suelta el registro más
 * viejo (drop-oldest) e invoca `onError` con el payload descartado, de modo
 * que un pico de tráfico sostenido no agota memoria.
 *
 * El `destination` se sanea antes de usarse:
 * - Node: se rechazan rutas con segmentos `..`, `~` o absolutas (path traversal).
 * - Browser: se colapsa a `[a-zA-Z0-9_-]` recortado a 64 caracteres.
 *
 * @implements {IBufferedTransport}
 *
 * @example
 * // Node: append a fichero con flush cada segundo
 * logger.addTransport({
 *   target: new FileTransport({
 *     destination: 'logs/app.log',
 *     batchSize: 100,
 *     flushInterval: 1000,
 *     onError: (entry) => captureFailure(entry)
 *   })
 * });
 *
 * @example
 * // Browser: persiste en localStorage bajo 'better-logger:audit'
 * logger.addTransport({
 *   target: new FileTransport({ destination: 'audit' })
 * });
 *
 * @see {@link FileTransportOptions}
 * @see {@link IBufferedTransport}
 */
export class FileTransport implements IBufferedTransport {
    /** Identificador del transport dentro del pipeline (`'file'`). */
    readonly name = 'file';

    private buffer: string[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private options: FileTransportOptions;
    private closed = false;

    /**
     * Construye el transport. Si se pasa `flushInterval`, arranca un timer
     * periódico que vacía el buffer al vencimiento; si no, el flush se
     * dispara solo cuando el buffer alcanza `batchSize`.
     *
     * @param {FileTransportOptions} [options] - Configuración. Defaults: `batchSize=100`, `maxBufferSize=10000`.
     *
     * @example
     * const t = new FileTransport({ destination: 'app.log', flushInterval: 1000 });
     */
    constructor(options?: FileTransportOptions) {
        this.options = {
            batchSize: BATCH_SIZE_DEFAULT,
            maxBufferSize: MAX_BUFFER_DEFAULT,
            ...(options ?? {})
        };

        if (this.options.flushInterval) {
            this.flushTimer = setInterval(() => {
                void this.flush();
            }, this.options.flushInterval);
        }
    }

    /** Registros pendientes en el buffer (aún sin flush). */
    get bufferSize(): number {
        return this.buffer.length;
    }

    /** Capacidad máxima del buffer; al superarla se aplica drop-oldest. */
    get maxBufferSize(): number {
        return this.options.maxBufferSize ?? MAX_BUFFER_DEFAULT;
    }

    /**
     * Indica si el transport acepta escrituras. Devuelve `false` después de
     * {@link FileTransport.close} — cualquier `write` posterior se descarta.
     *
     * @returns {boolean} `true` mientras el transport no esté cerrado.
     */
    isReady(): boolean {
        return !this.closed;
    }

    /**
     * Encola un registro serializado (JSON + `\n`). Si el buffer está a tope,
     * suelta el registro más viejo (drop-oldest) y emite un evento `onError`
     * con el payload descartado para que la pérdida sea observable. Si al
     * encolar se alcanza `batchSize`, dispara un flush asíncrono.
     *
     * No-op silencioso si el transport está cerrado.
     *
     * @param {TransportRecord} record - Registro a escribir.
     */
    write(record: TransportRecord): void {
        if (this.closed) return;

        // Drop-oldest: sin esta evacuation, un pico de tráfico sostenido
        // haría crecer el buffer sin límite hasta agotar memoria.
        if (this.buffer.length >= this.maxBufferSize) {
            const dropped = this.buffer.shift();
            if (dropped && this.options.onError) {
                const entry: HookLogEntry = {
                    level: 'warn',
                    message: 'FileTransport buffer overflow: oldest record dropped',
                    args: [],
                    timestamp: new Date().toISOString(),
                    hookEvent: 'onError' as HookEvent,
                    error: new Error('FileTransport buffer overflow'),
                    extra: { droppedRecord: dropped }
                };
                void this.options.onError(entry);
            }
        }

        this.buffer.push(JSON.stringify(record) + '\n');

        const batchSize = this.options.batchSize ?? BATCH_SIZE_DEFAULT;
        if (this.buffer.length >= batchSize) {
            void this.flush();
        }
    }

    /**
     * Vuelca el buffer al destino. En Node concatena el contenido y hace
     * un único `appendFile`; en browser hace un único `setItem` sobre
     * `localStorage`. El buffer se vacía antes del I/O para que los registros
     * entrantes no esperen al disco. Los errores de escritura se reportan
     * vía `onError` (nunca lanzan al caller).
     *
     * @returns {Promise<void>} Resuelve cuando el I/O terminó o falló.
     */
    async flush(): Promise<void> {
        if (this.closed || this.buffer.length === 0) return;

        const payload = this.buffer.join('');
        this.buffer = [];

        if (isNodeLike()) {
            await this.flushNode(payload);
        } else {
            await this.flushBrowser(payload);
        }
    }

    private async flushNode(payload: string): Promise<void> {
        const destination = this.resolveNodeDestination();
        try {
            // Dynamic import para no mandar código Node-only al bundle del
            // browser y para que los consumidores ESM no lidien con un
            // `require` undefined.
            const fsPromises = await loadNodeFsPromises();
            await fsPromises.appendFile(destination, payload, 'utf8');
        } catch (error) {
            this.emitError('FileTransport failed to write to disk', error);
        }
    }

    private async flushBrowser(payload: string): Promise<void> {
        if (typeof localStorage === 'undefined') {
            this.emitError('FileTransport: localStorage is not available in this environment', null);
            return;
        }
        try {
            const key = LOCAL_STORAGE_KEY_PREFIX + this.resolveBrowserKey();
            const existing = localStorage.getItem(key) ?? '';
            localStorage.setItem(key, existing + payload);
        } catch (error) {
            this.emitError('FileTransport: localStorage write failed (quota? private mode?)', error);
        }
    }

    /**
     * Cierra el transport: detiene el timer de flush y dispara un flush
     * final para no perder registros pendientes. Tras cerrar, `write` y
     * `flush` se vuelven no-op.
     *
     * @returns {Promise<void>} Resuelve cuando el flush final termina.
     */
    async close(): Promise<void> {
        this.closed = true;
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        await this.flush();
    }

    private resolveNodeDestination(): string {
        const requested = this.options.destination ?? 'app.log';
        const sanitised = sanitiseNodePath(requested);
        if (sanitised === null) {
            this.emitError(`FileTransport: refusing destination with traversal segment: ${requested}`, null);
            return 'app.log';
        }
        return sanitised;
    }

    private resolveBrowserKey(): string {
        const requested = this.options.destination ?? 'default';
        return sanitiseBrowserKey(requested);
    }

    private emitError(message: string, cause: unknown): void {
        if (!this.options.onError) return;
        const entry: HookLogEntry = {
            level: 'error',
            message,
            args: [],
            timestamp: new Date().toISOString(),
            hookEvent: 'onError' as HookEvent,
            error: cause instanceof Error ? cause : new Error(String(cause))
        };
        void this.options.onError(entry);
    }
}

// ===== Helpers de entorno =====

/**
 * Detecta si el runtime es Node comprobando `process.versions.node`.
 *
 * @internal Dispatch Node/browser dentro del transport.
 * @returns {boolean} `true` si corre sobre Node.
 */
function isNodeLike(): boolean {
    return typeof process !== 'undefined'
        && process.versions != null
        && process.versions.node != null;
}

// ===== Saneadores =====

/**
 * Rechaza rutas que escapan del working directory. Permite rutas relativas
 * bajo `cwd/`. Las rutas absolutas se rechazan a propósito — si un caller
 * necesita una ubicación absoluta, debe usar un escape hatch documentado
 * (no expuesto aquí).
 *
 * @internal
 * @param {string} input - Ruta cruda pedida por el caller.
 * @returns {string | null} Ruta saneada, o `null` si se rechaza por traversal.
 */
function sanitiseNodePath(input: string): string | null {
    if (!input) return null;
    const normalised = input.replace(/\\/g, '/').trim();
    if (normalised.length === 0) return null;
    if (normalised.startsWith('/') || /^[a-zA-Z]:\//.test(normalised)) return null;
    const segments = normalised.split('/').filter(s => s.length > 0 && s !== '.');
    if (segments.some(s => s === '..' || s === '~')) return null;
    return segments.join('/');
}

/**
 * Convierte cualquier string en una clave válida para `localStorage`:
 * colapsa todo carácter fuera de `[a-zA-Z0-9_-]` a `_` y recorta a 64
 * caracteres. Devuelve `'default'` si el resultado es vacío.
 *
 * @internal
 * @param {string} input - Clave cruda pedida por el caller.
 * @returns {string} Clave saneada lista para `localStorage`.
 */
function sanitiseBrowserKey(input: string): string {
    return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'default';
}

// ===== Loader de fs de Node =====

/**
 * Dynamic import cacheado de `node:fs/promises`. La caché es intencionadamente
 * module-scoped para que los flushes posteriores no paguen el coste del import.
 * Además corre el import contra un timeout corto (`FS_PROMISES_LOAD_TIMEOUT_MS`)
 * para que un entorno Node roto (bindings nativos corruptos) no bloquee el
 * transport indefinidamente.
 *
 * @internal
 * @returns {Promise<typeof import('node:fs/promises')>} Módulo `fs/promises` resuelto.
 * @throws {Error} Si el import excede el timeout o el módulo no está disponible.
 */
let _fsPromisesPromise: Promise<typeof import('node:fs/promises')> | null = null;

async function loadNodeFsPromises(): Promise<typeof import('node:fs/promises')> {
    if (_fsPromisesPromise) return _fsPromisesPromise;

    // Pone el dynamic import a competir contra un timeout corto para que
    // un entorno Node colgado (bindings nativos corruptos, etc.) no
    // bloquee el transport indefinidamente.
    const importPromise = import('node:fs/promises');
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`fs/promises import timed out after ${FS_PROMISES_LOAD_TIMEOUT_MS}ms`)), FS_PROMISES_LOAD_TIMEOUT_MS);
    });
    _fsPromisesPromise = Promise.race([importPromise, timeoutPromise]).catch(err => {
        _fsPromisesPromise = null;
        throw err;
    }) as Promise<typeof import('node:fs/promises')>;
    return _fsPromisesPromise;
}