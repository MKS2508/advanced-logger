import { Logger } from './Logger.js';
import type { TimerEntry, Bindings } from './types/index.js';

export class ScopedLogger {
    private readonly parent: Logger;
    private readonly scopeName: string;
    private badgeList: string[] = [];
    private contextStack: string[] = [];
    private _timers?: Map<string, TimerEntry>;

    constructor(parent: Logger, scopeName: string) {
        this.parent = parent;
        this.scopeName = scopeName;
    }

    private get timers(): Map<string, TimerEntry> {
        if (!this._timers) this._timers = new Map();
        return this._timers;
    }

    private getBindings(): Bindings {
        return {
            scope: this.getScopePrefix(),
            badges: this.badgeList.length > 0 ? [...this.badgeList] : undefined,
        };
    }

    private getScopePrefix(): string {
        if (this.contextStack.length === 0) return this.scopeName;
        return [this.scopeName, ...this.contextStack].join(':');
    }

    badges(badges: string[]): this {
        this.badgeList = [...badges];
        return this;
    }

    badge(badge: string): this {
        if (!this.badgeList.includes(badge)) {
            this.badgeList.push(badge);
        }
        return this;
    }

    clearBadges(): this {
        this.badgeList = [];
        return this;
    }

    style(presetName: string): this {
        this.parent.setTheme(presetName as any);
        return this;
    }

    context(contextName: string): ContextLogger {
        return new ContextLogger(this, contextName);
    }

    time(label: string): void {
        this.timers.set(label, {
            label: `${this.scopeName}:${label}`,
            startTime: performance.now(),
        });
    }

    timeEnd(label: string): number | undefined {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' not found`);
            return undefined;
        }
        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);
        this.success(`Timer: ${label} - ${elapsed.toFixed(2)}ms`);
        return elapsed;
    }

    debug(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'debug', ...args);
    }

    info(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'info', ...args);
    }

    warn(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'warn', ...args);
    }

    error(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'error', ...args);
    }

    success(...args: any[]): void {
        const bindings = this.getBindings();
        this.parent.logWithBindings(bindings, 'info', ...args);
    }

    critical(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'critical', ...args);
    }

    trace(...args: any[]): void {
        this.parent.logWithBindings(this.getBindings(), 'debug', ...args);
        console.trace(`[${this.scopeName}]`);
    }

    _pushContext(context: string): void {
        this.contextStack.push(context);
    }

    _popContext(): void {
        this.contextStack.pop();
    }
}

export class APILogger extends ScopedLogger {
    constructor(parent: Logger, apiName: string) {
        super(parent, `API:${apiName}`);
        this.badge('API');
    }

    slow(message: string, duration?: number): void {
        this.badge('SLOW');
        const msg = duration ? `${message} (${duration}ms)` : message;
        this.warn(msg);
    }

    rateLimit(message: string): void {
        this.badge('RATE_LIMIT');
        this.warn(message);
    }

    auth(message: string): void {
        this.badge('AUTH');
        this.error(message);
    }

    deprecated(message: string): void {
        this.badge('DEPRECATED');
        this.warn(message);
    }
}

export class ComponentLogger extends ScopedLogger {
    constructor(parent: Logger, componentName: string) {
        super(parent, componentName);
        this.badge('COMPONENT');
    }

    lifecycle(event: string, message?: string): void {
        this.badge('LIFECYCLE');
        const msg = message ? `${event}: ${message}` : event;
        this.info(msg);
    }

    stateChange(from: string, to: string, data?: any): void {
        this.badge('STATE');
        const msg = `${from} → ${to}`;
        if (data) {
            this.info(msg, data);
        } else {
            this.info(msg);
        }
    }

    propsChange(changes: Record<string, any>): void {
        this.badge('PROPS');
        this.debug('Props changed:', changes);
    }
}

export class ContextLogger {
    private parentLogger: ScopedLogger;
    private contextName: string;

    constructor(parentLogger: ScopedLogger, contextName: string) {
        this.parentLogger = parentLogger;
        this.contextName = contextName;
    }

    run<T>(fn: () => T): T {
        this.parentLogger._pushContext(this.contextName);
        try {
            return fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    async runAsync<T>(fn: () => Promise<T>): Promise<T> {
        this.parentLogger._pushContext(this.contextName);
        try {
            return await fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    start(): void {
        this.parentLogger._pushContext(this.contextName);
    }

    end(): void {
        this.parentLogger._popContext();
    }

    debug(...args: any[]): void { this.parentLogger.debug(...args); }
    info(...args: any[]): void { this.parentLogger.info(...args); }
    warn(...args: any[]): void { this.parentLogger.warn(...args); }
    error(...args: any[]): void { this.parentLogger.error(...args); }
    success(...args: any[]): void { this.parentLogger.success(...args); }
    critical(...args: any[]): void { this.parentLogger.critical(...args); }
}
