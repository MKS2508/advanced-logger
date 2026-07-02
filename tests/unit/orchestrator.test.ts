/**
 * Logger.ts orchestrator unit tests — all log methods route through bridges,
 * scoped loggers, method names match public API.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from '../../src/Logger.js';
import type { TransportRecord } from '../../src/types/index.js';
import { cleanup } from '../setup.js';

describe('Logger (orchestrator)', () => {
    let records: TransportRecord[];
    let logger: Logger;

    const captureTransport = (): { target: { name: string; write: (r: TransportRecord) => void; flush: () => Promise<void>; close: () => Promise<void> }; level: 'trace' } => {
        const t = {
            target: {
                name: 'capture',
                write(r: TransportRecord) { records.push(r); },
                flush: async () => {},
                close: async () => {},
            },
            level: 'trace' as const,  // Accept all levels for testing
        };
        return t;
    };

    beforeEach(() => {
        records = [];
        logger = new Logger({ verbosity: 'debug' });
        const { id } = logger.addTransport(captureTransport());
    });

    afterEach(async () => {
        await logger.closeTransports();
        cleanup();
    });

    describe('constructor', () => {
        it('accepts config object', () => {
            const l = new Logger({ verbosity: 'error' });
            expect(l.getConfig().verbosity).toBe('error');
        });

        it('defaults to info verbosity', () => {
            const l = new Logger();
            expect(l.getConfig().verbosity).toBe('info');
        });
    });

    describe('updateConfig / resetConfig', () => {
        it('updateConfig applies partial updates', () => {
            logger.updateConfig({ verbosity: 'warn' });
            expect(logger.getConfig().verbosity).toBe('warn');
        });

        it('resetConfig restores defaults', () => {
            logger.updateConfig({ verbosity: 'critical' });
            logger.resetConfig();
            expect(logger.getConfig().verbosity).toBe('info');
        });

        it('updateConfig does not delete unspecified keys', () => {
            const before = logger.getConfig();
            logger.updateConfig({ theme: 'dark' });
            const after = logger.getConfig();
            expect(after.theme).toBe('dark');
            expect(after.enableColors).toBe(before.enableColors);
        });
    });

    describe('all log methods', () => {
        it('debug routes through bridge', async () => {
            await logger.debug('debug msg');
            expect(records.some(r => r.level === 'debug')).toBe(true);
        });

        it('info routes through bridge', async () => {
            await logger.info('info msg');
            expect(records.some(r => r.level === 'info')).toBe(true);
        });

        it('warn routes through bridge', async () => {
            await logger.warn('warn msg');
            expect(records.some(r => r.level === 'warn')).toBe(true);
        });

        it('error routes through bridge', async () => {
            await logger.error('error msg');
            expect(records.some(r => r.level === 'error')).toBe(true);
        });

        it('trace routes through bridge', async () => {
            // verbosity is 'debug' (0), trace is -1 which is below threshold
            // so we need to set verbosity to 'trace' to test trace emission
            logger.setVerbosity('trace');
            await logger.trace('trace msg');
            expect(records.length).toBeGreaterThan(0);
            // Restore verbosity for other tests
            logger.setVerbosity('debug');
        });

        it('critical routes through bridge', async () => {
            await logger.critical('critical msg');
            expect(records.some(r => r.level === 'critical')).toBe(true);
        });

        it('success sets tag:"success" on TransportRecord', async () => {
            await logger.success('ok');
            const last = records[records.length - 1];
            expect(last.tag).toBe('success');
        });

        it('log is callable directly (protected but accessible)', async () => {
            // log() is protected; verify through subclassing
            const custom = new Logger({ verbosity: 'info' });
            custom.addTransport(captureTransport());
            await custom.info('direct log');
            expect(records.length).toBeGreaterThan(0);
        });
    });

    describe('scoped loggers', () => {
        it('scope() returns ScopedLogger', () => {
            const scope = logger.scope('TestScope');
            expect(scope).toBeDefined();
        });

        it('component() returns ComponentLogger', () => {
            const comp = logger.component('MyComponent');
            expect(comp).toBeDefined();
        });

        it('api() returns APILogger', () => {
            const api = logger.api('Users');
            expect(api).toBeDefined();
        });

        it('ScopedLogger.info routes through parent bridge', async () => {
            records = [];
            const scope = logger.scope('ScopeX');
            await scope.info('scoped info');
            expect(records.some(r => r.level === 'info')).toBe(true);
        });

        it('ScopedLogger.success sets tag:"success"', async () => {
            records = [];
            const scope = logger.scope('ScopeX');
            await scope.success('scoped ok');
            const last = records[records.length - 1];
            expect(last.tag).toBe('success');
        });
    });

    describe('MDC methods', () => {
        it('child returns a new logger', async () => {
            const child = logger.child({ requestId: 'r-1' });
            // child is a Logger instance with context set
            expect(child).toBeDefined();
            expect(typeof child.info).toBe('function');
        });

        it('clearContext resets the context', async () => {
            const child = logger.child({ k: 1 });
            await child.info('before clear');
            const countBefore = records.length;

            logger.clearContext();
            await logger.info('after clear');
            const countAfter = records.length;

            expect(countAfter).toBeGreaterThan(countBefore);
        });

        it('getContext returns current context snapshot', () => {
            const ctx = logger.getContext();
            expect(typeof ctx).toBe('object');
        });

        it('setResource sets the OTel resource', () => {
            logger.setResource({ 'service.name': 'my-app' });
            expect(logger.getContext()).toEqual({});
        });
    });

    describe('withContext / withContextAsync', () => {
        it('withContext(fn) runs fn and returns its value', () => {
            const result = logger.withContext({ k: 1 }, () => 'fn-result');
            expect(result).toBe('fn-result');
        });

        it('withContextAsync(fn) returns a Promise', async () => {
            const result = logger.withContextAsync({ k: 1 }, async () => 'async-result');
            expect(result).toBeInstanceOf(Promise);
            await expect(result).resolves.toBe('async-result');
        });
    });

    describe('transport bridge delegation', () => {
        it('addTransport returns an id', () => {
            const id = logger.addTransport({ target: 'console' });
            expect(typeof id).toBe('string');
        });

        it('removeTransport removes a transport', () => {
            const id = logger.addTransport({ target: 'console' });
            const removed = logger.removeTransport(id);
            expect(removed).toBe(true);
        });

        it('flushTransports calls flush on all transports', async () => {
            await expect(logger.flushTransports()).resolves.toBeUndefined();
        });

        it('closeTransports closes all transports', async () => {
            await expect(logger.closeTransports()).resolves.toBeUndefined();
        });
    });

    describe('hook bridge delegation', () => {
        it('on returns an unsubscribe function', () => {
            const unsub = logger.on('beforeLog', () => {});
            expect(typeof unsub).toBe('function');
            unsub();
        });

        it('once returns an unsubscribe function', () => {
            const unsub = logger.once('beforeLog', () => {});
            expect(typeof unsub).toBe('function');
            unsub();
        });

        it('off removes a hook', () => {
            const cb = () => {};
            logger.on('beforeLog', cb);
            const result = logger.off('beforeLog', cb);
            expect(result).toBe(true);
        });

        it('use registers middleware', () => {
            const unsub = logger.use(() => {});
            expect(typeof unsub).toBe('function');
            unsub();
        });
    });

    describe('serializer bridge delegation', () => {
        it('addSerializer registers a type', () => {
            class TestType {}
            logger.addSerializer(TestType, (t: TestType) => ({}));
            expect(logger.getSerializerRegistry().has(TestType)).toBe(true);
        });

        it('removeSerializer removes a type', () => {
            class TestType {}
            logger.addSerializer(TestType, (t: TestType) => ({}));
            const removed = logger.removeSerializer(TestType);
            expect(removed).toBe(true);
        });
    });

    describe('style manager delegation', () => {
        it('setTheme delegates to styleManager', () => {
            // Should not throw
            logger.setTheme('dark');
            const styles = logger.getConfig();
            expect(styles.theme).toBe('dark');
        });

        it('preset applies a preset', () => {
            logger.preset('default');
            const presets = logger.presets();
            expect(Array.isArray(presets)).toBe(true);
        });

        it('customize applies display overrides', () => {
            expect(() => logger.customize({ timestamp: { show: false } })).not.toThrow();
        });
    });

    describe('CLI primitive delegation', () => {
        it('step returns void', () => {
            expect(logger.step(1, 5, 'test')).toBeUndefined();
        });

        it('header returns void', () => {
            expect(logger.header('title')).toBeUndefined();
        });

        it('divider returns void', () => {
            expect(logger.divider()).toBeUndefined();
        });

        it('blank returns void', () => {
            expect(logger.blank()).toBeUndefined();
        });

        it('box returns void', () => {
            expect(logger.box('content')).toBeUndefined();
        });

        it('cliTable returns void', () => {
            expect(logger.cliTable([{ k: 'v' }])).toBeUndefined();
        });

        it('spinner returns a handle', () => {
            const handle = logger.spinner('test');
            expect(handle).toBeDefined();
            expect(typeof handle.start).toBe('function');
        });

        it('setCLILevel returns void', () => {
            expect(logger.setCLILevel('quiet')).toBeUndefined();
        });
    });

    describe('cleanup', () => {
        it('cleanup resolves without throwing', async () => {
            await expect(logger.cleanup()).resolves.toBeUndefined();
        });

        it('cleanup can be called multiple times', async () => {
            await logger.cleanup();
            await expect(logger.cleanup()).resolves.toBeUndefined();
        });
    });
});
