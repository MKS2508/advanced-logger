import type {
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    HookRegistration,
    MiddlewareRegistration,
    IHookManager
} from '../types/index.js';

/**
 * Profundidad máxima de reentrancia permitida para el evento `onError`.
 *
 * Cuando un hook registrado para `onError` lanza una excepción, el manager
 * re-emite el error como un nuevo evento `onError`, lo que podría entrar en
 * un bucle infinito. Este límite corta la cadena tras N niveles de anidamiento
 * y deja caer el entry al console para no acaparar el event loop.
 *
 * @internal Constantante de implementación; no forma parte de la API pública.
 */
const MAX_ONERROR_DEPTH = 5;

/**
 * Genera un identificador corto y único para cada registro de hook/middleware.
 *
 * Combina timestamp con un segmento aleatorio base36. Suficiente para
 * desambiguar registros dentro de un mismo proceso; no es un UUID criptográfico.
 *
 * @internal Helper interno; no es API pública.
 * @returns {string} ID tipo `<epoch>-<random9>`.
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Implementación por defecto de {@link IHookManager} que orquesta el ciclo de
 * vida de los hooks del logger: `beforeLog`, `afterLog` y `onError`.
 *
 * Permite:
 * - Registrar callbacks por evento con **prioridad** (mayor número = se
 *   ejecuta primero; las registraciones se ordenan descendentemente).
 * - Encadenar middlewares sobre el entry previo al dispatch.
 * - Propagar mutaciones: cada hook puede retornar un partial de
 *   {@link HookLogEntry} que se mergea al entry actual antes del siguiente hook.
 * - Acotar la recursión de `onError` con un guard de profundidad
 *   ({@link MAX_ONERROR_DEPTH}) para que un hook que lanza no loopée para
 *   siempre.
 *
 * El flujo típico lo orquesta el logger vía {@link process} (emite `beforeLog`
 * + ejecuta middlewares) y {@link afterProcess} (emite `afterLog`).
 *
 * @example
 * ```ts
 * const hooks = new HookManager();
 *
 * // Mayor prioridad => corre primero
 * hooks.on('beforeLog', (entry) => {
 *   return { ...entry, attributes: { ...entry.attributes, traced: true } };
 * }, 90);
 *
 * hooks.on('afterLog', (entry) => {
 *   metrics.increment('log_emitted', { level: entry.level });
 * });
 *
 * hooks.on('onError', (entry) => {
 *   telemetry.capture(entry.error);
 * });
 * ```
 *
 * @example
 * ```ts
 * // Middleware que añade timestamp si falta y delega al siguiente
 * hooks.use(async (entry, next) => {
 *   if (!entry.time) entry.time = Date.now();
 *   await next();
 * });
 * ```
 *
 * @see {@link IHookManager}
 * @see {@link HookEvent}
 */
export class HookManager implements IHookManager {
    private hooks: Map<HookEvent, HookRegistration[]> = new Map();
    private middlewares: MiddlewareRegistration[] = [];
    /**
     * Lleva el conteo de la profundidad de recursión actual por cada evento de
     * hook, para que las cadenas de `onError` que lanzan excepciones no puedan
     * loopéar para siempre. Se resetea cuando el `emit` externo retorna.
     */
    private _onErrorDepth: Map<HookEvent, number> = new Map();

    constructor() {
        this.hooks.set('beforeLog', []);
        this.hooks.set('afterLog', []);
        this.hooks.set('onError', []);
    }

    /**
     * Registra un callback persistente para un evento. Se ejecuta en cada
     * emisión hasta que se cancele con la función devuelta o con {@link off}.
     *
     * Los hooks se ordenan por `priority` **descendente**: mayor número =
     * se ejecuta primero. Misma prioridad respeta el orden de registro.
     *
     * @param event - Uno de `'beforeLog' | 'afterLog' | 'onError'`.
     * @param callback - Función asíncrona que recibe el {@link HookLogEntry}
     *   actual y puede retornar un partial para mutar el entry que verán los
     *   hooks siguientes.
     * @param priority - Peso de ordenamiento. Default `50`. Mayor = primero.
     * @returns {() => void} Función de cancelación; llamarla desregistra el hook.
     *
     * @example
     * ```ts
     * const off = hooks.on('beforeLog', async (entry) => {
     *   return { attributes: { ...entry.attributes, requestId: getReqId() } };
     * }, 80);
     *
     * // ...en shutdown:
     * off();
     * ```
     *
     * @see {@link once} para hooks de un solo disparo.
     * @see {@link off} para desregistro por referencia de callback.
     */
    on(event: HookEvent, callback: HookCallback, priority: number = 50): () => void {
        const registration: HookRegistration = {
            id: generateId(),
            event,
            callback,
            priority,
            once: false
        };

        const hooks = this.hooks.get(event)!;
        hooks.push(registration);
        hooks.sort((a, b) => b.priority - a.priority);

        return () => this.removeHook(event, registration.id);
    }

