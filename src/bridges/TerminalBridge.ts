/**
 * @fileoverview TerminalBridge — CLI terminal integration.
 * Encapsulates TTY detection, CLI primitive rendering, and server-mode
 * fallback for non-TTY environments.
 */

import type { CLILogLevel, ISpinnerHandle, IBoxOptions, ITableOptions } from '../types/index.js';
import { renderStep } from '../cli-primitives/step.js';
import { renderHeader } from '../cli-primitives/header.js';
import { renderDivider } from '../cli-primitives/divider.js';
import { renderBox } from '../cli-primitives/box.js';
import { renderTable } from '../cli-primitives/cli-table.js';
import { SpinnerManager, NoopSpinner } from '../cli-primitives/spinner.js';
import { ServerFallback } from '../cli-primitives/server-fallback.js';
import { getColorCapability, isRunningInTerminal } from '../utils/environment-detector.js';
import type { LoggerConfig } from '../types/index.js';
import type { Logger } from '../Logger.js';

/**
 * Bridge for CLI terminal operations.
 */
export interface TerminalBridge {
    /** Displays a step progress indicator. */
    step(current: number, total: number, message: string): void;
    /** Displays a styled header. */
    header(title: string, subtitle?: string): void;
    /** Displays a horizontal divider. */
    divider(): void;
    /** Outputs a blank line. */
    blank(): void;
    /** Renders content inside a bordered box. */
    box(content: string, options?: IBoxOptions): void;
    /** Renders an array of objects as an ASCII table. */
    cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void;
    /** Creates a spinner handle. */
    spinner(message: string): ISpinnerHandle;
    /** Whether CLI primitives should be shown. */
    getShowPrimitives(): boolean;
    /** Sets whether CLI primitives should be shown. */
    setShowPrimitives(show: boolean): void;
    /** Returns the server fallback instance (lazy). */
    getServerFallback(): ServerFallback;
    /** Returns true if running in a TTY. */
    isInTerminal(): boolean;
}

interface ITerminalBridgeCtorOptions {
    config: LoggerConfig;
    getLogger: () => Logger;
}

/**
 * Creates a TerminalBridge using a getter to avoid circular reference at construction.
 */
export function createTerminalBridge(options: ITerminalBridgeCtorOptions): TerminalBridge {
    let _showPrimitives = true;
    let _serverFallback: ServerFallback | undefined;

    return {
        step(current: number, total: number, message: string): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().step(current, total, message);
                return;
            }
            const colorCap = getColorCapability();
            const output = renderStep(current, total, message, colorCap);
            process.stderr.write(output + '\n');
        },

        header(title: string, subtitle?: string): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().header(title, subtitle);
                return;
            }
            const output = renderHeader(title, subtitle);
            process.stderr.write(output + '\n');
        },

        divider(): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().divider();
                return;
            }
            const output = renderDivider();
            process.stderr.write(output + '\n');
        },

        blank(): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().blank();
                return;
            }
            process.stderr.write('\n');
        },

        box(content: string, opts?: IBoxOptions): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().box(content, opts);
                return;
            }
            const colorCap = getColorCapability();
            const output = renderBox(content, opts, colorCap);
            process.stderr.write(output + '\n');
        },

        cliTable(rows: Record<string, unknown>[], opts?: ITableOptions): void {
            if (!_showPrimitives) return;
            if (!isRunningInTerminal()) {
                this.getServerFallback().cliTable(rows, opts);
                return;
            }
            const colorCap = getColorCapability();
            const output = renderTable(rows, opts, colorCap);
            process.stderr.write(output + '\n');
        },

        spinner(message: string): ISpinnerHandle {
            const logger = options.getLogger();
            if (!isRunningInTerminal() || options.config.outputMode === 'silent') {
                return new NoopSpinner(message, logger);
            }
            return new SpinnerManager(message, options.config, logger);
        },

        getShowPrimitives(): boolean {
            return _showPrimitives;
        },

        setShowPrimitives(show: boolean): void {
            _showPrimitives = show;
        },

        getServerFallback(): ServerFallback {
            if (!_serverFallback) {
                _serverFallback = new ServerFallback(options.getLogger());
            }
            return _serverFallback;
        },

        isInTerminal(): boolean {
            return isRunningInTerminal();
        }
    };
}
