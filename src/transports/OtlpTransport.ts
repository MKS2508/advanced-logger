import type {
    TransportRecord,
    HookLogEntry,
    HookEvent,
    ILogResource
} from '../types/index.js';
import { LOG_LEVEL_TO_SEVERITY_NUMBER } from '../types/index.js';
import { HttpTransport, type HttpTransportOptions } from './HttpTransport.js';

/**
 * Options for {@link OtlpTransport}.
 *
 */
export interface OtlpTransportOptions {
    /**
     * OTLP/HTTP collector base URL, e.g. `https://collector.example.com:4318`.
     * The transport POSTs to `<endpoint>/v1/logs`.
     */
    endpoint: string;
    /** `service.name` resource attribute. Required by OTel spec. */
    serviceName: string;
    /** `service.version` resource attribute. Recommended. */
    serviceVersion?: string;
    /** `deployment.environment` resource attribute (production/staging/dev). */
    environment?: string;
    /** Extra resource attributes merged into the resource block. */
    resourceAttributes?: Record<string, string>;
    /**
     * Name of an env var whose value is sent as the `signoz-ingestion-key`
     * header. The transport reads `process.env[ingestKeyEnvVar]` at
     * construction time — never from a string literal. If the env var is
     * unset, the header is silently omitted (OTLP collector uses default
     * no-auth path).
     */
    ingestKeyEnvVar?: string;
    /** Extra headers merged in (Authorization, custom X-*). */
    headers?: Record<string, string>;
    /** Batch size (records per POST). Default 50. */
    batchSize?: number;
    /** Flush interval in ms. */
    flushInterval?: number;
    /** Hard cap on buffered records. Default 10_000. */
    maxBufferSize?: number;
    /** Max retry attempts per batch. Default 3. */
    maxRetries?: number;
    /** Initial backoff in ms. Default 250. */
    initialBackoffMs?: number;
    /** Backoff ceiling in ms. Default 5_000. */
    maxBackoffMs?: number;
    /** Per-fetch timeout in ms. Default 10_000. */
    fetchTimeoutMs?: number;
    /** Hook fired on transport failure (drop, retry exhaustion, ...). */
    onError?: (entry: HookLogEntry) => void | Promise<void>;
}

/**
 * Shape of the OTLP/HTTP JSON request body. Matches the `LogsData` proto
 * JSON mapping for `/v1/logs`. See
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

type OtlpAttributeValue =
    | { stringValue: string }
    | { intValue: number }
    | { doubleValue: number }
    | { boolValue: boolean }
    | { arrayValue: { values: OtlpAttributeValue[] } };

/**
 * OTLP/HTTP transport for SigNoz (or any OTLP-compliant backend).
 *
 * Extends {@link HttpTransport} — inherits retry, bounded buffer, status
 * check, async close, and the on-error hook. Overrides only the payload
 * shape and the request headers.
 *
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
 *
 */
export class OtlpTransport extends HttpTransport {
    override readonly name = 'otlp';

    private readonly resource: ILogResource;
    /** Resolved at construction. Never logged, never written to source. */
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
     * Builds the OTLP/HTTP JSON payload from the currently buffered records.
     * One `resourceLogs` block per batch (matches OTel collector batching
     * guidance). Exposed for tests + custom transport subclasses.
     *
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
     * Serialises a batch into the OTLP/HTTP JSON request body. Overrides
     * {@link HttpTransport.serializeBody}.
     *
     */
    protected override serializeBody(records: TransportRecord[]): string {
        return JSON.stringify(this.buildPayload(records));
    }

    /**
     * Builds request headers. Adds `signoz-ingestion-key` from the value
     * resolved at construction time (never logged, never written to source).
     *
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
 * Reads the ingest API key from `process.env[name]`. Returns undefined
 * silently if `process` is unavailable (strict browser bundles) or the
 * variable is unset. Never throws, never logs the value.
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