/**
 * @fileoverview SpanRuntime — runtime de spans del trio API
 * `event` / `span` / `startSpan`.
 *
 * Vive en transports/ porque es la extensión del pipeline de dispatch: los
 * {@link SpanRecord} que produce viajan por el {@link TransportManager} junto
 * a los log records, enrutados por kind (`accepts`).
 *
 * Tres responsabilidades:
 *   - **ALS singleton del módulo**: un único `AsyncLocalStorage<SpanRecord>`
 *     compartido por TODAS las instancias de Logger — "qué instancia lleva el
 *     span" es ambiguo con MDC por-instancia, el span activo es una propiedad
 *     del call stack, no del logger.
 *   - **Generación de ids** conforme a W3C Trace Context (traceId 16 bytes →
 *     32 hex, spanId 8 bytes → 16 hex) vía `crypto.getRandomValues`.
 *   - **Leak-safety**: registry de spans abiertos; en flush/shutdown se
 *     fuerzan a `end()` con `incomplete: true` y se exportan — nunca se tiran.
 */

import type { Span, SpanAttributes, SpanRecord } from '../types/index.js';

/**
 * Forma mínima del `AsyncLocalStorage` de `node:async_hooks` que usa el
 * runtime. Undefined en browser sin polyfill.
 */
interface SpanALS {
    run<R>(store: SpanRecord, fn: () => R): R;
    getStore(): SpanRecord | undefined;
}

/**
 * Resuelve `AsyncLocalStorage` por capas:
 *   1. global `AsyncLocalStorage` (runtimes/polyfills que lo exponen),
 *   2. `process.getBuiltinModule('async_hooks')` (Node >= 22.3, Bun),
 *   3. `require('node:async_hooks')` (CJS interop),
 *   4. `undefined` → browser estricto: spans sin correlación (degradación
 *      documentada; `span(fn)`/`startSpan()` siguen funcionando).
 *
 * Nota: NO basta con `typeof AsyncLocalStorage !== 'undefined'` — en Node y
 * Bun el constructor NO es global y hay que ir a `node:async_hooks`.
 */
function resolveSpanALS(): SpanALS | undefined {
    const globalCtor = (globalThis as { AsyncLocalStorage?: new () => SpanALS }).AsyncLocalStorage;
    if (typeof globalCtor === 'function') {
        return new globalCtor();
    }

    const proc = globalThis as {
        process?: { getBuiltinModule?: (id: string) => { AsyncLocalStorage?: new () => SpanALS } | undefined };
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
            const asyncHooks = require('node:async_hooks') as { AsyncLocalStorage?: new () => SpanALS };
            if (asyncHooks?.AsyncLocalStorage) {
                return new asyncHooks.AsyncLocalStorage();
            }
        }
    } catch {
        // ESM puro sin require ni builtin accessor — browser
    }

    return undefined;
}

/** ALS singleton del módulo — compartido por todas las instancias de Logger. */
const activeSpanStore: SpanALS | undefined = resolveSpanALS();

/**
 * Span activo en el call stack corriente (dentro de `span(fn)`), si lo hay.
 * Lo consumen la correlación log→span (`TransportRecord.traceId/spanId`) y la
 * resolución de `parentSpanId` en spans hijos.
 */
export function getActiveSpan(): SpanRecord | undefined {
    return activeSpanStore?.getStore();
}

/**
 * Ejecuta `fn` con `record` como span activo. Sin ALS disponible (browser),
 * ejecuta `fn` directamente — sin correlación pero funcional.
 */
export function runWithActiveSpan<R>(record: SpanRecord, fn: () => R): R {
    return activeSpanStore ? activeSpanStore.run(record, fn) : fn();
}

/** Nanosegundos Unix actuales como string decimal (formato OTLP). */
export function nowUnixNano(): string {
    return String(BigInt(Date.now()) * 1_000_000n);
}

/**
 * Hex aleatorio de `bytes` bytes. Usa `crypto.getRandomValues`; sin
 * `crypto` (runtimes exóticos) degrada a `Math.random` — suficiente para ids
 * de correlación, no para secrets.
 */
function randomHex(bytes: number): string {
    const cryptoObj = (globalThis as { crypto?: { getRandomValues?: (buf: Uint8Array) => Uint8Array } }).crypto;
    if (cryptoObj?.getRandomValues) {
        const buf = new Uint8Array(bytes);
        cryptoObj.getRandomValues(buf);
        let out = '';
        for (const b of buf) {
            out += b.toString(16).padStart(2, '0');
        }
        return out;
    }
    let out = '';
    for (let i = 0; i < bytes * 2; i++) {
        out += Math.floor(Math.random() * 16).toString(16);
    }
    return out;
}

