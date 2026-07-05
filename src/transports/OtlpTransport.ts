import type {
    TransportRecord,
    HookLogEntry,
    HookEvent,
    ILogResource
} from '../types/index.js';
import { LOG_LEVEL_TO_SEVERITY_NUMBER } from '../types/index.js';
import { HttpTransport, type HttpTransportOptions } from './HttpTransport.js';

/**
 * Opciones de configuración para {@link OtlpTransport}.
 */
export interface OtlpTransportOptions {
    /**
     * URL base del collector OTLP/HTTP, p.ej. `https://collector.example.com:4318`.
     * El transport hace POST a `<endpoint>/v1/logs`.
     */
    endpoint: string;
    /** Atributo de resource `service.name`. Requerido por la spec OTel. */
    serviceName: string;
    /** Atributo de resource `service.version`. Recomendado. */
    serviceVersion?: string;
    /** Atributo de resource `deployment.environment` (production/staging/dev). */
    environment?: string;
    /** Atributos de resource adicionales que se merguean en el bloque `resource`. */
    resourceAttributes?: Record<string, string>;
    /**
     * Nombre de la env var cuyo valor se envía como header
     * `signoz-ingestion-key`. El transport lee `process.env[ingestKeyEnvVar]`
     * al construirse — nunca desde un string literal. Si la env var no está
     * seteada, el header se omite silenciosamente (el collector OTLP usa el
     * path default sin auth).
     */
    ingestKeyEnvVar?: string;
    /** Headers extra que se merguean (Authorization, X-* custom). */
    headers?: Record<string, string>;
    /** Tamaño del batch (records por POST). Default 50. */
    batchSize?: number;
    /** Intervalo de flush en ms. */
    flushInterval?: number;
    /** Tope duro de records bufferizados. Default 10_000. */
    maxBufferSize?: number;
    /** Reintentos máximos por batch. Default 3. */
    maxRetries?: number;
    /** Backoff inicial en ms. Default 250. */
    initialBackoffMs?: number;
    /** Techo de backoff en ms. Default 5_000. */
    maxBackoffMs?: number;
    /** Timeout por fetch en ms. Default 10_000. */
    fetchTimeoutMs?: number;
    /** Hook que se dispara ante falla del transport (drop, agotamiento de reintentos, ...). */
    onError?: (entry: HookLogEntry) => void | Promise<void>;
}

/**
 * Shape del body JSON de un request OTLP/HTTP. Coincide con el JSON mapping
 * del proto `LogsData` para `/v1/logs`. Ver
 * https://opentelemetry.io/docs/specs/otlp/#json-protobuf-encoding
 */
interface OtlpLogsPayload {
    resourceLogs: Array<{
        resource: {
            attributes: Array<{ key: string; value: { stringValue: string } }>;
        };
        scopeLogs: Array<{
            scope: {
                name: string;
                version: string;
            };
            logRecords: Array<OtlpLogRecord>;
        }>;
    }>;
}

/**
 * Registro individual de log dentro del payload OTLP. Mappea mensaje,
 * severidad, timestamp (en nanosegundos), atributos y contexto de trace al
 * formato `LogRecord` definido por la spec OTel Logs.
 * @see https://opentelemetry.io/docs/specs/otel/logs/data-model/
 */
interface OtlpLogRecord {
    timeUnixNano: string;
    observedTimeUnixNano: string;
    severityNumber: number;
    severityText: string;
    body: { stringValue: string };
    attributes?: Array<{ key: string; value: OtlpAttributeValue }>;
    traceId?: string;
    spanId?: string;
}

/**
 * Unión discriminada que representa un `AnyValue` de OTel para atributos de
 * log. Soporta string, int, double, bool y arrays anidados (homogéneos o
 * mixtos).
 * @see https://opentelemetry.io/docs/specs/otel/common/
 */
type OtlpAttributeValue =
    | { stringValue: string }
    | { intValue: number }
    | { doubleValue: number }
    | { boolValue: boolean }
    | { arrayValue: { values: OtlpAttributeValue[] } };

/**
 * Transport OTLP/HTTP para SigNoz (o cualquier backend compatible con OTLP).
 *
 * Extiende {@link HttpTransport} — hereda retry, buffer acotado, status check,
 * close asincrónico y el hook on-error. Overridea únicamente la shape del
 * payload y los headers del request.
 *
 * @example
 * ```ts
 * logger.addTransport({
 *   target: new OtlpTransport({
 *     endpoint: 'https://otelcollector.example.com:4318',
 *     serviceName: 'my-app',
 *     serviceVersion: '1.2.3',
 *     environment: 'production',
 *     ingestKeyEnvVar: 'SIGNOZ_KEY'
 *   })
 * });
 * ```
 */
export class OtlpTransport extends HttpTransport {
    override readonly name = 'otlp';

    private readonly resource: ILogResource;
    /** Resuelto al construir. Nunca se loguea, nunca se escribe a source. */
    private readonly ingestKeyValue: string | undefined;

