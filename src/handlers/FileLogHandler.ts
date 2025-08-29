/**
 * @fileoverview File-based log handler for Advanced Logger
 */

import type { ILogHandler, LogLevel, LogMetadata } from '../types/index.js';

/**
 * File-based log handler for persistent logging
 */
export class FileLogHandler implements ILogHandler {
    private filename: string;

    constructor(filename: string = 'app.log') {
        this.filename = filename;
    }

    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void {
        const logEntry = {
            filename: this.filename,
            timestamp: metadata.timestamp,
            level: level.toUpperCase(),
            prefix: metadata.prefix,
            message,
            args: args.slice(1),
            location: metadata.stackInfo,
        };

        console.debug('File log entry:', logEntry);
    }
}