/** Trace id W3C: 16 bytes → 32 chars hex. */
export function generateTraceId(): string {
    return randomHex(16);
}

/** Span id W3C: 8 bytes → 16 chars hex. */
export function generateSpanId(): string {
    return randomHex(8);
}

interface OpenSpanEntry {
    record: SpanRecord;
    /** End normal: cierra el span con su duración real. */
    end: () => void;
    /** End forzado por flush: marca `incomplete: true` antes de cerrar. */
    forceEnd: () => void;
}

/**
 * Registry de spans abiertos (leak-safety). Cubre tanto los de `startSpan()`
 * (externally-ended, el caso del handoff) como los de `span(fn)` en curso:
 * si un flush llega mid-flight, es mejor exportar el span incompleto que
 * tirarlo. El doble-`end()` es no-op, así que el cierre natural posterior no
 * duplica el export.
 */
const openSpans = new Map<SpanRecord, OpenSpanEntry>();

/**
 * Crea el record de span y su {@link Span} handle. El handle registra el
 * span en el registry de abiertos; `onEnd` se invoca una única vez, con el
 * record final (duración real o `incomplete: true`), para su export al
 * pipeline de transports.
 *
 * `end()` solo fija `endTimeUnixNano` si no se fijó antes — así los
 * point-spans (`event()`) pueden fijar `end = start` exacto.
 *
 * @param name - Nombre de la operación.
 * @param attributes - Attributes iniciales (copia propia del record).
 * @param scope - Scope del logger emisor.
 * @param onEnd - Callback de export; recibe el record cerrado.
 * @returns El record (para el ALS store) y el handle del span.
 */
export function createSpan(
    name: string,
    attributes: SpanAttributes | undefined,
    scope: string,
    onEnd: (record: SpanRecord) => void
): { record: SpanRecord; span: Span } {
    const parent = getActiveSpan();

    const record: SpanRecord = {
        kind: 'span',
        traceId: parent?.traceId ?? generateTraceId(),
        spanId: generateSpanId(),
        parentSpanId: parent?.spanId,
        name,
        spanKind: 1,
        startTimeUnixNano: nowUnixNano(),
        endTimeUnixNano: '0',
        attributes: { ...(attributes ?? {}) },
        scope
    };

    let ended = false;

    const finish = (): void => {
        if (ended) return;
        ended = true;
        openSpans.delete(record);
        onEnd(record);
    };

    openSpans.set(record, {
        record,
        end: finish,
        forceEnd: (): void => {
            if (ended) return;
            record.incomplete = true;
            if (record.endTimeUnixNano === '0') {
                record.endTimeUnixNano = nowUnixNano();
            }
            finish();
        }
    });

    const handle: Span = {
        traceId: record.traceId,
        spanId: record.spanId,
        set(key: string, value: string | number | boolean): Span {
            record.attributes[key] = value;
            return handle;
        },
        end(attributes?: SpanAttributes): void {
            if (attributes) {
                Object.assign(record.attributes, attributes);
            }
            if (ended) return;
            if (record.endTimeUnixNano === '0') {
                record.endTimeUnixNano = nowUnixNano();
            }
            finish();
        },
        fail(err: unknown): void {
            if (ended) return;
            record.status = {
                code: 2,
                message: err instanceof Error ? err.message : String(err)
            };
            this.end();
        }
    };

    return { record, span: handle };
}

/**
 * Emite un point-span (`event()`): start = end exactamente, sin registro en
 * abiertos tras el cierre — no hay leak posible. El `parentSpanId` se resuelve
 * contra el span activo si existe, pero NO fija contexto ALS.
 */
export function emitEventSpan(
    name: string,
    attributes: SpanAttributes | undefined,
    scope: string,
    onEnd: (record: SpanRecord) => void
): void {
    const { record, span } = createSpan(name, attributes, scope, onEnd);
    record.endTimeUnixNano = record.startTimeUnixNano;
    span.end();
}

/**
 * Fuerza el cierre de todos los spans abiertos (`incomplete: true`) y los
 * exporta vía el `onEnd` de cada uno. Lo invocan `flushTransports()` /
 * `closeTransports()` / `cleanup()` ANTES del flush real — un span abierto
 * nunca se tira en shutdown.
 *
 * @returns Los records forzados a cerrar (para diagnóstico/tests).
 */
export function forceCloseOpenSpans(): SpanRecord[] {
    // Snapshot: forceEnd muta el Map durante la iteración.
    const snapshot = [...openSpans.values()];
    for (const entry of snapshot) {
        entry.forceEnd();
    }
    return snapshot.map(entry => entry.record);
}

/** Número de spans actualmente abiertos (expuesto para tests/diagnóstico). */
export function openSpanCount(): number {
    return openSpans.size;
}
