/**
 * @fileoverview Core Logger Module - Minimal logging without advanced features
 * @version 0.0.1
 * 
 * This module provides the essential logging functionality without visual enhancements,
 * SVG support, or advanced styling. Perfect for lightweight applications or server-side usage.
 */

// Core types
import type {
    LogLevel,
    Verbosity,
    LoggerConfig,
    ILogHandler,
    LogMetadata,
    TimerEntry
} from './types/index.js';

// Core utilities only
import {
    parseStackTrace,
    formatTimestamp
} from './utils/index.js';

// Minimal constants
import { DEFAULT_CONFIG } from './constants.js';

/**
 * Minimal Logger class with core functionality only
 * 
 * @example
 * ```typescript
 * import { CoreLogger } from '@mks2508/better-logger/core';
 * 
 * const logger = new CoreLogger();
 * logger.info('Hello world');
 * logger.error('Something went wrong', error);
 * ```
 */
export class CoreLogger {
    private config: LoggerConfig;
    private scopedPrefix?: string;
    private handlers: ILogHandler[] = [];
    private timers: Map<string, TimerEntry> = new Map();
    private groupDepth: number = 0;

    /**
     * Creates a new CoreLogger instance
     * @param config - Optional configuration
     */
    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            // Force disable advanced features for core module
            enableColors: false,
            enableTimestamps: config.enableTimestamps ?? true,
            enableStackTrace: config.enableStackTrace ?? false,
        };
    }

    // ===== CONFIGURATION METHODS =====

    /**
     * Get current configuration
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    /**
     * Sets the global prefix for all log messages
     */
    setGlobalPrefix(prefix: string): void {
        this.config.globalPrefix = prefix;
    }

    /**
     * Sets the verbosity level for filtering log output
     */
    setVerbosity(level: Verbosity): void {
        this.config.verbosity = level;
    }

    /**
     * Creates a scoped logger with a specific prefix
     */
    scope(prefix: string): CoreLogger {
        const scopedLogger = new CoreLogger(this.config);
        scopedLogger.scopedPrefix = prefix;
        scopedLogger.handlers = [...this.handlers];
        return scopedLogger;
    }

    /**
     * Adds a custom log handler for extensibility
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    // ===== CORE LOGGING METHODS =====

    /**
     * Checks if a log level should be output based on current verbosity
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        const levels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
        return levels[level] >= levels[this.config.verbosity];
    }

    /**
     * Gets the effective prefix (global + scoped)
     */
    private getEffectivePrefix(): string | undefined {
        const parts = [this.config.globalPrefix, this.scopedPrefix].filter(Boolean);
        return parts.length > 0 ? parts.join(':') : undefined;
    }

    /**
     * Core logging method with minimal formatting
     */
    private log(level: LogLevel, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        const prefix = this.getEffectivePrefix();
        const timestamp = this.config.enableTimestamps ? formatTimestamp() : null;
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        
        // Simple formatting without CSS styling
        const parts: string[] = [];
        
        if (timestamp) {
            parts.push(`[${timestamp.slice(11, 23)}]`);
        }
        
        parts.push(`[${level.toUpperCase()}]`);
        
        if (prefix) {
            parts.push(`[${prefix}]`);
        }

        const groupIndent = '  '.repeat(this.groupDepth);
        const logPrefix = groupIndent + parts.join(' ');
        
        // Output to console with simple formatting
        console.log(logPrefix, ...args);
        
        if (stackInfo && this.config.enableStackTrace) {
            console.log(`    at ${stackInfo.file}:${stackInfo.line}:${stackInfo.column}`);
        }

        // Call custom handlers
        const metadata: LogMetadata = {
            timestamp: timestamp || formatTimestamp(),
            level,
            prefix,
            stackInfo: stackInfo || undefined,
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle(level, String(args[0] || ''), args, metadata);
            } catch (error) {
                console.error('Log handler failed:', error);
            }
        });
    }

    /**
     * Logs debug information (lowest priority)
     */
    debug(...args: any[]): void {
        this.log('debug', ...args);
    }

    /**
     * Logs informational messages
     */
    info(...args: any[]): void {
        this.log('info', ...args);
    }

    /**
     * Logs warning messages
     */
    warn(...args: any[]): void {
        this.log('warn', ...args);
    }

    /**
     * Logs error messages
     */
    error(...args: any[]): void {
        this.log('error', ...args);
    }

    /**
     * Logs critical errors (highest priority)
     */
    critical(...args: any[]): void {
        this.log('critical', ...args);
    }

    /**
     * Logs trace information (detailed debugging)
     */
    trace(...args: any[]): void {
        this.log('debug', ...args);
        if (this.shouldLog('debug')) {
            console.trace(...args);
        }
    }

    // ===== BASIC ADVANCED FEATURES =====

    /**
     * Displays data in a table format
     */
    table(data: any, columns?: string[]): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.getEffectivePrefix();
        console.log(`[TABLE]${prefix ? ` [${prefix}]` : ''}:`);
        
        if (columns) {
            console.table(data, columns);
        } else {
            console.table(data);
        }
    }

    /**
     * Starts a collapsible group in the console
     */
    group(label: string, collapsed: boolean = false): void {
        const prefix = this.getEffectivePrefix();
        const fullLabel = `${prefix ? `[${prefix}] ` : ''}${label}`;
        
        if (collapsed) {
            console.groupCollapsed(fullLabel);
        } else {
            console.group(fullLabel);
        }
        
        this.groupDepth++;
    }

    /**
     * Ends the current console group
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            console.groupEnd();
            this.groupDepth--;
        }
    }

    /**
     * Starts a timer with the given label
     */
    time(label: string): void {
        const timer: TimerEntry = {
            label,
            startTime: performance.now(),
        };
        this.timers.set(label, timer);
        console.log(`[TIMER] Started: ${label}`);
    }

    /**
     * Ends a timer and logs the elapsed time
     */
    timeEnd(label: string): void {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }

        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);
        console.log(`[TIMER] ${label}: ${elapsed.toFixed(2)}ms`);
    }
}

// Create and export singleton instance for convenience
const coreLogger = new CoreLogger();

/**
 * Export individual methods for convenience (with proper binding)
 */
export const debug = (...args: any[]) => coreLogger.debug(...args);
export const info = (...args: any[]) => coreLogger.info(...args);
export const warn = (...args: any[]) => coreLogger.warn(...args);
export const error = (...args: any[]) => coreLogger.error(...args);
export const critical = (...args: any[]) => coreLogger.critical(...args);
export const trace = (...args: any[]) => coreLogger.trace(...args);
export const table = (data: any, columns?: string[]) => coreLogger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => coreLogger.group(label, collapsed);
export const groupEnd = () => coreLogger.groupEnd();
export const time = (label: string) => coreLogger.time(label);
export const timeEnd = (label: string) => coreLogger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => coreLogger.setGlobalPrefix(prefix);
export const scope = (prefix: string) => coreLogger.scope(prefix);
export const setVerbosity = (level: Verbosity) => coreLogger.setVerbosity(level);
export const addHandler = (handler: ILogHandler) => coreLogger.addHandler(handler);

// Export the singleton as default
export default coreLogger;

// Re-export core types
export type {
    LogLevel,
    Verbosity,
    LoggerConfig,
    ILogHandler,
    LogMetadata
} from './types/index.js';