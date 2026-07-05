import { Logger } from './Logger.js';
import type { TimerEntry, Bindings, ISpinnerHandle, IBoxOptions, ITableOptions, CLILogLevel } from './types/index.js';

/**
 * Logger prefijado por un scope nominal. Mantiene su propio stack de badges
 * y contextos y delega el envío de mensajes al {@link Logger} padre a través
 * de bindings (`{ scope, badges }`).
 *
 * Es la base de la jerarquía temática: {@link APILogger} y
 * {@link ComponentLogger} extienden de ella, y {@link ContextLogger} la
 * consume para apilar/subdesapilar sub-prefijos en el scope.
 *
 * No se construye directamente: se obtiene con `logger.scope('name')`.
 *
 * @example
 * // El factory method del Logger raíz devuelve un ScopedLogger
 * import logger from '@mks2508/better-logger';
 *
 * const http = logger.scope('HTTP');
 * http.badge('OUTBOUND').info('Request enviada');
 * // salida: [HTTP] [OUTBOUND] Request enviada
 *
 * @example
 * // Anidar contextos dentro de un scope (el prefijo se compone con ':')
 * const retry = http.context('retry');
 * retry.run(() => http.warn('Reintentando petición'));
 * // salida: [HTTP:retry] Reintentando petición
 *
 * @see {@link Logger.scope}
 * @see {@link APILogger}
 * @see {@link ComponentLogger}
 * @see {@link ContextLogger}
 */
export class ScopedLogger {
    private readonly parent: Logger;
    private readonly scopeName: string;
    private badgeList: string[] = [];
    private contextStack: string[] = [];
    private _timers?: Map<string, TimerEntry>;

    /**
     * Construye un ScopedLogger vinculado a un {@link Logger} padre.
     *
     * Los clientes no deben llamar a este constructor directamente: usen
     * `logger.scope(name)`, que configura correctamente la instancia.
     *
     * @param {Logger} parent - Logger raíz al que se delegan los mensajes.
     * @param {string} scopeName - Etiqueta del scope; se renderiza como
     *   prefijo `[scopeName]` en cada línea.
     */
    constructor(parent: Logger, scopeName: string) {
        this.parent = parent;
        this.scopeName = scopeName;
    }

    private get timers(): Map<string, TimerEntry> {
        if (!this._timers) this._timers = new Map();
        return this._timers;
    }

    private getBindings(): Bindings {
        return {
            scope: this.getScopePrefix(),
            badges: this.badgeList.length > 0 ? [...this.badgeList] : undefined,
        };
    }

    private getScopePrefix(): string {
        if (this.contextStack.length === 0) return this.scopeName;
        return [this.scopeName, ...this.contextStack].join(':');
    }

    /**
     * Reemplaza la lista actual de badges por la pasada y la aplica a todos
     * los mensajes posteriores de este scope.
     *
     * @param {string[]} badges - Etiquetas a mostrar como badges adyacentes
     *   al prefijo (p. ej. `['OUTBOUND', 'CACHED']`).
     * @returns {this} La misma instancia, para encadenar llamadas.
     *
     * @example
     * logger.scope('HTTP').badges(['OUTBOUND', 'CACHED']).info('Cache hit');
     * // salida: [HTTP] [OUTBOUND] [CACHED] Cache hit
     *
     * @see {@link badge} para añadir sin reemplazar los existentes.
     * @see {@link clearBadges} para vaciar la lista.
     */
    badges(badges: string[]): this {
        this.badgeList = [...badges];
        return this;
    }

    /**
     * Añade un badge al scope de forma idempotente (no lo duplica si ya existe).
     *
     * @param {string} badge - Etiqueta a añadir a la lista de badges.
     * @returns {this} La misma instancia, para encadenar llamadas.
     *
     * @example
     * logger.scope('API')
     *   .badge('OUTBOUND')
     *   .badge('RETRY')
     *   .warn('Reintentando');
     * // salida: [API] [OUTBOUND] [RETRY] Reintentando
     */
    badge(badge: string): this {
        if (!this.badgeList.includes(badge)) {
            this.badgeList.push(badge);
        }
        return this;
    }

