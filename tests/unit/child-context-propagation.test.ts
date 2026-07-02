/**
 * F4.5.5 — child() context propagation to TransportRecord.
 * Bug: logger.child({k:v}).info(msg) produces a TransportRecord whose
 * `attributes` field is undefined instead of {k:v}.
 *
 * Root cause: LogContext.child() sets childLogger.context on the Logger
 * instance, but dispatchToTransports() reads from this.logContext._getContextRecord()
 * which returns LogContext's internal context (empty for a fresh child Logger).
 *
 *
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/Logger.js';
import type { TransportRecord } from '../../src/types/index.js';
import { cleanup } from '../setup.js';

describe('child() context propagation to TransportRecord', () => {
    let captured: TransportRecord[];
    let logger: Logger;

    const makeCaptureTransport = (): { target: { name: string; level: string; write: (r: TransportRecord) => void; flush: () => Promise<void>; close: () => Promise<void> }; level: 'trace' } => {
        const t = {
            target: {
                name: 'capture',
                level: 'trace' as const,
                write(r: TransportRecord) { captured.push(r); },
                flush: async () => {},
                close: async () => {},
            },
            level: 'trace' as const,
        };
        return t;
    };

    beforeEach(() => {
        captured = [];
        logger = new Logger({ verbosity: 'debug' });
    });

    afterEach(async () => {
        await logger.closeTransports();
        cleanup();
    });

    it('logger.child({k:v}).info(msg) records attributes with k:v', async () => {
        const l = logger.child({ requestId: 'r-1' });
        l.addTransport(makeCaptureTransport());
        l.info('hello');
        await l.flushTransports();
        expect(captured[0].attributes).toEqual({ requestId: 'r-1' });
    });

    it('grandchild inherits parent bindings and overrides', async () => {
        const l = logger.child({ scope: 'outer' });
        const ll = l.child({ requestId: 'r-1' });
        ll.addTransport(makeCaptureTransport());
        ll.info('hello');
        await ll.flushTransports();
        expect(captured[0].attributes).toEqual({ scope: 'outer', requestId: 'r-1' });
    });

    it('child does NOT mutate parent context', () => {
        const a = logger.child({ k: 'a' });
        const b = a.child({ k: 'b' }); // override
        expect(a.getContext()).toEqual({ k: 'a' });
        expect(b.getContext()).toEqual({ k: 'b' });
    });

    it('logger.child().getContext() returns the bound context', () => {
        const l = logger.child({ requestId: 'r-42' });
        expect(l.getContext()).toEqual({ requestId: 'r-42' });
    });

    it('empty child() then bound grandchild', async () => {
        const l = logger.child({});
        const ll = l.child({ requestId: 'r-1' });
        ll.addTransport(makeCaptureTransport());
        ll.info('hello');
        await ll.flushTransports();
        expect(captured[0].attributes).toEqual({ requestId: 'r-1' });
    });

    it('parent info() after child() still has empty attributes on parent', async () => {
        // Add transport to parent logger
        logger.addTransport(makeCaptureTransport());
        // Create child (but don't add transport to child)
        logger.child({ requestId: 'r-1' });
        // Parent logger still logs with empty context
        logger.info('parent msg');
        await logger.flushTransports();
        expect(captured[0].attributes).toBeUndefined();
    });

    it('setResource does NOT pollute attributes (separate field)', async () => {
        // setResource sets resource (OTel resource field), NOT attributes.
        // This is a separate pre-existing behavior — resource is per-Logger, not inherited.
        logger.setResource({ 'service.name': 'my-app' });
        const l = logger.child({ requestId: 'r-1' });
        l.addTransport(makeCaptureTransport());
        l.info('hello');
        await l.flushTransports();
        // attributes should only have child bindings, not resource keys
        expect(captured[0].attributes).toEqual({ requestId: 'r-1' });
    });

    it('component() of a child logger inherits child context', async () => {
        const l = logger.child({ requestId: 'r-99' });
        const comp = l.component('Auth');
        l.addTransport(makeCaptureTransport());
        comp.info('login attempt');
        await l.flushTransports();
        expect(captured[0].attributes).toEqual({ requestId: 'r-99' });
    });
});
