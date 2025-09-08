/**
 * @fileoverview Basic OpenTUI log renderer for enhanced terminal logging
 */

import { createCliRenderer, TextRenderable, type Renderable } from '@opentui/core';
import type { LogLevel } from '@mks2508/better-logger-core';
import type { OpenTUILogEntry, OpenTUIRendererOptions } from './types.js';

/**
 * Simple OpenTUI log renderer - Tier 2 Enhanced
 */
export class OpenTUILogRenderer {
    private renderer: any;
    private initialized = false;
    private logHistory: OpenTUILogEntry[] = [];
    private options: Required<OpenTUIRendererOptions>;

    constructor(options: OpenTUIRendererOptions = {}) {
        this.options = {
            interactive: false, // Tier 2: Basic for now
            animated: true,
            theme: 'auto',
            dashboard: false, // Save for Tier 3
            maxHistory: 100,
            components: {
                badges: true,
                progressBars: false, // Tier 2: Keep simple
                tables: false,
                charts: false
            }
        };
        
        Object.assign(this.options, options);
    }

    /**
     * Initialize the OpenTUI renderer
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        try {
            this.renderer = await createCliRenderer();
            this.initialized = true;
        } catch (error) {
            console.warn('OpenTUI not available, falling back to standard logging');
            this.initialized = false;
        }
    }

    /**
     * Check if OpenTUI is available and initialized
     */
    isAvailable(): boolean {
        return this.initialized;
    }

    /**
     * Render a log entry using OpenTUI
     */
    async renderLog(entry: OpenTUILogEntry): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (!this.isAvailable()) {
            // Fallback to simple console output
            this.renderFallback(entry);
            return;
        }

        // Add to history
        this.logHistory.push(entry);
        if (this.logHistory.length > this.options.maxHistory) {
            this.logHistory.shift();
        }

        // Create basic styled output
        const logRenderable = this.createLogRenderable(entry);
        this.renderer.root.add(logRenderable);
    }

    /**
     * Create OpenTUI renderable for log entry
     */
    private createLogRenderable(entry: OpenTUILogEntry): Renderable {
        const levelColor = this.getLevelColor(entry.level);
        const levelIcon = this.getLevelIcon(entry.level);
        
        // Simple badge + message format for Tier 2
        const badgeText = `${levelIcon} ${entry.level.toUpperCase()}`;
        const fullMessage = entry.prefix 
            ? `[${badgeText}] [${entry.prefix}] ${entry.message}`
            : `[${badgeText}] ${entry.message}`;

        return new TextRenderable(`log-${entry.id}`, {
            content: fullMessage,
            style: {
                color: levelColor,
                ...(entry.level === 'critical' && { 
                    fontWeight: 'bold',
                    textShadow: `0 0 5px ${levelColor}`
                })
            }
        });
    }

    /**
     * Get color for log level
     */
    private getLevelColor(level: LogLevel): string {
        const colors: Record<LogLevel, string> = {
            debug: '#6c757d',
            info: '#007bff', 
            warn: '#ffc107',
            error: '#dc3545',
            critical: '#8B0000'
        };
        return colors[level];
    }

    /**
     * Get icon for log level
     */
    private getLevelIcon(level: LogLevel): string {
        const icons: Record<LogLevel, string> = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            critical: '🚨'
        };
        return icons[level];
    }

    /**
     * Fallback rendering when OpenTUI is not available
     */
    private renderFallback(entry: OpenTUILogEntry): void {
        const icon = this.getLevelIcon(entry.level);
        const timestamp = entry.timestamp.slice(11, 23);
        const prefix = entry.prefix ? ` [${entry.prefix}]` : '';
        
        console.log(`[${timestamp}] ${icon} [${entry.level.toUpperCase()}]${prefix} ${entry.message}`);
    }

    /**
     * Get log history
     */
    getHistory(): OpenTUILogEntry[] {
        return [...this.logHistory];
    }

    /**
     * Clear log history
     */
    clearHistory(): void {
        this.logHistory = [];
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.renderer) {
            // Cleanup renderer if needed
            this.renderer = null;
        }
        this.initialized = false;
    }
}