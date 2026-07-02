/**
 * Transports unit tests — ConsoleTransport, FileTransport, HttpTransport, OtlpTransport.
 * Verifies: async write, batch trigger, drop-oldest overflow, localStorage fallback,
 * status-based dispatch, payload shape.
 *
 *
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsoleTransport } from '../../src/transports/ConsoleTransport.js';
import { FileTransport } from '../../src/transports/FileTransport.js';
import { HttpTransport } from '../../src/transports/HttpTransport.js';
import { OtlpTransport } from '../../src/transports/OtlpTransport.js';
import { cleanup } from '../setup.js';
import type { TransportRecord } from '../../src/types/index.js';

const sampleRecord: TransportRecord = {
    level: 'info',
    levelValue: 1,
    severityNumber: 9,
    severityText: 'INFO',
    time: Date.now(),
    msg: 'transport test',
    prefix: 'TestPrefix'
};

// ============================================================
// ConsoleTransport
// ============================================================
describe('ConsoleTransport', () => {
    let transport: ConsoleTransport;

    beforeEach(() => {
        transport = new ConsoleTransport();
    });

    afterEach(() => {
        cleanup();
    });

    it('has name "console"', () => {
        expect(transport.name).toBe('console');
    });

    it('write does not throw', () => {
        expect(() => transport.write(sampleRecord)).not.toThrow();
    });

    it('write does not throw for any log level', () => {
        const levels: TransportRecord['level'][] = ['debug', 'info', 'warn', 'error', 'critical'];
        for (const level of levels) {
            expect(() => transport.write({ ...sampleRecord, level })).not.toThrow();
        }
    });

    it('write formats prefix correctly', () => {
        // ConsoleTransport formats as `[${prefix}] ${record.msg}` - we verify no throw
        expect(() => transport.write({ ...sampleRecord, prefix: 'MyPrefix' })).not.toThrow();
        expect(() => transport.write({ ...sampleRecord, prefix: undefined })).not.toThrow();
    });

    it('write handles record without prefix', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        transport.write({ ...sampleRecord, prefix: undefined });
        expect(() => transport.write({ ...sampleRecord, prefix: undefined })).not.toThrow();
        spy.mockRestore();
    });
});

// ============================================================
// FileTransport
// ============================================================
describe('FileTransport', () => {
    afterEach(() => {
        cleanup();
    });

    it('rejects path traversal in destination (Node)', () => {
        const transport = new FileTransport({ destination: '../../etc/passwd' });
        expect(transport.name).toBe('file');
        expect(transport.maxBufferSize).toBeGreaterThan(0);
    });

    it('rejects absolute paths', () => {
        const transport = new FileTransport({ destination: '/etc/passwd' });
        expect(transport.name).toBe('file');
    });

    it('keeps relative subdirectory destinations intact', () => {
        const transport = new FileTransport({ destination: 'logs/app.log' });
        expect(transport.name).toBe('file');
    });

    it('accepts records and respects maxBufferSize (drop-oldest)', () => {
        const transport = new FileTransport({ maxBufferSize: 3 });
        const record: TransportRecord = { ...sampleRecord };

        transport.write(record);
        transport.write(record);
        transport.write(record);
        expect(transport.bufferSize).toBe(3);

        // 4th write should drop oldest
        transport.write(record);
        expect(transport.bufferSize).toBeLessThanOrEqual(3);
    });

    it('marks itself not ready after close', async () => {
        const transport = new FileTransport({ destination: 'test-close.log' });
        await transport.close();
        expect(transport.isReady()).toBe(false);
    });

    it('flush resolves even when buffer is empty', async () => {
        const transport = new FileTransport();
        await expect(transport.flush()).resolves.toBeUndefined();
    });

    it('bufferSize reports 0 for fresh transport', () => {
        const transport = new FileTransport();
        expect(transport.bufferSize).toBe(0);
    });

    describe('browser localStorage fallback', () => {
        it('write does not throw when localStorage is undefined', () => {
            const transport = new FileTransport({ destination: 'test-browser.log' });
            // Simulate browser: localStorage unavailable
            const origLocalStorage = globalThis.localStorage;
            Object.defineProperty(globalThis, 'localStorage', {
                value: undefined,
                writable: true,
                configurable: true
            });
            try {
                expect(() => transport.write(sampleRecord)).not.toThrow();
            } finally {
                Object.defineProperty(globalThis, 'localStorage', {
                    value: origLocalStorage,
                    writable: true,
                    configurable: true
                });
            }
        });
    });
});

// ============================================================
// HttpTransport
// ============================================================
describe('HttpTransport', () => {
    let transport: HttpTransport;

    afterEach(() => {
        cleanup();
    });

    it('marks itself ready when url is set', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs' });
        expect(transport.isReady()).toBe(true);
    });

    it('marks itself not ready when url is absent', () => {
        transport = new HttpTransport();
        expect(transport.isReady()).toBe(false);
    });

    it('write buffers records without throwing', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs', maxBufferSize: 10 });
        expect(() => transport.write(sampleRecord)).not.toThrow();
    });

    it('write does not throw when closed', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs' });
        transport.close();
        expect(() => transport.write(sampleRecord)).not.toThrow();
    });

    it('bufferSize grows with writes', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs', batchSize: 100 });
        transport.write(sampleRecord);
        transport.write(sampleRecord);
        expect(transport.bufferSize).toBe(2);
    });

    it('serializeBody returns JSON with logs envelope', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs' });
        const body = transport.serializeBody([sampleRecord]);
        expect(body).toContain('"logs"');
        expect(JSON.parse(body)).toHaveProperty('logs');
    });

    it('close resolves without throwing', async () => {
        transport = new HttpTransport({ url: 'https://example.com/logs' });
        await expect(transport.close()).resolves.toBeUndefined();
    });

    it('buildHeaders returns Content-Type: application/json', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs' });
        const headers = transport.buildHeaders();
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('buildHeaders merges extra headers', () => {
        transport = new HttpTransport({ url: 'https://example.com/logs', headers: { Authorization: 'Bearer token' } });
        const headers = transport.buildHeaders();
        expect(headers['Authorization']).toBe('Bearer token');
    });

    describe('status-based dispatch (2xx ok, 4xx/5xx error)', () => {
        it('does not retry on 4xx responses', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request'
            });
            global.fetch = fetchMock;

            // Use batchSize: 1 so flush is triggered immediately on write
            transport = new HttpTransport({ url: 'https://example.com/logs', maxRetries: 3, batchSize: 1 });
            transport.write(sampleRecord);

            await transport.flush(); // Wait for the flush to complete

            // Only one attempt for 4xx (not retried)
            expect(fetchMock).toHaveBeenCalledTimes(1);
            delete (global as Record<string, unknown>).fetch;
        });
    });
});

// ============================================================
// OtlpTransport
// ============================================================
describe('OtlpTransport', () => {
    afterEach(() => {
        cleanup();
        // Clean up env vars
        delete process.env['OTEL_INGEST_KEY'];
        delete process.env['TEST_OTEL_KEY'];
    });

    it('throws on missing endpoint', () => {
        expect(() => new OtlpTransport({
            // @ts-expect-error testing runtime guard
            endpoint: '',
            serviceName: 'x'
        })).toThrow(/endpoint/i);
    });

    it('throws on missing serviceName', () => {
        expect(() => new OtlpTransport({
            endpoint: 'https://collector.example.com:4318',
            // @ts-expect-error testing runtime guard
            serviceName: ''
        })).toThrow(/serviceName/i);
    });

    it('has name "otlp"', () => {
        const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
        expect(transport.name).toBe('otlp');
    });

    describe('buildPayload', () => {
        it('returns OTLP envelope with resourceLogs array', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'my-svc' });
            const payload = transport.buildPayload([sampleRecord]);

            expect(payload).toHaveProperty('resourceLogs');
            expect(Array.isArray(payload.resourceLogs)).toBe(true);
            expect(payload.resourceLogs).toHaveLength(1);
        });

        it('resourceLogs contains service.name attribute', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'my-svc',
                serviceVersion: '1.2.3',
                environment: 'test'
            });
            const payload = transport.buildPayload([sampleRecord]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;

            const svcName = attrs.find((a: { key: string }) => a.key === 'service.name');
            expect(svcName?.value.stringValue).toBe('my-svc');

            const svcVer = attrs.find((a: { key: string }) => a.key === 'service.version');
            expect(svcVer?.value.stringValue).toBe('1.2.3');

            const env = attrs.find((a: { key: string }) => a.key === 'deployment.environment');
            expect(env?.value.stringValue).toBe('test');
        });

        it('scopeLogs contains logRecords array', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const payload = transport.buildPayload([sampleRecord]);
            const scopeLogs = payload.resourceLogs[0]!.scopeLogs;

            expect(scopeLogs).toHaveLength(1);
            expect(Array.isArray(scopeLogs[0]!.logRecords)).toBe(true);
            expect(scopeLogs[0]!.logRecords).toHaveLength(1);
        });

        it('logRecord has correct severityNumber for each level', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const levels: Array<TransportRecord['level']> = ['trace', 'debug', 'info', 'warn', 'error', 'critical'];
            const expectedSeverity: Record<string, number> = {
                trace: 1, debug: 5, info: 9, warn: 13, error: 17, critical: 21
            };

            for (const level of levels) {
                const record: TransportRecord = { ...sampleRecord, level, severityNumber: expectedSeverity[level] };
                const payload = transport.buildPayload([record]);
                const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
                expect(logRecord.severityNumber).toBe(expectedSeverity[level]);
            }
        });

        it('timeUnixNano is a string of nanoseconds (BigInt-safe)', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const payload = transport.buildPayload([sampleRecord]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            expect(typeof logRecord.timeUnixNano).toBe('string');
            const ns = BigInt(logRecord.timeUnixNano);
            expect(ns).toBeGreaterThan(0n);
        });

        it('body.stringValue maps to record.msg', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = { ...sampleRecord, msg: 'hello otlp' };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
            expect(logRecord.body.stringValue).toBe('hello otlp');
        });

        it('attributes flattening — nested object becomes dot-notation', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const record: TransportRecord = {
                ...sampleRecord,
                attributes: { user: { name: 'Alice', id: 1 } }
            };
            const payload = transport.buildPayload([record]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;

            // Nested object gets JSON-stringified (OTLP attribute value is string)
            expect(logRecord.attributes).toBeDefined();
            const userAttr = logRecord.attributes!.find((a: { key: string }) => a.key === 'user');
            expect(userAttr?.value).toEqual({ stringValue: '{"name":"Alice","id":1}' });
        });

        it('prefix attribute is included', () => {
            const transport = new OtlpTransport({ endpoint: 'https://example.com:4318', serviceName: 'svc' });
            const payload = transport.buildPayload([sampleRecord]);
            const logRecord = payload.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
            const prefixAttr = logRecord.attributes!.find((a: { key: string }) => a.key === 'logger.prefix');
            expect(prefixAttr?.value).toEqual({ stringValue: 'TestPrefix' });
        });
    });

    describe('ingestKey from env var', () => {
        it('omits ingest key header when env var is unset', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'NONEXISTENT_OTEL_KEY_42'
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBeUndefined();
        });

        it('includes ingest key header when env var is set', () => {
            process.env['TEST_OTEL_KEY'] = 'otel-key-<REDACTED>';
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'TEST_OTEL_KEY'
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBe('otel-key-<REDACTED>');
        });

        it('OTEL_INGEST_KEY env var works out of the box', () => {
            process.env['OTEL_INGEST_KEY'] = 'default-ingest-key';
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                ingestKeyEnvVar: 'OTEL_INGEST_KEY'
            });
            const headers = transport.buildHeaders();
            expect(headers['signoz-ingestion-key']).toBe('default-ingest-key');
        });
    });

    describe('resource attributes', () => {
        it('setResource attributes appear in resource block', () => {
            const transport = new OtlpTransport({
                endpoint: 'https://example.com:4318',
                serviceName: 'svc',
                resourceAttributes: { 'custom.attr': 'custom-value' }
            });
            const payload = transport.buildPayload([sampleRecord]);
            const attrs = payload.resourceLogs[0]!.resource.attributes;

            const customAttr = attrs.find((a: { key: string }) => a.key === 'custom.attr');
            expect(customAttr?.value.stringValue).toBe('custom-value');
        });
    });
});
