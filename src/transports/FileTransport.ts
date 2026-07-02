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
 * Options for {@link FileTransport}. Uses `destination` as the file path in
 * Node and as a `localStorage` key in the browser (the path component is
 * sanitised to `[a-zA-Z0-9_-]`).
 *
 */
export interface FileTransportOptions extends TransportOptions {
    /**
     * Where to write. In Node this is a file path (resolved relative to
     * `process.cwd()` and sanitised against path traversal). In the browser
     * this is a localStorage key (sanitised to alphanumeric + `-_`).
     * @default 'app.log' (Node) | 'better-logger:default' (browser)
     */
    destination?: string;
    /**
     * Optional hook fired when the transport cannot write (FS error,
     * quota exceeded, browser tab in private mode, ...). Receives a
     * synthetic {@link HookLogEntry}.
     */
    onError?: (entry: HookLogEntry) => void | Promise<void>;
}

/**
 * File-based transport.
 *
 * - In Node, writes batches via `fs.promises.appendFile` (non-blocking).
 * - In the browser, writes batches into `localStorage` (fallback no-op if
 *   `localStorage` is unavailable — e.g. private mode, sandboxed iframes).
 *
 * Fixed in 5.1.0:
 *   - BUG-N3: uses async `fs.promises.appendFile` instead of sync `appendFileSync`.
 *   - BUG-N4: destination is sanitised to reject path traversal (`..`, `~`, abs paths).
 *   - BUG-N5: dynamic `import('node:fs/promises')` instead of CJS `require('fs')`.
 *   - BUG-N6: browser case uses `localStorage` with try/catch (was silent no-op).
 *
 * @since 0.3.0 (rewritten in 5.1.0)
 */
export class FileTransport implements IBufferedTransport {
    readonly name = 'file';

    private buffer: string[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private options: FileTransportOptions;
    private closed = false;

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

    get bufferSize(): number {
        return this.buffer.length;
    }

    get maxBufferSize(): number {
        return this.options.maxBufferSize ?? MAX_BUFFER_DEFAULT;
    }

    isReady(): boolean {
        return !this.closed;
    }

    write(record: TransportRecord): void {
        if (this.closed) return;

        // Drop the oldest record when the buffer is already at the cap
        // (BUG-N3 follow-up — without this the file transport grows
        // unbounded under a sustained outage, mirroring the old HttpTransport
        // leak that F005 already fixed).
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
            // Dynamic import so we don't ship Node-only code into the
            // browser bundle and so ESM consumers don't have to deal with
            // `require` being undefined.
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

// ===== Environment helpers =====

function isNodeLike(): boolean {
    return typeof process !== 'undefined'
        && process.versions != null
        && process.versions.node != null;
}

// ===== Sanitisers =====

/**
 * Reject paths that escape the working directory. Allows relative paths
 * under `cwd/`. Absolute paths are rejected by default — if a caller needs
 * an absolute location, pass it through a documented escape hatch (not
 * exposed here on purpose).
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

function sanitiseBrowserKey(input: string): string {
    return input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'default';
}

// ===== Node fs loader =====

/**
 * Cached dynamic import of `node:fs/promises`. The cache is intentionally
 * module-scoped so subsequent flushes don't pay the import cost.
 */
let _fsPromisesPromise: Promise<typeof import('node:fs/promises')> | null = null;

async function loadNodeFsPromises(): Promise<typeof import('node:fs/promises')> {
    if (_fsPromisesPromise) return _fsPromisesPromise;

    // Race the dynamic import against a short timeout so a hung Node
    // environment (corrupted native bindings, etc.) doesn't block the
    // transport forever.
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