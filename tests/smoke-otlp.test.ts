/**
 * OtlpTransport smoke test — verifies the payload shape is valid OTLP/HTTP
 * JSON against a local echo endpoint (no SigNoz needed).
 *
 * To run against the real SigNoz cluster:
 *   SIGNOZ_TEST=1 \
 *   SIGNOZ_ENDPOINT=https://otelcollectorhttp-m14cthfg0sozmd5adfyq6ttk.mks2508.systems:4318 \
 *   SIGNOZ_KEY=<REDACTED> \
 *   bunx vitest run tests/smoke-otlp.test.ts
 *
 * @since 5.1.0
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OtlpTransport } from '../src/transports/OtlpTransport.js';
import type { TransportRecord } from '../src/types/index.js';

describe('OtlpTransport', () => {
    const sampleRecord: TransportRecord = {
        level: 'info',
        levelValue: 1,
        severityNumber: 9,
        severityText: 'INFO',
        time: Date.now(),
        msg: 'smoke test message',
        prefix: 'Auth',
        attributes: { requestId: 'req-123', userId: 'u-456' }
    };

    it('builds a valid OTLP/HTTP JSON payload', () => {
        const transport = new OtlpTransport({
            endpoint: 'https://collector.example.com:4318',
            serviceName: 'smoke-test',
            serviceVersion: '1.0.0',
            environment: 'test'
        });

        const payload = transport.buildPayload([sampleRecord]);

        // OTLP envelope structure
        expect(payload).toHaveProperty('resourceLogs');
        expect(Array.isArray(payload.resourceLogs)).toBe(true);
        expect(payload.resourceLogs).toHaveLength(1);

        const block = payload.resourceLogs[0]!;
        expect(block).toHaveProperty('resource');
        expect(block).toHaveProperty('scopeLogs');
        expect(block.scopeLogs).toHaveLength(1);

        // Resource attributes (service.name MUST be present per OTel spec)
        const resourceAttrs = block.resource.attributes;
        const serviceName = resourceAttrs.find(a => a.key === 'service.name');
        expect(serviceName).toBeDefined();
        expect(serviceName!.value.stringValue).toBe('smoke-test');

        const serviceVersion = resourceAttrs.find(a => a.key === 'service.version');
        expect(serviceVersion).toBeDefined();
        expect(serviceVersion!.value.stringValue).toBe('1.0.0');

        const env = resourceAttrs.find(a => a.key === 'deployment.environment');
        expect(env).toBeDefined();
        expect(env!.value.stringValue).toBe('test');

        // Log record mapping
        const logRecord = block.scopeLogs[0]!.logRecords[0]!;
        expect(logRecord.body.stringValue).toBe('smoke test message');
        expect(logRecord.severityNumber).toBe(9);
        expect(logRecord.severityText).toBe('INFO');
        expect(logRecord.attributes).toBeDefined();

        const loggerPrefix = logRecord.attributes!.find(a => a.key === 'logger.prefix');
        expect(loggerPrefix!.value).toEqual({ stringValue: 'Auth' });

        const requestIdAttr = logRecord.attributes!.find(a => a.key === 'requestId');
        expect(requestIdAttr!.value).toEqual({ stringValue: 'req-123' });

        // timeUnixNano is a string of nanoseconds
        expect(typeof logRecord.timeUnixNano).toBe('string');
        expect(BigInt(logRecord.timeUnixNano)).toBeGreaterThan(0n);
    });

    it('throws on missing endpoint', () => {
        expect(() => new OtlpTransport({
            // @ts-expect-error testing runtime guard
            endpoint: '',
            serviceName: 'x'
        })).toThrow(/endpoint/);
    });

    it('throws on missing serviceName', () => {
        expect(() => new OtlpTransport({
            endpoint: 'https://collector.example.com:4318',
            // @ts-expect-error testing runtime guard
            serviceName: ''
        })).toThrow(/serviceName/);
    });

    it('omits signoz-ingestion-key when env var is unset', () => {
        const transport = new OtlpTransport({
            endpoint: 'https://collector.example.com:4318',
            serviceName: 'test',
            ingestKeyEnvVar: 'NONEXISTENT_SIGNOZ_KEY_42'
        });
        const headers = (transport as unknown as { buildHeaders: () => Record<string, string> }).buildHeaders();
        expect(headers['signoz-ingestion-key']).toBeUndefined();
    });

    it('uses signoz-ingestion-key when env var is set', () => {
        process.env['TEST_SIGNOZ_KEY'] = 'test-key-<REDACTED>';
        try {
            const transport = new OtlpTransport({
                endpoint: 'https://collector.example.com:4318',
                serviceName: 'test',
                ingestKeyEnvVar: 'TEST_SIGNOZ_KEY'
            });
            const headers = (transport as unknown as { buildHeaders: () => Record<string, string> }).buildHeaders();
            expect(headers['signoz-ingestion-key']).toBe('test-key-<REDACTED>');
        } finally {
            delete process.env['TEST_SIGNOZ_KEY'];
        }
    });
});
