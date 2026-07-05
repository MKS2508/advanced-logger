/**
 * @fileoverview TerminalBridge — integración de terminal CLI.
 * Encapsula detección de TTY, renderizado de primitivas CLI y fallback a
 * server-mode para entornos non-TTY.
 *
 * @internal
 */

import type { CLILogLevel, ISpinnerHandle, IBoxOptions, ITableOptions } from '../types/index.js';
import { renderStep } from '../playground/step.js';
import { renderHeader } from '../playground/header.js';
import { renderDivider } from '../playground/divider.js';
import { renderBox } from '../playground/box.js';
import { renderTable } from '../playground/cli-table.js';
import { SpinnerManager, NoopSpinner } from '../playground/spinner.js';
import { ServerFallback } from '../playground/server-fallback.js';
import { getColorCapability, isRunningInTerminal } from '../utils/environment-detector.js';
import type { LoggerConfig } from '../types/index.js';
import type { Logger } from '../Logger.js';

/**
 * Bridge para operaciones de terminal CLI.
 *
 * @internal
 */
export interface TerminalBridge {
    /** Muestra un indicador de progreso tipo step. */
    step(current: number, total: number, message: string): void;
    /** Muestra un header con estilo. */
    header(title: string, subtitle?: string): void;
    /** Muestra un divider horizontal. */
    divider(): void;
    /** Emite una línea en blanco. */
    blank(): void;
    /** Renderiza contenido dentro de un box con border. */
    box(content: string, options?: IBoxOptions): void;
    /** Renderiza un array de objetos como tabla ASCII. */
    cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void;
    /** Crea un handle de spinner. */
    spinner(message: string): ISpinnerHandle;
    /** Indica si las primitivas CLI deben mostrarse. */
    getShowPrimitives(): boolean;
    /** Define si las primitivas CLI deben mostrarse. */
    setShowPrimitives(show: boolean): void;
    /** Devuelve la instancia del server fallback (lazy). */
    getServerFallback(): ServerFallback;
    /** Devuelve `true` si se ejecuta en un TTY. */
    isInTerminal(): boolean;
}

interface ITerminalBridgeCtorOptions {
    config: LoggerConfig;
    getLogger: () => Logger;
}

/**
 * Crea un {@link TerminalBridge} usando un getter para evitar referencias
 * circulares en la construcción.
 *
 * @internal
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
