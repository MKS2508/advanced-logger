/**
 * @fileoverview ScopedLogger con badges y logging contextual
 * @version 0.3.0
 * @since 2024
 * 
 * Proporciona loggers especializados con contexto, badges automáticos
 * y características avanzadas para componentes y APIs.
 */

import { Logger } from './Logger.js';
import type { LoggerConfig, LogLevel, Verbosity, BannerType, StyleOptions, ILogHandler } from './types/index.js';

/**
 * Logger con scope mejorado con badges y API simplificada
 * 
 * @class ScopedLogger
 * @extends Logger
 * @description Logger contextual que añade prefijos y badges automáticamente
 * 
 * @example
 * const dbLogger = logger.scope('Database');
 * dbLogger.info('Conectando...'); // [Database] Conectando...
 * 
 * // Con badges personalizados
 * dbLogger.badge('SLOW').warn('Query lenta detectada');
 * // [SLOW] [Database] Query lenta detectada
 * 
 * @since 0.3.0
 */
export class ScopedLogger extends Logger {
    private parentLogger: Logger;
    private scopeName: string;
    private badgeList: string[] = [];
    private contextStack: string[] = [];

    constructor(parentLogger: Logger, scopeName: string, config?: Partial<LoggerConfig>) {
        // Initialize with parent's config plus any overrides
        super({ ...parentLogger.getConfig(), ...config });
        this.parentLogger = parentLogger;
        this.scopeName = scopeName;
        
        // Inherit parent's handlers
        const parentHandlers = parentLogger.getHandlers();
        parentHandlers.forEach(handler => this.addHandler(handler));
    }

    /**
     * Añade múltiples badges a este logger con scope
     * 
     * @param {string[]} badges - Array de badges a añadir
     * @returns {ScopedLogger} Esta instancia para encadenamiento
     * 
     * @example
     * const api = logger.scope('API');
     * api.badges(['v2', 'beta', 'cached'])
     *    .info('Respuesta desde caché');
     * // [v2] [beta] [cached] [API] Respuesta desde caché
     * 
     * @since 0.3.0
     */
    badges(badges: string[]): ScopedLogger {
        this.badgeList = [...badges];
        return this;
    }

    /**
     * Añade un badge individual
     * 
     * @param {string} badge - Badge a añadir
     * @returns {ScopedLogger} Esta instancia para encadenamiento
     * 
     * @example
     * dbLogger.badge('SLOW').warn('Query tardó 3s');
     * // [SLOW] [Database] Query tardó 3s
     * 
     * @since 0.3.0
     */
    badge(badge: string): ScopedLogger {
        if (!this.badgeList.includes(badge)) {
            this.badgeList.push(badge);
        }
        return this;
    }

    /**
     * Elimina todos los badges
     * 
     * @returns {ScopedLogger} Esta instancia para encadenamiento
     * 
     * @example
     * api.clearBadges().info('Sin badges');
     * // [API] Sin badges
     * 
     * @since 0.3.0
     */
    clearBadges(): ScopedLogger {
        this.badgeList = [];
        return this;
    }

    /**
     * Establece un preset de estilo para este logger con scope
     * 
     * @param {string} presetName - Nombre del preset a aplicar
     * @returns {ScopedLogger} Esta instancia para encadenamiento
     * 
     * @example
     * const errorLogger = logger.scope('ErrorHandler')
     *   .style('cyberpunk');
     * 
     * @since 0.3.0
     */
    style(presetName: string): ScopedLogger {
        this.setTheme(presetName as any); // Will be updated when we implement presets
        return this;
    }

    /**
     * Crea un contexto temporal que se limpia automáticamente
     * 
     * @param {string} contextName - Nombre del contexto
     * @returns {ContextLogger} Logger con contexto temporal
     * 
     * @example
     * const db = logger.scope('Database');
     * 
     * // Contexto temporal para una operación
     * db.context('Migration').run(() => {
     *   db.info('Iniciando migración');
     *   db.success('Tablas creadas');
     * });
     * // Contexto automáticamente limpiado
     * 
     * @since 0.3.0
     */
    context(contextName: string): ContextLogger {
        return new ContextLogger(this, contextName);
    }

