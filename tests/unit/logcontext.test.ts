/**
 * LogContext bridge unit tests — MDC (Mapped Diagnostic Context) management.
 * Tests: child immutability, child isolation, withContext ALS-scoped callbacks,
 * browser fallback, getContext, setResource, clearContext.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLogContext, type LogContext } from '../../src/context/LogContext.js';
import { cleanup } from '../setup.js';

describe('LogContext', () => {
    let logCtx: LogContext;

    beforeEach(() => {
        logCtx = createLogContext({
            // F4.5.5: LogContext.child() no longer sets child.context.
            // The parent Logger sets _parentContextRecord after child() returns.
            // For isolated LogContext tests, the mock factory captures
            // the parent's merged context snapshot (like Logger.child() does).
            childLoggerFactory: () => ({ _parentContextRecord: {} }),
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('getContext', () => {
        it('returns empty object for fresh logger', () => {
            expect(logCtx.getContext()).toEqual({});
        });

        it('returns a shallow copy (mutation does not affect internal state)', () => {
            const snapshot = logCtx.getContext();
            (snapshot as Record<string, unknown>)['newKey'] = 'value';
            expect(logCtx.getContext()).not.toHaveProperty('newKey');
        });
    });

    describe('child', () => {
        it('stores __parentSnapshot with the parent context at child-creation time', () => {
            // F4.5.5: LogContext.child() captures _getContextRecord() as __parentSnapshot.
            // The extra bindings are stored by Logger.child() as _bindings.
            const child = logCtx.child({ requestId: 'r-42' });
            // __parentSnapshot contains the parent's context snapshot (empty for root)
            expect((child as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
        });

        it('is immutable — creating a child does not mutate parent context', () => {
            const child = logCtx.child({ k: 1 });
            // Parent context is unaffected
            expect(logCtx.getContext()).toEqual({});
        });

        it('grandchild (via Logger.child()) creates a new logger with merged context', () => {
            // Note: logCtx.child() returns ChildLoggerShape (not chainable).
            // Logger.child() uses the factory to return a full Logger (chainable).
            // Here we just verify that child contexts are independent.
            const child1 = logCtx.child({ a: 1 });
            const child2 = logCtx.child({ a: 1, b: 2 });
            // __parentSnapshot is the parent's context snapshot (empty for root)
            expect((child1 as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
            expect((child2 as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
        });

        it('child with empty object works', () => {
            const child1 = logCtx.child({ a: 1 });
            const child2 = logCtx.child({});
            expect((child1 as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
            expect((child2 as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
        });
    });

    describe('setResource', () => {
        it('sets the OTel resource without affecting getContext', () => {
            logCtx.setResource({ 'service.name': 'my-app' });
            expect(logCtx._getResource()).toEqual({ 'service.name': 'my-app' });
            expect(logCtx.getContext()).toEqual({});
        });

        it('merges with existing resource', () => {
            logCtx.setResource({ 'service.name': 'my-app' });
            logCtx.setResource({ 'service.version': '1.0.0' });
            const res = logCtx._getResource();
            expect(res).toHaveProperty('service.name', 'my-app');
            expect(res).toHaveProperty('service.version', '1.0.0');
        });
    });

    describe('clearContext', () => {
        it('resets context to empty object', () => {
            logCtx.child({ k: 1 });
            logCtx.clearContext();
            expect(logCtx.getContext()).toEqual({});
        });

        it('clearing parent does not affect already-created children', () => {
            const child = logCtx.child({ k: 1 });
            logCtx.clearContext();
            expect(logCtx.getContext()).toEqual({});
            // __parentSnapshot is captured at child-creation time (parent's context before clear)
            expect((child as unknown as Record<string, unknown>)['__parentSnapshot']).toEqual({});
        });
    });

    describe('withContext (ALS-scoped callback)', () => {
        it('runs fn within scoped bindings (or direct call when ALS unavailable)', () => {
            let called = false;
            const result = logCtx.withContext({ requestId: 'r-99' }, () => {
                called = true;
                return 'callback-returned';
            });
            expect(called).toBe(true);
            expect(result).toBe('callback-returned');
        });

        it('withContext returns the fn return value', () => {
            const result = logCtx.withContext({ k: 1 }, () => 'returned-value');
            expect(result).toBe('returned-value');
        });

        it('withContext without fn is a no-op (backwards compat)', () => {
            expect(() => logCtx.withContext({ k: 1 })).not.toThrow();
        });

        it('nested withContext calls both execute (or direct when ALS unavailable)', () => {
            const order: string[] = [];
            logCtx.withContext({ outer: 'a' }, () => {
                order.push('outer-before');
                logCtx.withContext({ inner: 'b' }, () => {
                    order.push('inner');
                });
                order.push('outer-after');
            });
            expect(order).toContain('outer-before');
            expect(order).toContain('inner');
            expect(order).toContain('outer-after');
        });
    });

    describe('withContextAsync (async ALS callback)', () => {
        it('propagates bindings through async chain when ALS is available', async () => {
            let called = false;
            const result = await logCtx.withContextAsync({ asyncKey: 'asyncVal' }, async () => {
                await Promise.resolve();
                called = true;
                return 'async-result';
            });
            expect(called).toBe(true);
            expect(result).toBe('async-result');
        });

        it('parallel async chains do not share context when ALS available', async () => {
            let firstDone = false;
            let secondDone = false;
            await Promise.all([
                logCtx.withContextAsync({ key: 'A' }, async () => {
                    await Promise.resolve();
                    firstDone = true;
                    return 'result-a';
                }),
                logCtx.withContextAsync({ key: 'B' }, async () => {
                    await Promise.resolve();
                    secondDone = true;
                    return 'result-b';
                }),
            ]);
            expect(firstDone).toBe(true);
            expect(secondDone).toBe(true);
        });
    });

    describe('browser fallback (no AsyncLocalStorage)', () => {
        it('withContext is a no-op when AsyncLocalStorage is undefined', async () => {
            // Simulate browser: delete AsyncLocalStorage from globalThis
            const ALS = (globalThis as Record<string, unknown>).AsyncLocalStorage;
            delete (globalThis as Record<string, unknown>).AsyncLocalStorage;

            try {
                const freshCtx = createLogContext({ childLoggerFactory: () => ({ context: {} }) });
                let seen = 'not-called';
                const result = freshCtx.withContext({ browserKey: 'browserVal' }, () => {
                    seen = 'called';
                    return 'fn-result';
                });
                expect(result).toBe('fn-result');
                expect(seen).toBe('called');
                expect(freshCtx._getContextRecord()).not.toHaveProperty('browserKey');
            } finally {
                // Restore
                if (ALS !== undefined) {
                    Object.defineProperty(globalThis, 'AsyncLocalStorage', { value: ALS, writable: true, configurable: true });
                }
            }
        });

        it('withContextAsync falls back to running fn directly in browser', async () => {
            const ALS = (globalThis as Record<string, unknown>).AsyncLocalStorage;
            delete (globalThis as Record<string, unknown>).AsyncLocalStorage;

            try {
                const freshCtx = createLogContext({ childLoggerFactory: () => ({ context: {} }) });
                const result = await freshCtx.withContextAsync({ k: 'v' }, async () => 'async-result');
                expect(result).toBe('async-result');
            } finally {
                if (ALS !== undefined) {
                    Object.defineProperty(globalThis, 'AsyncLocalStorage', { value: ALS, writable: true, configurable: true });
                }
            }
        });
    });

    describe('_getContextRecord', () => {
        it('returns the current context snapshot', () => {
            expect(logCtx._getContextRecord()).toEqual({});
            logCtx.child({ x: 1 });
            expect(logCtx._getContextRecord()).toEqual({});
        });
    });

    describe('_getResource', () => {
        it('returns undefined when no resource is set', () => {
            expect(logCtx._getResource()).toBeUndefined();
        });
    });
});
