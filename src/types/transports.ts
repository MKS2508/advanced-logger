import type { LogLevel, StackInfo } from './core.js';

export interface TransportRecord {
    level: LogLevel;
    levelValue: number;
    time: number;
    msg: string;
    prefix?: string;
    location?: {
        file: string;
        line: number;
        column: number;
        function?: string;
    };
    [key: string]: any;
}

export interface TransportOptions {
    level?: LogLevel;
    transform?: (record: TransportRecord) => TransportRecord | null;
    batchSize?: number;
    flushInterval?: number;
    [key: string]: any;
}

export interface TransportTarget {
    target: string | ITransport;
    options?: TransportOptions;
    level?: LogLevel;
}

export interface ITransport {
    readonly name: string;
    write(record: TransportRecord): void | Promise<void>;
    flush?(): void | Promise<void>;
    close?(): void | Promise<void>;
    isReady?(): boolean;
}

export interface IBufferedTransport extends ITransport {
    readonly bufferSize: number;
    readonly maxBufferSize: number;
    flush(): Promise<void>;
}

export interface ITransportManager {
    add(target: TransportTarget): string;
    remove(id: string): boolean;
    write(record: TransportRecord): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
