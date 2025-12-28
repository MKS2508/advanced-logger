import type { TransportRecord, TransportOptions, ITransport, LogLevel } from '../types/index.js';

export class ConsoleTransport implements ITransport {
    readonly name = 'console';

    constructor(private options?: TransportOptions) {}

    write(record: TransportRecord): void {
        const method = this.getConsoleMethod(record.level);
        const prefix = record.prefix ? `[${record.prefix}] ` : '';
        const location = record.location
            ? ` (${record.location.file}:${record.location.line})`
            : '';

        console[method](`[${record.level.toUpperCase()}]${prefix} ${record.msg}${location}`);
    }

    private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
        switch (level) {
            case 'debug': return 'log';
            case 'info': return 'info';
            case 'warn': return 'warn';
            case 'error':
            case 'critical': return 'error';
            default: return 'log';
        }
    }
}
