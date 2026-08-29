/**
 * @fileoverview Bridge de LogContext — gestión de MDC (Mapped Diagnostic Context).
 *
 * Encapsula el contexto estructurado por logger, la creación de child loggers y
 * el merge de resource OTel en cada record emitido.
 *
 * Modelo de API:
 * - `withContext(bindings, fn?)` — si se pasa `fn`, lo ejecuta dentro de un
 *   scope de AsyncLocalStorage mergeando `bindings`. Sin `fn`: no-op (shim de
 *   backwards compat para la vieja forma de setter).
 * - `withContextAsync(bindings, fn)` — variante async callback.
 * - `child(bindings)` — inmutable (patrón canónico de MDC).
 * - Feature-detect de AsyncLocalStorage; en browser sin ALS es no-op.
 */

import type { ILogResourceRef } from '../types/index.js';
import type { LoggerConfig } from '../types/index.js';
import { resolveAsyncLocalStorage, type AsyncLocalStorageLike } from '../utils/asyncLocalStorage.js';

/**
 * Snapshot del contexto bound. Lo retorna {@link LogContext.getContext}.
 *
 * Es `Readonly` para marcar contractually que el objeto devuelto es una shallow
 * copy: mutarlo no afecta a los records que emitan futuras llamadas de log.
 */
export type ContextSnapshot = Readonly<Record<string, unknown>>;

/**
 * Tipo de la factory function para crear instancias child de Logger.
 *
 * Se inyecta en LogContext para que `child()` pueda instanciar nuevos loggers
 * sin introducir un import circular entre `Logger.ts` y `LogContext.ts`.
 * Retorna `unknown` — la clase Logger concreta la maneja el caller, y la
 * instancia devuelta tiene su campo `context` escrito por LogContext tras la
 * creación.
 */
export type ChildLoggerFactory = (config: Partial<LoggerConfig>) => unknown;

/**
 * Shape mínima de una instancia de Logger que LogContext necesita ver.
 *
 * Evita dependencias circulares entre LogContext y Logger. El campo
 * `_parentContextRecord` lo setea el Logger padre después de que
 * `LogContext.child()` retorna, estableciendo la cadena de contextos.
 */
export interface ChildLoggerShape {
    _parentContextRecord?: Record<string, unknown>;
    /** Campo legacy — ya no es la fuente canónica del contexto. */
    context?: Record<string, unknown>;
}

/**
 * Options que se pasan a {@link createLogContext}.
 */
export interface ILogContextOptions {
    /** Pares key-value iniciales del contexto. */
    initialContext?: Record<string, unknown>;
    /** Factory para crear instancias child de logger. */
    childLoggerFactory: ChildLoggerFactory;
    /** Resource OTel inicial a mergear en cada record emitido. */
    initialResource?: Partial<ILogResourceRef>;
    /**
     * Retorna el record de contexto mergeado del logger padre en el momento
     * de creación del child. Lo usa `_getContextRecord()` para construir la
     * cadena de contextos.
     * @internal
     */
    getParentContextRecord?: () => Record<string, unknown>;
    /**
     * Instancia de AsyncLocalStorage a usar para el scoping de `withContext`.
     * @internal
     */
    alsInstance?: ALS;
}

/**
 * Contrato que retorna {@link createLogContext}.
 *
 * Fachada de MDC (Mapped Diagnostic Context) por logger. Combina tres fuentes
 * de contexto:
 * - **base inmutable** vía `child()` (snapshot capturado al crear el child),
 * - **scope transitorio** vía `withContext()` / `withContextAsync()` sobre
 *   AsyncLocalStorage,
 * - **resource OTel** mergeado en cada record.
 *
 * En entornos browser sin `AsyncLocalStorage`, las variantes `withContext*`
 * degradan a no-op: ejecutan `fn` sin scoping (o lo skipan si no hay `fn`).
 * `child()` sigue operativo en browser porque no depende de ALS.
 */
export interface LogContext {
    /**
     * Snapshot actual del contexto bound.
     *
     * @returns Copia inmutable (shallow) del contexto; mutarla no afecta a los
     * records que emitan futuras llamadas de log.
     *
     * @example
     * const ctx = logContext.getContext();
     * console.log(ctx.requestId); // 'abc-123'
     */
    getContext(): ContextSnapshot;

    /**
     * Ejecuta `fn` dentro de un scope de AsyncLocalStorage donde `bindings`
     * se mergean al contexto para todas las llamadas de log dentro de `fn`.
     *
     * Si no se pasa `fn` (la vieja forma de setter), es no-op por backwards
     * compatibility. Para binding persistente prefiere `child()`; para
     * callbacks async usa `withContextAsync()`.
     *
     * **Browser fallback**: sin ALS, ejecuta `fn` directamente sin scoping
     * (los bindings NO se mergean). Si tampoco hay `fn`, retorna `undefined`.
     *
     * @param bindings - Pares key-value a attachar durante la ejecución de `fn`
     * @param fn - Función sincrónica opcional a ejecutar bajo el scope ALS
     * @returns El valor de retorno de `fn`, o `undefined` si no se pasa `fn`
     *
     * @example
     * logContext.withContext({ requestId: 'abc-123' }, () => {
     *   logger.info('procesando'); // el record lleva requestId=abc-123
     * });
     * // fuera de fn: requestId ya no está presente en próximos logs
     *
     * @see {@link LogContext.withContextAsync} para callbacks async
     * @see {@link LogContext.child} para binding persistente inmutable (sin ALS)
     */
    withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined;

