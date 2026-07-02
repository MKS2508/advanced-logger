import type { LogLevel, LogTag, StackInfo } from './core.js';

/**
 * Map a `LogLevel` to the OpenTelemetry numeric severity (1-24) used by
 * SigNoz / any OTLP/HTTP backend. Spec-compliant banded values:
 *   TRACE=1-4, DEBUG=5-8, INFO=9-12, WARN=13-16, ERROR=17-20, FATAL=21-24
 * We use the canonical mid-band value per level.
 *
 * @see https://opentelemetry.io/docs/specs/otel/logs/data-model/#severity-fields
 */
export const LOG_LEVEL_TO_SEVERITY_NUMBER: Record<LogLevel, number> = {
    trace: 1,    // TRACE
    debug: 5,    // DEBUG
    info: 9,     // INFO
    warn: 13,    // WARN
    error: 17,   // ERROR
    critical: 21 // FATAL
} as const;

/**
 * Map a `LogLevel` to its OpenTelemetry severity name (uppercase, OTel spec).
 */
export const LOG_LEVEL_TO_SEVERITY_TEXT: Record<LogLevel, string> = {
    trace: 'TRACE',
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    critical: 'FATAL'
} as const;

/**
 * OTel resource attributes attached once per batch (service.name, version, env, ...).
 * Values are string-coerced by the transport layer.
 */
export interface ILogResource {
    'service.name': string;
    'service.version'?: string;
    'deployment.environment'?: string;
    [key: string]: string | undefined;
}

/**
 * Structured attribute bag (OpenTelemetry-compatible). Every key maps to
 * a typed value; the transport layer decides how to serialise it.
 */
export type LogAttributeValue = string | number | boolean | null | LogAttributeValue[] | { [k: string]: LogAttributeValue };
export interface ILogAttributes {
    [key: string]: LogAttributeValue;
}

/**
 * The payload sent to every transport on each `log()` call. Fields are
 * deliberately explicit (no `[key: string]: any` safety hatch) so transport
 * implementations like `OtlpTransport` can map 1:1 to OTLP `logRecords`.
 */
export interface TransportRecord {
    /** Canonical log level (trace/debug/info/warn/error/critical). */
    level: LogLevel;
    /** Numeric severity, copied from `LOG_LEVELS[level]`. */
    levelValue: number;
    /** OTel numeric severity (1-24). Set automatically by Logger. */
    severityNumber: number;
    /** OTel severity name (TRACE/DEBUG/INFO/WARN/ERROR/FATAL). */
    severityText: string;
    /** Epoch milliseconds at log time. */
    time: number;
    /** Final, post-hook message text. */
    msg: string;
    /** Optional logical scope (e.g. "Auth", "API:Users"). */
    prefix?: string;
    /** Caller location, only when `enableStackTrace` is true. */
    location?: {
        file: string;
        line: number;
        column: number;
        function?: string;
    };
    /** 32-char hex trace id (OTel), when correlated with an active span. */
    traceId?: string;
    /** 16-char hex span id (OTel), when correlated with an active span. */
    spanId?: string;
    /** Structured attributes (requestId, userId, custom tags). */
    attributes?: ILogAttributes;
    /** Per-log resource (overrides Transport-level resource). */
    resource?: Partial<ILogResource>;
    /** Special "success" tag — set by `Logger.success()`. */
    tag?: LogTag;
}

/**
 * Options accepted by any transport at registration time.
 */
export interface TransportOptions {
    level?: LogLevel;
    /** Transform the record before it's serialised. Return null to drop. */
    transform?: (record: TransportRecord) => TransportRecord | null;
    /** Flush once the buffer reaches this many records. */
    batchSize?: number;
    /** Flush periodically at this interval (ms). */
    flushInterval?: number;
    /** Hard cap on buffered records. Older entries are dropped on overflow. */
    maxBufferSize?: number;
    /** Drop oldest (true) or newest (false) record on buffer overflow. */
    dropOldest?: boolean;
    /** Override the per-batch OTel resource (service.name, version, env). */
    resource?: Partial<ILogResource>;
}

/**
 * A transport registration. `target` can be:
 *   - An `ITransport` instance (legacy / inline).
 *   - A string registered in `TransportManager`'s built-in registry
 *     (`'console' | 'file' | 'http' | 'otlp'`).
 */
export interface TransportTarget {
    target: string | ITransport;
    options?: TransportOptions;
    level?: LogLevel;
}

/**
 * Minimal contract every transport must satisfy.
 */
export interface ITransport {
    readonly name: string;
    write(record: TransportRecord): void | Promise<void>;
    flush?(): void | Promise<void>;
    close?(): void | Promise<void>;
    isReady?(): boolean;
}

/**
 * Buffered transport contract. Concrete transports like `HttpTransport`,
 * `FileTransport` and `OtlpTransport` extend this.
 */
export interface IBufferedTransport extends ITransport {
    readonly bufferSize: number;
    readonly maxBufferSize: number;
    flush(): Promise<void>;
}

/**
 * Transport registry / dispatch contract.
 */
export interface ITransportManager {
    add(target: TransportTarget): string;
    remove(id: string): boolean;
    write(record: TransportRecord): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
