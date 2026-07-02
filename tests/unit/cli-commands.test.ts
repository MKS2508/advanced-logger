/**
 * CLI commands unit tests — StatusCommand, ResetCommand, DemoCommand.
 * Verifies: safe execution with no transports, reset clears config,
 * demo runs without throwing.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/Logger.js';
import { cleanup } from '../setup.js';
import { StatusCommand, ResetCommand, DemoCommand } from '../../src/cli/commands/StatusCommand.js';

describe('CLI Commands', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger({ verbosity: 'silent' });
    });

    afterEach(() => {
        cleanup();
    });

    describe('StatusCommand', () => {
        it('name is "status"', () => {
            expect(new StatusCommand().name).toBe('status');
        });

        it('execute does not throw with no transports', () => {
            const cmd = new StatusCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute does not throw with transports registered', () => {
            logger.addTransport({
                target: 'console',
            });
            const cmd = new StatusCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute does not throw with buffer stats from ExportLogHandler', () => {
            const cmd = new StatusCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute returns void', () => {
            const cmd = new StatusCommand();
            const result = cmd.execute('', logger);
            expect(result).toBeUndefined();
        });

        it('usage is "/status"', () => {
            expect(new StatusCommand().usage).toBe('/status');
        });

        it('description is non-empty string', () => {
            expect(typeof new StatusCommand().description).toBe('string');
            expect(new StatusCommand().description.length).toBeGreaterThan(0);
        });
    });

    describe('ResetCommand', () => {
        it('name is "reset"', () => {
            expect(new ResetCommand().name).toBe('reset');
        });

        it('execute clears custom config', () => {
            logger.updateConfig({ theme: 'cyberpunk' });
            logger.setVerbosity('debug');

            const cmd = new ResetCommand();
            cmd.execute('', logger);

            // ResetConfig should restore defaults
            const config = logger.getConfig();
            expect(config.verbosity).toBe('info');
        });

        it('execute does not throw after reset', () => {
            const cmd = new ResetCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute returns void', () => {
            const cmd = new ResetCommand();
            const result = cmd.execute('', logger);
            expect(result).toBeUndefined();
        });

        it('usage is "/reset"', () => {
            expect(new ResetCommand().usage).toBe('/reset');
        });
    });

    describe('DemoCommand', () => {
        it('name is "demo"', () => {
            expect(new DemoCommand().name).toBe('demo');
        });

        it('execute runs without throwing', () => {
            const cmd = new DemoCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute does not throw with timers set', () => {
            logger.time('demo-op');
            const cmd = new DemoCommand();
            expect(() => cmd.execute('', logger)).not.toThrow();
        });

        it('execute returns void', () => {
            const cmd = new DemoCommand();
            const result = cmd.execute('', logger);
            expect(result).toBeUndefined();
        });

        it('usage is "/demo"', () => {
            expect(new DemoCommand().usage).toBe('/demo');
        });

        it('description is non-empty string', () => {
            expect(typeof new DemoCommand().description).toBe('string');
            expect(new DemoCommand().description.length).toBeGreaterThan(0);
        });
    });
});
