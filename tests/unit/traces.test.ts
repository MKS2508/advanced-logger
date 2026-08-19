/**
 * Trio API event/span/startSpan — spans + MDC correlation + leak-safety +
 * routing by-kind. Milestones C3, C4, C5, C6.
 */
import { describe, it, expect } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { OtlpTransport } from '../../src/transports/OtlpTransport.js';
import { OtlpTraceTransport } from '../../src/transports/OtlpTraceTransport.js';
import type {
    ITransport,
    SpanRecord,
    TransportDispatchRecord,
    TransportRecord
} from '../../src/types/index.js';

class CaptureTransport implements ITransport {
    readonly name = 'capture';
    readonly received: TransportDispatchRecord[] = [];

    /**
     * Kinds aceptados. Sin argumento queda `undefined` → el manager aplica
     * el default `['log']` (así se testea el comportamiento log-only).
     */
    constructor(readonly accepts?: readonly ('log' | 'span')[]) {}

    write(record: TransportDispatchRecord): void {
        this.received.push(record);
    }
}

function makeLogger(...transports: ITransport[]): Logger {
    const logger = new Logger({
        verbosity: 'trace',
        outputMode: 'silent',
        enableStackTrace: false
    });
    for (const t of transports) {
        logger.addTransport({ target: t });
    }
    return logger;
}

const tick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

function isSpanRecord(r: TransportDispatchRecord): r is SpanRecord {
    return (r as SpanRecord).kind === 'span';
}

function spansOf(capture: CaptureTransport): SpanRecord[] {
    return capture.received.filter(isSpanRecord);
}

function logsOf(capture: CaptureTransport): TransportRecord[] {
    return capture.received.filter((r): r is TransportRecord => !isSpanRecord(r));
}

describe('C3 — trio API event/span/startSpan', () => {
    it('event() emits a point-span with start === end', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        logger.event('build.finished', { status: 'ok' });
        await tick();

        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        const span = spans[0]!;
        expect(span.kind).toBe('span');
        expect(span.name).toBe('build.finished');
        expect(span.attributes).toEqual({ status: 'ok' });
        expect(span.startTimeUnixNano).toBe(span.endTimeUnixNano);
        expect(span.traceId).toMatch(/^[0-9a-f]{32}$/);
        expect(span.spanId).toMatch(/^[0-9a-f]{16}$/);
        // point-span cerrado: sin incomplete
        expect(span.incomplete).toBeUndefined();
    });

    it('span(fn) auto-ends on return (async fn, attributes overload)', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        const result = await logger.span('db.migrate', { target: 'v2' }, async (s) => {
            s.set('tables', 14);
            return 42;
        });

        expect(result).toBe(42);
        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.name).toBe('db.migrate');
        expect(spans[0]!.attributes).toEqual({ target: 'v2', tables: 14 });
        expect(BigInt(spans[0]!.endTimeUnixNano)).toBeGreaterThanOrEqual(BigInt(spans[0]!.startTimeUnixNano));
        expect(spans[0]!.incomplete).toBeUndefined();
    });

    it('span(fn) works with sync fn', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        const result = await logger.span('sync-op', () => 7);
        expect(result).toBe(7);
        expect(spansOf(capture)).toHaveLength(1);
    });

    it('span(fn) marks status error and rethrows on throw', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        await expect(logger.span('boom', async () => {
            throw new Error('kaput');
        })).rejects.toThrow('kaput');

        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.status).toEqual({ code: 2, message: 'kaput' });
    });

    it('startSpan() returns a handle with set chaining, end(attributes) and idempotent end', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        const s = logger.startSpan('spawn.build', { cmd: 'make' });
        expect(s.traceId).toMatch(/^[0-9a-f]{32}$/);
        expect(s.spanId).toMatch(/^[0-9a-f]{16}$/);
        expect(s.set('pid', 1234)).toBe(s);

        s.end({ exitCode: 0 });
        s.end(); // double end → no-op

        await tick();
        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.attributes).toEqual({ cmd: 'make', pid: 1234, exitCode: 0 });
        expect(spans[0]!.incomplete).toBeUndefined();
    });

    it('fail() sets status error and ends the span', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        const s = logger.startSpan('watch');
        s.fail(new Error('watchdog timeout'));

        await tick();
        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.status).toEqual({ code: 2, message: 'watchdog timeout' });
    });
});

