/**
 * @fileoverview LogContext bridge — MDC (Mapped Diagnostic Context) management.
 * Encapsulates per-logger structured context, child logger creation, and
 * OTel resource merging.
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
 * Any object with a `context` field satisfies this interface.
 */
export interface ChildLoggerShape {
    context: Record<string, unknown>;
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
     * Mutates the bound context and returns itself for chaining.
     * The context is merged into every emitted `TransportRecord.attributes`.
     *
     * @param extra - Key-value pairs to attach (requestId, userId, ...)
     * @returns The same LogContext instance, now with extra context bound
     */
    withContext(extra: Record<string, unknown>): this;

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
    /** Internal resource record. Exposed for TransportRecord assembly. */
    _getResource(): Partial<ILogResourceRef> | undefined;
}

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

    return {
        getContext(): ContextSnapshot {
            return { ...context };
        },

        withContext(extra: Record<string, unknown>): typeof this {
            context = { ...context, ...extra };
            return this;
        },

        clearContext(): typeof this {
            context = {};
            return this;
        },

        setResource(res: Partial<ILogResourceRef>): typeof this {
            resource = { ...resource, ...res };
            return this;
        },

        child(extra: Record<string, unknown>): ChildLoggerShape {
            const childLogger = options.childLoggerFactory({}) as ChildLoggerShape;
            childLogger.context = { ...context, ...extra };
            return childLogger;
        },

        _getContextRecord(): Record<string, unknown> {
            return context;
        },

        _getResource(): Partial<ILogResourceRef> | undefined {
            return resource;
        }
    };
}
