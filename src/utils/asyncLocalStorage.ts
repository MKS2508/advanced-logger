/**
 * @fileoverview Resolución compartida de `AsyncLocalStorage` — utilidad
 * interna, NO exportada por el barrel público (`src/utils/index.ts`).
 *
 * Único punto de verdad para resolver `node:async_hooks` por capas. Lo
 * consumen tanto `transports/SpanRuntime.ts` (ALS singleton de spans) como
 * `context/LogContext.ts` (ALS singleton de MDC). Antes había dos copias de
 * este conocimiento: una acertaba (SpanRuntime, la que sigue este archivo) y
 * otra usaba `typeof AsyncLocalStorage !== 'undefined'` — un feature-detect
 * roto, porque en Node y Bun el constructor NO es global, así que esa rama
 * quedaba siempre en `undefined` y el MDC de logs era no-op silencioso fuera
 * del browser.
 */

/**
 * Forma mínima de `AsyncLocalStorage<T>` que necesita este paquete.
 */
export interface AsyncLocalStorageLike<T> {
    run<R>(store: T, fn: () => R): R;
    getStore(): T | undefined;
}

/**
 * Resuelve `AsyncLocalStorage` por capas:
 *   1. global `AsyncLocalStorage` (runtimes/polyfills que lo exponen),
 *   2. `process.getBuiltinModule('async_hooks')` (Node >= 22.3, Bun),
 *   3. `require('node:async_hooks')` (CJS interop),
 *   4. `undefined` → browser estricto: sin correlación (degradación
 *      documentada; el caller decide qué hacer sin ALS).
 *
 * Nota: NO basta con `typeof AsyncLocalStorage !== 'undefined'` — en Node y
 * Bun el constructor NO es global y hay que ir a `node:async_hooks`.
 */
export function resolveAsyncLocalStorage<T>(): AsyncLocalStorageLike<T> | undefined {
    const globalCtor = (globalThis as { AsyncLocalStorage?: new () => AsyncLocalStorageLike<T> }).AsyncLocalStorage;
    if (typeof globalCtor === 'function') {
        return new globalCtor();
    }

    const proc = globalThis as {
        process?: {
            getBuiltinModule?: (id: string) => { AsyncLocalStorage?: new () => AsyncLocalStorageLike<T> } | undefined;
        };
    };
    try {
        const asyncHooks = proc.process?.getBuiltinModule?.('async_hooks');
        if (asyncHooks?.AsyncLocalStorage) {
            return new asyncHooks.AsyncLocalStorage();
        }
    } catch {
        // getBuiltinModule no disponible — siguiente capa
    }

    try {
        if (typeof require === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const asyncHooks = require('node:async_hooks') as { AsyncLocalStorage?: new () => AsyncLocalStorageLike<T> };
            if (asyncHooks?.AsyncLocalStorage) {
                return new asyncHooks.AsyncLocalStorage();
            }
        }
    } catch {
        // ESM puro sin require ni builtin accessor — browser
    }

    return undefined;
}