describe('C4 — ALS singleton: parent + log↔span correlation', () => {
    it('logs inside span(fn) inherit traceId/spanId of the span', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        await logger.span('request.handle', async () => {
            await logger.scope('INNER').info('mid-log');
        });

        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        const logs = logsOf(capture);
        expect(logs).toHaveLength(1);

        // el prefijo de scope viaja inline en el msg (con badges ANSI)
        expect(logs[0]!.msg).toContain('mid-log');
        expect(logs[0]!.traceId).toBe(spans[0]!.traceId);
        expect(logs[0]!.spanId).toBe(spans[0]!.spanId);
    });

    it('logs outside the span do NOT carry the span ids', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        await logger.span('isolated', async () => {
            // nothing
        });
        await logger.info('outside');

        const logs = logsOf(capture);
        expect(logs).toHaveLength(1);
        expect(logs[0]!.traceId).toBeUndefined();
        expect(logs[0]!.spanId).toBeUndefined();
    });

    it('nested spans share traceId and link parentSpanId', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        await logger.span('outer', async () => {
            await logger.span('inner', async () => {
                // child work
            });
        });

        const spans = spansOf(capture);
        expect(spans).toHaveLength(2);
        const outer = spans.find(s => s.name === 'outer')!;
        const inner = spans.find(s => s.name === 'inner')!;
        expect(inner.parentSpanId).toBe(outer.spanId);
        expect(inner.traceId).toBe(outer.traceId);
        expect(outer.parentSpanId).toBeUndefined();
    });
});

describe('C5 — leak-safety: open spans exported on flush', () => {
    it('startSpan() without end() is exported with incomplete:true after flushTransports()', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        logger.startSpan('never-closed', { job: 'smoke' });
        await tick();
        // aún no exportado — está abierto
        expect(spansOf(capture)).toHaveLength(0);

        await logger.flushTransports();

        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.incomplete).toBe(true);
        expect(spans[0]!.name).toBe('never-closed');
        expect(spans[0]!.attributes).toEqual({ job: 'smoke' });
        // el cierre forzado fija un endTime real, no el placeholder '0'
        expect(spans[0]!.endTimeUnixNano).not.toBe('0');
    });

    it('late end() after forced close is a no-op (no duplicate export)', async () => {
        const capture = new CaptureTransport(['log', 'span']);
        const logger = makeLogger(capture);

        const s = logger.startSpan('late');
        await logger.flushTransports();
        s.end();

        const spans = spansOf(capture);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.incomplete).toBe(true);
    });
});

describe('C6 — routing regression by kind', () => {
    it('OtlpTransport (logs) receives ZERO span records; OtlpTraceTransport receives ZERO log records', async () => {
        const otlpLogs = new OtlpTransport({
            endpoint: 'http://routing.invalid',
            serviceName: 'routing-logs',
            batchSize: 1000,
            maxRetries: 0
        });
        const otlpTraces = new OtlpTraceTransport({
            endpoint: 'http://routing.invalid',
            serviceName: 'routing-traces',
            batchSize: 1000,
            maxRetries: 0
        });
        const logger = makeLogger(otlpLogs, otlpTraces);

        logger.event('span-only-evt');
        await tick();
        expect(otlpLogs.bufferSize).toBe(0);
        expect(otlpTraces.bufferSize).toBe(1);

        await logger.info('log-only-msg');
        await tick();
        expect(otlpLogs.bufferSize).toBe(1);
        // el trace transport sigue en 1 — ningún log le llegó
        expect(otlpTraces.bufferSize).toBe(1);
    });

    it('custom transport without accepts (default log-only) never sees a span', async () => {
        const capture = new CaptureTransport();
        const logger = makeLogger(capture);

        logger.event('evt');
        await logger.info('msg');
        await tick();

        expect(capture.received).toHaveLength(1);
        expect(isSpanRecord(capture.received[0]!)).toBe(false);
        expect(logsOf(capture)).toHaveLength(1);
    });

    it('spans do not go through the log transform pipeline', async () => {
        const seen: TransportRecord[] = [];
        const logger = new Logger({ verbosity: 'trace', outputMode: 'silent', enableStackTrace: false });
        logger.addTransport({
            target: new CaptureTransport(),
            options: {
                // transform asume shape de log; un span aquí rompería el
                // contrato (p.ej. al tocar record.message)
                transform: r => {
                    seen.push(r);
                    return r;
                }
            }
        });

        logger.event('no-transform');
        await tick();

        expect(seen).toHaveLength(0);
    });
});
