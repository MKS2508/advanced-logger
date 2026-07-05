/**
 * @fileoverview HookBridge — facade de HookManager.
 * Encapsula registro de hooks, middleware pipeline y emisión de eventos.
 *
 * @internal
 */

import type { HookEvent, HookCallback, MiddlewareFn } from '../types/index.js';
import { HookManager } from './index.js';

/**
 * Bridge para la gestión de hooks y middleware.
 *
 * @internal
 */
export interface HookBridge {
    /** Registra un hook para un evento. Devuelve función de unsubscribe. */
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    /** Registra un hook one-time. Devuelve función de unsubscribe. */
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    /** Elimina un hook registrado. Devuelve `true` si se eliminó. */
    off(event: HookEvent, callback: HookCallback): boolean;
    /** Añade middleware al pipeline. Devuelve función de unsubscribe. */
    use(middleware: MiddlewareFn, priority?: number): () => void;
    /** Devuelve el HookManager subyacente. */
    getHookManager(): HookManager;
}

/**
 * Crea una instancia de {@link HookBridge}.
 *
 * @internal
 */
export function createHookBridge(): HookBridge {
    const hookManager = new HookManager();

    return {
        on(event: HookEvent, callback: HookCallback, priority?: number): () => void {
            return hookManager.on(event, callback, priority);
        },

        once(event: HookEvent, callback: HookCallback, priority?: number): () => void {
            return hookManager.once(event, callback, priority);
        },

        off(event: HookEvent, callback: HookCallback): boolean {
            return hookManager.off(event, callback);
        },

        use(middleware: MiddlewareFn, priority?: number): () => void {
            return hookManager.use(middleware, priority);
        },

        getHookManager(): HookManager {
            return hookManager;
        }
    };
}
