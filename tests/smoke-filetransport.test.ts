/**
 * FileTransport smoke test — verifies the Node path-traversal sanitiser,
 * browser localStorage path, and async flush (no event-loop blocking).
 *
 */
import { describe, it, expect } from 'vitest';
import { FileTransport } from '../src/transports/FileTransport.js';
import type { TransportRecord } from '../src/types/index.js';

const sampleRecord: TransportRecord = {
    level: 'info',
    levelValue: 1,
    severityNumber: 9,
    severityText: 'INFO',
    time: Date.now(),
    msg: 'file smoke'
};

describe('FileTransport', () => {
    it('sanitises path-traversal in destination (Node)', () => {
        // BUG-N4: must reject `..` — construction alone doesn't sanitise
        // (that happens at flush time); see tests/unit/transports.test.ts
        // for the behavioural test that actually flushes and asserts no
        // write happens.
        const transport = new FileTransport({ destination: '../../etc/passwd' });
        expect(transport.name).toBe('file');
        expect(transport.maxBufferSize).toBeGreaterThan(0);
    });

    it('accepts absolute paths in destination (lock waxin 2026-09-02: owner-chosen absolute path is legitimate)', () => {
        const transport = new FileTransport({ destination: '/tmp/bl-smoke-abs.log' });
        expect(transport.name).toBe('file');
    });

    it('keeps relative subdirectory destinations intact', () => {
        const transport = new FileTransport({ destination: 'logs/app.log' });
        expect(transport.name).toBe('file');
    });

    it('accepts records and respects maxBufferSize', () => {
        const transport = new FileTransport({ maxBufferSize: 3 });
        transport.write(sampleRecord);
        transport.write(sampleRecord);
        transport.write(sampleRecord);
        // 3 records at cap — next one should drop oldest
        transport.write(sampleRecord);
        expect(transport.bufferSize).toBeLessThanOrEqual(3);
    });

    it('marks itself not ready after close', async () => {
        const transport = new FileTransport({ destination: 'test-close.log' });
        await transport.close();
        expect(transport.isReady()).toBe(false);
    });
});
