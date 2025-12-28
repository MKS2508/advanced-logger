import type { LogLevel } from './core.js';

export type SerializerFn<T = any> = (value: T, context: SerializerContext) => any;

export interface SerializerContext {
    depth: number;
    maxDepth: number;
    path: string[];
    seen: WeakSet<object>;
}

export interface SerializerEntry<T = any> {
    type: new (...args: any[]) => T;
    serializer: SerializerFn<T>;
    priority: number;
}

export interface SerializerConfig {
    maxDepth?: number;
    circular?: 'error' | 'skip' | 'placeholder';
    preserveUndefined?: boolean;
}

export interface ISerializerRegistry {
    add<T>(type: new (...args: any[]) => T, serializer: SerializerFn<T>, priority?: number): void;
    remove<T>(type: new (...args: any[]) => T): boolean;
    has<T>(type: new (...args: any[]) => T): boolean;
    serialize(value: any, config?: SerializerConfig): any;
    getAll(): SerializerEntry[];
}
