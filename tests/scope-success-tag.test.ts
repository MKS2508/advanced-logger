/**
 * N2 bug test — ScopedLogger.success() must propagate tag:'success'
 * to TransportRecord so transports can distinguish success from info.
 *
 * Bug: ScopedLogger.success() routes through logWithBindings→log→
 * dispatchToTransports without passing tag:'success', so the TransportRecord
 * has no tag field.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Logger } from '../src/Logger.js';
import type { TransportRecord } from '../src/types/index.js';

describe('ScopedLogger.success tag', () => {
    let records: TransportRecord[];
    let logger: Logger;

    beforeEach(() => {
        records = [];
        logger = new Logger();
        // Capture records via a minimal in-memory transport
        logger.addTransport({
            target: {
                name: 'capture',
                write(record: TransportRecord) {
                    records.push(record);
                },
                flush(): Promise<void> {
                    return Promise.resolve();
                },
                close(): Promise<void> {
                    return Promise.resolve();
                },
            },
        });
    });

    it('Logger.success() sets tag:"success" on TransportRecord', async () => {
        await logger.success('done');
        expect(records.length).toBeGreaterThan(0);
        const record = records[records.length - 1];
        expect(record.tag).toBe('success');
    });

    it('ScopedLogger.success() sets tag:"success" on TransportRecord', async () => {
        const scope = logger.scope('X');
        await scope.success('operation complete');
        expect(records.length).toBeGreaterThan(0);
        const record = records[records.length - 1];
        expect(record.tag).toBe('success');
    });

    it('ComponentLogger.success() sets tag:"success" on TransportRecord', async () => {
        const comp = logger.component('MyComponent');
        await comp.success('component ready');
        expect(records.length).toBeGreaterThan(0);
        const record = records[records.length - 1];
        expect(record.tag).toBe('success');
    });

    it('APILogger.success() sets tag:"success" on TransportRecord', async () => {
        const api = logger.api('Users');
        await api.success('endpoint healthy');
        expect(records.length).toBeGreaterThan(0);
        const record = records[records.length - 1];
        expect(record.tag).toBe('success');
    });

    it('ScopedLogger.info() does NOT set tag on TransportRecord', async () => {
        const scope = logger.scope('X');
        await scope.info('just info');
        expect(records.length).toBeGreaterThan(0);
        const record = records[records.length - 1];
        expect(record.tag).toBeUndefined();
    });
});
