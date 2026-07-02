/**
 * @fileoverview HookBridge — HookManager facade.
 * Encapsulates hook registration, middleware pipeline, and event emission.
 */

import type { HookEvent, HookCallback, MiddlewareFn } from '../types/index.js';
import { HookManager } from '../hooks/index.js';

/**
 * Bridge for hook and middleware management.
 */
export interface HookBridge {
    /** Registers a hook for an event. Returns unsubscribe function. */
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    /** Registers a one-time hook. Returns unsubscribe function. */
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    /** Removes a registered hook. Returns true if removed. */
    off(event: HookEvent, callback: HookCallback): boolean;
    /** Adds middleware to the pipeline. Returns unsubscribe function. */
    use(middleware: MiddlewareFn, priority?: number): () => void;
    /** Returns the underlying HookManager. */
    getHookManager(): HookManager;
}

/**
 * Creates a HookBridge instance.
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
