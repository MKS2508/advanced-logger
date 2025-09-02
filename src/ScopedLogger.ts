/**
 * @fileoverview ScopedLogger with badges and contextual logging
 */

import { Logger } from './Logger.js';
import type { LoggerConfig, LogLevel, Verbosity, BannerType, StyleOptions, ILogHandler } from './types/index.js';

/**
 * Enhanced scoped logger with badges and simplified API
 */
export class ScopedLogger extends Logger {
    private parentLogger: Logger;
    private scopeName: string;
    private badgeList: string[] = [];
    private contextStack: string[] = [];

    constructor(parentLogger: Logger, scopeName: string, config?: Partial<LoggerConfig>) {
        // Initialize with parent's config plus any overrides
        super({ ...parentLogger.getConfig(), ...config });
        this.parentLogger = parentLogger;
        this.scopeName = scopeName;
        
        // Inherit parent's handlers
        const parentHandlers = parentLogger.getHandlers();
        parentHandlers.forEach(handler => this.addHandler(handler));
    }

    /**
     * Add badges to this scoped logger
     */
    badges(badges: string[]): ScopedLogger {
        this.badgeList = [...badges];
        return this;
    }

    /**
     * Add a single badge
     */
    badge(badge: string): ScopedLogger {
        if (!this.badgeList.includes(badge)) {
            this.badgeList.push(badge);
        }
        return this;
    }

    /**
     * Remove badges
     */
    clearBadges(): ScopedLogger {
        this.badgeList = [];
        return this;
    }

    /**
     * Set style preset for this scoped logger
     */
    style(presetName: string): ScopedLogger {
        this.setTheme(presetName as any); // Will be updated when we implement presets
        return this;
    }

    /**
     * Create a temporary context that gets automatically cleaned up
     */
    context(contextName: string): ContextLogger {
        return new ContextLogger(this, contextName);
    }

    /**
     * Override core logging to include badges
     */
    protected log(level: LogLevel, ...args: any[]): void {
        // Build the enhanced message with badges
        const badges = this.getBadgeString();
        const scopePrefix = this.getScopePrefix();
        
        let enhancedMessage = '';
        if (badges) enhancedMessage += badges + ' ';
        if (scopePrefix) enhancedMessage += `[${scopePrefix}] `;
        
        if (args.length > 0) {
            enhancedMessage += String(args[0]);
            // Replace the first argument with our enhanced message
            args[0] = enhancedMessage;
        }

        // Call parent's log method
        super.log(level, ...args);
    }

    /**
     * Get formatted badge string
     */
    private getBadgeString(): string {
        if (this.badgeList.length === 0) return '';
        return this.badgeList.map(badge => `[${badge}]`).join('');
    }

    /**
     * Get scope prefix (includes context stack)
     */
    private getScopePrefix(): string {
        const parts = [this.scopeName, ...this.contextStack].filter(Boolean);
        return parts.join(':');
    }

    /**
     * Internal method to push context
     */
    _pushContext(context: string): void {
        this.contextStack.push(context);
    }

    /**
     * Internal method to pop context
     */
    _popContext(): void {
        this.contextStack.pop();
    }
}

/**
 * API-specific scoped logger with common API badges
 */
export class APILogger extends ScopedLogger {
    constructor(parentLogger: Logger, apiName: string, config?: Partial<LoggerConfig>) {
        super(parentLogger, `API:${apiName}`, config);
        this.badge('API');
    }

    /**
     * Log slow operations
     */
    slow(message: string, duration?: number): void {
        this.badge('SLOW');
        const msg = duration ? `${message} (${duration}ms)` : message;
        this.warn(msg);
    }

    /**
     * Log rate limiting
     */
    rateLimit(message: string): void {
        this.badge('RATE_LIMIT');
        this.warn(message);
    }

    /**
     * Log authentication issues
     */
    auth(message: string): void {
        this.badge('AUTH');
        this.error(message);
    }

    /**
     * Log deprecation warnings
     */
    deprecated(message: string): void {
        this.badge('DEPRECATED');
        this.warn(message);
    }
}

/**
 * Component-specific scoped logger
 */
export class ComponentLogger extends ScopedLogger {
    constructor(parentLogger: Logger, componentName: string, config?: Partial<LoggerConfig>) {
        super(parentLogger, componentName, config);
        this.badge('COMPONENT');
    }

    /**
     * Log lifecycle events
     */
    lifecycle(event: string, message?: string): void {
        this.badge('LIFECYCLE');
        const msg = message ? `${event}: ${message}` : event;
        this.info(msg);
    }

    /**
     * Log state changes
     */
    stateChange(from: string, to: string, data?: any): void {
        this.badge('STATE');
        const msg = `${from} → ${to}`;
        if (data) {
            this.info(msg, data);
        } else {
            this.info(msg);
        }
    }

    /**
     * Log prop changes
     */
    propsChange(changes: Record<string, any>): void {
        this.badge('PROPS');
        this.debug('Props changed:', changes);
    }
}

/**
 * Temporary context logger that auto-cleans up
 */
export class ContextLogger {
    private parentLogger: ScopedLogger;
    private contextName: string;

    constructor(parentLogger: ScopedLogger, contextName: string) {
        this.parentLogger = parentLogger;
        this.contextName = contextName;
    }

    /**
     * Run a function with this context active
     */
    run<T>(fn: () => T): T {
        this.parentLogger._pushContext(this.contextName);
        try {
            return fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    /**
     * Run an async function with this context active
     */
    async runAsync<T>(fn: () => Promise<T>): Promise<T> {
        this.parentLogger._pushContext(this.contextName);
        try {
            return await fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    /**
     * Start the context (manual mode)
     */
    start(): void {
        this.parentLogger._pushContext(this.contextName);
    }

    /**
     * End the context (manual mode)
     */
    end(): void {
        this.parentLogger._popContext();
    }

    // Delegate logging methods to parent with context
    debug(...args: any[]): void { this.parentLogger.debug(...args); }
    info(...args: any[]): void { this.parentLogger.info(...args); }
    warn(...args: any[]): void { this.parentLogger.warn(...args); }
    error(...args: any[]): void { this.parentLogger.error(...args); }
    success(...args: any[]): void { this.parentLogger.success(...args); }
    critical(...args: any[]): void { this.parentLogger.critical(...args); }
}