    /**
     * Vacía la lista de badges del scope.
     *
     * @returns {this} La misma instancia, para encadenar llamadas.
     *
     * @example
     * const http = logger.scope('HTTP');
     * http.badge('OUTBOUND').info('uno');
     * http.clearBadges().info('dos');
     * // [HTTP] [OUTBOUND] uno   /   [HTTP] dos
     */
    clearBadges(): this {
        this.badgeList = [];
        return this;
    }

    /**
     * Aplica un theme preset al logger padre. El preset afecta a toda la
     * instancia raíz (no solo a este scope) porque el style es compartido.
     *
     * @param {string} presetName - Nombre del preset registrado en el StyleManager.
     * @returns {this} La misma instancia, para encadenar llamadas.
     *
     * @example
     * logger.scope('UI').style('cyberpunk').info('neon');
     * @see {@link Logger.setTheme}
     */
    style(presetName: string): this {
        this.parent.setTheme(presetName as any);
        return this;
    }

    /**
     * Crea un {@link ContextLogger} vinculado a este scope. Los contextos se
     * apilan en el prefijo separados por `:`, permitiendo agrupar bloques de
     * logs relacionados (reintentos, sub-etapas, etc.) sin `console.group`.
     *
     * @param {string} contextName - Nombre del contexto a apilar.
     * @returns {ContextLogger} Handler con `run`, `runAsync`, `start`/`end`.
     *
     * @example
     * const retry = logger.scope('HTTP').context('retry');
     * retry.run(() => logger.warn('Reintentando'));
     * // salida: [HTTP:retry] Reintentando
     * @see {@link ContextLogger}
     */
    context(contextName: string): ContextLogger {
        return new ContextLogger(this, contextName);
    }

    /**
     * Inicia un timer etiquetado bajo el namespace `<scopeName>:<label>`.
     * El label es local a este scope, así que dos scopes pueden reutilizar el
     * mismo nombre sin colisión.
     *
     * @param {string} label - Identificador del timer.
     *
     * @example
     * const http = logger.scope('HTTP');
     * http.time('request');
     * // ... trabajo ...
     * http.timeEnd('request'); // imprime "Timer: request - 12.34ms"
     * @see {@link timeEnd}
     */
    time(label: string): void {
        this.timers.set(label, {
            label: `${this.scopeName}:${label}`,
            startTime: performance.now(),
        });
    }

