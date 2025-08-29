/**
 * @fileoverview Remote log handler for Advanced Logger
 */

import type { ILogHandler, LogLevel, LogMetadata } from '../types/index.js';

/**
 * Remote log handler for sending logs to external services
 */
export class RemoteLogHandler implements ILogHandler {
    private endpoint: string;
    private apiKey?: string;

    constructor(endpoint: string, apiKey?: string) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }

    async handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): Promise<void> {
        try {
            const payload = {
                timestamp: metadata.timestamp,
                level,
                message,
                prefix: metadata.prefix,
                location: metadata.stackInfo,
                additional: args.slice(1),
            };

            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            // Silently fail to avoid infinite logging loops
        }
    }
}