    constructor(options: OtlpTransportOptions) {
        if (!options.endpoint) {
            throw new Error('OtlpTransport: `endpoint` is required');
        }
        if (!options.serviceName) {
            throw new Error('OtlpTransport: `serviceName` is required');
        }

        const ingestKey = readIngestKey(options.ingestKeyEnvVar);

        const httpOptions: HttpTransportOptions = {
            url: `${stripTrailingSlash(options.endpoint)}/v1/logs`,
            headers: {
                ...(ingestKey ? { 'signoz-ingestion-key': ingestKey } : {}),
                ...(options.headers ?? {})
            },
            batchSize: options.batchSize,
            flushInterval: options.flushInterval,
            maxBufferSize: options.maxBufferSize,
            maxRetries: options.maxRetries,
            initialBackoffMs: options.initialBackoffMs,
            maxBackoffMs: options.maxBackoffMs,
            fetchTimeoutMs: options.fetchTimeoutMs,
            onError: options.onError
        };

        super(httpOptions);

        this.resource = {
            'service.name': options.serviceName,
            ...(options.serviceVersion ? { 'service.version': options.serviceVersion } : {}),
            ...(options.environment ? { 'deployment.environment': options.environment } : {}),
            ...(options.resourceAttributes ?? {})
        };
        this.ingestKeyValue = ingestKey;
    }

    /**
     * Construye el payload JSON OTLP/HTTP a partir de los records bufferizados.
     * Un bloque `resourceLogs` por batch (sigue la guía de batching del
     * collector OTel). Expuesto para tests y para subclasses custom de transport.
     *
     * @param records - Records de log a serializar dentro del payload.
     * @returns Objeto `LogsData` listo para `JSON.stringify`.
     * @see {@link OtlpLogsPayload}
     */
    buildPayload(records: TransportRecord[]): OtlpLogsPayload {
        const resourceAttrs = Object.entries(this.resource)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([key, value]) => ({ key, value: { stringValue: value } }));

        return {
            resourceLogs: [
                {
                    resource: { attributes: resourceAttrs },
                    scopeLogs: [
                        {
                            scope: {
                                name: 'better-logger',
                                version: '5.1.0'
                            },
                            logRecords: records.map(r => this.toLogRecord(r))
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Serializa un batch al body JSON del request OTLP/HTTP. Override de
     * {@link HttpTransport.serializeBody}.
     *
     * @param records - Records del batch a serializar.
     * @returns String JSON listo para usar como `body` del fetch POST.
     */
    protected override serializeBody(records: TransportRecord[]): string {
        return JSON.stringify(this.buildPayload(records));
    }

    /**
     * Construye los headers del request. Agrega `signoz-ingestion-key` con el
     * valor resuelto al construir (nunca se loguea, nunca se escribe a source).
     *
     * @returns Record de headers a merguear en el fetch.
     */
    protected override buildHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            ...(this.ingestKeyValue ? { 'signoz-ingestion-key': this.ingestKeyValue } : {}),
            ...(this.options.headers ?? {})
        };
    }

    private toLogRecord(record: TransportRecord): OtlpLogRecord {
        const timeUnixNano = String(BigInt(record.time) * 1_000_000n);
        const observedTimeUnixNano = timeUnixNano;
        const severityNumber = LOG_LEVEL_TO_SEVERITY_NUMBER[record.level];

        const base: OtlpLogRecord = {
            timeUnixNano,
            observedTimeUnixNano,
            severityNumber,
            severityText: record.severityText,
            body: { stringValue: record.msg }
        };

        const attributes = collectAttributes(record);
        if (attributes.length > 0) {
            base.attributes = attributes;
        }

        if (record.traceId) base.traceId = record.traceId;
        if (record.spanId) base.spanId = record.spanId;

        return base;
    }
}

// ===== Internal helpers =====

function stripTrailingSlash(value: string): string {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

/**
 * Lee la ingest API key desde `process.env[name]`. Devuelve `undefined`
 * silenciosamente si `process` no está disponible (bundles estrictos de
 * browser) o si la variable no está seteada. Nunca throwea, nunca loguea
 * el valor.
 *
 * @internal Helper del constructor de {@link OtlpTransport}; no es API pública.
 * @param envVarName - Nombre de la env var a leer.
 * @returns Valor de la key, o `undefined` si no está disponible.
 */
function readIngestKey(envVarName: string | undefined): string | undefined {
    if (!envVarName) return undefined;
    if (typeof process === 'undefined') return undefined;
    const proc = process as { env?: Record<string, string | undefined> };
    const value = proc.env?.[envVarName];
    if (!value) return undefined;
    return value;
}

function collectAttributes(record: TransportRecord): Array<{ key: string; value: OtlpAttributeValue }> {
    const out: Array<{ key: string; value: OtlpAttributeValue }> = [];

    if (record.prefix) {
        out.push({ key: 'logger.prefix', value: { stringValue: record.prefix } });
    }
    if (record.tag) {
        out.push({ key: 'logger.tag', value: { stringValue: record.tag } });
    }
    if (record.location) {
        out.push({ key: 'code.filepath', value: { stringValue: record.location.file } });
        out.push({ key: 'code.lineno', value: { intValue: record.location.line } });
        if (record.location.function) {
            out.push({ key: 'code.function', value: { stringValue: record.location.function } });
        }
    }

    if (record.attributes) {
        for (const [key, value] of Object.entries(record.attributes)) {
            const mapped = toOtlpAttribute(value);
            if (mapped) out.push({ key, value: mapped });
        }
    }

    return out;
}

function toOtlpAttribute(value: unknown): OtlpAttributeValue | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return { intValue: value };
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') return { boolValue: value };
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value
                    .map(v => toOtlpAttribute(v))
                    .filter((v): v is OtlpAttributeValue => v !== null)
            }
        };
    }
    return { stringValue: JSON.stringify(value) };
}