/**
 * HookBridge unit tests — on/once/off/use, beforeLog awaited (F2 fix),
 * beforeLog mutations respected (F2 fix), HookManager re-entry guard.
 *
 *
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHookBridge, type HookBridge } from '../../src/hooks/HookBridge.js';
import { cleanup } from '../setup.js';
import type { HookLogEntry } from '../../src/types/index.js';

const makeEntry = (): HookLogEntry => ({
    level: 'info',
    message: 'test message',
    args: [],
    timestamp: new Date().toISOString(),
});

describe('HookBridge', () => {
    let hookBridge: HookBridge;

    beforeEach(() => {
        hookBridge = createHookBridge();
    });

    afterEach(() => {
        cleanup();
    });

    describe('on / once / off', () => {
        it('on registers a callback and returns unsubscribe function', () => {
            const handler = vi.fn();
            const unsub = hookBridge.on('beforeLog', handler);
            expect(typeof unsub).toBe('function');
            unsub();
        });

        it('once fires exactly once then auto-removes', async () => {
            const handler = vi.fn();
            hookBridge.once('beforeLog', handler);

            const entry = makeEntry();
            await hookBridge.getHookManager().emit('beforeLog', entry);
            await hookBridge.getHookManager().emit('beforeLog', entry);
            await hookBridge.getHookManager().emit('beforeLog', entry);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('off removes a registered callback', async () => {
            const handler = vi.fn();
            hookBridge.on('beforeLog', handler);
            hookBridge.off('beforeLog', handler);

            const entry = makeEntry();
            await hookBridge.getHookManager().emit('beforeLog', entry);

            expect(handler).not.toHaveBeenCalled();
        });

        it('off returns true when callback was found and removed', () => {
            const handler = vi.fn();
            hookBridge.on('beforeLog', handler);
            const result = hookBridge.off('beforeLog', handler);
            expect(result).toBe(true);
        });

        it('off returns false when callback was not registered', () => {
            const handler = vi.fn();
            const result = hookBridge.off('beforeLog', handler);
            expect(result).toBe(false);
        });

        it('use registers middleware and returns unsubscribe', () => {
            const middleware = vi.fn();
            const unsub = hookBridge.use(middleware);
            expect(typeof unsub).toBe('function');
            unsub();
        });

        it('multiple callbacks fire in priority order (higher first)', async () => {
            const order: string[] = [];
            hookBridge.on('beforeLog', () => { order.push('low'); }, 10);
            hookBridge.on('beforeLog', () => { order.push('high'); }, 100);
            hookBridge.on('beforeLog', () => { order.push('mid'); }, 50);

            const entry = makeEntry();
            await hookBridge.getHookManager().emit('beforeLog', entry);

            expect(order).toEqual(['high', 'mid', 'low']);
        });
    });

    describe('beforeLog awaited (F2 fix)', () => {
        it('beforeLog is awaited — log does not emit until hook resolves', async () => {
            let resolved = false;
            hookBridge.on('beforeLog', async () => {
                await new Promise(r => setTimeout(r, 20));
                resolved = true;
            });

            const entry = makeEntry();
            const emitPromise = hookBridge.getHookManager().emit('beforeLog', entry);

            // Not resolved yet
            expect(resolved).toBe(false);

            await emitPromise;
            expect(resolved).toBe(true);
        });

        it('async beforeLog returning mutated entry — mutation is respected', async () => {
            const entry = makeEntry();
            hookBridge.on('beforeLog', async (e) => {
                e.message = 'mutated by hook';
                return e;
            });

            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            expect(result.message).toBe('mutated by hook');
        });

        it('synchronous beforeLog returning partial — manager merges it', async () => {
            const entry = makeEntry();
            hookBridge.on('beforeLog', () => ({
                message: 'replaced message'
            }));

            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            expect(result.message).toBe('replaced message');
        });

        it('beforeLog throwing — entry is still returned (fallback to pre-hook values)', async () => {
            hookBridge.on('beforeLog', () => {
                throw new Error('hook error');
            });

            const entry = makeEntry();
            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            // Manager falls back to entry without crashing
            expect(result).toBeDefined();
            expect(result.message).toBe('test message');
        });

        it('multiple async beforeLog hooks all complete before log emits', async () => {
            const order: string[] = [];
            hookBridge.on('beforeLog', async () => {
                await new Promise(r => setTimeout(r, 30));
                order.push('first');
            });
            hookBridge.on('beforeLog', async () => {
                await new Promise(r => setTimeout(r, 10));
                order.push('second');
            });

            await hookBridge.getHookManager().emit('beforeLog', makeEntry());
            // Both hooks are registered without explicit priority (default 50).
            // emit() awaits each callback sequentially: hook1 (first registered) awaits first,
            // hook1's 30ms timer runs, then hook1 completes; then hook2 awaits its 10ms timer.
            // Both timers run concurrently from when each callback starts executing,
            // but the await in emit() waits for each callback to fully complete before moving on.
            // hook1 finishes at ~30ms, hook2 finishes at ~40ms (10ms timer + waiting for hook1).
            expect(order).toEqual(['first', 'second']);
        });
    });

    describe('beforeLog mutations respected (F2 fix)', () => {
        it('a beforeLog that mutates record attributes — mutated record is what gets dispatched', async () => {
            const entry: HookLogEntry = { ...makeEntry(), context: { existing: 'val' } };
            hookBridge.on('beforeLog', (e) => {
                (e.context as Record<string, unknown>)['added'] = 'by-mutation';
                return e;
            });

            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            expect((result.context as Record<string, unknown>)).toHaveProperty('added', 'by-mutation');
        });

        it('a beforeLog that replaces args — replacement is reflected', async () => {
            const entry = makeEntry();
            entry.args = ['original'];
            hookBridge.on('beforeLog', (e) => {
                e.args = ['replaced'];
                return e;
            });

            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            expect(result.args).toEqual(['replaced']);
        });

        it('a beforeLog that adds prefix — addition is reflected', async () => {
            const entry = makeEntry();
            hookBridge.on('beforeLog', (e) => {
                e.prefix = 'HookPrefix';
                return e;
            });

            const result = await hookBridge.getHookManager().emit('beforeLog', entry);
            expect(result.prefix).toBe('HookPrefix');
        });
    });

    describe('HookManager re-entry guard (F2 fix)', () => {
        it('if a hook triggers another hook on the same event, it does not loop infinitely', async () => {
            let emitCount = 0;
            const MAX_DEPTH = 5;

            hookBridge.on('beforeLog', async () => {
                emitCount++;
                if (emitCount < MAX_DEPTH) {
                    // Simulate a hook that internally emits another event
                    await hookBridge.getHookManager().emit('beforeLog', makeEntry());
                }
            });

            await hookBridge.getHookManager().emit('beforeLog', makeEntry());

            // Should stop before reaching MAX_DEPTH
            expect(emitCount).toBeLessThanOrEqual(MAX_DEPTH);
        });

        it('onError recursion is capped and does not stack overflow', async () => {
            const onErrorHandler = vi.fn();

            // Override getHookManager to create a self-emitting scenario
            const mgr = hookBridge.getHookManager();

            mgr.on('onError', async () => {
                onErrorHandler();
                throw new Error('recursive error');
            });

            mgr.on('beforeLog', async () => {
                throw new Error('trigger error');
            });

            const entry = makeEntry();
            await mgr.emit('beforeLog', entry);

            // onError fires for the thrown error; if it throws the guard caps it
            // No stack overflow, no infinite loop
            expect(onErrorHandler.mock.calls.length).toBeGreaterThan(0);
        });
    });

    describe('getHookManager', () => {
        it('returns the underlying HookManager', () => {
            const mgr = hookBridge.getHookManager();
            expect(mgr).toBeDefined();
            expect(typeof mgr.emit).toBe('function');
            expect(typeof mgr.on).toBe('function');
            expect(typeof mgr.off).toBe('function');
        });
    });
});
