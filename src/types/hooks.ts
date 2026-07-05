import type { LogLevel, StackInfo } from './core.js';

/**
 * Payload que recibe cada callback de hook. Los hooks pueden devolver un
 * partial de este objeto para sobreescribir campos individuales; el manager
 * mergea el resultado de vuelta a la cadena del entry.
 */
export interface HookLogEntry {
    level: LogLevel;
    message: string;
    args: unknown[];
    timestamp: string;
    prefix?: string;
    stackInfo?: StackInfo;
    correlationId?: string;
    context?: Record<string, unknown>;
    /**
     * Evento de hook de origen cuando se emite desde un path de fallo interno
     * (p.ej. error de flush en transport → dispara `onError` con `hookEvent: 'beforeLog'`).
     */
    hookEvent?: HookEvent;
    /** Excepción capturada, si el hook se disparó por un error lanzado. */
    error?: Error;
    /**
     * Payload estructurado específico del hook. Lo usan los transports para
     * exponer records dropeados, response codes, retry counts, etc.
     */
    extra?: Record<string, unknown>;
}

/**
 * Eventos de hook que el {@link IHookManager} despacha en el pipeline de log.
 *
 * - `'beforeLog'` — antes de despachar el log a transports/handlers. El
 *   callback puede mutar o reemplazar campos del {@link HookLogEntry} y el
 *   resultado se propaga a los siguientes hooks y al log final.
 * - `'afterLog'` — después de que el log se ha escrito. Solo efectivo para
 *   side-effects (métricas, telemetría); mutar el entry aquí no cambia el
 *   output ya emitido.
 * - `'onError'` — cuando un transport o un hook lanza, o cuando un batch
 *   agota reintentos. El callback recibe `entry.error` (la excepción) y
 *   `entry.extra` (payload estructurado: dropped, status, retryCount, ...).
 */
export type HookEvent = 'beforeLog' | 'afterLog' | 'onError';

/**
 * Firma del callback de hook. Los hooks async se awaitan en orden de prioridad;
 * devolver un partial object sobreescribe los campos del entry para los hooks
 * siguientes y para la llamada final al log.
 */
export type HookCallback = (entry: HookLogEntry) => void | Partial<HookLogEntry> | Promise<void | Partial<HookLogEntry>>;

/**
 * Middleware estilo Koa para el pipeline de hooks.
 *
 * Recibe el {@link HookLogEntry} y una función `next()` que invoca al
 * siguiente middleware en la cadena de prioridad. Si el middleware NO llama
 * `next()`, corta la cadena y el log se descarta (útil para filtrado
 * avanzado, sampling o redacción que decide no emitir).
 *
 * Se registra vía {@link IHookManager.use} y corre antes que cualquier
 * callback de evento {@link HookEvent}, lo que lo hace ideal para
 * cross-cutting concerns: correlación de trazas, redacción de PII,
 * enriquecimiento con atributos globales, etc.
 *
 * @example
 * // Descarta logs marcados como privados
 * const privacyFilter: MiddlewareFn = (entry, next) => {
 *   if (entry.context?.private === true) return; // no llama next() → se descarta
 *   return next();
 * };
 */
export type MiddlewareFn = (
    entry: HookLogEntry,
    next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Registro interno de un callback de hook suscrito a un {@link HookEvent}.
 *
 * El manager construye este record al registrar un callback vía `on()` /
 * `once()`; los usuarios normalmente no instancian este tipo directamente.
 * Útil para inspección del estado del manager en tests y depuración.
 *
 * @property id - Identificador único asignado por el manager (usado por el unsubscribe handle).
 * @property event - Evento al que está suscrito el callback.
 * @property callback - Función invocada cuando se emite el evento.
 * @property priority - Orden de ejecución (mayor = antes). Empates respetan orden de registro.
 * @property once - Si `true`, el manager lo des-registra tras la primera invocación.
 */
export interface HookRegistration {
    id: string;
    event: HookEvent;
    callback: HookCallback;
    priority: number;
    once: boolean;
}

/**
 * Registro interno de un middleware en la cadena del manager. Análogo a
 * {@link HookRegistration} pero para la capa de {@link MiddlewareFn}, que
 * corre antes que los callbacks de evento.
 *
 * @property id - Identificador único asignado por el manager.
 * @property fn - Middleware registrado vía `use()`.
 * @property priority - Orden dentro de la cadena (mayor = más al inicio).
 */
export interface MiddlewareRegistration {
    id: string;
    fn: MiddlewareFn;
    priority: number;
}

/**
 * Contrato del manager de hooks.
 *
 * Orquesta el pipeline de middleware + eventos que envuelve cada llamada a
 * `log()`. Permite suscribirse a puntos del ciclo de vida del log
 * (`beforeLog`, `afterLog`, `onError`), transformar el {@link HookLogEntry}
 * en vuelo, y registrar middleware estilo Koa para cross-cutting concerns
 * (sampling, redacción de PII, enriquecimiento con correlación).
 *
 * Los métodos `on` / `once` / `use` devuelven una función de unsubscribe
 * (patrón `Disposable`) para limpieza explícita — llamarla remueve el
 * registro sin necesidad de pasar el callback original.
 *
 * @example
 * const hooks: IHookManager = createManager();
 * // Redacta campos sensibles antes de loguear
 * hooks.on('beforeLog', (entry) => {
 *   if (entry.context?.password) {
 *     return { context: { ...entry.context, password: '***' } };
 *   }
 * });
 * // Métricas de error de transport
 * hooks.on('onError', async (entry) => {
 *   metrics.increment('log.transport.error');
 * });
 */
export interface IHookManager {
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void;
    off(event: HookEvent, callback: HookCallback): boolean;
    use(middleware: MiddlewareFn, priority?: number): () => void;
    emit(event: HookEvent, entry: HookLogEntry): Promise<HookLogEntry>;
    process(entry: HookLogEntry): Promise<HookLogEntry>;
}
