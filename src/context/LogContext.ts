/**
 * @fileoverview LogContext bridge — MDC (Mapped Diagnostic Context) management.
 * Encapsulates per-logger structured context, child logger creation, and
 * OTel resource merging.
 *
 * F4 MDC API reset:
 * - `withContext(bindings, fn?)` — if fn provided, run within AsyncLocalStorage.
 *   Without fn: no-op (backwards compat shim for the old setter shape).
 * - `withContextAsync(bindings, fn)` — async callback variant.
 * - `child(bindings)` remains immutable (canonical MDC pattern).
 * - Feature-detect AsyncLocalStorage; browser fallback is a no-op.
 */

import type { ILogResourceRef } from '../types/index.js';
import type { LoggerConfig } from '../types/index.js';

/**
 * Snapshot of the bound context. Returned by {@link LogContext.getContext}.
 */
export type ContextSnapshot = Readonly<Record<string, unknown>>;

/**
 * Factory function type for creating child Logger instances.
 * Passed to LogContext so `child()` can instantiate new loggers without
 * introducing a circular import. Returns unknown — the actual Logger class
 * is used by the caller and the returned instance has its `context` field
 * written to by LogContext.
 */
export type ChildLoggerFactory = (config: Partial<LoggerConfig>) => unknown;

/**
 * Minimal shape of a Logger instance needed by LogContext.
 * Used to avoid circular dependencies between LogContext and Logger.
 * The `_parentContextRecord` field is set by the parent Logger after
 * `LogContext.child()` returns, establishing the context chain.
 */
export interface ChildLoggerShape {
    _parentContextRecord?: Record<string, unknown>;
    /** Legacy field — no longer the canonical context source (F4.5.5 fix). */
    context?: Record<string, unknown>;
}

/**
 * Options passed to {@link createLogContext}.
 */
export interface ILogContextOptions {
    /** Initial context key-value pairs. */
    initialContext?: Record<string, unknown>;
    /** Factory for creating child logger instances. */
    childLoggerFactory: ChildLoggerFactory;
    /** Initial OTel resource to merge into every record. */
    initialResource?: Partial<ILogResourceRef>;
    /**
     * Returns the parent logger's merged context record at child-creation time.
     * Used by _getContextRecord() to build the context chain.
     * @internal
     */
    getParentContextRecord?: () => Record<string, unknown>;
    /**
     * The ALS instance to use for withContext scoping.
     * @internal
     */
    alsInstance?: ALS;
}

/**
 * Result returned by {@link createLogContext}.
 */
export interface LogContext {
    /**
     * Current bound context snapshot (shallow copy — mutation does NOT affect
     * what subsequent log calls emit).
     */
    getContext(): ContextSnapshot;

    /**
     * Runs `fn` within an AsyncLocalStorage scope where `bindings` are
     * merged into the context for all log calls inside `fn`.
     *
     * If `fn` is not provided (the old setter shape), this is a no-op
     * for backwards compatibility. Prefer `child()` for persistent binding
     * or `withContextAsync()` for async callbacks.
     *
     * @param bindings - Key-value pairs to attach for the duration of `fn`
     * @param fn - Optional synchronous function to run with the scoped bindings
     * @returns The return value of `fn`, or undefined if no fn provided
     */
    withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined;

    /**
     * Async variant of `withContext`. Runs `fn` within an AsyncLocalStorage
     * scope so bindings are available to all async log calls inside `fn`.
     *
     * @param bindings - Key-value pairs to attach for the duration of `fn`
     * @param fn - Async function to run with the scoped bindings
     * @returns The return value of `fn`
     */
    withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R>;

    /**
     * Drops every key from the bound context. After this call, emitted
     * records no longer carry `attributes` until {@link withContext} or
     * {@link child} re-establishes one.
     *
     * @returns The same LogContext instance, now context-free
     */
    clearContext(): this;

    /**
     * Updates the default OTel resource (service.name, version, env).
     * Persisted into every emitted record's `resource` field unless the
     * record itself overrides it.
     *
     * @param resource - Partial OTel resource to merge into the current one
     * @returns The same LogContext instance, for chaining
     */
    setResource(resource: Partial<ILogResourceRef>): this;

    /**
     * Returns an immutable copy of this logger with the extra context bound.
     * Future calls on the child emit with the merged context, without
     * mutating the parent — the canonical MDC pattern.
     *
     * @param extra - Key-value pairs to attach (requestId, userId, ...)
     * @returns A new Logger with merged context
     */
    child(extra: Record<string, unknown>): ChildLoggerShape;

