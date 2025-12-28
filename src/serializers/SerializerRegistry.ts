import type {
    SerializerFn,
    SerializerContext,
    SerializerEntry,
    SerializerConfig,
    ISerializerRegistry
} from '../types/index.js';

const DEFAULT_CONFIG: Required<SerializerConfig> = {
    maxDepth: 5,
    circular: 'placeholder',
    preserveUndefined: false
};

export class SerializerRegistry implements ISerializerRegistry {
    private serializers: Map<Function, SerializerEntry> = new Map();
    private config: Required<SerializerConfig>;

    constructor(config: SerializerConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.registerDefaults();
    }

    private registerDefaults(): void {
        this.add(Error, (err: Error) => ({
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 10),
            ...(err.cause ? { cause: this.serialize(err.cause) } : {})
        }), 100);

        this.add(Date, (date: Date) => ({
            iso: date.toISOString(),
            timestamp: date.getTime()
        }), 90);

        this.add(RegExp, (regex: RegExp) => ({
            pattern: regex.source,
            flags: regex.flags
        }), 90);

        this.add(Map, (map: Map<any, any>, ctx) => {
            const obj: Record<string, any> = {};
            map.forEach((value, key) => {
                const keyStr = typeof key === 'object' ? JSON.stringify(key) : String(key);
                obj[keyStr] = this.serializeInternal(value, {
                    ...ctx,
                    depth: ctx.depth + 1,
                    path: [...ctx.path, keyStr]
                });
            });
            return { __type: 'Map', entries: obj };
        }, 80);

        this.add(Set, (set: Set<any>, ctx) => ({
            __type: 'Set',
            values: Array.from(set).map((v, i) =>
                this.serializeInternal(v, {
                    ...ctx,
                    depth: ctx.depth + 1,
                    path: [...ctx.path, `[${i}]`]
                })
            )
        }), 80);

        if (typeof Buffer !== 'undefined') {
            this.add(Buffer as any, (buf: Buffer) => ({
                __type: 'Buffer',
                length: buf.length,
                preview: buf.slice(0, 50).toString('hex')
            }), 70);
        }
    }

    add<T>(
        type: new (...args: any[]) => T,
        serializer: SerializerFn<T>,
        priority: number = 50
    ): void {
        this.serializers.set(type, { type, serializer, priority });
    }

    remove<T>(type: new (...args: any[]) => T): boolean {
        return this.serializers.delete(type);
    }

    has<T>(type: new (...args: any[]) => T): boolean {
        return this.serializers.has(type);
    }

    getAll(): SerializerEntry[] {
        return Array.from(this.serializers.values())
            .sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50));
    }

    private findSerializer(value: any): SerializerEntry | null {
        const sorted = this.getAll();
        for (const entry of sorted) {
            if (value instanceof entry.type) {
                return entry;
            }
        }
        return null;
    }

    private serializeInternal(value: any, context: SerializerContext): any {
        if (value === null) return null;
        if (value === undefined) return this.config.preserveUndefined ? undefined : '[undefined]';
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
        if (typeof value !== 'object') return value;

        if (context.depth >= this.config.maxDepth) {
            return '[Max Depth]';
        }

        if (context.seen.has(value)) {
            switch (this.config.circular) {
                case 'error':
                    throw new Error(`Circular reference at ${context.path.join('.')}`);
                case 'skip':
                    return undefined;
                case 'placeholder':
                default:
                    return '[Circular]';
            }
        }
        context.seen.add(value);

        const serializer = this.findSerializer(value);
        if (serializer) {
            return serializer.serializer(value, context);
        }

        if (Array.isArray(value)) {
            return value.map((item, i) =>
                this.serializeInternal(item, {
                    ...context,
                    depth: context.depth + 1,
                    path: [...context.path, `[${i}]`]
                })
            );
        }

        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = this.serializeInternal(val, {
                ...context,
                depth: context.depth + 1,
                path: [...context.path, key]
            });
        }
        return result;
    }

    serialize(value: any, config?: SerializerConfig): any {
        const mergedConfig = { ...this.config, ...config };
        return this.serializeInternal(value, {
            depth: 0,
            maxDepth: mergedConfig.maxDepth,
            path: [],
            seen: new WeakSet()
        });
    }
}

let _defaultRegistry: SerializerRegistry | null = null;

export function getDefaultSerializerRegistry(): SerializerRegistry {
    if (!_defaultRegistry) {
        _defaultRegistry = new SerializerRegistry();
    }
    return _defaultRegistry;
}