    /**
     * Igual que {@link on}, pero el hook se auto-desregistra después del primer
     * disparo exitoso. Útil para setup one-shot (warm-up de caché, captura del
     * primer log, ...).
     *
     * Si el callback lanza, el hook NO se elimina (la excepción se deriva a
     * `onError`); la limpieza solo ocurre cuando el callback retorna sin Throw.
     *
     * @param event - Evento a escuchar.
     * @param callback - Handler que se ejecutará una sola vez.
     * @param priority - Peso de ordenamiento (mayor = primero). Default `50`.
     * @returns {() => void} Cancelación manual por si se quiere retirar antes
     *   del primer disparo.
     *
     * @example
     * ```ts
     * hooks.once('afterLog', async (entry) => {
     *   console.log('Primer log emitido:', entry.msg);
     * });
     * ```
     *
     * @see {@link on}
     */
    once(event: HookEvent, callback: HookCallback, priority: number = 50): () => void {
        const registration: HookRegistration = {
            id: generateId(),
            event,
            callback,
            priority,
            once: true
        };

        const hooks = this.hooks.get(event)!;
        hooks.push(registration);
        hooks.sort((a, b) => b.priority - a.priority);

        return () => this.removeHook(event, registration.id);
    }

    /**
     * Desregistra un hook por referencia de callback. Solo elimina la primera
     * coincidencia encontrada para el evento.
     *
     * Para hooks registrados con {@link on} o {@link once} es preferible usar
     * la función de cancelación devuelta (que usa el id interno y es O(n) más
     * directa). `off` es útil cuando se perdió la referencia al cancelador o
     * cuando se integra con APIs que piden un método `removeListener(cb)`.
     *
     * @param event - Evento del que se quiere desregistrar.
     * @param callback - Misma referencia de función pasada a {@link on}/{@link once}.
     * @returns {boolean} `true` si se eliminó un hook, `false` si no había match.
     *
     * @example
     * ```ts
     * const handler = async (entry) => { /* ... *\/ };
     * hooks.on('afterLog', handler);
     * hooks.off('afterLog', handler); // true
     * ```
     *
     * @see {@link on}
     */
    off(event: HookEvent, callback: HookCallback): boolean {
        const hooks = this.hooks.get(event);
        if (!hooks) return false;

        const index = hooks.findIndex(h => h.callback === callback);
        if (index >= 0) {
            hooks.splice(index, 1);
            return true;
        }
        return false;
    }

    private removeHook(event: HookEvent, id: string): void {
        const hooks = this.hooks.get(event);
        if (hooks) {
            const index = hooks.findIndex(h => h.id === id);
            if (index >= 0) {
                hooks.splice(index, 1);
            }
        }
    }

    /**
     * Registra un middleware que se encadena sobre el {@link HookLogEntry}
     * **antes** de que se emita el log al resto del pipeline. Los middlewares
     * corren después del evento `beforeLog` y se ejecutan en cascada vía `next()`.
     *
     * Cada middleware recibe `(entry, next)` y debe llamar a `next()` para
     * ceder el control al siguiente. Si NO llama a `next()`, corta la cadena
     * (patrón short-circuit).
     *
     * Ordenamiento: `priority` descendente (mayor = primero), igual que los
     * hooks. La secuencia respetada es la del sort, no la del orden de
     * llamada a `use`.
     *
     * @param middleware - Función `(entry, next) => Promise<void>`.
     * @param priority - Peso de ordenamiento. Default `50`.
     * @returns {() => void} Función de cancelación para retirar el middleware.
     *
     * @example
     * ```ts
     * // PII redaction: enmascara passwords antes de loguear
     * hooks.use(async (entry, next) => {
     *   if (entry.attributes?.password) {
     *     entry.attributes.password = '***';
     *   }
     *   await next();
     * }, 90);
     *
     * // Short-circuit: si es level=debug y env=prod, no baja
     * const stop = hooks.use(async (entry, next) => {
     *   if (entry.level === 'debug' && ENV === 'production') return;
     *   await next();
     * }, 100);
     * ```
     *
     * @see {@link process} para el orquestador que ejecuta la cadena.
     */
    use(middleware: MiddlewareFn, priority: number = 50): () => void {
        const registration: MiddlewareRegistration = {
            id: generateId(),
            fn: middleware,
            priority
        };

        this.middlewares.push(registration);
        this.middlewares.sort((a, b) => b.priority - a.priority);

        return () => {
            const index = this.middlewares.findIndex(m => m.id === registration.id);
            if (index >= 0) {
                this.middlewares.splice(index, 1);
            }
        };
    }