    /**
     * Variante async de {@link withContext}. Ejecuta `fn` dentro de un scope
     * de AsyncLocalStorage para que los bindings queden disponibles a todas las
     * llamadas de log async dentro de `fn` (incluso tras `await`).
     *
     * **Browser fallback**: sin ALS, ejecuta `fn` directamente sin scoping.
     *
     * @param bindings - Pares key-value a attachar durante la ejecución de `fn`
     * @param fn - Función async a ejecutar bajo el scope ALS
     * @returns El Promise retornado por `fn`
     *
     * @example
     * await logContext.withContextAsync({ traceId }, async () => {
     *   const user = await fetchUser();
     *   logger.info('user cargado', { id: user.id });
     *   // el record lleva el traceId aunque el log ocurra tras un await
     * });
     */
    withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R>;

    /**
     * Droppea todas las keys del contexto bound. Tras esta llamada, los
     * records emitidos ya no llevan `attributes` hasta que
     * {@link withContext} o {@link child} restablezcan uno.
     *
     * @returns La misma instancia de LogContext, ahora sin contexto
     *
     * @example
     * logContext.clearContext();
     * logger.info('limpio'); // sin attributes
     */
    clearContext(): this;

    /**
     * Actualiza el resource OTel por defecto (service.name, version,
     * deployment.environment, ...).
     *
     * Se persiste en el campo `resource` de cada record emitido, salvo que el
     * propio record lo overridee.
     *
     * @param resource - Resource OTel parcial a mergear con el actual
     * @returns La misma instancia de LogContext, para encadenar calls
     *
     * @example
     * logContext.setResource({ serviceName: 'api-gateway', environment: 'prod' });
     */
    setResource(resource: Partial<ILogResourceRef>): this;

    /**
     * Devuelve una copia inmutable de este logger con el contexto extra bound.
     *
     * Las llamadas futuras sobre el child emiten con el contexto mergeado, sin
     * mutar al padre — patrón canónico de MDC.
     *
     * A diferencia de {@link withContext}, **no involucra AsyncLocalStorage**:
     * el binding es persistente y queda capturado en el snapshot del child al
     * crearse. Por eso `child()` es operativo también en browser sin ALS.
     *
     * Los bindings transitorios de ALS activos en el momento de `child()` NO
     * se bakean en el child — solo se captura el contexto base. ALS se aplica
     * fresco en cada dispatch vía `_getContextRecord()`.
     *
     * @param extra - Pares key-value a attachar (requestId, userId, ...)
     * @returns Un nuevo Logger con el contexto mergeado
     *
     * @example
     * const requestLog = logContext.child({ requestId: 'abc-123' });
     * requestLog.info('inicio');   // siempre lleva requestId=abc-123
     * requestLog.info('fin');
     * // el logger padre no se ve afectado por estos bindings
     *
     * @see {@link LogContext.withContext} para scoping transitorio (ALS)
     */
    child(extra: Record<string, unknown>): ChildLoggerShape;

    /**
     * Record de contexto interno. Expuesto para el ensamblado de TransportRecord
     * (base + overlay ALS si hay store activo).
     * @internal
     */
    _getContextRecord(): Record<string, unknown>;
    /**
     * Retorna el contexto base SIN el overlay de ALS.
     *
     * Lo usa `Logger.child()` para capturar el snapshot del contexto padre al
     * crear un child logger, garantizando que el binding ALS transitorio no
     * se bakeé en el child.
     * @internal
     */
    _getBaseContextRecord(): Record<string, unknown>;
    /**
     * Record de resource interno. Expuesto para el ensamblado de TransportRecord.
     * @internal
     */
    _getResource(): Partial<ILogResourceRef> | undefined;
    /**
     * Retorna el store actual de AsyncLocalStorage, si ALS está activo en el
     * call stack corriente.
     * @internal
     */
    _getAlsStore(): Record<string, unknown> | undefined;
}

// AsyncLocalStorage type (Node 14+, undefined in browser)
type ALS = AsyncLocalStorageLike<Record<string, unknown>>;

// ALS singleton del módulo. Resolución por capas (global →
// `process.getBuiltinModule` → `require`, undefined en browser) delegada al
// helper compartido `resolveAsyncLocalStorage` — el mismo que usa el ALS de
// spans en `transports/SpanRuntime.ts`. Antes esto era
// `typeof AsyncLocalStorage !== 'undefined'`, un feature-detect roto: ese
// constructor no es global en node/bun, así que siempre resolvía `undefined`
// y `withContext`/`withContextAsync` eran no-op silenciosos fuera del browser.
//
// Se resuelve lazy en el primer `withContext(fn)`: cargar `node:async_hooks`
// cuesta ~2,2 MB de RSS en bun, y `_getContextRecord` consulta el store en
// cada dispatch de log — resolverlo al importar se lo cobraría a todo
// proceso que loguea, use MDC o no. Sin `run()` previo `getStore()` devuelve
// `undefined`, así que el guard por flag es observable-identico.
let alsInstance: ALS | undefined;
let alsActivated = false;