    /**
     * Sobrescribe el logging principal para incluir badges
     * @protected
     * @param {LogLevel} level - Nivel del log
     * @param {...any} args - Argumentos del log
     */
    protected log(level: LogLevel, ...args: any[]): void {
        // Build the enhanced message with badges
        const badges = this.getBadgeString();
        const scopePrefix = this.getScopePrefix();
        
        let enhancedMessage = '';
        if (badges) enhancedMessage += badges + ' ';
        if (scopePrefix) enhancedMessage += `[${scopePrefix}] `;
        
        if (args.length > 0) {
            enhancedMessage += String(args[0]);
            // Replace the first argument with our enhanced message
            args[0] = enhancedMessage;
        }

        // Call parent's log method
        super.log(level, ...args);
    }

    /**
     * Obtiene la cadena de badges formateada
     * @private
     * @returns {string} Badges formateados como [BADGE1][BADGE2]
     */
    private getBadgeString(): string {
        if (this.badgeList.length === 0) return '';
        return this.badgeList.map(badge => `[${badge}]`).join('');
    }

    /**
     * Obtiene el prefijo del scope (incluye stack de contexto)
     * @private
     * @returns {string} Prefijo completo con contextos
     */
    private getScopePrefix(): string {
        const parts = [this.scopeName, ...this.contextStack].filter(Boolean);
        return parts.join(':');
    }

    /**
     * Método interno para añadir contexto
     * @internal
     */
    _pushContext(context: string): void {
        this.contextStack.push(context);
    }

    /**
     * Método interno para eliminar contexto
     * @internal
     */
    _popContext(): void {
        this.contextStack.pop();
    }
}

/**
 * Logger específico para APIs con badges comunes de API
 * 
 * @class APILogger
 * @extends ScopedLogger
 * @description Logger especializado para endpoints y servicios API
 * 
 * @example
 * const api = logger.api('REST');
 * api.info('GET /users');
 * // [API] [REST] GET /users
 * 
 * api.slow('Query lenta', 3500);
 * // [API] [SLOW] [REST] Query lenta (3500ms)
 * 
 * @since 0.3.0
 */
export class APILogger extends ScopedLogger {
    constructor(parentLogger: Logger, apiName: string, config?: Partial<LoggerConfig>) {
        super(parentLogger, `API:${apiName}`, config);
        this.badge('API');
    }

    /**
     * Registra operaciones lentas
     * 
     * @param {string} message - Mensaje sobre la operación lenta
     * @param {number} duration - Duración en milisegundos (opcional)
     * 
     * @example
     * api.slow('Query compleja', 5000);
     * api.slow('Procesamiento pesado');
     * 
     * @since 0.3.0
     */
    slow(message: string, duration?: number): void {
        this.badge('SLOW');
        const msg = duration ? `${message} (${duration}ms)` : message;
        this.warn(msg);
    }

    /**
     * Registra límites de tasa alcanzados
     * 
     * @param {string} message - Mensaje sobre el límite
     * 
     * @example
     * api.rateLimit('Límite excedido: 100 req/min');
     * 
     * @since 0.3.0
     */
    rateLimit(message: string): void {
        this.badge('RATE_LIMIT');
        this.warn(message);
    }

    /**
     * Registra problemas de autenticación
     * 
     * @param {string} message - Mensaje de autenticación
     * 
     * @example
     * api.auth('Token inválido o expirado');
     * api.auth('Credenciales incorrectas');
     * 
     * @since 0.3.0
     */
    auth(message: string): void {
        this.badge('AUTH');
        this.error(message);
    }

    /**
     * Registra advertencias de deprecación
     * 
     * @param {string} message - Mensaje de deprecación
     * 
     * @example
     * api.deprecated('Este endpoint será eliminado en v2.0');
     * api.deprecated('Usar /v2/users en lugar de /users');
     * 
     * @since 0.3.0
     */
    deprecated(message: string): void {
        this.badge('DEPRECATED');
        this.warn(message);
    }
}