    /**
     * Detiene un timer previamente iniciado con {@link time} y registra la
     * duración con nivel `success`. Si el label no existe, emite un `warn`
     * y devuelve `undefined`.
     *
     * @param {string} label - Mismo label pasado a {@link time}.
     * @returns {number | undefined} Milisegundos transcurridos, o `undefined`
     *   si el timer no estaba registrado.
     *
     * @example
     * const http = logger.scope('HTTP');
     * http.time('fetch');
     * await fetch(url);
     * const ms = http.timeEnd('fetch');
     * if (ms && ms > 1000) http.warn('Latencia alta');
     */
    timeEnd(label: string): number | undefined {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' not found`);
            return undefined;
        }
        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);
        this.success(`Timer: ${label} - ${elapsed.toFixed(2)}ms`);
        return elapsed;
    }

    /**
     * Emite un mensaje a nivel `debug` con los bindings actuales del scope.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales (objetos,
     *   errores, etc.) serializados igual que en el logger raíz.
     *
     * @example
     * logger.scope('DB').debug('query', { sql, params });
     */
    debug(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'debug', ...args);
    }

    /**
     * Emite un mensaje a nivel `info` con los bindings actuales del scope.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     *
     * @example
     * logger.scope('AUTH').info('Login exitoso', { userId });
     */
    info(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'info', ...args);
    }

    /**
     * Emite un mensaje a nivel `warn` con los bindings actuales del scope.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     *
     * @example
     * logger.scope('CACHE').warn('Cache miss', { key });
     */
    warn(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'warn', ...args);
    }

    /**
     * Emite un mensaje a nivel `error` con los bindings actuales del scope.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales (típicamente
     *   un `Error` o contexto del fallo).
     *
     * @example
     * logger.scope('DB').error('Conexión rechazada', err);
     */
    error(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'error', ...args);
    }

    /**
     * Emite un mensaje con badge visual `SUCCESS` a nivel `info`. Úselo para
     * hitos positivos dentro del scope (conexión establecida, sync completo,
     * commit aplicado).
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     *
     * @example
     * logger.scope('SYNC').success('Sincronización completa', { count: 42 });
     */
    success(...args: unknown[]): void {
        const bindings = this.getBindings();
        this.parent.logWithBindingsAndTag(bindings, 'info', 'success', ...args);
    }

    /**
     * Emite un mensaje a nivel `critical` con los bindings actuales del scope.
     * Reservado para fallos que detienen el flujo de la aplicación.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     *
     * @example
     * logger.scope('PAY').critical('Pasarela inaccesible', err);
     */
    critical(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'critical', ...args);
    }

    /**
     * Emite un mensaje a nivel `trace` (verbosidad máxima) con los bindings
     * actuales del scope. Solo aparece si la verbosity global lo permite.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     *
     * @example
     * logger.scope('NET').trace('packet', { bytes });
     */
    trace(...args: unknown[]): void {
        this.parent.logWithBindings(this.getBindings(), 'trace', ...args);
    }

    // ===== CLI PRIMITIVES (delegation to Logger) =====

    /**
     * Delegación a {@link Logger.step}: dibuja una barra de progreso discreta
     * `current/total` para este scope.
     *
     * @param {number} current - Paso actual (1-indexed).
     * @param {number} total - Total de pasos.
     * @param {string} message - Texto mostrado junto al contador.
     * @see {@link Logger.step}
     */
    step(current: number, total: number, message: string): void {
        this.parent.step(current, total, message);
    }

    /**
     * Delegación a {@link Logger.header}: imprime un título con separadores visuales.
     *
     * @param {string} title - Texto del título.
     * @param {string} [subtitle] - Subtítulo opcional bajo el título.
     * @see {@link Logger.header}
     */
    header(title: string, subtitle?: string): void {
        this.parent.header(title, subtitle);
    }

    /**
     * Delegación a {@link Logger.divider}: imprime una línea separadora horizontal.
     * @see {@link Logger.divider}
     */
    divider(): void {
        this.parent.divider();
    }

    /**
     * Delegación a {@link Logger.blank}: inserta una línea en blanco.
     * @see {@link Logger.blank}
     */
    blank(): void {
        this.parent.blank();
    }

    /**
     * Delegación a {@link Logger.box}: dibuja un recuadro ANSI alrededor de `content`.
     *
     * @param {string} content - Texto a enmarcar.
     * @param {IBoxOptions} [options] - Opciones de estilo del box.
     * @see {@link Logger.box}
     */
    box(content: string, options?: IBoxOptions): void {
        this.parent.box(content, options);
    }

    /**
     * Delegación a {@link Logger.cliTable}: renderiza `rows` como tabla ASCII.
     *
     * @param {Record<string, unknown>[]} rows - Filas a mostrar.
     * @param {ITableOptions} [options] - Opciones de columnas y estilo.
     * @see {@link Logger.cliTable}
     */
    cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void {
        this.parent.cliTable(rows, options);
    }

    /**
     * Delegación a {@link Logger.spinner}: arranca un spinner con `message`.
     *
     * @param {string} message - Texto a mostrar al lado del spinner.
     * @returns {ISpinnerHandle} Handle para detener/actualizar el spinner.
     * @see {@link Logger.spinner}
     */
    spinner(message: string): ISpinnerHandle {
        return this.parent.spinner(message);
    }

    /**
     * Delegación a {@link Logger.setCLILevel}: ajusta el nivel mínimo de las
     * primitivas CLI visibles.
     *
     * @param {CLILogLevel} level - Nivel CLI (`silent` … `verbose`).
     * @see {@link Logger.setCLILevel}
     */
    setCLILevel(level: CLILogLevel): void {
        this.parent.setCLILevel(level);
    }

    /**
     * Apila un contexto en el prefijo del scope. Invocado por
     * {@link ContextLogger}; los clientes no deben llamarlo directamente.
     *
     * @param {string} context - Nombre del contexto a apilar.
     * @internal
     */
    _pushContext(context: string): void {
        this.contextStack.push(context);
    }

    /**
     * Desapila el último contexto del prefijo del scope. Invocado por
     * {@link ContextLogger}; los clientes no deben llamarlo directamente.
     *
     * @internal
     */
    _popContext(): void {
        this.contextStack.pop();
    }
}