    /**
     * Emite un evento a todos sus hooks registrados, en orden de prioridad, y
     * retorna el entry resultante tras aplicar todos los mutations.
     *
     * Cada hook puede retornar un partial de {@link HookLogEntry}; ese partial
     * se mergea sobre el entry actual antes de invocar al siguiente hook, así
     * los hooks se encadenan como una pipeline de transformaciones.
     *
     * Manejo de errores:
     * - Si un hook de `beforeLog`/`afterLog` lanza, la excepción se captura y
     *   se re-emite como evento `onError` con el campo `error` poblado.
     * - Si un hook de `onError` lanza, **NO** se re-emite (rompería el ciclo);
     *   se loguea a `console.error` y se traga.
     * - Guard de reentrancia: si `onError` se re-entra más de
     *   {@link MAX_ONERROR_DEPTH} veces, se corta y se loguea el entry al
     *   console. Previene loops infinitos por errores en cascada.
     *
     * Los hooks marcados como `once` se eliminan tras un disparo exitoso.
     *
     * @param event - Evento a emitir.
     * @param entry - Entry inicial; no se muta in-place (se clona por nivel).
     * @returns {Promise<HookLogEntry>} Entry transformado tras todos los hooks.
     *
     * @example
     * ```ts
     * const enriched = await hooks.emit('beforeLog', rawEntry);
     * // enriched.attributes puede traer merges de varios hooks
     * ```
     *
     * @see {@link on}
     * @see {@link once}
     * @see {@link MAX_ONERROR_DEPTH}
     */
    async emit(event: HookEvent, entry: HookLogEntry): Promise<HookLogEntry> {
        // Guard de reentrancia. Sin esto, un hook de onError que lance
        // re-entraría a emit('onError', ...) y loopearía para siempre o
        // recursaría hasta hacer volar el stack. Permitimos un burst pequeño
        // (MAX_ONERROR_DEPTH) para que el fan-out legítimo siga funcionando,
        // pero cortamos el ciclo.
        const depth = (this._onErrorDepth.get(entry.hookEvent ?? event) ?? 0);
        if (event === 'onError' && depth >= MAX_ONERROR_DEPTH) {
            // eslint-disable-next-line no-console
            console.error('HookManager: onError recursion limit reached, dropping entry:', entry);
            return entry;
        }
        this._onErrorDepth.set(event, depth + 1);

        try {
            const hooks = this.hooks.get(event) || [];
            let currentEntry = { ...entry };
            const toRemove: string[] = [];

            for (const hook of hooks) {
                try {
                    const result = await hook.callback(currentEntry);
                    if (result) {
                        currentEntry = { ...currentEntry, ...result };
                    }
                    if (hook.once) {
                        toRemove.push(hook.id);
                    }
                } catch (error) {
                    if (event !== 'onError') {
                        await this.emit('onError', {
                            ...currentEntry,
                            error: error instanceof Error ? error : new Error(String(error)),
                            hookEvent: event
                        });
                    } else {
                        // Un hook de onError lanzó — se loguea al console (single shot)
                        // sin emitir otro onError (lo que recursaría).
                        // eslint-disable-next-line no-console
                        console.error('HookManager: onError hook threw, swallowed to break recursion:', error);
                    }
                }
            }

            toRemove.forEach(id => this.removeHook(event, id));
            return currentEntry;
        } finally {
            this._onErrorDepth.set(event, depth);
        }
    }

