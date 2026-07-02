import type { LogLevel, StackInfo } from './core.js';

/**
 * The payload passed to every hook callback. Hooks may return a partial
 * of this object to override individual fields; the manager merges the
 * result back into the entry chain.
 *
 * @since 0.3.0
 */
export interface HookLogEntry {
    level: LogLevel;
    message: string;
    args: unknown[];
    timestamp: string;
    prefix?: string;
    stackInfo?: StackInfo;
    correlationId?: string;
    context?: Record<string, unknown>;
    /**
     * Source hook event when emitted from an internal failure path
     * (e.g. transport flush error → fires `onError` with `hookEvent: 'beforeLog'`).
     */
    hookEvent?: HookEvent;
    /** Captured exception, if the hook fired because of a thrown error. */
    error?: Error;
    /**
     * Hook-specific structured payload. Used by transports to surface
     * dropped records, response codes, retry counts, etc.
     */
    extra?: Record<string, unknown>;
}

/** The three hook events the manager dispatches. @since 0.3.0 */
export type HookEvent = 'beforeLog' | 'afterLog' | 'onError';

/**
 * Hook callback signature. Async hooks are awaited in priority order;
 * a returned partial object overrides the entry's fields for downstream
 * hooks and the eventual log call.
 * @since 0.3.0
 */
export type HookCallback = (entry: HookLogEntry) => void | Partial<HookLogEntry> | Promise<void | Partial<HookLogEntry>>;

/** Koa-style middleware used by `HookManager.use()`. @since 0.3.0 */
export type MiddlewareFn = (
    entry: HookLogEntry,
    next: () => void | Promise<void>
) => void | Promise<void>;

export interface HookRegistration {
    id: string;
    event: HookEvent;
    callback: HookCallback;
    priority: number;
    once: boolean;
}

export interface MiddlewareRegistration {
    id: string;
    fn: MiddlewareFn;
    priority: number;
}

export interface IHookManager {
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    off(event: HookEvent, callback: HookCallback): boolean;
    use(middleware: MiddlewareFn, priority?: number): () => void;
    emit(event: HookEvent, entry: HookLogEntry): Promise<HookLogEntry>;
    process(entry: HookLogEntry): Promise<HookLogEntry>;
}