/**
 * Factory que crea una instancia de {@link LogContext}.
 *
 * @param options - Configuración (ver {@link ILogContextOptions})
 * @returns Una instancia de LogContext lista para usar
 *
 * @example
 * const logContext = createLogContext({
 *   childLoggerFactory: (cfg) => new Logger(cfg),
 *   initialContext: { service: 'orders-api' },
 *   initialResource: { serviceName: 'orders-api', environment: 'prod' }
 * });
 *
 * // Child inmutable con contexto persistente
 * const requestLog = logContext.child({ requestId: 'abc-123' });
 *
 * // Scope transitorio vía ALS (Node; en browser sin ALS es no-op)
 * logContext.withContext({ traceId: 't-9' }, () => {
 *   requestLog.info('procesando orden');
 * });
 */
export function createLogContext(options: ILogContextOptions): LogContext {
    let context: Record<string, unknown> = { ...options.initialContext };
    let resource: Partial<ILogResourceRef> | undefined = options.initialResource
        ? { ...options.initialResource }
        : undefined;

    // Provided instance wins; otherwise the module singleton resolves on
    // first real use (see the note on `alsInstance` above). The module
    // instance stays shared across LogContexts: nested `withContext` de
    // loggers distintos se ven entre sí vía el mismo store.
    const activateAls = (): ALS | undefined => {
        if (!alsActivated) {
            alsActivated = true;
            alsInstance = resolveAsyncLocalStorage<Record<string, unknown>>();
        }
        return options.alsInstance ?? alsInstance;
    };

    return {
        getContext(): ContextSnapshot {
            return { ...context };
        },

        withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined {
            // No fn: backwards-compat no-op setter shim — never activates ALS
            if (!fn) return undefined;
            const store = activateAls();
            // No AsyncLocalStorage (browser fallback): run fn as-is
            if (!store) return fn();
            // Run fn within AsyncLocalStorage scope, merged with the active
            // outer scope (if any) so nested withContext calls accumulate
            // bindings instead of replacing them.
            const merged = { ...context, ...store.getStore(), ...bindings };
            return store.run(merged, fn);
        },

        async withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R> {
            const store = activateAls();
            if (!store) return fn();
            const merged = { ...context, ...store.getStore(), ...bindings };
            return store.run(merged, fn);
        },

        clearContext(): typeof this {
            context = {};
            return this;
        },

        setResource(res: Partial<ILogResourceRef>): typeof this {
            resource = { ...resource, ...res };
            return this;
        },

        child(_extra: Record<string, unknown>): ChildLoggerShape {
            // Creates the child logger via factory. Captures the current
            // _getBaseContextRecord() snapshot (parent context WITHOUT ALS) at
            // child-creation time. ALS is transient and should not be baked into
            // the child's _parentContextRecord — it is applied fresh at dispatch time.
            // Note: _extra (bindings) are stored by Logger.child() as _bindings.
            const snapshot = this._getBaseContextRecord();
            const childLogger = options.childLoggerFactory({}) as ChildLoggerShape;
            // Store on childLogger for Logger.child() to pick up
            (childLogger as unknown as Record<string, unknown>)['__parentSnapshot'] = snapshot;
            return childLogger;
        },

        _getContextRecord(): Record<string, unknown> {
            // Returns the full merged context for dispatch purposes.
            // Base (parent snapshot + own context) plus ALS overlay if active.
            // An injected instance is read as-is (external runs count); the
            // module singleton only after activation — pre-activation its
            // store would be empty anyway.
            const base = this._getBaseContextRecord();
            const store = options.alsInstance ?? (alsActivated ? alsInstance : undefined);
            const alsContext = store?.getStore();
            if (alsContext && Object.keys(alsContext).length > 0) {
                return { ...base, ...alsContext };
            }
            return base;
        },

        _getBaseContextRecord(): Record<string, unknown> {
            // Returns parent context chain + own context (NO ALS overlay).
            // ALS is applied by _getContextRecord() as a live overlay.
            let base: Record<string, unknown> = {};
            const parentRecord = options.getParentContextRecord?.() ?? null;
            if (parentRecord && Object.keys(parentRecord).length > 0) {
                base = parentRecord;
            } else if (Object.keys(context).length > 0) {
                base = context;
            }
            if (Object.keys(context).length > 0) {
                base = { ...base, ...context };
            }
            return base;
        },

        _getResource(): Partial<ILogResourceRef> | undefined {
            return resource;
        },

        _getAlsStore(): Record<string, unknown> | undefined {
            return (options.alsInstance ?? (alsActivated ? alsInstance : undefined))?.getStore();
        }
    };
}