    /**
     * Orquesta el pipeline pre-emit de un log. Orden de ejecución:
     *
     * 1. Emite `beforeLog` (todos sus hooks corren en orden de prioridad y
     *    pueden mutar el entry vía return partial).
     * 2. Si hay middlewares registrados ({@link use}), los ejecuta en cascada
     *    sobre el entry ya enriquecido por los hooks de `beforeLog`.
     *
     * Es el punto de entrada que el logger invoca **antes** de despachar el
     * record a los transports. El entry devuelto es el que finalmente se loguea.
     *
     * No emite `afterLog`; para eso usar {@link afterProcess} una vez que el
     * dispatch al transport haya terminado.
     *
     * @param entry - Entry crudo entrante al pipeline.
     * @returns {Promise<HookLogEntry>} Entry final listo para mandar a transports.
     *
     * @example
     * ```ts
     * const processed = await hooks.process(rawEntry);
     * await transport.write(processed);
     * await hooks.afterProcess(processed);
     * ```
     *
     * @see {@link afterProcess}
     * @see {@link use}
     */
    async process(entry: HookLogEntry): Promise<HookLogEntry> {
        let currentEntry = { ...entry };

        currentEntry = await this.emit('beforeLog', currentEntry);

        if (this.middlewares.length > 0) {
            let index = 0;

            const executeNext = async (): Promise<void> => {
                if (index < this.middlewares.length) {
                    const middleware = this.middlewares[index++];
                    if (middleware) {
                        await middleware.fn(currentEntry, executeNext);
                    }
                }
            };

            await executeNext();
        }

        return currentEntry;
    }

    /**
     * Emite el evento `afterLog` con el entry ya procesado y dispatcheado a
     * los transports. Pensado para side-effects post-log: métricas, audit
     * trail, flush de buffers externos, etc.
     *
     * Los hooks de `afterLog` pueden retornar un partial pero el entry ya se
     * ha publicado, así que la mutación no tiene efecto sobre el log emitido;
     * solo queda disponible en el return de {@link emit}, que aquí se descarta.
     *
     * @param entry - Entry final (mismo objeto devuelto por {@link process}).
     * @returns {Promise<void>} Resuelve cuando todos los hooks terminaron.
     *
     * @example
     * ```ts
     * hooks.on('afterLog', async (entry) => {
     *   metrics.increment('logs_total', { level: entry.level });
     * });
     *
     * const processed = await hooks.process(rawEntry);
     * await transport.write(processed);
     * await hooks.afterProcess(processed); // dispara métricas
     * ```
     *
     * @see {@link process}
     */
    async afterProcess(entry: HookLogEntry): Promise<void> {
        await this.emit('afterLog', entry);
    }

    /**
     * Vacía todos los hooks y middlewares registrados. Útil para resetear el
     * estado entre tests o en hot-reload.
     *
     * Afecta a los tres eventos (`beforeLog`, `afterLog`, `onError`) y a la
     * pila de middlewares. Las funciones de cancelación devueltas por
     * {@link on}/{@link once}/{@link use} se vuelven no-ops pero pueden
     * llamarse sin error.
     *
     * @example
     * ```ts
     * afterEach(() => hooks.clear());
     * ```
     */
    clear(): void {
        this.hooks.forEach(hooks => hooks.length = 0);
        this.middlewares.length = 0;
    }

    /**
     * Snapshot del estado interno para observabilidad y debugging.
     *
     * @returns {Object} stats
     * @returns {Record<HookEvent, number>} stats.hooks - Conteo de hooks
     *   registrados por evento (`beforeLog`, `afterLog`, `onError`).
     * @returns {number} stats.middlewares - Total de middlewares activos.
     *
     * @example
     * ```ts
     * const stats = hooks.getStats();
     * // { hooks: { beforeLog: 2, afterLog: 1, onError: 3 }, middlewares: 1 }
     * if (stats.hooks.onError === 0) {
     *   console.warn('Sin handlers onError registrados');
     * }
     * ```
     */
    getStats(): { hooks: Record<HookEvent, number>; middlewares: number } {
        return {
            hooks: {
                beforeLog: this.hooks.get('beforeLog')?.length || 0,
                afterLog: this.hooks.get('afterLog')?.length || 0,
                onError: this.hooks.get('onError')?.length || 0
            },
            middlewares: this.middlewares.length
        };
    }
}

let _defaultHookManager: HookManager | null = null;

/**
 * Devuelve la instancia singleton de {@link HookManager} compartida por todo
 * el proceso. La crea perezosamente en la primera llamada.
 *
 * Pensada como hook manager por defecto del logger; los consumidores que
 * necesiten aislamiento (tests, múltiples loggers con pipelines distintos)
 * deben instanciar su propio `new HookManager()` en lugar de usar este shared.
 *
 * @returns {HookManager} La instancia singleton.
 *
 * @example
 * ```ts
 * import { getDefaultHookManager } from '@mks2508/better-logger/hooks';
 *
 * getDefaultHookManager().on('onError', async (entry) => {
 *   telemetry.capture(entry.error);
 * });
 * ```
 *
 * @see {@link HookManager}
 */
export function getDefaultHookManager(): HookManager {
    if (!_defaultHookManager) {
        _defaultHookManager = new HookManager();
    }
    return _defaultHookManager;
}