/**
 * Logger específico para componentes de UI
 * 
 * @class ComponentLogger
 * @extends ScopedLogger
 * @description Logger especializado para componentes con eventos de ciclo de vida
 * 
 * @example
 * const authForm = logger.component('AuthForm');
 * authForm.lifecycle('mounted');
 * authForm.stateChange('idle', 'loading');
 * 
 * @since 0.3.0
 */
export class ComponentLogger extends ScopedLogger {
    constructor(parentLogger: Logger, componentName: string, config?: Partial<LoggerConfig>) {
        super(parentLogger, componentName, config);
        this.badge('COMPONENT');
    }

    /**
     * Registra eventos del ciclo de vida del componente
     * 
     * @param {string} event - Nombre del evento (mounted, unmounted, updated, etc)
     * @param {string} message - Mensaje adicional (opcional)
     * 
     * @example
     * component.lifecycle('mounted', 'Componente listo');
     * component.lifecycle('beforeDestroy');
     * 
     * @since 0.3.0
     */
    lifecycle(event: string, message?: string): void {
        this.badge('LIFECYCLE');
        const msg = message ? `${event}: ${message}` : event;
        this.info(msg);
    }

    /**
     * Registra cambios de estado
     * 
     * @param {string} from - Estado anterior
     * @param {string} to - Estado nuevo
     * @param {any} data - Datos adicionales (opcional)
     * 
     * @example
     * component.stateChange('idle', 'loading');
     * component.stateChange('loading', 'error', { code: 404 });
     * 
     * @since 0.3.0
     */
    stateChange(from: string, to: string, data?: any): void {
        this.badge('STATE');
        const msg = `${from} → ${to}`;
        if (data) {
            this.info(msg, data);
        } else {
            this.info(msg);
        }
    }

    /**
     * Registra cambios en las propiedades
     * 
     * @param {Record<string, any>} changes - Objeto con los cambios
     * 
     * @example
     * component.propsChange({
     *   user: newUser,
     *   isActive: true
     * });
     * 
     * @since 0.3.0
     */
    propsChange(changes: Record<string, any>): void {
        this.badge('PROPS');
        this.debug('Props changed:', changes);
    }
}

/**
 * Logger de contexto temporal que se limpia automáticamente
 * 
 * @class ContextLogger
 * @description Proporciona un contexto temporal para operaciones agrupadas
 * 
 * @example
 * const db = logger.scope('Database');
 * 
 * // El contexto se limpia automáticamente al finalizar
 * db.context('Transaction').run(() => {
 *   db.info('Iniciando transacción');
 *   db.success('Transacción completada');
 * });
 * 
 * @since 0.3.0
 */
export class ContextLogger {
    private parentLogger: ScopedLogger;
    private contextName: string;

    constructor(parentLogger: ScopedLogger, contextName: string) {
        this.parentLogger = parentLogger;
        this.contextName = contextName;
    }

    /**
     * Ejecuta una función con este contexto activo
     * 
     * @template T - Tipo de retorno de la función
     * @param {Function} fn - Función a ejecutar
     * @returns {T} Resultado de la función
     * 
     * @example
     * const result = logger.context('Process').run(() => {
     *   logger.info('Procesando...');
     *   return processData();
     * });
     * 
     * @since 0.3.0
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
     * Run an async function with this context active
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
     * Start the context (manual mode)
     */
    start(): void {
        this.parentLogger._pushContext(this.contextName);
    }

    /**
     * End the context (manual mode)
     */
    end(): void {
        this.parentLogger._popContext();
    }

    // Delegate logging methods to parent with context
    debug(...args: any[]): void { this.parentLogger.debug(...args); }
    info(...args: any[]): void { this.parentLogger.info(...args); }
    warn(...args: any[]): void { this.parentLogger.warn(...args); }
    error(...args: any[]): void { this.parentLogger.error(...args); }
    success(...args: any[]): void { this.parentLogger.success(...args); }
    critical(...args: any[]): void { this.parentLogger.critical(...args); }
}