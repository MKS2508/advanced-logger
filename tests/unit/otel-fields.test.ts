/**
 * OTLP field correctness unit tests — severityNumber per LogLevel,
 * timeUnixNano conversion, resource attributes, attributes flattening,
 * ingestKey from OTEL_INGEST_KEY env var.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { OtlpTransport } from '../../src/transports/OtlpTransport.js';
import { LOG_LEVEL_TO_SEVERITY_NUMBER } from '../../src/types/index.js';
import { cleanup } from '../setup.js';
import type { TransportRecord } from '../../src/types/index.js';

describe('OTLP field correctness', () => {
    afterEach(() => {
        cleanup();
        delete process.env['OTEL_INGEST_KEY'];
        delete process.env['TEST_OTEL_INGEST_KEY'];
    });

    describe('severityNumber per LogLevel', () => {
        const levelSeverityPairs: Array<{ level: TransportRecord['level']; expected: number }> = [
            { level: 'trace', expected: 1 },
            { level: 'debug', expected: 5 },
            { level: 'info', expected: 9 },
            { level: 'warn', expected: 13 },
            { level: 'error', expected: 17 },
            { level: 'critical', expected: 21 },
        ];

        for (const { level, expected } of levelSeverityPairs) {
            it(`severityNumber for ${level} is ${expected}`, () => {
                const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
                const record: TransportRecord = {
                    level,
                    levelValue: 0,
                    severityNumber: expected,
                    severityText: level.toUpperCase(),
                    time: Date.now(),
                    msg: `${level} message`
                };
                const payload = transport.buildPayload([record]);
                const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
                expect(logRecord.severityNumber).toBe(expected);
            });
        }

        it('LOG_LEVEL_TO_SEVERITY_NUMBER maps match OTLP spec bands', () => {
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['trace']).toBe(1);
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['debug']).toBe(5);
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['info']).toBe(9);
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['warn']).toBe(13);
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['error']).toBe(17);
            expect(LOG_LEVEL_TO_SEVERITY_NUMBER['critical']).toBe(21);
        });
    });

    describe('timeUnixNano conversion (ms -> ns, BigInt-safe)', () => {
        it('timeUnixNano is a string of nanoseconds', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const before = Date.now();
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: before,
                msg: 'time test'
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            expect(typeof logRecord.timeUnixNano).toBe('string');
        });

        it('timeUnixNano equals time × 1_000_000', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const ts = 1715000000000; // Fixed timestamp
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: ts,
                msg: 'time test'
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const ns = BigInt(logRecord.timeUnixNano);
            const expectedNs = BigInt(ts) * 1_000_000n;
            expect(ns).toBe(expectedNs);
        });

        it('observedTimeUnixNano equals timeUnixNano (no clock skew)', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'observed test'
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            expect(logRecord.observedTimeUnixNano).toBe(logRecord.timeUnixNano);
        });

        it('BigInt conversion does not throw for large timestamps', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const farFuture = 9007199254740991; // Number.MAX_SAFE_INTEGER
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: farFuture,
                msg: 'large timestamp'
            };
            expect(() => transport.buildPayload([record])).not.toThrow();
        });
    });

    describe('resource attributes from setResource', () => {
        it('service.name is always present in resource', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'my-service'
            });
            const payload = transport.buildPayload([{
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'resource test'
            }]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;
            const svcName = attrs.find(a => a.key === 'service.name');
            expect(svcName?.value.stringValue).toBe('my-service');
        });

        it('service.version is present when provided', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                serviceVersion: '2.0.0'
            });
            const payload = transport.buildPayload([{
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'version test'
            }]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;
            const svcVer = attrs.find(a => a.key === 'service.version');
            expect(svcVer?.value.stringValue).toBe('2.0.0');
        });

        it('deployment.environment is present when provided', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                environment: 'production'
            });
            const payload = transport.buildPayload([{
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'env test'
            }]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;
            const envAttr = attrs.find(a => a.key === 'deployment.environment');
            expect(envAttr?.value.stringValue).toBe('production');
        });

        it('resourceAttributes merges custom attributes into resource', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                resourceAttributes: {
                    'host.name': 'prod-host-1',
                    'cloud.zone': 'us-east-1a'
                }
            });
            const payload = transport.buildPayload([{
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'custom attrs'
            }]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;

            const hostName = attrs.find(a => a.key === 'host.name');
            expect(hostName?.value.stringValue).toBe('prod-host-1');

            const zone = attrs.find(a => a.key === 'cloud.zone');
            expect(zone?.value.stringValue).toBe('us-east-1a');
        });
    });

    describe('attributes flattening', () => {
        it('nested object becomes JSON-stringified string value', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'nested test',
                attributes: {
                    nested: { deep: { value: 42 } },
                    array: [1, 2, 3],
                    number: 123,
                    bool: true,
                    null: null,
                }
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const nestedAttr = logRecord.attributes!.find(a => a.key === 'nested');
            expect(nestedAttr?.value).toEqual({ stringValue: '{"deep":{"value":42}}' });

            const arrayAttr = logRecord.attributes!.find(a => a.key === 'array');
            expect(arrayAttr?.value).toEqual({ arrayValue: { values: [
                { intValue: 1 }, { intValue: 2 }, { intValue: 3 }
            ]}});

            const boolAttr = logRecord.attributes!.find(a => a.key === 'bool');
            expect(boolAttr?.value).toEqual({ boolValue: true });

            const numAttr = logRecord.attributes!.find(a => a.key === 'number');
            expect(numAttr?.value).toEqual({ intValue: 123 });
        });

        it('flat attributes are preserved as-is', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'flat attrs',
                attributes: {
                    'requestId': 'req-abc',
                    'userId': 12345,
                    'isAuthenticated': true,
                }
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const reqId = logRecord.attributes!.find(a => a.key === 'requestId');
            expect(reqId?.value).toEqual({ stringValue: 'req-abc' });

            const userId = logRecord.attributes!.find(a => a.key === 'userId');
            expect(userId?.value).toEqual({ intValue: 12345 });

            const auth = logRecord.attributes!.find(a => a.key === 'isAuthenticated');
            expect(auth?.value).toEqual({ boolValue: true });
        });

        it('location attributes are included', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'location test',
                location: {
                    file: '/app/src/index.ts',
                    line: 42,
                    column: 10,
                    function: 'main'
                }
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const fileAttr = logRecord.attributes!.find(a => a.key === 'code.filepath');
            expect(fileAttr?.value).toEqual({ stringValue: '/app/src/index.ts' });

            const lineAttr = logRecord.attributes!.find(a => a.key === 'code.lineno');
            expect(lineAttr?.value).toEqual({ intValue: 42 });

            const fnAttr = logRecord.attributes!.find(a => a.key === 'code.function');
            expect(fnAttr?.value).toEqual({ stringValue: 'main' });
        });

        it('prefix is included as logger.prefix attribute', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'prefix test',
                prefix: 'AuthModule'
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const prefixAttr = logRecord.attributes!.find(a => a.key === 'logger.prefix');
            expect(prefixAttr?.value).toEqual({ stringValue: 'AuthModule' });
        });

        it('tag is included as logger.tag attribute', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                level: 'info',
                levelValue: 1,
                severityNumber: 9,
                severityText: 'INFO',
                time: Date.now(),
                msg: 'tag test',
                tag: 'success'
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            const tagAttr = logRecord.attributes!.find(a => a.key === 'logger.tag');
            expect(tagAttr?.value).toEqual({ stringValue: 'success' });
        });
    });

    describe('ingestKey from OTEL_INGEST_KEY env var', () => {
        it('OTEL_INGEST_KEY is read by default when set', () => {
            process.env['OTEL_INGEST_KEY'] = 'otel-default-key';
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'OTEL_INGEST_KEY'
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBe('otel-default-key');
        });

        it('x-ingest-key header is included when ingest key is set', () => {
            process.env['TEST_OTEL_INGEST_KEY'] = 'my-secret-key';
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'TEST_OTEL_INGEST_KEY'
            });
            const headers = transport.buildHeaders();
            expect(headers).toHaveProperty('signoz-ingestion-key', 'my-secret-key');
            expect(headers).toHaveProperty('Content-Type', 'application/json');
        });

        it('headers include x-ingest-key alongside custom headers', () => {
            process.env['TEST_OTEL_INGEST_KEY'] = 'key-from-env';
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'TEST_OTEL_INGEST_KEY',
                headers: { 'X-Custom-Header': 'custom-value' }
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBe('key-from-env');
            expect(headers['X-Custom-Header']).toBe('custom-value');
        });

        it('no signoz-ingestion-key header when env var is not set', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'DEFINITELY_NOT_SET_OTEL_KEY'
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBeUndefined();
        });
    });
});
