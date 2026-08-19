/**
 * OtlpTraceTransport — unit tests del payload OTLP /v1/traces.
 * Milestone C2: buildPayload produce resourceSpans/scopeSpans/spans bien
 * formado; accepts === ['span'].
 */
import { describe, it, expect } from 'vitest';
import { OtlpTraceTransport } from '../../src/transports/OtlpTraceTransport.js';
import type { SpanRecord } from '../../src/types/index.js';

function sampleSpan(overrides: Partial<SpanRecord> = {}): SpanRecord {
    return {
        kind: 'span',
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
        name: 'db.query',
        spanKind: 1,
        startTimeUnixNano: '1700000000000000000',
        endTimeUnixNano: '1700000000123000000',
        attributes: { 'db.system': 'postgres', rows: 42, cached: false },
        scope: 'API:Stripe',
        ...overrides
    };
}

describe('OtlpTraceTransport', () => {
    it('accepts only span records', () => {
        const transport = new OtlpTraceTransport({
            endpoint: 'https://collector.example.com',
            serviceName: 'trace-test'
        });
        expect(transport.accepts).toEqual(['span']);
    });

    it('builds a valid OTLP/HTTP traces payload', () => {
        const transport = new OtlpTraceTransport({
            endpoint: 'https://collector.example.com',
            serviceName: 'trace-test',
            serviceVersion: '1.0.0',
            environment: 'staging'
        });

        const payload = transport.buildPayload([sampleSpan()]);

        expect(Array.isArray(payload.resourceSpans)).toBe(true);
        expect(payload.resourceSpans).toHaveLength(1);

        const block = payload.resourceSpans[0]!;
        expect(block).toHaveProperty('resource');
        expect(block).toHaveProperty('scopeSpans');
        expect(block.scopeSpans).toHaveLength(1);

        const resourceAttrs = block.resource.attributes;
        expect(resourceAttrs.find(a => a.key === 'service.name')!.value.stringValue).toBe('trace-test');
        expect(resourceAttrs.find(a => a.key === 'service.version')!.value.stringValue).toBe('1.0.0');
        expect(resourceAttrs.find(a => a.key === 'deployment.environment')!.value.stringValue).toBe('staging');

        const scope = block.scopeSpans[0]!;
        expect(scope.scope.name).toBe('better-logger');
        expect(scope.scope.version).toBeUndefined();

        const span = scope.spans[0]!;
        expect(span.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
        expect(span.spanId).toBe('b7ad6b7169203331');
        expect(span.parentSpanId).toBeUndefined();
        expect(span.name).toBe('db.query');
        expect(span.kind).toBe(1);
        expect(span.startTimeUnixNano).toBe('1700000000000000000');
        expect(span.endTimeUnixNano).toBe('1700000000123000000');

        // attributes: user attrs reusan el mapping toOtlpAttribute
        const attrs = span.attributes!;
        expect(attrs.find(a => a.key === 'db.system')!.value).toEqual({ stringValue: 'postgres' });
        expect(attrs.find(a => a.key === 'rows')!.value).toEqual({ intValue: 42 });
        expect(attrs.find(a => a.key === 'cached')!.value).toEqual({ boolValue: false });
        // scope del logger viaja como attribute (no es campo del proto Span)
        expect(attrs.find(a => a.key === 'logger.scope')!.value).toEqual({ stringValue: 'API:Stripe' });
        expect(attrs.find(a => a.key === 'span.incomplete')).toBeUndefined();
        expect(span.status).toBeUndefined();
    });

    it('maps parentSpanId, status and incomplete flag', () => {
        const transport = new OtlpTraceTransport({
            endpoint: 'https://collector.example.com',
            serviceName: 'trace-test',
            scopeVersion: '0.18.2'
        });

        const payload = transport.buildPayload([
            sampleSpan({
                parentSpanId: '1111111111111111',
                status: { code: 2, message: 'connection refused' },
                incomplete: true
            })
        ]);

        const scope = payload.resourceSpans[0]!.scopeSpans[0]!;
        expect(scope.scope.version).toBe('0.18.2');

        const span = scope.spans[0]!;
        expect(span.parentSpanId).toBe('1111111111111111');
        expect(span.status).toEqual({ code: 2, message: 'connection refused' });
        expect(span.attributes!.find(a => a.key === 'span.incomplete')!.value).toEqual({ boolValue: true });
    });

    it('throws on missing endpoint', () => {
        expect(() => new OtlpTraceTransport({
            endpoint: '',
            serviceName: 'x'
        })).toThrow(/endpoint/);
    });

    it('throws on missing serviceName', () => {
        expect(() => new OtlpTraceTransport({
            endpoint: 'https://collector.example.com',
            serviceName: ''
        })).toThrow(/serviceName/);
    });
});
