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

/**
 * Stored log entry for export functionality
 */
export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    prefix?: string;
    message: string;
    args: any[];
    location?: StackInfo;
    groupInfo?: {
        depth: number;
        groupName?: string;
    };
}

/**
 * Export filter options
 */
export interface ExportFilters {
    levels?: LogLevel[];
    since?: Date | string | number; // Date, ISO string, or hours ago
    until?: Date | string | number;
    prefixes?: string[];
    excludePrefixes?: string[];
    withStackTrace?: boolean;
    errorsOnly?: boolean;
    last?: number;
    first?: number;
    search?: string;
    groupBy?: 'level' | 'prefix' | 'hour' | 'date';
}

/**
 * Export options for different formats
 */
export interface ExportOptions {
    minimal?: boolean;
    compact?: boolean;
    styled?: boolean;
    includeMetadata?: boolean;
    groupBy?: ExportFilters['groupBy'];
}

/**
 * Export result with metadata
 */
export interface ExportResult {
    format: string;
    data: string;
    metadata: {
        totalLogs: number;
        filteredLogs: number;
        exportedAt: string;
        filters?: ExportFilters;
        options?: ExportOptions;
    };
}

/**
 * Buffer statistics for log management
 */
export interface BufferStats {
    size: number;
    maxSize: number;
    usage: number; // percentage
    oldestLog?: Date;
    newestLog?: Date;
    levelCounts: Record<LogLevel, number>;
}