/**
 * Logger especializado para llamadas a APIs y servicios externos.
 *
 * Extiende {@link ScopedLogger} pre-seteando el badge `API` y exponiendo
 * atajos para eventos típicos de integración: llamadas lentas ({@link slow}),
 * rate limiting ({@link rateLimit}), fallos de autenticación ({@link auth}) y
 * APIs deprecadas ({@link deprecated}).
 *
 * Se obtiene con `logger.api(name)` y no se construye directamente.
 *
 * @example
 * import logger from '@mks2508/better-logger';
 *
 * const stripe = logger.api('Stripe');
 * stripe.info('Consultando customer', { id });
 * // salida: [API:Stripe] [API] Consultando customer
 *
 * stripe.slow('customer.retrieve', 1250);
 * // salida: [API:Stripe] [API] [SLOW] customer.retrieve (1250ms)
 *
 * @see {@link Logger.api}
 * @see {@link ScopedLogger}
 */
export class APILogger extends ScopedLogger {
    /**
     * Construye un APILogger con scope `API:<apiName>` y badge `API` ya aplicado.
     *
     * Los clientes deben usar `logger.api(name)`.
     *
     * @param {Logger} parent - Logger raíz al que se delegan los mensajes.
     * @param {string} apiName - Nombre del servicio/API (se prefija con `API:`).
     */
    constructor(parent: Logger, apiName: string) {
        super(parent, `API:${apiName}`);
        this.badge('API');
    }

    /**
     * Registra una llamada lenta con badge `SLOW` a nivel `warn`.
     *
     * @param {string} message - Descripción de la operación lenta.
     * @param {number} [duration] - Duración medida en ms; si se pasa, se
     *   anexa al mensaje como `(Nms)`.
     *
     * @example
     * const t0 = performance.now();
     * await stripe.customers.retrieve(id);
     * logger.api('Stripe').slow('retrieve', performance.now() - t0);
     */
    slow(message: string, duration?: number): void {
        this.badge('SLOW');
        const msg = duration ? `${message} (${duration}ms)` : message;
        this.warn(msg);
    }

    /**
     * Registra un evento de rate limiting (HTTP 429) con badge `RATE_LIMIT`.
     *
     * @param {string} message - Detalle del límite golpeado.
     *
     * @example
     * logger.api('GitHub').rateLimit('Secondary rate limit on /search');
     */
    rateLimit(message: string): void {
        this.badge('RATE_LIMIT');
        this.warn(message);
    }

    /**
     * Registra un fallo de autenticación (401/403) con badge `AUTH` a nivel
     * `error`.
     *
     * @param {string} message - Detalle del fallo de credenciales/token.
     *
     * @example
     * logger.api('OAuth').auth('Token expirado');
     */
    auth(message: string): void {
        this.badge('AUTH');
        this.error(message);
    }

    /**
     * Marca una API como deprecada con badge `DEPRECATED` a nivel `warn`.
     *
     * @param {string} message - Mensaje guiando a la migración (endpoint
     *   alternativo, versión retirada, etc.).
     *
     * @example
     * logger.api('Legacy').deprecated('Usar v3; v2 se retira en Q4');
     */
    deprecated(message: string): void {
        this.badge('DEPRECATED');
        this.warn(message);
    }
}

