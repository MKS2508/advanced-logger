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
 * Kind de record que circula por el pipeline de transports. Los transports
 * declaran cuáles aceptan vía {@link ITransport.accepts}; el
 * {@link ITransportManager} enruta cada record solo a los transports cuyo
 * `accepts` lo incluye.
 */
export type TransportRecordKind = 'log' | 'span';

/**
 * Valor admitido en los attributes de un {@link SpanRecord}. Deliberadamente
 * más estrecho que {@link LogAttributeValue}: el JSON mapping de OTLP traces
 * solo acepta primitivos en `span.attributes` sin schema extra.
 */
export type SpanAttributeValue = string | number | boolean;

/**
 * Bag de attributes de un span (compatible con el modelo de attributes de
 * OpenTelemetry para traces).
 */
export interface SpanAttributes {
    [key: string]: SpanAttributeValue;
}

/**
 * Status de finalización de un span, conforme al proto OTel `Status`.
 * `code: 2` = `STATUS_CODE_ERROR`.
 *
 * @see https://opentelemetry.io/docs/specs/otel/trace/api/#set-status
 */
export interface SpanStatus {
    code: number;
    message?: string;
}

/**
 * Record de span (trace) que emite el trio API `event`/`span`/`startSpan`.
 * A diferencia de {@link TransportRecord}, NO atraviesa el hook path de logs:
 * el {@link ITransportManager} lo despacha solo a transports cuyo
 * {@link ITransport.accepts} incluye `'span'`.
 *
 * `traceId` son 16 bytes en hex (32 chars) y `spanId` 8 bytes en hex
 * (16 chars), conforme a la spec W3C Trace Context que exige OTLP/HTTP.
 */
export interface SpanRecord {
    kind: 'span';
    /** Trace id hex de 32 chars. Se hereda del span activo si existe. */
    traceId: string;
    /** Span id hex de 16 chars. */
    spanId: string;
    /** Span id del padre, tomado del span activo en el ALS al crearse. */
    parentSpanId?: string;
    /** Nombre de la operación (`db.query`, `http.request`, ...). */
    name: string;
    /** Span kind OTel numérico. 1 = SPAN_KIND_INTERNAL. */
    spanKind: number;
    /** Instante de inicio en nanosegundos (string decimal). */
    startTimeUnixNano: string;
    /** Instante de fin en nanosegundos (string decimal). `'0'` hasta end(). */
    endTimeUnixNano: string;
    /** Attributes del span. Mutables vía {@link Span.set} hasta el end(). */
    attributes: SpanAttributes;
    /** Status de finalización. Presente si el span terminó con `fail()`. */
    status?: SpanStatus;
    /** `true` cuando el span se cerró por flush sin `end()` explícito. */
    incomplete?: boolean;
    /** Scope del logger que emitió el span (nombre del scoped logger). */
    scope: string;
}

/**
 * Handle de un span externally-ended. Lo devuelven `startSpan()` y el
 * callback de `span(fn)`.
 */
export interface Span {
    /**
     * Añade o actualiza un attribute del span.
     *
     * @param key - Nombre del attribute.
     * @param value - Valor primitivo (string | number | boolean).
     * @returns `this`, para encadenar.
     */
    set(key: string, value: SpanAttributeValue): this;
    /**
     * Finaliza el span: fija `endTimeUnixNano` y encola el
     * {@link SpanRecord} para export. Llamadas posteriores son no-op.
     *
     * @param attributes - Attributes finales a mergear antes del export.
     */
    end(attributes?: SpanAttributes): void;
    /**
     * Marca el span como fallido (`status.code = 2` con el mensaje del
     * error) y luego lo finaliza como {@link end}.
     *
     * @param err - Error (o valor) que causó el fallo.
     */
    fail(err: unknown): void;
    /** Trace id hex de 32 chars del span. */
    readonly traceId: string;
    /** Span id hex de 16 chars del span. */
    readonly spanId: string;
}

/**
 * Unión de todo record que puede atravesar el {@link ITransportManager}:
 * un log ({@link TransportRecord}) o un span ({@link SpanRecord}).
 * El routing por kind lo hace el manager vía {@link ITransport.accepts}.
 */
export type TransportDispatchRecord = TransportRecord | SpanRecord;

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
 *
 * Un transport declara qué kinds de record acepta vía {@link accepts}:
 * ausente o `['log']` → log-only (default, comportamiento de todos los
 * transports históricos); `['span']` → solo spans (p.ej. `OtlpTraceTransport`);
 * `['log', 'span']` → ambos. El {@link ITransportManager} garantiza que un
 * transport jamás recibe un record de un kind que no declaró — un
 * `SpanRecord` nunca llega a un transport de logs.
 */
export interface ITransport {
    readonly name: string;
    /**
     * Kinds de record que este transport acepta. **Default `['log']` cuando
     * está ausente** — los transports existentes siguen siendo log-only sin
     * cambios.
     */
    readonly accepts?: readonly TransportRecordKind[];
    write(record: TransportDispatchRecord): void | Promise<void>;
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
    /**
     * Dispatcha un record (log o span) a los transports que acepten su kind
     * y (para logs) pasen el filtro de nivel del transport.
     */
    write(record: TransportDispatchRecord): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
