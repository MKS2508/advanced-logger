import type { TransportRecord, TransportOptions, ITransport } from '../types/index.js';

export interface HttpTransportOptions extends TransportOptions {
    url?: string;
    headers?: Record<string, string>;
}

export class HttpTransport implements ITransport {
    readonly name = 'http';
    private buffer: TransportRecord[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private options: HttpTransportOptions;

    constructor(options?: HttpTransportOptions) {
        this.options = options || {};

        if (this.options.flushInterval) {
            this.flushTimer = setInterval(() => this.flush(), this.options.flushInterval);
        }
    }

    write(record: TransportRecord): void {
        this.buffer.push(record);

        if (this.buffer.length >= (this.options.batchSize || 50)) {
            this.flush();
        }
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0 || !this.options.url) return;

        const records = [...this.buffer];
        this.buffer = [];

        try {
            await fetch(this.options.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.options.headers
                },
                body: JSON.stringify({ logs: records })
            });
        } catch {
            this.buffer.unshift(...records);
        }
    }

    close(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