/**
 * Logger para componentes UI, módulos o cualquier unidad con ciclo de vida.
 *
 * Extiende {@link ScopedLogger} pre-seteando el badge `COMPONENT` y exponiendo
 * atajos para eventos típicos: {@link lifecycle}, {@link stateChange} y
 * {@link propsChange}.
 *
 * Se obtiene con `logger.component(name)` y no se construye directamente.
 *
 * @example
 * import logger from '@mks2508/better-logger';
 *
 * const cart = logger.component('Cart');
 * cart.lifecycle('mount');
 * // salida: [Cart] [COMPONENT] [LIFECYCLE] mount
 *
 * cart.stateChange('empty', 'has-items', { count: 3 });
 * // salida: [Cart] [COMPONENT] [STATE] empty → has-items { count: 3 }
 *
 * @see {@link Logger.component}
 * @see {@link ScopedLogger}
 */
export class ComponentLogger extends ScopedLogger {
    /**
     * Construye un ComponentLogger con badge `COMPONENT` ya aplicado.
     *
     * Los clientes deben usar `logger.component(name)`.
     *
     * @param {Logger} parent - Logger raíz al que se delegan los mensajes.
     * @param {string} componentName - Nombre del componente (scope label).
     */
    constructor(parent: Logger, componentName: string) {
        super(parent, componentName);
        this.badge('COMPONENT');
    }

    /**
     * Registra un evento de ciclo de vida con badge `LIFECYCLE` a nivel `info`.
     *
     * @param {string} event - Nombre del evento (`mount`, `unmount`,
     *   `update`, ...).
     * @param {string} [message] - Detalle opcional; si se omite, solo se
     *   registra el nombre del evento.
     *
     * @example
     * logger.component('Cart').lifecycle('mount', 'Modal abierto');
     */
    lifecycle(event: string, message?: string): void {
        this.badge('LIFECYCLE');
        const msg = message ? `${event}: ${message}` : event;
        this.info(msg);
    }

    /**
     * Registra una transición de estado con badge `STATE` a nivel `info`.
     *
     * @param {string} from - Estado previo.
     * @param {string} to - Estado nuevo.
     * @param {unknown} [data] - Payload opcional asociado a la transición.
     *
     * @example
     * const fsm = logger.component('FSM');
     * fsm.stateChange('idle', 'loading');
     * fsm.stateChange('loading', 'success', { items: 3 });
     */
    stateChange(from: string, to: string, data?: unknown): void {
        this.badge('STATE');
        const msg = `${from} → ${to}`;
        if (data) {
            this.info(msg, data);
        } else {
            this.info(msg);
        }
    }

    /**
     * Registra cambios de props/debug del componente con badge `PROPS` a nivel
     * `debug`.
     *
     * @param {Record<string, unknown>} changes - Mapa prop → valor (típicamente
     *   el diff de props entre renders).
     *
     * @example
     * logger.component('Cart').propsChange({ itemCount: 5, currency: 'EUR' });
     */
    propsChange(changes: Record<string, unknown>): void {
        this.badge('PROPS');
        this.debug('Props changed:', changes);
    }
}

/**
 * Handler de contexto apilable sobre un {@link ScopedLogger}.
 *
 * Permite agrupar bloques de logs bajo un sub-prefijo separado por `:`,
 * manteniendo la correlación visual sin necesidad de `console.group`. El
 * prefijo compuesto se forma como `<scopeName>:<contextName>`.
 *
 * Se crea con `scopedLogger.context(name)`. El patrón idiomático es
 * {@link run}/{@link runAsync} (auto push/pop con try/finally); {@link start}
 * y {@link end} permiten control manual cuando el bloque no cierra
 * léxicamente (event handlers distribuidos, promesas de larga duración).
 *
 * @example
 * import logger from '@mks2508/better-logger';
 *
 * const http = logger.scope('HTTP');
 *
 * // Bloque síncrono auto-cerrado
 * http.context('retry').run(() => {
 *   http.warn('Reintentando petición');
 * });
 * // salida: [HTTP:retry] Reintentando petición
 *
 * // Bloque async auto-cerrado
 * await http.context('refresh').runAsync(async () => {
 *   await refreshToken();
 *   http.info('Token refrescado');
 * });
 *
 * @see {@link ScopedLogger.context}
 */
export class ContextLogger {
    private parentLogger: ScopedLogger;
    private contextName: string;