    /** Internal context record. Exposed for TransportRecord assembly. */
    _getContextRecord(): Record<string, unknown>;
    /**
     * Returns the base context WITHOUT the ALS overlay.
     * Used by Logger.child() to capture the parent context snapshot for
     * child logger creation (F4.5.5 fix).
     * @internal
     */
    _getBaseContextRecord(): Record<string, unknown>;
    /** Internal resource record. Exposed for TransportRecord assembly. */
    _getResource(): Partial<ILogResourceRef> | undefined;
    /**
     * Returns the current AsyncLocalStorage store, if ALS is active.
     * @internal
     */
    _getAlsStore(): Record<string, unknown> | undefined;
}

// AsyncLocalStorage type (Node 14+, undefined in browser)
type ALS = {
    run<R>(store: Record<string, unknown>, fn: () => R): R;
    getStore(): Record<string, unknown> | undefined;
};
declare const AsyncLocalStorage: new () => ALS;

// Feature-detect AsyncLocalStorage
const hasALS = typeof AsyncLocalStorage !== 'undefined';
const alsInstance: ALS | undefined = hasALS ? new AsyncLocalStorage() : undefined;

/**
 * Creates a LogContext instance.
 *
 * @param options - Configuration options
 * @returns A LogContext instance
 */
export function createLogContext(options: ILogContextOptions): LogContext {
    let context: Record<string, unknown> = { ...options.initialContext };
    let resource: Partial<ILogResourceRef> | undefined = options.initialResource
        ? { ...options.initialResource }
        : undefined;

    // Use provided ALS instance or fall back to module-level (browser fallback)
    const als = options.alsInstance ?? alsInstance;

    return {
        getContext(): ContextSnapshot {
            return { ...context };
        },

        withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined {
            // No-op without AsyncLocalStorage (browser) — warn once
            if (!als) {
                if (fn) return fn();
                return undefined;
            }
            // No fn: backwards-compat no-op setter shim
            if (!fn) return undefined;
            // Run fn within AsyncLocalStorage scope
            const merged = { ...context, ...bindings };
            return als.run(merged, fn);
        },

        async withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R> {
            if (!als) return fn();
            const merged = { ...context, ...bindings };
            return als.run(merged, fn);
        },

        clearContext(): typeof this {
            context = {};
            return this;
        },

        setResource(res: Partial<ILogResourceRef>): typeof this {
            resource = { ...resource, ...res };
            return this;
        },

        child(_extra: Record<string, unknown>): ChildLoggerShape {
            // Creates the child logger via factory. Captures the current
            // _getBaseContextRecord() snapshot (parent context WITHOUT ALS) at
            // child-creation time. ALS is transient and should not be baked into
            // the child's _parentContextRecord — it is applied fresh at dispatch time.
            // Note: _extra (bindings) are stored by Logger.child() as _bindings.
            const snapshot = this._getBaseContextRecord();
            const childLogger = options.childLoggerFactory({}) as ChildLoggerShape;
            // Store on childLogger for Logger.child() to pick up
            (childLogger as unknown as Record<string, unknown>)['__parentSnapshot'] = snapshot;
            return childLogger;
        },

        _getContextRecord(): Record<string, unknown> {
            // Returns the full merged context for dispatch purposes.
            // Base (parent snapshot + own context) plus ALS overlay if active.
            const base = this._getBaseContextRecord();
            const alsContext = als?.getStore();
            if (alsContext && Object.keys(alsContext).length > 0) {
                return { ...base, ...alsContext };
            }
            return base;
        },

        _getBaseContextRecord(): Record<string, unknown> {
            // Returns parent context chain + own context (NO ALS overlay).
            // ALS is applied by _getContextRecord() as a live overlay.
            let base: Record<string, unknown> = {};
            const parentRecord = options.getParentContextRecord?.() ?? null;
            if (parentRecord && Object.keys(parentRecord).length > 0) {
                base = parentRecord;
            } else if (Object.keys(context).length > 0) {
                base = context;
            }
            if (Object.keys(context).length > 0) {
                base = { ...base, ...context };
            }
            return base;
        },

        _getResource(): Partial<ILogResourceRef> | undefined {
            return resource;
        },

        _getAlsStore(): Record<string, unknown> | undefined {
            return als?.getStore();
        }
    };
}
