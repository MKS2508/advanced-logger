import type { LogLevel, LogTag, StackInfo } from './core.js';

/**
 * Mapea un `LogLevel` a la severidad numérica de OpenTelemetry (1-24) usada
 * por SigNoz / cualquier backend OTLP/HTTP. Valores por banda conformes a la
 * spec: TRACE=1-4, DEBUG=5-8, INFO=9-12, WARN=13-16, ERROR=17-20, FATAL=21-24.
 * Se usa el valor canónico del medio de cada banda.
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
 * Mapea un `LogLevel` a su nombre de severidad OpenTelemetry (mayúsculas, spec OTel).
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
 * Atributos de recurso OTel adjuntados una vez por batch (service.name, version,
 * env, ...). Los valores son string-coerced por la capa de transport.
 */
export interface ILogResource {
    'service.name': string;
    'service.version'?: string;
    'deployment.environment'?: string;
    [key: string]: string | undefined;
}

/**
 * Valor admitido en un {@link ILogAttributes}: unión recursiva de primitivos
 * serializables (string, number, boolean, null), arrays y structs anidados.
 * Compatible con el modelo de attribute value de OpenTelemetry.
 */
export type LogAttributeValue = string | number | boolean | null | LogAttributeValue[] | { [k: string]: LogAttributeValue };

/**
 * Bag estructurado de atributos (compatible con OpenTelemetry). Cada clave
 * mapea a un valor tipado; la capa de transport decide cómo serializarlo.
 */
export interface ILogAttributes {
    [key: string]: LogAttributeValue;
}

/**
 * Payload enviado a cada transport en cada llamada a `log()`. Los campos son
 * deliberadamente explícitos (sin escape hatch `[key: string]: any`) para que
 * implementaciones como `OtlpTransport` puedan mapear 1:1 a `logRecords` OTLP.
 */
export interface TransportRecord {
    /** Nivel canónico (trace/debug/info/warn/error/critical). */
    level: LogLevel;
    /** Severidad numérica, copiada de `LOG_LEVELS[level]`. */
    levelValue: number;
    /** Severidad numérica OTel (1-24). La asigna automáticamente el Logger. */
    severityNumber: number;
    /** Nombre de severidad OTel (TRACE/DEBUG/INFO/WARN/ERROR/FATAL). */
    severityText: string;
    /** Epoch milliseconds en el momento del log. */
    time: number;
    /** Texto final del mensaje, ya procesado por los hooks. */
    msg: string;
    /** Scope lógico opcional (p.ej. "Auth", "API:Users"). */
    prefix?: string;
    /** Ubicación del caller, solo cuando `enableStackTrace` es true. */
    location?: {
        file: string;
        line: number;
        column: number;
        function?: string;
    };
    /** Trace id hex de 32 chars (OTel), cuando hay correlación con un span activo. */
    traceId?: string;
    /** Span id hex de 16 chars (OTel), cuando hay correlación con un span activo. */
    spanId?: string;
    /** Atributos estructurados (requestId, userId, tags custom). */
    attributes?: ILogAttributes;
    /** Recurso a nivel de log (sobreescribe el resource del transport). */
    resource?: Partial<ILogResource>;
    /** Tag especial "success" — lo setea `Logger.success()`. */
    tag?: LogTag;
}

/**
 * Opciones aceptadas por cualquier transport al registrarse.
 */
export interface TransportOptions {
    level?: LogLevel;
    /** Transforma el record antes de serializarlo. Devolver null descarta el record. */
    transform?: (record: TransportRecord) => TransportRecord | null;
    /** Flush cuando el buffer alcanza esta cantidad de records. */
    batchSize?: number;
    /** Flush periódico a este intervalo (ms). */
    flushInterval?: number;
    /** Tope duro de records en buffer. Los más antiguos se descartan al desbordar. */
    maxBufferSize?: number;
}

/**
 * Registro de un transport. `target` puede ser:
 *   - Una instancia de `ITransport` (legacy / inline).
 *   - Un string registrado en el registry built-in de `TransportManager`
 *     (`'console' | 'file' | 'http' | 'otlp'`).
 */
export interface TransportTarget {
    target: string | ITransport;
    options?: TransportOptions;
    level?: LogLevel;
}

/**
 * Contrato mínimo que todo transport debe satisfacer.
 */
export interface ITransport {
    readonly name: string;
    write(record: TransportRecord): void | Promise<void>;
    flush?(): void | Promise<void>;
    close?(): void | Promise<void>;
    isReady?(): boolean;
}

/**
 * Contrato de transport con buffer. Transports concretos como `HttpTransport`,
 * `FileTransport` y `OtlpTransport` extienden esta interfaz.
 */
export interface IBufferedTransport extends ITransport {
    readonly bufferSize: number;
    readonly maxBufferSize: number;
    flush(): Promise<void>;
}

/**
 * Contrato del registry / dispatch de transports.
 */
export interface ITransportManager {
    add(target: TransportTarget): string;
    remove(id: string): boolean;
    write(record: TransportRecord): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