    /**
     * @param {ScopedLogger} parentLogger - Scope sobre el que se apila el contexto.
     * @param {string} contextName - Sub-prefijo a apilar en el scope padre.
     */
    constructor(parentLogger: ScopedLogger, contextName: string) {
        this.parentLogger = parentLogger;
        this.contextName = contextName;
    }

    /**
     * Ejecuta `fn` síncrona dentro del contexto, garantizando el pop del
     * prefijo incluso si `fn` lanza. El contexto solo está activo durante la
     * ejecución de `fn`.
     *
     * @typeParam T - Tipo de retorno de `fn`.
     * @param {() => T} fn - Función a ejecutar bajo el contexto.
     * @returns {T} Lo que devuelva `fn`.
     * @throws {unknown} Relanza cualquier excepción de `fn` tras desapilar.
     *
     * @example
     * logger.scope('HTTP').context('warmup').run(() => {
     *   logger.info('Pre-cargando caché');
     * });
     */
    run<T>(fn: () => T): T {
        this.parentLogger._pushContext(this.contextName);
        try {
            return fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    /**
     * Variante async de {@link run}: mantiene el contexto activo mientras se
     * awaiting la promesa de `fn`, incluyendo awaits internos.
     *
     * @typeParam T - Tipo resuelto por la promesa de `fn`.
     * @param {() => Promise<T>} fn - Función async a ejecutar bajo el contexto.
     * @returns {Promise<T>} Promesa que resuelve al valor de `fn`.
     * @throws {unknown} Relanza cualquier rechazo de `fn` tras desapilar.
     *
     * @example
     * await logger.scope('HTTP').context('fetch').runAsync(async () => {
     *   const r = await fetch(url);
     *   logger.info('Recibido', { status: r.status });
     * });
     */
    async runAsync<T>(fn: () => Promise<T>): Promise<T> {
        this.parentLogger._pushContext(this.contextName);
        try {
            return await fn();
        } finally {
            this.parentLogger._popContext();
        }
    }

    /**
     * Apila el contexto manualmente. Útil cuando el bloque que lo consume no
     * cierra léxicamente (event handlers, timeouts, streams). Debe emparejarse
     * con un {@link end} posterior; olvidarlo deja el prefijo contaminado para
     * los logs siguientes del scope.
     *
     * @example
     * const ctx = logger.scope('WS').context('subscribe');
     * socket.onopen  = () => { ctx.start(); ctx.info('connected'); };
     * socket.onclose = () => { ctx.info('disconnected'); ctx.end(); };
     * @see {@link end}
     */
    start(): void {
        this.parentLogger._pushContext(this.contextName);
    }

    /**
     * Desapila el último contexto abierto con {@link start}.
     *
     * @see {@link start}
     */
    end(): void {
        this.parentLogger._popContext();
    }

    /**
     * Atajo a `scopedLogger.debug(...)`. El contexto se aplica al prefijo del
     * scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    debug(...args: unknown[]): void { this.parentLogger.debug(...args); }

    /**
     * Atajo a `scopedLogger.info(...)`. El contexto se aplica al prefijo del
     * scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    info(...args: unknown[]): void { this.parentLogger.info(...args); }

    /**
     * Atajo a `scopedLogger.warn(...)`. El contexto se aplica al prefijo del
     * scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    warn(...args: unknown[]): void { this.parentLogger.warn(...args); }

    /**
     * Atajo a `scopedLogger.error(...)`. El contexto se aplica al prefijo del
     * scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    error(...args: unknown[]): void { this.parentLogger.error(...args); }

    /**
     * Atajo a `scopedLogger.success(...)`. El contexto se aplica al prefijo del
     * scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    success(...args: unknown[]): void { this.parentLogger.success(...args); }

    /**
     * Atajo a `scopedLogger.critical(...)`. El contexto se aplica al prefijo
     * del scope padre solo si se invoca dentro de un bloque {@link run}/{@link start}.
     *
     * @param {...unknown[]} args - Mensaje y argumentos adicionales.
     */
    critical(...args: unknown[]): void { this.parentLogger.critical(...args); }
}
