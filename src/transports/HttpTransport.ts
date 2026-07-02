import type {
    TransportRecord,
    TransportOptions,
    ITransport,
    IBufferedTransport,
    HookEvent,
    HookLogEntry
} from '../types/index.js';

/**
 * Configuration for {@link HttpTransport}. Extends {@link TransportOptions}
 * with HTTP-specific knobs.
 *
 */
export interface HttpTransportOptions extends TransportOptions {
    /** Target URL. POST is used with a JSON-encoded body. */
    url?: string;
    /** Extra request headers (e.g. `Authorization: Bearer ...`). */
    headers?: Record<string, string>;
    /** Hard cap on buffered records. Older entries dropped on overflow. */
    maxBufferSize?: number;
    /** Max consecutive retry attempts per batch before the entries are dropped. */
    maxRetries?: number;
    /** Initial backoff in ms. Doubles per attempt up to `maxBackoffMs`. */
    initialBackoffMs?: number;
    /** Backoff ceiling in ms. */
    maxBackoffMs?: number;
    /** Fetch timeout in ms (per attempt). Default 10_000. */
    fetchTimeoutMs?: number;
    /**
     * Optional hook fired when the buffer overflows or a batch is dropped
     * after `maxRetries`. The hook receives a synthetic {@link HookLogEntry}.
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
 * HTTP-based transport. Buffers records, batches them on size or interval,
 * POSTs the batch as JSON, and surfaces failures via retry, bounded buffer,
 * and an `onError` hook — never a silent `.catch(() => {})`.
 *
 * Extending this class is the recommended way to ship a new transport:
 * see {@link OtlpTransport}.
 *
 */
export class HttpTransport implements IBufferedTransport {
    readonly name: string = 'http';

    private buffer: TransportRecord[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private closed = false;

    /** Options bag — `protected` so subclasses (e.g. {@link OtlpTransport}) can read or extend it. */
    protected options: HttpTransportOptions;

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

    get bufferSize(): number {
        return this.buffer.length;
    }

    get maxBufferSize(): number {
        return this.options.maxBufferSize ?? DEFAULT_MAX_BUFFER;
    }

    isReady(): boolean {
        return !this.closed && Boolean(this.options.url);
    }

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
     * Serialises a batch into the request body. Subclasses override to
     * switch encodings (e.g. {@link OtlpTransport} produces OTLP/HTTP JSON
     * instead of the default `{ logs: [...] }` envelope).
     *
     */
    protected serializeBody(records: TransportRecord[]): string {
        return JSON.stringify({ logs: records });
    }

    /**
     * Builds the request headers. Subclasses may prepend transport-specific
     * headers (e.g. `signoz-ingestion-key`).
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

    async flush(): Promise<void> {
        if (this.closed || this.buffer.length === 0 || !this.options.url) return;

        const records = [...this.buffer];
        this.buffer = [];

        const success = await this.sendWithRetry(records);
        if (!success) {
            // Re-buffer at the front to preserve order; if we'd overflow
            // again, the policy above will trim the oldest and surface it.
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

                // Non-2xx is a logical failure — do NOT retry on 4xx (client
                // mistakes are not transient). 5xx is retried.
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

                // 5xx → retry with backoff
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