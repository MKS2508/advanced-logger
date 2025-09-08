/**
 * @fileoverview OpenTUI Log Handler for integration with core logger
 */

import type { ILogHandler, LogLevel, LogMetadata } from '@mks2508/better-logger-core';
import { OpenTUILogRenderer } from './LogRenderer.js';
import type { OpenTUILogEntry, OpenTUILogHandlerConfig } from './types.js';

/**
 * Log handler that uses OpenTUI for rich terminal output
 */
export class OpenTUILogHandler implements ILogHandler {
    private renderer: OpenTUILogRenderer;
    private config: OpenTUILogHandlerConfig;
    private logCounter = 0;

    constructor(config: OpenTUILogHandlerConfig = {}) {
        this.config = {
            renderer: {
                interactive: false,
                animated: true,
                theme: 'auto',
                dashboard: false,
                maxHistory: 100,
                components: {
                    badges: true,
                    progressBars: false,
                    tables: false,
                    charts: false
                }
            },
            ...config
        };

        this.renderer = new OpenTUILogRenderer(this.config.renderer);
    }

    /**
     * Handle log entry from core logger
     */
    async handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): Promise<void> {
        // Create OpenTUI log entry
        const entry: OpenTUILogEntry = {
            id: this.generateLogId(),
            timestamp: metadata.timestamp,
            level,
            message,
            args: args.slice(1), // Exclude first message argument
            prefix: metadata.prefix,
            stackInfo: metadata.stackInfo,
            metadata: {
                originalArgs: args,
                handlerType: 'opentui'
            }
        };

        try {
            await this.renderer.renderLog(entry);
        } catch (error) {
            // Fallback to console if OpenTUI fails
            console.error('OpenTUI rendering failed:', error);
            this.fallbackRender(entry);
        }
    }

    /**
     * Initialize the handler (call this early in application lifecycle)
     */
    async initialize(): Promise<boolean> {
        try {
            await this.renderer.initialize();
            return this.renderer.isAvailable();
        } catch (error) {
            console.warn('Failed to initialize OpenTUI:', error);
            return false;
        }
    }

    /**
     * Check if OpenTUI is available
     */
    isAvailable(): boolean {
        return this.renderer.isAvailable();
    }

    /**
     * Get rendering statistics
     */
    getStats() {
        return {
            available: this.isAvailable(),
            logsRendered: this.logCounter,
            historySize: this.renderer.getHistory().length,
            config: this.config
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<OpenTUILogHandlerConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * Get log history
     */
    getHistory(): OpenTUILogEntry[] {
        return this.renderer.getHistory();
    }

    /**
     * Clear log history
     */
    clearHistory(): void {
        this.renderer.clearHistory();
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.renderer.destroy();
    }

    /**
     * Generate unique log ID
     */
    private generateLogId(): string {
        return `opentui-log-${Date.now()}-${++this.logCounter}`;
    }

    /**
     * Fallback rendering when OpenTUI fails
     */
    private fallbackRender(entry: OpenTUILogEntry): void {
        const prefix = entry.prefix ? `[${entry.prefix}] ` : '';
        const timestamp = entry.timestamp.slice(11, 23);
        
        console.log(`[${timestamp}] [${entry.level.toUpperCase()}] ${prefix}${entry.message}`);
        
        // Log additional args if present
        if (entry.args && entry.args.length > 0) {
            entry.args.forEach(arg => {
                if (typeof arg === 'object') {
                    console.log(JSON.stringify(arg, null, 2));
                } else {
                    console.log(String(arg));
                }
            });
        }

        // Log stack trace if present and it's an error
        if (entry.stackInfo && (entry.level === 'error' || entry.level === 'critical')) {
            console.log(`    at ${entry.stackInfo.file}:${entry.stackInfo.line}:${entry.stackInfo.column}`);
        }
    }
}

/**
 * Factory function to create OpenTUI log handler
 */
export function createOpenTUILogHandler(config?: OpenTUILogHandlerConfig): OpenTUILogHandler {
    return new OpenTUILogHandler(config);
}

/**
 * Utility function to check if OpenTUI is available in the environment
 */
export async function isOpenTUIAvailable(): Promise<boolean> {
    try {
        // Try to import OpenTUI core
        await import('@opentui/core');
        return true;
    } catch (error) {
        return false;
    }
}