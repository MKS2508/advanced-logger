import type {
    TransportRecord,
    TransportTarget,
    TransportOptions,
    ITransport,
    ITransportManager,
    LogLevel
} from '../types/index.js';
import { LOG_LEVELS } from '../types/index.js';
import { ConsoleTransport } from './ConsoleTransport.js';
import { FileTransport } from './FileTransport.js';
import { HttpTransport } from './HttpTransport.js';
import { OtlpTransport } from './OtlpTransport.js';

function generateTransportId(): string {
    return `transport-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Constructor signature for transports registered in the built-in registry.
 * Accepts the transport's own options type; pass-through is enforced at
 * registration time via TypeScript but erased at runtime.
 */
export type TransportConstructor = new (options?: TransportOptions) => ITransport;

/**
 * Built-in registry of named transports. Users can call
 * {@link TransportManager.register} to add their own (e.g. a custom
 * Datadog or Loki transport) and then instantiate it via
 * `addTransport({ target: 'datadog', options })`.
 *
 * The four built-ins are registered automatically:
 *   - `'console'` → {@link ConsoleTransport}
 *   - `'file'`    → {@link FileTransport}
 *   - `'http'`    → {@link HttpTransport}
 *   - `'otlp'`    → {@link OtlpTransport}
 */
const BUILTIN_REGISTRY: Map<string, TransportConstructor> = new Map([
    ['console', ConsoleTransport as unknown as TransportConstructor],
    ['file', FileTransport as unknown as TransportConstructor],
    ['http', HttpTransport as unknown as TransportConstructor],
    ['otlp', OtlpTransport as unknown as TransportConstructor]
]);

interface TransportEntry {
    id: string;
    transport: ITransport;
    options: TransportOptions;
    level: LogLevel;
    levelValue: number;
}

export class TransportManager implements ITransportManager {
    private transports: Map<string, TransportEntry> = new Map();
    private defaultLevel: LogLevel = 'info';
    private readonly registry: Map<string, TransportConstructor> = new Map(BUILTIN_REGISTRY);

    constructor(defaultLevel?: LogLevel) {
        if (defaultLevel) {
            this.defaultLevel = defaultLevel;
        }
    }

    /**
     * Registers a custom transport under a string name. Once registered,
     * `addTransport({ target: 'name', options })` instantiates it.
     *
     * @example
     * transportManager.register('datadog', DatadogTransport);
     * transportManager.add({ target: 'datadog', options: { apiKey: env('DD_KEY') } });
     *
     */
    register(name: string, ctor: TransportConstructor): void {
        if (BUILTIN_REGISTRY.has(name)) {
            throw new Error(`TransportManager.register: '${name}' is a built-in and cannot be overridden`);
        }
        this.registry.set(name, ctor);
    }

    /**
     * Lists all registered transport names (built-ins + custom).
     *
     */
    listRegistered(): string[] {
        return [...this.registry.keys()];
    }

    add(target: TransportTarget): string {
        const id = generateTransportId();
        const level = target.level || this.defaultLevel;

        let transport: ITransport;

        if (typeof target.target === 'string') {
            const ctor = this.registry.get(target.target);
            if (!ctor) {
                throw new Error(
                    `TransportManager.add: unknown transport name '${target.target}'. ` +
                    `Registered: ${this.listRegistered().join(', ')}`
                );
            }
            transport = new ctor(target.options ?? {});
        } else {
            transport = target.target;
        }

        const entry: TransportEntry = {
            id,
            transport,
            options: target.options || {},
            level,
            levelValue: LOG_LEVELS[level]
        };

        this.transports.set(id, entry);
        return id;
    }

    remove(id: string): boolean {
        const entry = this.transports.get(id);
        if (entry) {
            const closeResult = entry.transport.close?.();
            if (closeResult instanceof Promise) {
                void closeResult.catch(() => {
                    // close failures are best-effort during remove
                });
            }
            return this.transports.delete(id);
        }
        return false;
    }

    async write(record: TransportRecord): Promise<void> {
        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (record.levelValue < entry.levelValue) {
                continue;
            }

            let transformedRecord: TransportRecord = record;
            if (entry.options.transform) {
                const result = entry.options.transform(record);
                if (result === null) continue;
                transformedRecord = result;
            }

            try {
                const result = entry.transport.write(transformedRecord);
                if (result instanceof Promise) {
                    promises.push(
                        result.catch(err => {
                            // Surface write failures through console (no silent drop)
                            // without throwing — the logger's main path stays sync.
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.write: transport failed:', err);
                        })
                    );
                }
            } catch (error) {
                // Synchronous write errors are surfaced but never break the log call.
                // eslint-disable-next-line no-console
                console.error('TransportManager.write: transport threw synchronously:', error);
            }
        }

        await Promise.all(promises);
    }

    async flush(): Promise<void> {
        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.flush) {
                try {
                    const result = entry.transport.flush();
                    if (result instanceof Promise) {
                        promises.push(result.catch(err => {
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.flush: transport failed:', err);
                        }));
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('TransportManager.flush: transport threw synchronously:', error);
                }
            }
        }

        await Promise.all(promises);
    }

    async close(): Promise<void> {
        await this.flush();

        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.close) {
                try {
                    const result = entry.transport.close();
                    if (result instanceof Promise) {
                        promises.push(result.catch(err => {
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.close: transport failed:', err);
                        }));
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('TransportManager.close: transport threw synchronously:', error);
                }
            }
        }

        await Promise.all(promises);
        this.transports.clear();
    }

    get count(): number {
        return this.transports.size;
    }

    list(): string[] {
        return Array.from(this.transports.keys());
    }
}