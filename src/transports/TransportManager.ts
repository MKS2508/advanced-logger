import type {
    TransportRecord,
    TransportTarget,
    TransportOptions,
    ITransport,
    ITransportManager,
    LogLevel
} from '../types/index.js';
import { LOG_LEVELS } from '../types/index.js';

function generateTransportId(): string {
    return `transport-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

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

    constructor(defaultLevel?: LogLevel) {
        if (defaultLevel) {
            this.defaultLevel = defaultLevel;
        }
    }

    add(target: TransportTarget): string {
        const id = generateTransportId();
        const level = target.level || this.defaultLevel;

        let transport: ITransport;

        if (typeof target.target === 'string') {
            throw new Error(`String transport targets not supported. Use inline transport object.`);
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
            entry.transport.close?.();
            return this.transports.delete(id);
        }
        return false;
    }

    async write(record: TransportRecord): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const entry of this.transports.values()) {
            if (record.levelValue < entry.levelValue) {
                continue;
            }

            let transformedRecord = record;
            if (entry.options.transform) {
                const result = entry.options.transform(record);
                if (result === null) continue;
                transformedRecord = result;
            }

            const result = entry.transport.write(transformedRecord);
            if (result instanceof Promise) {
                promises.push(result);
            }
        }

        await Promise.all(promises);
    }

    async flush(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.flush) {
                const result = entry.transport.flush();
                if (result instanceof Promise) {
                    promises.push(result);
                }
            }
        }

        await Promise.all(promises);
    }

    async close(): Promise<void> {
        await this.flush();

        const promises: Promise<void>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.close) {
                const result = entry.transport.close();
                if (result instanceof Promise) {
                    promises.push(result);
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
