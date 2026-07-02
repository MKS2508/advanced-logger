/**
 * @fileoverview Handler and metadata type definitions for Advanced Logger
 */

import type { LogLevel, StackInfo } from './core.js';

/**
 * Metadata associated with each log entry
 */
export interface LogMetadata {
    timestamp: string;
    level: LogLevel;
    prefix?: string;
    stackInfo?: StackInfo;
    group?: string;
}

/**
 * Interface for custom log handlers (extensibility)
 */
export interface ILogHandler {
    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void;
}
