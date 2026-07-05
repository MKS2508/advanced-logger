/**
 * @fileoverview TransportBridge — facade de TransportManager.
 * Encapsula el lifecycle de transports: add, remove, flush, close.
 *
 * @internal
 */

import type { TransportTarget } from '../types/index.js';
import { TransportManager } from '../transports/index.js';

/**
 * Resultado de añadir un transport.
 */
export interface AddTransportResult {
    /** ID único del transport. */
    id: string;
    /** La instancia de TransportManager (creada al primer add). */
    manager: TransportManager;
}

/**
 * Bridge para la gestión del lifecycle de transports.
 *
 * @internal
 */
export interface TransportBridge {
    /** Añade un transport y devuelve su ID. */
    addTransport(target: TransportTarget): string;
    /** Elimina un transport por ID. Devuelve `true` si se eliminó. */
    removeTransport(id: string): boolean;
    /** Fuerza el flush de todos los buffers de transports. */
    flushTransports(): Promise<void>;
    /** Cierra todos los transports de forma graceful. */
    closeTransports(): Promise<void>;
    /** Devuelve el manager subyacente (o `undefined` si nunca se usó). */
    getTransportManager(): TransportManager | undefined;
    /** Escribe un transport record (fire-and-forget). No-op si el manager no está inicializado. */
    writeRecord(record: Parameters<TransportManager['write']>[0]): void;
}

/**
 * Crea una instancia de {@link TransportBridge}.
 *
 * @internal
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
            // Fire-and-forget — nunca rompe el sync log path.
            transportManager.write(record).catch(() => {});
        }
    };
}
