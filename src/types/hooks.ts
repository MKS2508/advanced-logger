import type { LogLevel, StackInfo } from './core.js';

export interface HookLogEntry {
    level: LogLevel;
    message: string;
    args: any[];
    timestamp: string;
    prefix?: string;
    stackInfo?: StackInfo;
    correlationId?: string;
    context?: Record<string, any>;
    [key: string]: any;
}

export type HookEvent = 'beforeLog' | 'afterLog' | 'onError';

export type HookCallback = (entry: HookLogEntry) => void | HookLogEntry | Promise<void | HookLogEntry>;

export type MiddlewareFn = (
    entry: HookLogEntry,
    next: () => void | Promise<void>
) => void | Promise<void>;

export interface HookRegistration {
    id: string;
    event: HookEvent;
    callback: HookCallback;
    priority: number;
    once: boolean;
}

export interface MiddlewareRegistration {
    id: string;
    fn: MiddlewareFn;
    priority: number;
}

export interface IHookManager {
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    off(event: HookEvent, callback: HookCallback): boolean;
    use(middleware: MiddlewareFn, priority?: number): () => void;
    emit(event: HookEvent, entry: HookLogEntry): Promise<HookLogEntry>;
    process(entry: HookLogEntry): Promise<HookLogEntry>;
}
