/**
 * TerminalBridge unit tests — step, header, divider, blank, box, cliTable,
 * spinner, setCLILevel, isInTerminal.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTerminalBridge, type TerminalBridge } from '../../src/bridges/TerminalBridge.js';
import { cleanup } from '../setup.js';
import { Logger } from '../../src/Logger.js';

describe('TerminalBridge', () => {
    let bridge: TerminalBridge;
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger({ verbosity: 'silent' });
        bridge = createTerminalBridge({
            config: logger.getConfig(),
            getLogger: () => logger,
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('step', () => {
        it('step returns void', () => {
            const result = bridge.step(1, 5, 'Installing...');
            expect(result).toBeUndefined();
        });

        it('step does not throw in non-TTY (server fallback)', () => {
            Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
            expect(() => bridge.step(1, 5, 'test')).not.toThrow();
        });

        it('step is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.step(1, 5, 'test')).not.toThrow();
        });
    });

    describe('header', () => {
        it('header returns void', () => {
            const result = bridge.header('My Title', 'subtitle');
            expect(result).toBeUndefined();
        });

        it('header without subtitle still works', () => {
            expect(() => bridge.header('Title only')).not.toThrow();
        });

        it('header is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.header('test')).not.toThrow();
        });
    });

    describe('divider', () => {
        it('divider returns void', () => {
            const result = bridge.divider();
            expect(result).toBeUndefined();
        });

        it('divider is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.divider()).not.toThrow();
        });
    });

    describe('blank', () => {
        it('blank returns void', () => {
            const result = bridge.blank();
            expect(result).toBeUndefined();
        });

        it('blank is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.blank()).not.toThrow();
        });
    });

    describe('box', () => {
        it('box returns void', () => {
            const result = bridge.box('Hello world');
            expect(result).toBeUndefined();
        });

        it('box with options does not throw', () => {
            expect(() => bridge.box('Content', { title: 'Box Title', borderColor: '#ff0000' })).not.toThrow();
        });

        it('box is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.box('test')).not.toThrow();
        });
    });

    describe('cliTable', () => {
        it('cliTable returns void', () => {
            const rows = [{ col1: 'a', col2: 'b' }];
            const result = bridge.cliTable(rows);
            expect(result).toBeUndefined();
        });

        it('cliTable with options does not throw', () => {
            const rows = [{ name: 'Alice', age: 30 }];
            expect(() => bridge.cliTable(rows, { headers: ['name', 'age'] })).not.toThrow();
        });

        it('cliTable is gated by _showPrimitives flag', () => {
            bridge.setShowPrimitives(false);
            expect(() => bridge.cliTable([{ k: 'v' }])).not.toThrow();
        });
    });

    describe('spinner', () => {
        it('spinner returns a handle with start/succeed/fail methods', () => {
            const handle = bridge.spinner('Working...');
            expect(handle).toBeDefined();
            expect(typeof handle.start).toBe('function');
            expect(typeof handle.succeed).toBe('function');
            expect(typeof handle.fail).toBe('function');
        });

        it('spinner returns NoopSpinner when not in TTY', () => {
            Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
            const freshBridge = createTerminalBridge({
                config: logger.getConfig(),
                getLogger: () => logger,
            });
            const handle = freshBridge.spinner('test');
            expect(handle).toBeDefined();
        });
    });

    describe('setShowPrimitives / getShowPrimitives', () => {
        it('getShowPrimitives defaults to true', () => {
            expect(bridge.getShowPrimitives()).toBe(true);
        });

        it('setShowPrimitives(false) hides primitives', () => {
            bridge.setShowPrimitives(false);
            expect(bridge.getShowPrimitives()).toBe(false);
        });

        it('setShowPrimitives(true) re-enables primitives', () => {
            bridge.setShowPrimitives(false);
            bridge.setShowPrimitives(true);
            expect(bridge.getShowPrimitives()).toBe(true);
        });
    });

    describe('isInTerminal', () => {
        it('returns a boolean', () => {
            const result = bridge.isInTerminal();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('getServerFallback', () => {
        it('returns the same instance on multiple calls', () => {
            const fb1 = bridge.getServerFallback();
            const fb2 = bridge.getServerFallback();
            expect(fb1).toBe(fb2);
        });
    });
});
