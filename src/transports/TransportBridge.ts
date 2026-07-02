/**
 * @fileoverview TransportBridge — TransportManager facade.
 * Encapsulates transport lifecycle: add, remove, flush, close.
 */

import type { TransportTarget } from '../types/index.js';
import { TransportManager } from '../transports/index.js';

/**
 * Result of adding a transport.
 */
export interface AddTransportResult {
    /** Unique transport ID. */
    id: string;
    /** The TransportManager instance (created on first add). */
    manager: TransportManager;
}

/**
 * Bridge for transport lifecycle management.
 */
export interface TransportBridge {
    /** Adds a transport and returns its ID. */
    addTransport(target: TransportTarget): string;
    /** Removes a transport by ID. Returns true if removed. */
    removeTransport(id: string): boolean;
    /** Forces flush of all transport buffers. */
    flushTransports(): Promise<void>;
    /** Closes all transports gracefully. */
    closeTransports(): Promise<void>;
    /** Returns the underlying manager (or undefined if never used). */
    getTransportManager(): TransportManager | undefined;
    /** Writes a transport record (fire-and-forget). No-op if manager not initialized. */
    writeRecord(record: Parameters<TransportManager['write']>[0]): void;
}

/**
 * Creates a TransportBridge instance.
 */
export function createTransportBridge(): TransportBridge {
    let transportManager: TransportManager | undefined;

    return {
        addTransport(target: TransportTarget): string {
            if (!transportManager) {
                transportManager = new TransportManager();
            }
            return transportManager.add(target);
        },

        removeTransport(id: string): boolean {
            return transportManager?.remove(id) ?? false;
        },

        async flushTransports(): Promise<void> {
            await transportManager?.flush();
        },

        async closeTransports(): Promise<void> {
            await transportManager?.close();
        },

        getTransportManager(): TransportManager | undefined {
            return transportManager;
        },

        writeRecord(record): void {
            if (!transportManager) return;
            // Fire-and-forget — never break the sync log path.
            transportManager.write(record).catch(() => {});
        }
    };
}
