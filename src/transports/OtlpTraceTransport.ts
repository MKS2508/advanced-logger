import type { SpanRecord, TransportRecord, ILogResource } from '../types/index.js';
import { HttpTransport, type HttpTransportOptions } from './HttpTransport.js';
import {
    toOtlpAttribute,
    readIngestKey,
    stripTrailingSlash,
    type OtlpAttributeValue,
    type OtlpTransportOptions
} from './OtlpTransport.js';

/**
 * Opciones de configuración para {@link OtlpTraceTransport}. Hereda todas las
 * opciones de {@link OtlpTransportOptions} (endpoint, serviceName,
 * ingestKeyEnvVar, batching, retry, ...) porque el transport de traces espeja
 * al de logs.
 */
export interface OtlpTraceTransportOptions extends OtlpTransportOptions {
    /**
     * Versión del scope que emite los spans (`scopeSpans[].scope.version`).
     * Opcional: si se omite, el bloque `scope` se emite sin `version` en vez
     * de inventar una.
     */
    scopeVersion?: string;
}

/**
 * Shape del body JSON de un request OTLP/HTTP para traces. Coincide con el
 * JSON mapping del proto `TracesData` para `/v1/traces`. Ver
 * https://opentelemetry.io/docs/specs/otlp/#json-protobuf-encoding
 */
interface OtlpTracesPayload {
    resourceSpans: Array<{
        resource: {
            attributes: Array<{ key: string; value: { stringValue: string } }>;
        };
        scopeSpans: Array<{
            scope: {
                name: string;
                version?: string;
            };
            spans: Array<OtlpSpan>;
        }>;
    }>;
}

/**
 * Span individual dentro del payload OTLP. Mappea 1:1 los campos del
 * `SpanRecord` al proto `Span` de la spec OTel Trace.
 * @see https://opentelemetry.io/docs/specs/otel/trace/api/#span
 */
interface OtlpSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: number;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes?: Array<{ key: string; value: OtlpAttributeValue }>;
    status?: { code: number; message?: string };
}

/**
 * Transport OTLP/HTTP para traces (spans) — POST a `<endpoint>/v1/traces`.
 *
 * Espeja {@link OtlpTransport} (que va a `/v1/logs`): hereda de
 * {@link HttpTransport} el batch, retry con backoff, buffer acotado, close
 * asincrónico y el hook on-error. Solo cambia la shape del payload y acepta
 * exclusivamente records de kind `'span'` (`accepts = ['span']`): el
 * {@link TransportManager} garantiza que jamás recibe un log record.
 *
 * @example
 * ```ts
 * logger.addTransport({
 *   target: new OtlpTraceTransport({
 *     endpoint: 'https://otelcollector.example.com:4318',
 *     serviceName: 'my-app',
 *     scopeVersion: '1.2.3'
 *   })
 * });
 *
 * await logger.span('db.query', { table: 'users' }, async () => {
 *   await db.select();
 * });
 * ```
 */
export class OtlpTraceTransport extends HttpTransport {
    override readonly name = 'otlp-trace';

    /** Este transport SOLO acepta spans — jamás recibe log records. */
    readonly accepts = ['span'] as const;

    private readonly resource: ILogResource;
    private readonly scopeVersion: string | undefined;
    /** Resuelto al construir. Nunca se loguea, nunca se escribe a source. */
    private readonly ingestKeyValue: string | undefined;

    constructor(options: OtlpTraceTransportOptions) {
        if (!options.endpoint) {
            throw new Error('OtlpTraceTransport: `endpoint` is required');
        }
        if (!options.serviceName) {
            throw new Error('OtlpTraceTransport: `serviceName` is required');
        }

        const ingestKey = readIngestKey(options.ingestKeyEnvVar);

        const httpOptions: HttpTransportOptions = {
            url: `${stripTrailingSlash(options.endpoint)}/v1/traces`,
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
        this.scopeVersion = options.scopeVersion;
        this.ingestKeyValue = ingestKey;
    }

    /**
     * Construye el payload JSON OTLP/HTTP a partir de los spans bufferizados.
     * Un bloque `resourceSpans` por batch. Expuesto para tests y subclasses.
     *
     * @param spans - Spans a serializar dentro del payload.
     * @returns Objeto `TracesData` listo para `JSON.stringify`.
     */
    buildPayload(spans: SpanRecord[]): OtlpTracesPayload {
        const resourceAttrs = Object.entries(this.resource)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([key, value]) => ({ key, value: { stringValue: value } }));

        return {
            resourceSpans: [
                {
                    resource: { attributes: resourceAttrs },
                    scopeSpans: [
                        {
                            scope: {
                                name: 'better-logger',
                                ...(this.scopeVersion ? { version: this.scopeVersion } : {})
                            },
                            spans: spans.map(s => this.toOtlpSpan(s))
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Serializa un batch al body JSON del request OTLP/HTTP. Override de
     * {@link HttpTransport.serializeBody}.
     */
    protected override serializeBody(records: TransportRecord[]): string {
        // accepts=['span'] hace que el manager solo despache SpanRecords aquí;
        // el cast refleja ese routing by-kind.
        return JSON.stringify(this.buildPayload(records as unknown as SpanRecord[]));
    }

    /**
     * Construye los headers del request. Agrega `signoz-ingestion-key` con el
     * valor resuelto al construir.
     */
    protected override buildHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            ...(this.ingestKeyValue ? { 'signoz-ingestion-key': this.ingestKeyValue } : {}),
            ...(this.options.headers ?? {})
        };
    }

    private toOtlpSpan(span: SpanRecord): OtlpSpan {
        const attributes: NonNullable<OtlpSpan['attributes']> = [
            { key: 'logger.scope', value: { stringValue: span.scope } }
        ];

        for (const [key, value] of Object.entries(span.attributes)) {
            const mapped = toOtlpAttribute(value);
            if (mapped) attributes.push({ key, value: mapped });
        }

        if (span.incomplete) {
            attributes.push({ key: 'span.incomplete', value: { boolValue: true } });
        }

        const out: OtlpSpan = {
            traceId: span.traceId,
            spanId: span.spanId,
            ...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
            name: span.name,
            kind: span.spanKind,
            startTimeUnixNano: span.startTimeUnixNano,
            endTimeUnixNano: span.endTimeUnixNano,
            attributes
        };

        if (span.status) {
            out.status = span.status;
        }

        return out;
    }
}

// ===== Internal helpers =====
