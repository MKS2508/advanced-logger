import type { TransportRecord, TransportOptions, ITransport } from '../types/index.js';

export interface FileTransportOptions extends TransportOptions {
    destination?: string;
}

export class FileTransport implements ITransport {
    readonly name = 'file';
    private buffer: string[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private options: FileTransportOptions;

    constructor(options?: FileTransportOptions) {
        this.options = options || {};

        if (this.options.flushInterval) {
            this.flushTimer = setInterval(() => this.flush(), this.options.flushInterval);
        }
    }

    write(record: TransportRecord): void {
        const line = JSON.stringify(record) + '\n';
        this.buffer.push(line);

        if (this.buffer.length >= (this.options.batchSize || 100)) {
            this.flush();
        }
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const lines = this.buffer.join('');
        this.buffer = [];

        if (typeof globalThis.process !== 'undefined' && typeof require === 'function') {
            try {
                const fs = require('fs');
                const dest = this.options.destination || 'app.log';
                fs.appendFileSync(dest, lines);
            } catch {
                // Silent fail in browser or if fs not available
            }
        }
    }

    close(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
