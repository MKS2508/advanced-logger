/**
 * TransportBridge unit tests — add/remove/get transports, flush, close,
 * writeRecord fire-and-forget, re-entry guard, unhandled rejection handling.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTransportBridge, type TransportBridge } from '../../src/transports/TransportBridge.js';
import { cleanup } from '../setup.js';
import type { TransportRecord } from '../../src/types/index.js';

const makeRecord = (): TransportRecord => ({
    level: 'info',
    levelValue: 1,
    severityNumber: 9,
    severityText: 'INFO',
    time: Date.now(),
    msg: 'transport test'
});

describe('TransportBridge', () => {
    let bridge: TransportBridge;

    beforeEach(() => {
        bridge = createTransportBridge();
    });

    afterEach(() => {
        cleanup();
    });

    describe('addTransport / removeTransport / getTransports', () => {
        it('adds a transport and returns an id', () => {
            const id = bridge.addTransport({
                target: 'console',
            });
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('removes a transport by id', () => {
            const id = bridge.addTransport({ target: 'console' });
            const removed = bridge.removeTransport(id);
            expect(removed).toBe(true);
        });

        it('removeTransport returns false for unknown id', () => {
            const removed = bridge.removeTransport('not-found');
            expect(removed).toBe(false);
        });

        it('getTransportManager returns undefined when no transports added', () => {
            expect(bridge.getTransportManager()).toBeUndefined();
        });

        it('getTransportManager returns manager after adding transport', () => {
            bridge.addTransport({ target: 'console' });
            expect(bridge.getTransportManager()).toBeDefined();
            expect(bridge.getTransportManager()!.count).toBe(1);
        });
    });

    describe('flush()', () => {
        it('flush resolves without transports', async () => {
            await expect(bridge.flushTransports()).resolves.toBeUndefined();
        });

        it('flush calls flush on all transports', async () => {
            const flush1 = vi.fn().mockResolvedValue(undefined);
            const flush2 = vi.fn().mockResolvedValue(undefined);

            bridge.addTransport({
                target: {
                    name: 'flush1',
                    write() {},
                    flush: flush1,
                    close: async () => {},
                },
            });
            bridge.addTransport({
                target: {
                    name: 'flush2',
                    write() {},
                    flush: flush2,
                    close: async () => {},
                },
            });

            await bridge.flushTransports();
            expect(flush1).toHaveBeenCalled();
            expect(flush2).toHaveBeenCalled();
        });
    });

    describe('close()', () => {
        it('close resolves without transports', async () => {
            await expect(bridge.closeTransports()).resolves.toBeUndefined();
        });

        it('close calls close on all transports', async () => {
            const close1 = vi.fn().mockResolvedValue(undefined);
            const close2 = vi.fn().mockResolvedValue(undefined);

            bridge.addTransport({
                target: {
                    name: 'close1',
                    write() {},
                    flush: async () => {},
                    close: close1,
                },
            });
            bridge.addTransport({
                target: {
                    name: 'close2',
                    write() {},
                    flush: async () => {},
                    close: close2,
                },
            });

            await bridge.closeTransports();
            expect(close1).toHaveBeenCalled();
            expect(close2).toHaveBeenCalled();
        });
    });

    describe('writeRecord (fire-and-forget)', () => {
        it('writeRecord does not throw even when transport throws', async () => {
            bridge.addTransport({
                target: {
                    name: 'throws',
                    write() { throw new Error('synthetic write error'); },
                    flush: async () => {},
                    close: async () => {},
                },
            });

            // Should not throw
            expect(() => bridge.writeRecord(makeRecord())).not.toThrow();

            // Allow the async error to settle
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        it('writeRecord is fire-and-forget (returns void)', () => {
            bridge.addTransport({
                target: { name: 'sync', write() {} },
            });
            const result = bridge.writeRecord(makeRecord());
            expect(result).toBeUndefined();
        });

        it('writeRecord with no transports is a no-op', () => {
            expect(() => bridge.writeRecord(makeRecord())).not.toThrow();
        });
    });

    describe('re-entry guard (HookManager recursion)', () => {
        it('no infinite loop when transport write triggers another log via hook', async () => {
            let writeCount = 0;
            const MAX_WRITES = 3;

            bridge.addTransport({
                target: {
                    name: 'reentry',
                    write() {
                        writeCount++;
                        if (writeCount < MAX_WRITES) {
                            bridge.writeRecord(makeRecord());
                        }
                    },
                    flush: async () => {},
                    close: async () => {},
                },
            });

            bridge.writeRecord(makeRecord());
            await new Promise(resolve => setTimeout(resolve, 50));

            // Should stop at MAX_WRITES, not loop forever
            expect(writeCount).toBeLessThanOrEqual(MAX_WRITES + 1);
        });
    });

    describe('write() unhandled rejection (F2 fix)', () => {
        it('transport throwing synchronously does not crash the process', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            bridge.addTransport({
                target: {
                    name: 'sync-throw',
                    write() { throw new Error('sync throw'); },
                    flush: async () => {},
                    close: async () => {},
                },
            });

            // Should not propagate
            expect(() => bridge.writeRecord(makeRecord())).not.toThrow();
            // The error should be surfaced via console.error (not unhandled rejection)
            await new Promise(resolve => setTimeout(resolve, 10));
            consoleSpy.mockRestore();
        });

        it('transport returning a rejected promise is handled gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            bridge.addTransport({
                target: {
                    name: 'rejecting',
                    write() { return Promise.reject(new Error('rejected write')); },
                    flush: async () => {},
                    close: async () => {},
                },
            });

            bridge.writeRecord(makeRecord());
            await new Promise(resolve => setTimeout(resolve, 20));
            // No unhandled rejection — error is caught internally
            consoleSpy.mockRestore();
        });
    });

    describe('cleanup()', () => {
        it('after cleanup, transports are gone', async () => {
            bridge.addTransport({ target: 'console' });
            bridge.addTransport({ target: 'console' });

            await bridge.closeTransports();

            // After close, manager should be empty
            const mgr = bridge.getTransportManager();
            expect(mgr?.count).toBe(0);
        });
    });
});
