/**
 * @fileoverview BufferWriter - Collects log output in memory for later use
 * @version 4.0.0
 */

import type { LogLevel, OutputWriter } from '../types/core.js';

/**
 * Entry in the log buffer
 */
export interface BufferEntry {
    message: string;
    level: LogLevel;
    styles: string[];
    timestamp: number;
}

/**
 * BufferWriter collects log messages in memory instead of outputting to console.
 * Useful for:
 * - CLI operations with spinners (buffer logs during spinner, show after)
 * - Testing (capture logs for assertions)
 * - Batch processing (collect logs, process together)
 *
 * @implements {OutputWriter}
 * @since 4.0.0
 *
 * @example
 * import logger, { BufferWriter } from '@mks2508/better-logger';
 *
 * const buffer = new BufferWriter();
 * logger.updateConfig({
 *   outputMode: 'custom',
 *   outputWriter: buffer
 * });
 *
 * // Logs go to buffer, not console
 * spinner.start('Loading...');
 * logger.info('Connecting...');
 * logger.info('Processing...');
 * spinner.stop();
 *
 * // Show buffered logs
 * logger.updateConfig({ outputMode: 'console' });
 * buffer.flush(); // Outputs all buffered logs to console
 */
export class BufferWriter implements OutputWriter {
    private buffer: BufferEntry[] = [];
    private maxSize: number;

    /**
     * Creates a new BufferWriter
     * @param maxSize - Maximum number of entries to buffer (default: 1000)
     */
    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
    }

    /**
     * Writes a log entry to the buffer
     * @param message - Formatted log message
     * @param level - Log level
     * @param styles - CSS styles (for browser console)
     */
    write(message: string, level: LogLevel, styles: string[]): void {
        if (this.buffer.length >= this.maxSize) {
            this.buffer.shift(); // Remove oldest entry
        }

        this.buffer.push({
            message,
            level,
            styles,
            timestamp: Date.now()
        });
    }

    /**
     * Returns all buffered entries
     * @returns Copy of the buffer array
     */
    getBuffer(): BufferEntry[] {
        return [...this.buffer];
    }

    /**
     * Returns buffered entries filtered by log level
     * @param levels - Log levels to include
     * @returns Filtered buffer entries
     */
    getByLevel(...levels: LogLevel[]): BufferEntry[] {
        return this.buffer.filter(entry => levels.includes(entry.level));
    }

    /**
     * Returns the number of buffered entries
     */
    get size(): number {
        return this.buffer.length;
    }

    /**
     * Checks if buffer is empty
     */
    get isEmpty(): boolean {
        return this.buffer.length === 0;
    }

    /**
     * Clears all buffered entries
     */
    clear(): void {
        this.buffer = [];
    }

    /**
     * Outputs all buffered entries to console and clears the buffer
     */
    flush(): void {
        this.buffer.forEach(entry => {
            if (entry.styles.length > 0) {
                console.log(entry.message, ...entry.styles);
            } else {
                console.log(entry.message);
            }
        });
        this.clear();
    }

    /**
     * Outputs buffered entries to console without clearing
     */
    replay(): void {
        this.buffer.forEach(entry => {
            if (entry.styles.length > 0) {
                console.log(entry.message, ...entry.styles);
            } else {
                console.log(entry.message);
            }
        });
    }

    /**
     * Returns all messages as an array of strings
     */
    toArray(): string[] {
        return this.buffer.map(entry => entry.message);
    }

    /**
     * Returns all messages joined as a single string
     * @param separator - String to join messages with (default: newline)
     */
    toString(separator: string = '\n'): string {
        return this.toArray().join(separator);
    }
}
