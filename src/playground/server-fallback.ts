/**
 * @fileoverview Server/JSON fallback for CLI primitives in non-TTY environments
 * @since 5.0.0
 */

import type { IBoxOptions, ITableOptions } from '../types/core.js';
import type { Logger } from '../Logger.js';

/**
 * Server-mode fallback: outputs CLI primitives as plain logger calls
 * when not running in an interactive terminal.
 *
 * @since 5.0.0
 */
export class ServerFallback {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** Render step as plain info log */
    step(current: number, total: number, msg: string): void {
        this.logger.info(`[${current}/${total}] ${msg}`);
    }

    /** Render header as plain info log */
    header(title: string, subtitle?: string): void {
        const text = subtitle ? `${title} ${subtitle}` : title;
        this.logger.info(text);
    }

    /** Divider is a no-op in server mode */
    divider(): void {
        // No-op in server/JSON mode
    }

    /** Blank line is a no-op in server mode */
    blank(): void {
        // No-op in server/JSON mode
    }

    /** Render box content as plain info log */
    box(content: string, _options?: IBoxOptions): void {
        this.logger.info(content);
    }

    /** Render table rows as plain info logs */
    cliTable(rows: Record<string, unknown>[], _options?: ITableOptions): void {
        for (const row of rows) {
            this.logger.info(JSON.stringify(row));
        }
    }
}
