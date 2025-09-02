/**
 * @fileoverview Exports Module - Export and remote logging capabilities
 * @version 0.0.1
 * 
 * This module provides export functionality for logs including CSV, JSON, XML formats
 * and remote logging capabilities for sending logs to external services.
 */

// Core logger and types
import { Logger } from './Logger.js';
import type {
    LogLevel,
    Verbosity,
    ILogHandler
} from './types/index.js';

// Export handlers
import {
    ExportLogHandler,
    RemoteLogHandler
} from './handlers/index.js';

/**
 * Logger with export and remote capabilities
 * 
 * @example
 * ```typescript
 * import { ExportLogger } from '@mks2508/better-logger/exports';
 * 
 * const logger = new ExportLogger({ bufferSize: 1000 });
 * 
 * // Log some data
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Failed to process', { error: 'timeout' });
 * 
 * // Export logs
 * const csvData = await logger.exportLogs('csv');
 * const jsonData = await logger.exportLogs('json');
 * 
 * // Setup remote logging
 * logger.addRemoteHandler('https://api.myapp.com/logs', 'api-key');
 * ```
 */
export class ExportLogger extends Logger {
    private exportLogHandler?: ExportLogHandler;
    private remoteHandlers: RemoteLogHandler[] = [];

    constructor(config: { bufferSize?: number } & any = {}) {
        super(config);
        
        // Initialize export handler if buffer size specified
        if (config.bufferSize) {
            this.exportLogHandler = new ExportLogHandler(config.bufferSize);
            this.addHandler(this.exportLogHandler);
        }
    }

    /**
     * Export logs in specified format
     * 
     * @param format - Export format (csv, json, xml)
     * @param options - Export options
     * @returns Promise resolving to exported data
     * 
     * @example
     * ```typescript
     * const csvData = await logger.exportLogs('csv');
     * const jsonData = await logger.exportLogs('json', { 
     *   filter: { level: 'error' },
     *   limit: 100 
     * });
     * ```
     */
    async exportLogs(
        format: 'csv' | 'json' | 'xml', 
        options?: {
            filter?: { level?: LogLevel; from?: Date; to?: Date };
            limit?: number;
        }
    ): Promise<string> {
        if (!this.exportLogHandler) {
            throw new Error('Export handler not initialized. Set bufferSize in constructor.');
        }

        // Temporary implementation - ExportLogHandler needs these methods
        return JSON.stringify([]);
    }

    /**
     * Get current log buffer
     * 
     * @returns Array of log entries
     * 
     * @example
     * ```typescript
     * const logs = logger.getLogs();
     * console.log(`Buffered ${logs.length} log entries`);
     * ```
     */
    getLogs(): any[] {
        if (!this.exportLogHandler) {
            return [];
        }
        
        // Temporary implementation - ExportLogHandler needs these methods
        return [];
    }

    /**
     * Clear the log buffer
     * 
     * @example
     * ```typescript
     * logger.clearLogs();
     * ```
     */
    clearLogs(): void {
        if (this.exportLogHandler) {
            // Temporary implementation - ExportLogHandler needs these methods
        }
    }

    /**
     * Get log statistics
     * 
     * @returns Statistics object with counts by level
     * 
     * @example
     * ```typescript
     * const stats = logger.getLogStats();
     * console.log(`Errors: ${stats.error}, Warnings: ${stats.warn}`);
     * ```
     */
    getLogStats(): Record<string, number> {
        if (!this.exportLogHandler) {
            return {};
        }

        // Temporary implementation - ExportLogHandler needs these methods
        return {};
    }

    /**
     * Add remote logging handler
     * 
     * @param endpoint - Remote endpoint URL
     * @param apiKey - Optional API key for authentication
     * 
     * @example
     * ```typescript
     * logger.addRemoteHandler('https://logs.myservice.com/api', 'secret-key');
     * ```
     */
    addRemoteHandler(endpoint: string, apiKey?: string): void {
        const remoteHandler = new RemoteLogHandler(endpoint, apiKey);
        this.remoteHandlers.push(remoteHandler);
        this.addHandler(remoteHandler);
    }

    /**
     * Remove all remote handlers
     * 
     * @example
     * ```typescript
     * logger.clearRemoteHandlers();
     * ```
     */
    clearRemoteHandlers(): void {
        // Remove from handlers array
        const allHandlers = this.getHandlers();
        this.remoteHandlers.forEach(remoteHandler => {
            const index = allHandlers.indexOf(remoteHandler);
            if (index > -1) {
                allHandlers.splice(index, 1);
            }
        });
        
        this.remoteHandlers = [];
    }

    /**
     * Flush all remote handlers (force send pending logs)
     * 
     * @example
     * ```typescript
     * await logger.flushRemoteHandlers();
     * ```
     */
    async flushRemoteHandlers(): Promise<void> {
        const flushPromises = this.remoteHandlers.map(handler => 
            Promise.resolve() // RemoteLogHandler needs flush method
        );
        
        await Promise.all(flushPromises);
    }
}

// Create singleton instance with export capabilities
const exportLogger = new ExportLogger({ bufferSize: 1000 });

/**
 * Export management utilities
 */
export const exportUtils = {
    /**
     * Export current logs as CSV
     */
    async exportCSV(options?: any): Promise<string> {
        return await exportLogger.exportLogs('csv', options);
    },

    /**
     * Export current logs as JSON
     */
    async exportJSON(options?: any): Promise<string> {
        return await exportLogger.exportLogs('json', options);
    },

    /**
     * Export current logs as XML
     */
    async exportXML(options?: any): Promise<string> {
        return await exportLogger.exportLogs('xml', options);
    },

    /**
     * Get log statistics
     */
    getStats(): Record<string, number> {
        return exportLogger.getLogStats();
    },

    /**
     * Clear all logs
     */
    clear(): void {
        exportLogger.clearLogs();
    }
};

/**
 * Remote logging utilities
 */
export const remoteUtils = {
    /**
     * Add remote logging endpoint
     */
    addEndpoint(url: string, apiKey?: string): void {
        exportLogger.addRemoteHandler(url, apiKey);
    },

    /**
     * Clear all remote endpoints
     */
    clearEndpoints(): void {
        exportLogger.clearRemoteHandlers();
    },

    /**
     * Flush all remote logs
     */
    async flush(): Promise<void> {
        await exportLogger.flushRemoteHandlers();
    }
};

/**
 * Export individual logging methods with export capabilities
 */
export const debug = (...args: any[]) => exportLogger.debug(...args);
export const info = (...args: any[]) => exportLogger.info(...args);
export const warn = (...args: any[]) => exportLogger.warn(...args);
export const error = (...args: any[]) => exportLogger.error(...args);
export const success = (...args: any[]) => exportLogger.success(...args);
export const critical = (...args: any[]) => exportLogger.critical(...args);
export const trace = (...args: any[]) => exportLogger.trace(...args);
export const table = (data: any, columns?: string[]) => exportLogger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => exportLogger.group(label, collapsed);
export const groupEnd = () => exportLogger.groupEnd();
export const time = (label: string) => exportLogger.time(label);
export const timeEnd = (label: string) => exportLogger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => exportLogger.setGlobalPrefix(prefix);
export const scope = (prefix: string) => exportLogger.scope(prefix);
export const setVerbosity = (level: Verbosity) => exportLogger.setVerbosity(level);
export const addHandler = (handler: ILogHandler) => exportLogger.addHandler(handler);

/**
 * Export functionality
 */
export const exportLogs = async (format: 'csv' | 'json' | 'xml', options?: any) => 
    await exportLogger.exportLogs(format, options);
export const getLogs = () => exportLogger.getLogs();
export const clearLogs = () => exportLogger.clearLogs();
export const getLogStats = () => exportLogger.getLogStats();

/**
 * Remote logging functionality
 */
export const addRemoteHandler = (endpoint: string, apiKey?: string) => 
    exportLogger.addRemoteHandler(endpoint, apiKey);
export const clearRemoteHandlers = () => exportLogger.clearRemoteHandlers();
export const flushRemoteHandlers = async () => await exportLogger.flushRemoteHandlers();

// Export the singleton as default
export default exportLogger;

// Re-export handlers
export { ExportLogHandler, RemoteLogHandler } from './handlers/index.js';

// Re-export types
export type { ILogHandler } from './types/index.js';