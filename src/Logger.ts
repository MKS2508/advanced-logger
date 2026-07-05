/**
 * @fileoverview Logger avanzado con arquitectura modular y API simplificada
 * 
 * Sistema de logging profesional con estilos CSS avanzados, temas adaptativos,
 * badges automáticos, contextos temporales y exportación de datos.
 */

// Type imports
import type {
    LogLevel,
    LogTag,
    Verbosity,
    ThemeVariant,
    BannerType,
    LoggerConfig,
    TimerEntry,
    ILogHandler,
    LogMetadata,
    StyleOptions,
    Bindings,
    SerializerFn,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    TransportTarget,
    TransportRecord,
    ILogResourceRef,
    StackInfo,
    LogStyles,
    ILogAttributes,
    LogAttributeValue
} from './types/index.js';

import { LOG_LEVELS } from './types/index.js';
import {
    LOG_LEVEL_TO_SEVERITY_NUMBER,
    LOG_LEVEL_TO_SEVERITY_TEXT,
    type ILogResource as ITransportLogResource
} from './types/index.js';

// Enterprise features
import { SerializerRegistry } from './serializers/index.js';
import { HookManager } from './hooks/index.js';
import { TransportManager } from './transports/index.js';

// Utility imports
import { parseStackTrace } from './utils/stackTrace.js';
import { formatTimestamp } from './utils/timestamps.js';
import { createStyledOutput, setupThemeChangeListener } from './utils/output.js';
import { getEnvironment, getColorCapability, isRunningInTerminal } from './utils/environment-detector.js';
import { formatBadge } from './terminal/formatter.js';

// Styling imports
import {
    THEME_PRESETS,
    THEME_BANNERS,
    displayInitBanner,
    StylePresets,
    StyleBuilder
} from './styling/index.js';

// Smart presets and dynamic scoped loggers
import { getSmartPreset, getAvailablePresets, hasPreset } from './styling/SmartPresets.js';

// Scoped loggers (static import for performance)
import { ScopedLogger, APILogger, ComponentLogger } from './ScopedLogger.js';

// CLI imports
import { createDefaultCLI, type CommandProcessor } from './cli/index.js';

// Constants
import { DEFAULT_CONFIG, CLI_LEVEL_MAP } from './constants.js';

// CLI Primitives
import type { CLILogLevel, ISpinnerHandle, IBoxOptions, ITableOptions } from './types/index.js';

// Bridge imports
import { createLogContext, type LogContext } from './context/LogContext.js';
import { createTransportBridge, type TransportBridge } from './transports/TransportBridge.js';
import { createHookBridge, type HookBridge } from './hooks/HookBridge.js';
import { createSerializerBridge, type SerializerBridge } from './serializers/SerializerBridge.js';
import { createTerminalBridge, type TerminalBridge } from './playground/TerminalBridge.js';
import { createStyleManager, type StyleManager } from './styles/StyleManager.js';

/**
 * Estilos del tema activo actual
 * @private
 */
let LEVEL_STYLES = THEME_PRESETS.default;

/**
 * Clase principal Logger con capacidades avanzadas de logging
 * 
 * @class Logger
 * @description Sistema completo de logging con temas, badges, contextos y exportación.
 *              Detecta automáticamente el tema claro/oscuro del navegador.
 * 
 * @example
 * // Uso básico sin configuración
 * import logger from '@mks2508/better-logger';
 * logger.info('Aplicación iniciada');
 * logger.success('Conexión establecida');
 * 
 * @example
 * // Aplicar un preset temático
 * logger.preset('cyberpunk');
 * logger.warn('Advertencia con estilo neón');
 * 
 * @example
 * // Logger con scope para componentes
 * const auth = logger.component('Autenticación');
 * auth.info('Usuario intentando login');
 * auth.success('Login exitoso');
 * 
 */
export class Logger {
    private config: LoggerConfig;
    private scopedPrefix?: string;
    private handlers: ILogHandler[] = [];
    private timers: Map<string, TimerEntry> = new Map();
    private groupDepth: number = 0;
    private cliProcessor?: CommandProcessor;
    private themeChangeListener?: (() => void) | null;
    private badgeList: string[] = [];
    private displaySettings = {
        showTimestamp: true,
        showLocation: true,
        showBadges: true
    };

    private serializerBridge: SerializerBridge;
    private hookBridge: HookBridge;
    private logContext: LogContext;
    private transportBridge: TransportBridge;
    /** Fijado por `success()` para que `log()` salte su propio dispatch. */
    private _successTagDispatched = false;
    private styleManager: StyleManager;

    /** Controla si las CLI primitives (step, box, header, ...) deben renderizarse. */
    private _showPrimitives = true;
    private terminalBridge: TerminalBridge;

    /**
     * Referencia activa al smart-preset (fijada por `preset()`). Tipada como
     * `unknown` para mantener limpia la surface pública; la consume
     * `createStyledOutput`.
     */
    private _activePreset?: unknown;
    /**
     * Nombre del smart-preset activo. Se guarda aparte para que la detección
     * de cambio de tema pueda re-renderizar sin re-ejecutar el body del preset.
     */
    private _activePresetName?: string;
    /**
     * Overrides aplicados por el último `customize()`. Se conservan para que
     * `createStyledOutput` los lea después.
     */
    private _customization?: unknown;

    /**
     * Bindings propios de este logger (provenientes de llamadas a `child()`).
     * Source of truth única de la contribución de este logger a la cadena de contexto.
     * @private
     */
    private _bindings: Record<string, unknown> = {};

    /**
     * Referencia al record de contexto mergueado del parent en el momento en
     * que se creó este logger. Junto con `_bindings`, forma la cadena de
     * contexto. `undefined` para el logger raíz.
     * @private
     */
    private _parentContextRecord: Record<string, unknown> | undefined;

    /**
     * Crea una nueva instancia del Logger
     * 
     * @param {Partial<LoggerConfig>} config - Configuración opcional del logger
     * 
     * @example
     * // Logger con configuración personalizada
     * const logger = new Logger({
     *   theme: 'neon',
     *   globalPrefix: 'MiApp',
     *   verbosity: 'debug',
     *   bufferSize: 1000
     * });
     */
    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };

        // Enterprise features
        this.serializerBridge = createSerializerBridge();
        this.hookBridge = createHookBridge();

        // LogContext bridge
        this.logContext = createLogContext({
            initialResource: this.config.resource,
            childLoggerFactory: (childConfig: Partial<LoggerConfig>): Logger => {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                return new Logger({ ...this.config, ...childConfig });
            },
            // Captura el contexto mergueado completo del parent en el momento
            // de creación del child, para que los child loggers puedan construir
            // la cadena correctamente.
            getParentContextRecord: () => this._captureMergedContext()
        });

        // TransportBridge
        this.transportBridge = createTransportBridge();

        // StyleManager bridge
        this.styleManager = createStyleManager();

        // TerminalBridge lazy — usa getter para evitar circular ref
        this.terminalBridge = createTerminalBridge({
            config: this.config,
            getLogger: () => this
        });

        // CLI processor lazy.
        // Los consumers que usan `logger.cli(...)` pagan el setup en el momento de la llamada.
        this.cliProcessor = createDefaultCLI();

        // Set up theme change listener si auto-detection está habilitado
        if (this.config.autoDetectTheme) {
            this.setupAutoThemeDetection();
        }
    }

    // ===== PRIVATE HELPER METHODS =====
    
    /**
     * Configura la detección automática de tema con listener de cambios
     * @private
     * @description Detecta automáticamente si el navegador está en modo claro u oscuro
     */
    private setupAutoThemeDetection(): void {
        // Limpia el listener existente si lo hay
        if (this.themeChangeListener) {
            this.themeChangeListener();
            this.themeChangeListener = null;
        }

        // Set up nuevo listener
        this.themeChangeListener = setupThemeChangeListener((theme) => {
            // Theme cambió — los logs usarán automáticamente los nuevos colores en la próxima llamada.
            // No hace falta actualizar nada: los colores se resuelven dinámicamente.
            this.debug(`DevTools theme changed to: ${theme}`);
        });
    }

    // ===== CONFIGURATION METHODS =====

    /**
     * Obtiene la configuración actual del logger
     * 
     * @returns {LoggerConfig} Configuración completa actual
     * 
     * @example
     * const config = logger.getConfig();
     * console.log('Verbosidad actual:', config.verbosity);
     * console.log('Tema actual:', config.theme);
     * 
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    /**
     * Actualiza la configuración del logger
     * 
     * @param {Partial<LoggerConfig>} updates - Propiedades a actualizar
     * 
     * @example
     * logger.updateConfig({
     *   verbosity: 'debug',
     *   enableTimestamps: false,
     *   theme: 'cyberpunk'
     * });
     * 
     */
    updateConfig(updates: Partial<LoggerConfig>): void {
        const previousAutoDetect = this.config.autoDetectTheme;
        this.config = { ...this.config, ...updates };
        
        // Handle de cambios de auto-detection
        if (updates.autoDetectTheme !== undefined && updates.autoDetectTheme !== previousAutoDetect) {
            if (updates.autoDetectTheme) {
                this.setupAutoThemeDetection();
            } else if (this.themeChangeListener) {
                this.themeChangeListener();
                this.themeChangeListener = null;
            }
        }
    }

    /**
     * Establece el prefijo global para todos los mensajes de log
     * 
     * @param {string} prefix - Prefijo a usar
     * 
     * @example
     * logger.setGlobalPrefix('MiApp');
     * logger.info('Iniciado'); // [MiApp] Iniciado
     * 
     */
    setGlobalPrefix(prefix: string): void {
        this.config.globalPrefix = prefix;
    }

    /**
     * Establece el nivel de verbosidad para filtrar la salida de logs
     * 
     * @param {Verbosity} level - Nivel mínimo a mostrar ('debug' | 'info' | 'warn' | 'error' | 'critical' | 'silent')
     * 
     * @example
     * logger.setVerbosity('warn');  // Solo muestra warn, error y critical
     * logger.setVerbosity('debug'); // Muestra todos los niveles
     * logger.setVerbosity('silent'); // No muestra nada
     * 
     */
    setVerbosity(level: Verbosity): void {
        this.config.verbosity = level;
    }

    /**
     * Establece el tema del logger
     * 
     * @param {ThemeVariant} theme - Tema a aplicar ('default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk')
     * 
     * @example
     * logger.setTheme('neon');      // Tema con colores neón
     * logger.setTheme('minimal');   // Tema minimalista
     * logger.setTheme('cyberpunk'); // Tema cyberpunk con efectos
     * 
     */
    setTheme(theme: ThemeVariant): void {
        // Primero comprueba si es un smart preset
        if (hasPreset(theme)) {
            this.preset(theme);
            return;
        }

        // Fallback al sistema de temas legacy — delega al StyleManager para
        // mantener el LEVEL_STYLES module-level sincronizado con el bridge.
        const applied = this.styleManager.setTheme(theme);
        if (applied) {
            this.config.theme = theme;

            // Muestra el banner específico del theme a través del writer
            // centralizado para respetar los outputMode silent/custom.
            const bannersRecord = THEME_BANNERS as Record<string, { simple: string; style: string }>;
            if (theme in bannersRecord) {
                const themeBanner = bannersRecord[theme];
                if (themeBanner) {
                    this.writeOutput(`%c${themeBanner.simple}`, 'info', [themeBanner.style], []);
                }
            }

            this.success(`Theme changed to: ${theme}`);
        } else {
            this.error(`Invalid theme: ${theme}. Available:`, [...getAvailablePresets(), ...Object.keys(THEME_PRESETS)]);
        }
    }

    /**
     * Establece el tipo de banner para mostrar en la inicialización
     * 
     * @param {BannerType} bannerType - Tipo de banner ('simple' | 'ascii' | 'unicode' | 'svg' | 'animated')
     * 
     * @example
     * logger.setBannerType('ascii');    // Banner con arte ASCII
     * logger.setBannerType('unicode');  // Banner con caracteres Unicode
     * logger.setBannerType('animated'); // Banner con animación
     * 
     */
    setBannerType(bannerType: BannerType): void {
        this.config.bannerType = bannerType;
        this.success(`Banner type changed to: ${bannerType}`);
    }

    /**
     * Ejecuta `fn` dentro de un scope AsyncLocalStorage donde `bindings` se
     * merguean al contexto para todas las llamadas de log dentro de `fn`.
     *
     * Sin `fn` (el shape legacy de setter): no-op por backwards compatibility.
     * Preferir `child()` para bindings persistentes o `withContextAsync()`
     * para callbacks async.
     *
     * @param bindings - Pares key-value a adjuntar durante la ejecución de `fn`
     * @param fn - Función sincrónica opcional a ejecutar con los bindings en scope
     * @returns El valor de retorno de `fn`, o `undefined` si no se pasa `fn`
     *
     * @example
     * // Callback sincrónico scoped
     * logger.withContext({ requestId: 'r-42' }, () => {
     *   doWork(); // los logs de aquí ven requestId en attributes
     * });
     *
     * @example
     * // Binding persistente: usar child()
     * const reqLog = logger.child({ requestId: 'r-42' });
     * reqLog.info('handling request'); // attributes incluye requestId
     *
     * @see {@link child} para una copia inmutable con el contexto mergueado
     * @see {@link withContextAsync} para la variante con callback async
     */
    withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined {
        return this.logContext.withContext(bindings, fn);
    }

    /**
     * Variante async de `withContext`. Ejecuta `fn` dentro de un scope
     * AsyncLocalStorage para que los bindings estén disponibles a todas las
     * llamadas de log async dentro de `fn`.
     *
     * @param bindings - Pares key-value a adjuntar durante la ejecución de `fn`
     * @param fn - Función async a ejecutar con los bindings en scope
     * @returns El valor de retorno de `fn`
     *
     * @example
     * await logger.withContextAsync({ requestId: 'r-42' }, async () => {
     *   await fetchData(); // los logs de aquí ven requestId en attributes
     * });
     *
     * @see {@link child} para un child logger persistente
     * @see {@link withContext} para la variante con callback sincrónico
     */
    withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R> {
        return this.logContext.withContextAsync(bindings, fn);
    }

    /**
     * Devuelve una copia inmutable de este logger con el contexto extra bound.
     * Las llamadas futuras sobre el child emiten con el contexto mergueado,
     * sin mutar al parent — el patrón canónico de MDC.
     *
     * @param extra - Pares key-value a adjuntar (requestId, userId, ...)
     * @returns Un nuevo Logger con el contexto mergueado
     *
     * @example
     * const reqLog = logger.child({ requestId: req.id });
     * reqLog.info('start');     // emite attributes: { requestId }
     * logger.info('unrelated'); // NO afectado — el contexto del parent queda intacto
     *
     */
    child(extra: Record<string, unknown>): Logger {
        // LogContext.child() crea el child Logger vía factory y captura el
        // snapshot de _getContextRecord() del parent (contexto parent + ALS)
        // en __parentSnapshot sobre el child. Aquí lo recogemos y lo
        // asignamos a _parentContextRecord, y luego fijamos los _bindings del child.
        const childLogger = this.logContext.child(extra) as unknown as Logger;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = (childLogger as any)['__parentSnapshot'] as Record<string, unknown> | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childLogger as any)._parentContextRecord = snapshot ?? {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childLogger as any)._bindings = extra;
        return childLogger;
    }

    /**
     * Descarta todas las keys del contexto bound. Tras esta llamada, los
     * records emitidos dejan de llevar `attributes` hasta que
     * {@link withContext} o {@link child} restablezcan uno.
     *
     * @returns La misma instancia del logger, ahora sin contexto
     */
    clearContext(): this {
        this.logContext.clearContext();
        return this;
    }

    /**
     * Snapshot del contexto bound. El objeto devuelto es una shallow copy:
     * mutarlo NO afecta lo que emiten las llamadas de log posteriores.
     *
     * @returns Un snapshot read-only del contexto actual
     */
    getContext(): Readonly<Record<string, unknown>> {
        // Devuelve la cadena de contexto (snapshot del parent + bindings propios),
        // SIN incluir el scope ALS (que es transitorio). Esto replica lo que usa
        // dispatchToTransports para attributes, pero sin el overlay de ALS.
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }
        return merged;
    }

    /**
     * Actualiza el resource OTel por defecto (service.name, version, env).
     * Se persiste en el campo `resource` de cada record emitido, salvo que
     * el propio record lo override.
     *
     * @param resource - Resource OTel parcial a merguear con el actual
     * @returns La misma instancia del logger, para chaining
     *
     * @example
     * logger.setResource({ 'service.name': 'api', 'service.version': '1.2.3' });
     *
     */
    setResource(resource: Partial<ILogResourceRef>): this {
        this.logContext.setResource(resource);
        return this;
        return this;
    }

    /**
     * Reinicia el logger a la configuración por defecto
     * 
     * @example
     * logger.resetConfig();
     * // Todo vuelve a la configuración inicial
     * 
     */
    resetConfig(): void {
        // Clean up del theme listener
        if (this.themeChangeListener) {
            this.themeChangeListener();
            this.themeChangeListener = null;
        }

        this.config = { ...DEFAULT_CONFIG };
        this.styleManager.resetStyles();

        // Re-setup auto theme detection si está habilitado en la config por defecto
        if (this.config.autoDetectTheme) {
            this.setupAutoThemeDetection();
        }
        
        this.success('Logger configuration reset to defaults');
    }

    /**
     * Método de limpieza para eliminar listeners y liberar recursos.
     *
     * Vacía los transports (drain), limpia timers, suelta la lista de
     * handlers legacy, resetea el group depth y limpia el context.
     * Seguro de invocar múltiples veces.
     *
     * @example
     * // Antes de cerrar la aplicación
     * await logger.cleanup();
     *
     */
    async cleanup(): Promise<void> {
        if (this.themeChangeListener) {
            try {
                this.themeChangeListener();
            } catch {
                // Listener cleanup es best-effort
            }
            this.themeChangeListener = null;
        }

        // Drain del queue de transports en cleanup.
        await this.transportBridge.closeTransports();

        // Suelta las refs de handlers para que el GC los pueda recolectar.
        this.handlers.length = 0;
        // Reset del mutable runtime state
        this.timers.clear();
        this.badgeList = [];
        this.logContext.clearContext();
        this.groupDepth = 0;
    }


    // ===== SIMPLIFIED API =====

    /**
     * Aplica un preset inteligente - funciona perfectamente sin configuración
     * 
     * @param {string} name - Nombre del preset a aplicar
     * 
     * @example
     * // Presets disponibles
     * logger.preset('default');       // Limpio y adaptativo
     * logger.preset('cyberpunk');     // Colores neón, efectos brillantes
     * logger.preset('glassmorphism'); // Efectos de blur modernos
     * logger.preset('minimal');       // Minimalista y elegante
     * logger.preset('debug');         // Modo desarrollo detallado
     * logger.preset('production');    // Enfocado en producción
     * 
     */
    preset(name: string): void {
        if (!hasPreset(name)) {
            this.error(`Unknown preset: ${name}. Available presets:`, getAvailablePresets());
            return;
        }

        const presetConfig = getSmartPreset(name);
        if (presetConfig) {
            // Aplica la configuración del smart preset
            this.displaySettings.showTimestamp = presetConfig.timestamp?.show ?? true;
            this.displaySettings.showLocation = presetConfig.location?.show ?? true;

            // Guarda la config del preset para que la use createStyledOutput
            this._activePreset = presetConfig;
            this._activePresetName = name;

            // Solo muestra el mensaje de success en navegador para evitar verbose terminal logs
            if (getEnvironment() === 'browser') {
                this.success(`Applied preset: ${name}`);
            }
        }
    }

    /**
     * Lista todos los presets disponibles
     * 
     * @returns {string[]} Array con nombres de presets disponibles
     * 
     * @example
     * const disponibles = logger.presets();
     * console.log(disponibles); // ['default', 'cyberpunk', 'glassmorphism', ...]
     * 
     */
    presets(): string[] {
        return getAvailablePresets();
    }

    // ===== TOGGLE METHODS =====

    /**
     * Oculta el timestamp en los logs
     * 
     * @example
     * logger.hideTimestamp();
     * logger.info('Sin marca de tiempo'); // Sin timestamp visible
     * 
     */
    hideTimestamp(): this {
        this.displaySettings.showTimestamp = false;
        return this;
    }

    /**
     * Muestra el timestamp en los logs
     * 
     * @example
     * logger.showTimestamp();
     * logger.info('Con marca de tiempo'); // [2024-01-15 10:30:45] Con marca de tiempo
     * 
     */
    showTimestamp(): this {
        this.displaySettings.showTimestamp = true;
        return this;
    }

    /**
     * Oculta la información de ubicación (archivo:línea) en los logs
     * 
     * @example
     * logger.hideLocation();
     * logger.debug('Sin ubicación'); // Sin mostrar archivo:línea
     * 
     */
    hideLocation(): this {
        this.displaySettings.showLocation = false;
        return this;
    }

    /**
     * Muestra la información de ubicación (archivo:línea) en los logs
     * 
     * @example
     * logger.showLocation();
     * logger.debug('Con ubicación'); // app.js:42 Con ubicación
     * 
     */
    showLocation(): this {
        this.displaySettings.showLocation = true;
        return this;
    }

    /**
     * Oculta los badges en los logs
     * 
     * @example
     * logger.hideBadges();
     * const api = logger.api('REST');
     * api.info('Sin badges'); // Sin mostrar [API] [REST]
     * 
     */
    hideBadges(): this {
        this.displaySettings.showBadges = false;
        return this;
    }

    /**
     * Muestra los badges en los logs
     *
     * @example
     * logger.showBadges();
     * const api = logger.api('GraphQL');
     * api.info('Con badges'); // [API] [GraphQL] Con badges
     *
     */
    showBadges(): this {
        this.displaySettings.showBadges = true;
        return this;
    }

    /**
     * Establece múltiples badges para los logs
     *
     * @param {string[]} badges - Array de badges a mostrar
     * @returns {this} Logger instance para encadenamiento
     *
     * @example
     * logger.badges(['v3', 'stable']).info('Release publicado');
     * logger.badges(['API', 'v2']).warn('Endpoint deprecado');
     *
     */
    badges(badges: string[]): this {
        this.badgeList = [...badges];
        return this;
    }

    /**
     * Añade un badge individual a la lista
     *
     * @param {string} badge - Badge a añadir
     * @returns {this} Logger instance para encadenamiento
     *
     * @example
     * logger.badge('DEBUG').badge('AUTH').info('Token validado');
     *
     */
    badge(badge: string): this {
        if (!this.badgeList.includes(badge)) {
            this.badgeList.push(badge);
        }
        return this;
    }

    /**
     * Limpia todos los badges activos
     *
     * @returns {this} Logger instance para encadenamiento
     *
     * @example
     * logger.clearBadges().info('Sin badges');
     *
     */
    clearBadges(): this {
        this.badgeList = [];
        return this;
    }

    // ===== SCOPED LOGGERS =====

    /**
     * Crea un logger scoped para un componente o módulo del dominio.
     *
     * El `ComponentLogger` resultante prepends un badge `[name]` a cada
     * mensaje y comparte configuración, transports y hooks con el logger
     * padre. Útil para trazar el origen de los logs en apps con muchos
     * módulos (Auth, DB, Cache, ...).
     *
     * @param {string} name - Nombre del componente que aparecerá como badge
     * @returns {ComponentLogger} Logger scoped para el componente
     *
     * @example
     * const auth = logger.component('Auth');
     * auth.info('Validando token');   // [Auth] Validando token
     * auth.success('Token válido');
     *
     * @see {@link api} para loggers de endpoints REST/GraphQL
     * @see {@link scope} para un scope genérico sin badge de componente
     */
    component(name: string): ComponentLogger {
        return new ComponentLogger(this, name);
    }

    /**
     * Crea un logger scoped para un endpoint o surface de API.
     *
     * Como `component()` pero con styling orientado a APIs (badge `[API]`
     * por defecto más el nombre del sub-scope). Útil para distinguir
     * tráfico REST vs GraphQL vs WebSocket en los logs.
     *
     * @param {string} name - Nombre de la API o surface (p.ej. `'REST'`, `'GraphQL'`)
     * @returns {APILogger} Logger scoped para la API
     *
     * @example
     * const rest = logger.api('REST');
     * rest.info('GET /users/42');     // [API] [REST] GET /users/42
     *
     * @see {@link component} para loggers de componentes de dominio
     */
    api(name: string): APILogger {
        return new APILogger(this, name);
    }

    /**
     * Crea un logger scoped genérico con un prefijo.
     *
     * Variante minimal de `component()` / `api()`: solo aplica un prefijo
     * de scope sin badges ni styling especial. Útil para sub-módulos que
     * no encajan en las categorías de `component`/`api`.
     *
     * @param {string} name - Texto del prefijo de scope
     * @returns {ScopedLogger} Logger con el scope aplicado
     *
     * @example
     * const db = logger.scope('db');
     * db.info('Pool conectado');      // [db] Pool conectado
     *
     * @see {@link component} y {@link api} para variantes con badges
     */
    scope(name: string): ScopedLogger {
        return new ScopedLogger(this, name);
    }

    // ===== SIMPLE CUSTOMIZATION =====

    /**
     * Personalización simple con configuración mínima
     * 
     * @param {Object} overrides - Opciones de personalización
     * @param {Object} overrides.message - Configuración del mensaje
     * @param {Object} overrides.timestamp - Configuración del timestamp
     * @param {Object} overrides.location - Configuración de ubicación
     * @param {Object} overrides.level - Configuración del nivel
     * @param {Object} overrides.prefix - Configuración del prefijo
     * @param {string} overrides.spacing - Espaciado: 'compact' | 'normal' | 'spacious'
     * 
     * @example
     * logger.customize({
     *   message: { color: '#00ff00', size: '16px' },
     *   timestamp: { show: false },
     *   spacing: 'compact'
     * });
     * 
     */
    customize(overrides: {
        message?: { color?: string; font?: string; size?: string };
        timestamp?: { show?: boolean; color?: string };
        location?: { show?: boolean; color?: string };
        level?: { uppercase?: boolean; style?: string };
        prefix?: { show?: boolean; style?: string };
        spacing?: 'compact' | 'normal' | 'spacious';
    }): void {
        // Aplica los overrides simples
        if (overrides.timestamp?.show !== undefined) {
            this.displaySettings.showTimestamp = overrides.timestamp.show;
        }
        if (overrides.location?.show !== undefined) {
            this.displaySettings.showLocation = overrides.location.show;
        }
        if (overrides.prefix?.show !== undefined) {
            // Se manejará al integrar con el preset system
        }

        // Guarda la customization para que la use createStyledOutput
        this._customization = overrides;
        this.success('Customization applied');
    }

    // ===== HANDLER MANAGEMENT =====

    /**
     * Añade un handler personalizado para extender funcionalidad
     * 
     * @param {ILogHandler} handler - Handler que implementa ILogHandler
     *
     * @example
     * // Handler personalizado para enviar logs a servidor
     * logger.addHandler({
     *   handle(level, message, args, metadata) {
     *     fetch('/logs', { method: 'POST', body: JSON.stringify({ level, message }) });
     *   }
     * });
     *
     * @example
     * // Para escribir a archivo, usa `addTransport` con un `FileTransport`
     * logger.addTransport({ target: new FileTransport({ destination: 'app.log' }) });
     *
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Obtiene todos los handlers registrados
     * 
     * @returns {ILogHandler[]} Array de handlers activos
     */
    getHandlers(): ILogHandler[] {
        return [...this.handlers];
    }

    // ===== SERIALIZERS =====

    /**
     * Añade un serializador personalizado para un tipo específico
     *
     * @param type - Constructor del tipo a serializar
     * @param serializer - Función de serialización
     * @param priority - Prioridad (mayor = primero)
     *
     * @example
     * logger.addSerializer(Error, (err) => ({
     *   name: err.name,
     *   message: err.message,
     *   stack: err.stack?.split('\n').slice(0, 5)
     * }));
     *
     */
    addSerializer<T>(
        type: new (...args: unknown[]) => T,
        serializer: SerializerFn<T>,
        priority?: number
    ): void {
        this.serializerBridge.addSerializer(type, serializer, priority);
    }

    /**
     * Elimina un serializador registrado
     *
     * @param type - Constructor del tipo a remover
     * @returns true si se eliminó
     *
     */
    removeSerializer<T>(type: new (...args: unknown[]) => T): boolean {
        return this.serializerBridge.removeSerializer(type);
    }

    /**
     * Obtiene el registry de serializadores
     *
     * @returns SerializerRegistry
     */
    getSerializerRegistry(): SerializerRegistry {
        return this.serializerBridge.getSerializerRegistry();
    }

    // ===== HOOKS & MIDDLEWARE =====

    /**
     * Registra un hook para un evento
     *
     * @param event - Evento: 'beforeLog' | 'afterLog' | 'onError'
     * @param callback - Función a ejecutar
     * @param priority - Prioridad (mayor = primero)
     * @returns Función para desregistrar
     *
     * @example
     * const unsubscribe = logger.on('beforeLog', (entry) => {
     *   entry.correlationId = getCorrelationId();
     *   return entry;
     * });
     *
     */
    on(event: HookEvent, callback: HookCallback, priority?: number): () => void {
        return this.hookBridge.on(event, callback, priority);
    }

    /**
     * Registra un hook que se ejecuta solo una vez
     *
     * @param event - Evento: 'beforeLog' | 'afterLog' | 'onError'
     * @param callback - Función a ejecutar
     * @param priority - Prioridad (mayor = primero)
     * @returns Función para desregistrar
     *
     */
    once(event: HookEvent, callback: HookCallback, priority?: number): () => void {
        return this.hookBridge.once(event, callback, priority);
    }

    /**
     * Elimina un hook registrado
     *
     * @param event - Evento del hook
     * @param callback - Callback a remover
     * @returns true si se eliminó
     *
     */
    off(event: HookEvent, callback: HookCallback): boolean {
        return this.hookBridge.off(event, callback);
    }

    /**
     * Añade un middleware al pipeline
     *
     * @param middleware - Función middleware
     * @param priority - Prioridad (mayor = primero)
     * @returns Función para desregistrar
     *
     * @example
     * logger.use((entry, next) => {
     *   entry.requestId = asyncLocalStorage.getStore()?.requestId;
     *   next();
     * });
     *
     */
    use(middleware: MiddlewareFn, priority?: number): () => void {
        return this.hookBridge.use(middleware, priority);
    }

    /**
     * Obtiene el HookManager
     *
     * @returns HookManager
     */
    getHookManager(): HookManager {
        return this.hookBridge.getHookManager();
    }

    // ===== TRANSPORTS =====

    /**
     * Añade un transport para envío de logs
     *
     * @param target - Configuración del transport
     * @returns ID único del transport
     *
     * @example
     * // File transport
     * logger.addTransport({
     *   target: 'file',
     *   options: { destination: '/var/log/app.log' }
     * });
     *
     * @example
     * // HTTP transport con batching
     * logger.addTransport({
     *   target: 'http',
     *   options: {
     *     url: 'https://logs.example.com',
     *     batchSize: 100,
     *     flushInterval: 5000
     *   },
     *   level: 'warn'
     * });
     *
     */
    addTransport(target: TransportTarget): string {
        return this.transportBridge.addTransport(target);
    }

    /**
     * Elimina un transport
     *
     * @param id - ID del transport a remover
     * @returns true si se eliminó
     *
     */
    removeTransport(id: string): boolean {
        return this.transportBridge.removeTransport(id);
    }

    /**
     * Fuerza el flush de todos los transports
     *
     * @returns Promise que resuelve cuando todos los buffers están vaciados
     *
     */
    async flushTransports(): Promise<void> {
        await this.transportBridge.flushTransports();
    }

    /**
     * Cierra todos los transports
     *
     * @returns Promise que resuelve cuando todos están cerrados
     *
     */
    async closeTransports(): Promise<void> {
        await this.transportBridge.closeTransports();
    }

    /**
     * Obtiene el TransportManager
     *
     * @returns TransportManager o undefined si no hay transports
     */
    getTransportManager(): TransportManager | undefined {
        return this.transportBridge.getTransportManager();
    }

    // ===== CORE LOGGING METHODS =====

    /**
     * Verifica si un nivel de log debe mostrarse según la verbosidad actual.
     * @private
     * @param {LogLevel} level - Nivel de log a verificar
     * @returns {boolean} True si debe mostrarse, false si no
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.verbosity as LogLevel];
    }

    /**
     * Tag pendiente de inyectar en el siguiente `TransportRecord` emitido
     * por `log()`. Lo fijan `success()` y `logWithBindingsAndTag()` antes
     * de delegar; `log()` lo consume y lo resetea a `undefined`.
     *
     * @internal
     */
    protected _dispatchTag: string | undefined;

    /**
     * Computa el contexto completamente mergueado para este logger.
     *
     * La cadena de contexto se construye en el momento de crear el child:
     * cada child almacena el contexto fully-merged de su parent (en ese
     * instante) como `_parentContextRecord`. Esto implica que
     * `_parentContextRecord` ya contiene los bindings de todos los ancestros
     * en el orden de precedencia correcto (root primero, child más cercano al final).
     *
     * Orden de merge (gana el último):
     *   1. _parentContextRecord — snapshot del contexto mergueado del parent en la creación
     *   2. _bindings            — bindings propios de este logger (llamadas a `child()`)
     *   3. ALS store            — scope de `withContext`/`withContextAsync` (prioridad máxima)
     *
     * @internal
     * @returns El record de contexto mergueado
     */
    private _getMergedContext(): Record<string, unknown> {
        // Empieza con el snapshot del parent (ya contiene todos los ancestros)
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};

        // Layer de los bindings propios de este logger (gana el más cercano)
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }

        // Layer del scope ALS (prioridad máxima)
        const alsContext = this.logContext._getAlsStore?.() ?? {};
        if (alsContext && Object.keys(alsContext).length > 0) {
            merged = { ...merged, ...alsContext };
        }

        return merged;
    }

    /** @internal Expone el contexto base mergueado (sin ALS) a la closure de la child factory de LogContext. */
    _captureMergedContext(): Record<string, unknown> {
        // Devuelve el contexto base sin ALS — ALS es transitorio y no debe
        // quedar baked en _parentContextRecord en el momento de crear el child.
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }
        return merged;
    }

    /**
     * Construye y despacha un `TransportRecord` al {@link TransportManager}
     * (no-op si no hay transports registrados). Lo comparten todos los
     * caminos de log — `log()`, `success()` y los métodos visuales como
     * `table()` / `group()` / `time()` — para que toda emisión atraviese
     * el mismo pipeline de transports.
     *
     * @protected
     * @param {LogLevel} level - Nivel canónico (trace/debug/info/warn/error/critical)
     * @param {string} message - Mensaje final, post-hook
     * @param {string | undefined} prefix - Prefijo efectivo (global + scope)
     * @param {StackInfo | null} stackInfo - Ubicación del caller, opcional
     * @param {Partial<TransportRecord>} [extra] - Campos extra a mergear en el record
     *        (p.ej. `{ tag: 'success' }` o `attributes` adicionales)
     */
    protected dispatchToTransports(
        level: LogLevel,
        message: string,
        prefix: string | undefined,
        stackInfo: StackInfo | null,
        extra?: Partial<TransportRecord>
    ): void {
        const record: TransportRecord = {
            level,
            levelValue: LOG_LEVELS[level],
            severityNumber: LOG_LEVEL_TO_SEVERITY_NUMBER[level],
            severityText: LOG_LEVEL_TO_SEVERITY_TEXT[level],
            time: Date.now(),
            msg: message,
            prefix,
            location: stackInfo
                ? {
                    file: stackInfo.file,
                    line: stackInfo.line,
                    column: stackInfo.column,
                    function: stackInfo.function
                }
                : undefined,
            attributes: Object.keys(this.logContext._getContextRecord()).length > 0
                ? toLogAttributes(this.logContext._getContextRecord())
                : undefined,
            resource: this.logContext._getResource()
                ? { ...this.logContext._getResource() } as Partial<ITransportLogResource>
                : undefined,
            ...extra
        };

        // Fire-and-forget vía bridge — nunca rompe el path de log sincrónico.
        this.transportBridge.writeRecord(record);
    }

    /**
     * Obtiene el prefijo efectivo (global + scope)
     * @private
     * @returns {string | undefined} Prefijo combinado o undefined
     */
    private getEffectivePrefix(): string | undefined {
        const parts = [this.config.globalPrefix, this.scopedPrefix].filter(Boolean);
        return parts.length > 0 ? parts.join(':') : undefined;
    }

    /**
     * Método central de logging. Espera el hook pipeline `beforeLog`
     * antes de despachar a consola y transports, para que redacciones
     * o enriquecimientos (PII, correlation IDs) se reflejen en el
     * mensaje emitido.
     *
     * Los callers fire-and-forget (p.ej. `logger.info(...)` sin `await`)
     * siguen funcionando: el `Promise<void>` resultante se descarta.
     * Se recomienda `await` cuando los hooks `beforeLog` mutan `message`.
     *
     * El tag opcional (`TransportRecord.tag`) NO se pasa como argumento:
     * se establece vía `_dispatchTag` (ver `success()` y
     * {@link logWithBindingsAndTag}) antes de invocar este método.
     *
     * @protected
     * @param {LogLevel} level - Nivel del log
     * @param {unknown[]} args - Argumentos a loggear (mensaje + datos)
     * @returns {Promise<void>} Promesa que resuelve al completar el dispatch
     *
     */
    protected async log(level: LogLevel, ...args: unknown[]): Promise<void> {
        if (!this.shouldLog(level)) return;

        // Comprueba _dispatchTag ANTES de procesar los args para que el tag
        // NO termine en additionalArgs. success() lo fija en vez de pasar
        // 'success' como arg.
        const dispatchTag = this._dispatchTag;
        this._dispatchTag = undefined;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const timestamp = formatTimestamp();

        const serializedArgs = args.map(arg => this.serializerBridge.getSerializerRegistry().serialize(arg));

        let message = serializedArgs.length > 0 ? String(serializedArgs[0]) : '';
        if (this.badgeList.length > 0 && this.displaySettings.showBadges) {
            const badgePrefix = this.badgeList.map(b => `[${b}]`).join('');
            message = badgePrefix + ' ' + message;
        }
        const additionalArgs = serializedArgs.slice(1);

        const hookEntry = {
            level,
            message,
            args: serializedArgs,
            timestamp,
            prefix,
            stackInfo: stackInfo ?? undefined
        };

        // Await de los hooks beforeLog para que las redacciones / enriquecimientos
        // se reflejen en el mensaje emitido.
        let processed;
        try {
            processed = await this.hookBridge.getHookManager().emit('beforeLog', hookEntry);
        } catch (error) {
            // El Hook manager ya dispara onError por su cuenta; cae a los
            // valores pre-hook para que la llamada de log no se rompa.
            // eslint-disable-next-line no-console
            console.error('HookManager beforeLog failed:', error);
            processed = hookEntry;
        }
        message = processed.message;

        const [format, ...styles] = createStyledOutput(
            level,
            this.styleManager.getStyles(),
            prefix,
            message,
            this.displaySettings.showLocation ? stackInfo : null,
            this.config.autoDetectTheme,
            this._activePreset as LogStyles | undefined,
            this._activePresetName
        );

        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + format;

        this.writeOutput(finalFormat, level, styles, additionalArgs);

        const metadata: LogMetadata = {
            timestamp,
            level,
            prefix,
            stackInfo: stackInfo ?? undefined
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle(level, message, serializedArgs, metadata);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Log handler failed:', error);
            }
        });

        // Si se fijó dispatchTag (por success()), despacha con él.
        if (dispatchTag !== undefined) {
            this.dispatchToTransports(level, message, prefix, stackInfo, { tag: dispatchTag as LogTag });
        } else {
            this.dispatchToTransports(level, message, prefix, stackInfo);
        }

        // Fire-and-forget de afterLog — las mutaciones after-side no cambian
        // el mensaje que ya está en pantalla, así que no bloqueamos con él.
        this.hookBridge.getHookManager().emit('afterLog', processed).catch(() => {});
    }

    /**
     * Emite un log aplicando bindings (badges, scope) al prefijo del
     * mensaje antes de delegar en {@link Logger.log}.
     *
     * No es API pública de consumo: existe para que `ScopedLogger`
     * (`component()` / `api()` / `scope()`) pueda reutilizar el pipeline
     * central de `log()` sin duplicar la lógica de styling/badges.
     *
     * @internal
     * @param {Bindings} bindings - Bindings de scope (badges, scope name, ...)
     * @param {LogLevel} level - Nivel de log
     * @param {unknown[]} args - Argumentos a loggear
     * @returns {Promise<void>} Promesa del dispatch
     *
     * @see {@link logWithBindingsAndTag} para la variante con `tag`
     */
    logWithBindings(bindings: Bindings, level: LogLevel, ...args: unknown[]): Promise<void> {
        if (!this.shouldLog(level)) return Promise.resolve();

        let prefix = '';
        const colorCapability = getColorCapability();

        if (bindings.badges?.length) {
            prefix += bindings.badges.map(b => formatBadge(b, 'pill', colorCapability, '#00ff88')).join(' ') + ' ';
        }
        if (bindings.scope) {
            prefix += formatBadge(bindings.scope, 'pill', colorCapability, '#00ffff') + ' ';
        }

        if (prefix && args.length > 0) {
            args[0] = prefix + String(args[0]);
        }

        return this.log(level, ...args);
    }

    /**
     * Como {@link logWithBindings} pero fija `_dispatchTag` antes de
     * delegar, para que `log()` despache el `TransportRecord` con el
     * tag indicado. Lo usa `ScopedLogger.success()` para propagar
     * `tag: 'success'` a través del pipeline normal de `log()`.
     *
     * @internal
     * @param {Bindings} bindings - Bindings de scope (badges, scope name, ...)
     * @param {LogLevel} level - Nivel de log
     * @param {LogTag} tag - Tag a inyectar en el `TransportRecord`
     * @param {unknown[]} args - Argumentos a loggear
     * @returns {Promise<void>} Promesa del dispatch
     */
    logWithBindingsAndTag(bindings: Bindings, level: LogLevel, tag: LogTag, ...args: unknown[]): Promise<void> {
        this._dispatchTag = tag;
        return this.logWithBindings(bindings, level, ...args);
    }

    /**
     * Registra mensajes de debug (nivel más verboso junto a `trace`).
     * Pensado para diagnóstico de desarrollo: valores intermedios, flags
     * de control flow, estado interno. Devuelve `Promise<void>`.
     *
     * Filtrado por defecto cuando `verbosity > 'debug'` (ver `setVerbosity`).
     *
     * @param {unknown[]} args - Mensaje + datos a inspeccionar
     * @returns {Promise<void>} Promesa del dispatch
     *
     * @example
     * logger.debug('Estado interno:', { conn, queueSize });
     * logger.debug('Entrando en branch X');
     *
     * @see {@link trace} para diagnósticos aún más granulares
     * @see {@link setVerbosity} para controlar el nivel mínimo visible
     */
    debug(...args: unknown[]): Promise<void> {
        return this.log('debug', ...args);
    }

    /**
     * Registra mensajes informativos. El `await` retorna cuando el hook
     * `beforeLog` y el dispatch a transports han terminado.
     *
     * @param args - Mensajes y datos informativos
     *
     * @example
     * logger.info('Servidor iniciado en puerto 3000');
     * await logger.info('Procesando', totalItems, 'elementos'); // espera hooks
     *
     */
    info(...args: unknown[]): Promise<void> {
        return this.log('info', ...args);
    }

    /**
     * Registra mensajes de advertencia.
     *
     * @param args - Mensajes de advertencia
     *
     */
    warn(...args: unknown[]): Promise<void> {
        return this.log('warn', ...args);
    }

    /**
     * Registra mensajes de error.
     *
     * @param args - Mensaje de error y stack traces
     *
     */
    error(...args: unknown[]): Promise<void> {
        return this.log('error', ...args);
    }

    /**
     * Registra mensajes de éxito. Mapeado internamente a nivel `info` con
     * styling de success y `record.tag = 'success'` para que los transports
     * puedan distinguirlo (sin perder info semantics para filtering).
     *
     * @param args - Mensaje + datos adicionales
     *
     * @example
     * logger.success('Base de datos conectada');
     * logger.success('Usuario creado con ID:', userId);
     * logger.success('✓ Tests pasados: 42/42');
     *
     */
    async success(...args: unknown[]): Promise<void> {
        if (!this.shouldLog('info')) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const timestamp = formatTimestamp();
        const serializedArgs = args.map(arg => this.serializerBridge.getSerializerRegistry().serialize(arg));
        let message = serializedArgs.length > 0 ? String(serializedArgs[0]) : '';
        if (this.badgeList.length > 0 && this.displaySettings.showBadges) {
            const badgePrefix = this.badgeList.map(b => `[${b}]`).join('');
            message = badgePrefix + ' ' + message;
        }
        const additionalArgs = serializedArgs.slice(1);

        const hookEntry = {
            level: 'info' as LogLevel,
            message,
            args: serializedArgs,
            timestamp,
            prefix,
            stackInfo: stackInfo ?? undefined
        };

        // Await de beforeLog para que las redacciones se propaguen (match con log())
        try {
            const processed = await this.hookBridge.getHookManager().emit('beforeLog', hookEntry);
            message = processed.message;
        } catch {
            // El Hook manager ya disparó onError
        }

        const [format, ...styles] = createStyledOutput(
            'info',
            this.styleManager.getStyles(),
            prefix,
            message,
            this.displaySettings.showLocation ? stackInfo : null,
            this.config.autoDetectTheme,
            this._activePreset as LogStyles | undefined,
            this._activePresetName
        );

        const successStyle = this.styleManager.getStyles().success;
        const emoji = successStyle?.emoji ?? '✅';
        const label = successStyle?.label ?? 'SUCCESS';
        const successFormat = format.replace(/ℹ️ INFO/, `${emoji} ${label}`);

        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + successFormat;

        this.writeOutput(finalFormat, 'info', styles, additionalArgs);

        const metadata: LogMetadata = {
            timestamp,
            level: 'info',
            prefix,
            stackInfo: stackInfo ?? undefined
        };
        this.handlers.forEach(handler => {
            try {
                handler.handle('info', message, args, metadata);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Log handler failed:', error);
            }
        });

        // Fija _dispatchTag para que log() despache con el tag.
        // 'success' NO se pasa como arg (evita que aparezca en additionalArgs).
        this._dispatchTag = 'success';
        await this.log('info', ...args);

        this.hookBridge.getHookManager().emit('afterLog', hookEntry).catch(() => {});
    }

    /**
     * Registra información de trace (nivel más bajo, debajo de debug).
     * Alineado con OpenTelemetry `TRACE` severity (1-4).
     *
     * @param args - Datos muy verbosos (entrada/salida de funciones, valores intermedios)
     *
     * @example
     * logger.trace('Entrando en función processData');
     * logger.trace('Variables intermedias:', { a, b, c });
     *
     */
    trace(...args: unknown[]): void {
        this.log('trace', ...args);
    }

    /**
     * Registra errores críticos (prioridad más alta).
     *
     * @param args - Errores críticos del sistema
     *
     * @example
     * await logger.critical('Sistema caído - reinicio inmediato requerido');
     *
     */
    critical(...args: unknown[]): Promise<void> {
        return this.log('critical', ...args);
    }

    // ===== ADVANCED LOGGING FEATURES =====

    /**
     * Muestra datos en formato de tabla. Pasa por la pipeline completa
     * (outputMode-respecting writeOutput + transports + hooks).
     *
     * @param data - Array de objetos o matriz
     * @param columns - Columnas específicas a mostrar (opcional)
     *
     * @example
     * logger.table([{ id: 1, nombre: 'Juan' }, { id: 2, nombre: 'María' }]);
     *
     */
    table(data: unknown, columns?: string[]): void {
        if (!this.shouldLog('info')) return;
        const prefix = this.getEffectivePrefix();
        const tableStyle = StylePresets.accent().build();

        const headerLabel = `📊 TABLE${prefix ? ` [${prefix}]` : ''}`;
        const format = `%c${headerLabel}`;
        const styles = [tableStyle];

        // Emite el header vía el writer centralizado
        this.writeOutput(format, 'info', styles, []);

        // console.table no respeta outputMode — pero aún así queremos que
        // los datos fluyan a los transports. Solución: serializa los datos
        // como segundo argumento para que los transports observen un payload estructurado.
        const additionalArgs = [data, ...(columns ? [columns] : [])];
        if (this.config.outputMode !== 'silent') {
            if (columns) {
                console.table(data, columns);
            } else {
                console.table(data);
            }
        }

        const message = `table:${Array.isArray(data) ? `${data.length} rows` : 'data'}`;
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        this.dispatchToTransports('info', message, prefix, stackInfo, {
            attributes: {
                ...this.logContext._getContextRecord(),
                'logger.visual': 'table',
                'logger.data': JSON.stringify(data).slice(0, 4096),
                ...(columns ? { 'logger.columns': columns.join(',') } : {})
            }
        });
    }

    /**
     * Inicia un grupo colapsable en la consola. Emite un marker a
     * transports con `attributes.logger.visual = 'groupStart'` para que
     * backends puedan reconstruir la jerarquía.
     *
     * @param label - Etiqueta del grupo
     * @param collapsed - Si el grupo inicia colapsado (default: false)
     *
     * @example
     * logger.group('Procesando usuarios');
     * logger.info('Usuario 1 procesado');
     * logger.groupEnd();
     *
     */
    group(label: string, collapsed: boolean = false): void {
        const groupStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)')
            .color('#1565c0')
            .border('1px solid #90caf9')
            .padding('4px 12px')
            .rounded('6px')
            .bold()
            .build();

        const format = `%c📁 ${label}`;

        if (this.config.outputMode !== 'silent') {
            if (collapsed) {
                console.groupCollapsed(format, groupStyle);
            } else {
                console.group(format, groupStyle);
            }
        }

        this.groupDepth++;

        // Emite un record sintético de info que marca el boundary del group
        const prefix = this.getEffectivePrefix();
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        this.dispatchToTransports('info', `group:start:${label}`, prefix, stackInfo, {
            attributes: {
                ...this.logContext._getContextRecord(),
                'logger.visual': 'groupStart',
                'logger.group.label': label,
                'logger.group.collapsed': collapsed,
                'logger.group.depth': this.groupDepth
            }
        });
    }

    /**
     * Finaliza el grupo actual de la consola. Emite un marker a transports
     * simétrico al `group()` start, para que backends puedan cerrar la
     * jerarquía correctamente.
     *
     * @example
     * logger.group('Operaciones');
     * logger.info('Operación 1');
     * logger.groupEnd();
     *
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            this.groupDepth--;
            if (this.config.outputMode !== 'silent') {
                console.groupEnd();
            }
            const prefix = this.getEffectivePrefix();
            const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
            this.dispatchToTransports('info', 'group:end', prefix, stackInfo, {
                attributes: {
                    ...this.logContext._getContextRecord(),
                    'logger.visual': 'groupEnd',
                    'logger.group.depth': this.groupDepth
                }
            });
        }
    }

    // ===== PERFORMANCE TIMING =====

    /**
     * Inicia un temporizador con la etiqueta dada
     * 
     * @param {string} label - Etiqueta identificadora del temporizador
     * 
     * @example
     * logger.time('proceso-datos');
     * // ... operación costosa ...
     * logger.timeEnd('proceso-datos'); // ⏱️ Timer ended: proceso-datos - 1523.45ms
     * 
     */
    time(label: string): void {
        const timer: TimerEntry = {
            label,
            startTime: (typeof performance !== 'undefined' ? performance : Date).now()
        };
        this.timers.set(label, timer);

        const timerStyle = StylePresets.warning().build();
        const format = `%c⏱️ Timer started: ${label}`;
        this.writeOutput(format, 'debug', [timerStyle], []);
    }

    /**
     * Finaliza un temporizador y muestra el tiempo transcurrido
     *
     * @param {string} label - Etiqueta del temporizador a finalizar
     * @returns {number} Milisegundos transcurridos, o `-1` si no se encuentra el timer
     *
     * @example
     * logger.time('consulta-db');
     * await consultarBaseDatos();
     * const elapsed = logger.timeEnd('consulta-db'); // ⏱️ Timer ended: consulta-db - 234.56ms
     *
     */
    timeEnd(label: string): number {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return -1;
        }

        const now = (typeof performance !== 'undefined' ? performance : Date).now();
        const elapsed = now - timer.startTime;
        this.timers.delete(label);

        const timerStyle = StylePresets.success().build();
        const format = `%c⏱️ Timer ended: ${label} - ${elapsed.toFixed(2)}ms`;
        this.writeOutput(format, 'info', [timerStyle], []);

        const prefix = this.getEffectivePrefix();
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        this.dispatchToTransports('info', `timer:${label}`, prefix, stackInfo, {
            tag: 'success',
            attributes: {
                ...this.logContext._getContextRecord(),
                'logger.visual': 'timer',
                'logger.timer.label': label,
                'logger.timer.elapsedMs': elapsed
            }
        });

        return elapsed;
    }

    // ===== ADVANCED VISUAL FEATURES =====

    /**
     * Muestra un banner con el tipo especificado o configurado
     * 
     * @param {BannerType} bannerType - Tipo de banner (opcional)
     * 
     * @example
     * logger.showBanner('ascii');    // Banner ASCII art
     * logger.showBanner('unicode');  // Banner con caracteres Unicode
     * logger.showBanner('svg');      // Banner con gráfico SVG
     * logger.showBanner();           // Usa el tipo configurado
     * 
     */
    showBanner(bannerType?: BannerType): void {
        const effectiveBannerType = bannerType ? bannerType : this.config.bannerType;
        displayInitBanner(effectiveBannerType);
    }

    /**
     * Registra mensaje con imagen SVG de fondo
     * 
     * @param {string} message - Mensaje a mostrar
     * @param {string} svgContent - Contenido SVG personalizado (opcional)
     * @param {StyleOptions} options - Opciones de estilo (ancho, alto, padding)
     * 
     * @example
     * // SVG automático con gradiente
     * logger.logWithSVG('🎆 Bienvenido a Better Logger');
     * 
     * @example
     * // SVG personalizado
     * const customSVG = '<svg>...</svg>';
     * logger.logWithSVG('Logo', customSVG, { width: 400, height: 100 });
     * 
     */
    logWithSVG(message: string, svgContent?: string, options: StyleOptions = {}): void {
        if (!this.shouldLog('info')) return;
        const { width = 300, height = 60, padding = '30px 150px' } = options;

        let svgDataUri = '';
        if (svgContent) {
            const encodedSVG = encodeURIComponent(svgContent);
            svgDataUri = `data:image/svg+xml,${encodedSVG}`;
        } else {
            const defaultSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='100%' style='stop-color:%23764ba2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)' rx='4'/><text x='${width/2}' y='${height/2 + 5}' text-anchor='middle' fill='white' font-family='monospace' font-size='14' font-weight='bold'>${message}</text></svg>`;
            svgDataUri = `data:image/svg+xml,${encodeURIComponent(defaultSVG)}`;
        }

        const svgStyle = new StyleBuilder()
            .bg(`url("${svgDataUri}") no-repeat center center`)
            .padding(padding)
            .color('transparent')
            .rounded('4px')
            .build();

        this.writeOutput(`%c${message}`, 'info', [svgStyle], []);

        const prefix = this.getEffectivePrefix();
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        this.dispatchToTransports('info', `svg:${message}`, prefix, stackInfo, {
            attributes: {
                ...this.logContext._getContextRecord(),
                'logger.visual': 'svg',
                'logger.svg.width': width,
                'logger.svg.height': height
            }
        });
    }

    /**
     * Registra mensaje con gradiente animado de fondo
     * 
     * @param {string} message - Mensaje a animar
     * @param {number} duration - Duración de la animación en segundos (default: 3)
     * 
     * @example
     * logger.logAnimated('🌈 Animación en progreso');
     * logger.logAnimated('Cargando...', 5); // Animación de 5 segundos
     * 
     */
    logAnimated(message: string, duration: number = 3): void {
        if (!this.shouldLog('info')) return;

        // DOM-guard: las animaciones solo tienen sentido en un entorno de navegador real.
        if (typeof document !== 'undefined') {
            if (!document.getElementById('logger-animations')) {
                const style = document.createElement('style');
                style.id = 'logger-animations';
                style.textContent = `
                    @keyframes loggerGradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        const animatedStyle = new StyleBuilder()
            .bg('linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)')
            .css('background-size', '400% 400%')
            .color('#ffffff')
            .padding('12px 20px')
            .rounded('8px')
            .bold()
            .font('Monaco, Consolas, monospace')
            .animation(`loggerGradient ${duration}s ease infinite`)
            .display('inline-block')
            .build();

        this.writeOutput(`%c${message}`, 'info', [animatedStyle], []);

        const prefix = this.getEffectivePrefix();
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        this.dispatchToTransports('info', `animated:${message}`, prefix, stackInfo, {
            attributes: {
                ...this.logContext._getContextRecord(),
                'logger.visual': 'animated',
                'logger.animation.durationSec': duration
            }
        });
    }

    // ===== CLI PRIMITIVES (v5.0) =====

    /**
     * Muestra un indicador de progreso de pasos en la terminal
     *
     * @param {number} current - Número de paso actual
     * @param {number} total - Número total de pasos
     * @param {string} message - Descripción del paso
     *
     * @example
     * logger.step(1, 5, 'Analyzing repository...');
     * logger.step(2, 5, 'Generating commit message...');
     *
     */
    step(current: number, total: number, message: string): void {
        this.terminalBridge.step(current, total, message);
    }

    /**
     * Muestra un header con estilo y subtítulo opcional
     *
     * @param {string} title - Texto del título principal
     * @param {string} subtitle - Subtítulo opcional (se renderiza atenuado)
     *
     * @example
     * logger.header('Commit Wizard', 'v2.0.0');
     *
     */
    header(title: string, subtitle?: string): void {
        this.terminalBridge.header(title, subtitle);
    }

    /**
     * Muestra una línea divisoria horizontal
     *
     * @example
     * logger.divider();
     *
     */
    divider(): void {
        this.terminalBridge.divider();
    }

    /**
     * Emite una línea en blanco
     *
     * @example
     * logger.blank();
     *
     */
    blank(): void {
        this.terminalBridge.blank();
    }

    /**
     * Renderiza contenido dentro de un box con borde
     *
     * @param {string} content - String de contenido (puede contener newlines)
     * @param {IBoxOptions} options - Opciones de renderizado del box
     *
     * @example
     * logger.box('3 commits generated\nProvider: Groq', { title: 'Done', borderColor: '#00ff00' });
     *
     */
    box(content: string, options?: IBoxOptions): void {
        this.terminalBridge.box(content, options);
    }

    /**
     * Renderiza un array de objetos como una tabla ASCII formateada.
     * Distinto del método `table()` existente, que usa `console.table`.
     *
     * @param {Record<string, unknown>[]} rows - Array de objetos fila
     * @param {ITableOptions} options - Opciones de renderizado de la tabla
     *
     * @example
     * logger.cliTable([
     *   { provider: 'Groq', status: 'Available', model: 'llama-3.3-70b' },
     *   { provider: 'Gemini', status: 'Configured', model: 'gemini-2.5-flash' },
     * ]);
     *
     */
    cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void {
        this.terminalBridge.cliTable(rows, options);
    }

    /**
     * Crea un handle de spinner para mostrar progreso durante operaciones async.
     * Devuelve un `NoopSpinner` en entornos non-TTY.
     *
     * @param {string} message - Texto inicial del spinner
     * @returns {ISpinnerHandle} Controller del spinner
     *
     * @example
     * const s = logger.spinner('Analyzing repository...');
     * s.start();
     * await analyzeRepo();
     * s.succeed('Analysis complete (1.2s)');
     *
     */
    spinner(message: string): ISpinnerHandle {
        return this.terminalBridge.spinner(message);
    }

    /**
     * Fija el nivel de verbosidad del CLI, controlando a la vez la verbosidad
     * de logs y la visibilidad de las primitives
     *
     * @param {CLILogLevel} level - Nivel de log del CLI
     *
     * @example
     * logger.setCLILevel('quiet');   // Solo errors, sin CLI primitives
     * logger.setCLILevel('verbose'); // Debug logs + todas las CLI primitives
     *
     */
    setCLILevel(level: CLILogLevel): void {
        const mapping = CLI_LEVEL_MAP[level];
        this.setVerbosity(mapping.verbosity);
        this.terminalBridge.setShowPrimitives(mapping.showPrimitives);
        this.config.cliLevel = level;
    }

    /**
     * Devuelve el nivel de log del CLI actual
     * @returns {CLILogLevel} Nivel de log del CLI actual
     */
    get cliLevel(): CLILogLevel {
        return this.config.cliLevel ?? 'normal';
    }

    // ===== OUTPUT WRITER SYSTEM =====

    /**
     * Escribe output formateado al destino configurado.
     * Respeta la configuración `outputMode` para output a consola, silencioso o custom.
     *
     * @private
     * @param {string} message - Mensaje de log formateado
     * @param {LogLevel} level - Nivel de log
     * @param {string[]} styles - Estilos CSS para la consola del navegador
     * @param {unknown[]} additionalArgs - Argumentos adicionales a loggear
     */
    private writeOutput(
        message: string,
        level: LogLevel,
        styles: string[],
        additionalArgs: unknown[]
    ): void {
        const mode = this.config.outputMode ?? 'console';

        // Silent mode: sin output
        if (mode === 'silent') {
            return;
        }

        // Custom mode: usa el writer configurado
        if (mode === 'custom' && this.config.outputWriter) {
            const fullMessage = additionalArgs.length > 0
                ? `${message} ${additionalArgs.map(a => String(a)).join(' ')}`
                : message;
            this.config.outputWriter.write(fullMessage, level, styles);
            return;
        }

        // Default: output a consola
        if (additionalArgs.length > 0) {
            console.log(message, ...styles, ...additionalArgs);
        } else {
            console.log(message, ...styles);
        }
    }

    // ===== CLI SYSTEM =====

    /**
     * Procesador de comandos CLI para configuración y exportación del logger
     * 
     * @param {string} command - Comando CLI a ejecutar
     * @returns {Promise<void>}
     * 
     * @example
     * // Comandos disponibles
     * await logger.cli('export json');      // Exporta logs en JSON
     * await logger.cli('export csv');       // Exporta logs en CSV
     * await logger.cli('theme list');       // Lista temas disponibles
     * await logger.cli('theme set neon');   // Cambia al tema neon
     * await logger.cli('config show');      // Muestra configuración actual
     * await logger.cli('history clear');    // Limpia historial de logs
     * await logger.cli('status');           // Muestra estado del logger
     * await logger.cli('help');             // Muestra ayuda de comandos
     * 
     */
    async cli(command: string): Promise<void> {
        if (!this.cliProcessor) {
            this.error('CLI processor not initialized');
            return;
        }

        await this.cliProcessor.processCommand(command, this);
    }
}

/**
 * Instancia singleton lazy — se inicializa en la primera llamada a
 * {@link getDefaultLogger}, no al importar el módulo.
 *
 * @private
 */
let _defaultLogger: Logger | null = null;

/**
 * Crea el singleton del Logger por defecto de forma lazy.
 *
 * El singleton se construye solo en la primera llamada, de modo que
 * importar el módulo nunca ejecuta `new Logger(...)` ni
 * `displayInitBanner()`. Así los imports del módulo quedan side-effect free.
 *
 * @returns La instancia compartida de Logger
 */
function getDefaultLogger(): Logger {
    if (!_defaultLogger) {
        _defaultLogger = new Logger({
            verbosity: 'info',
            enableColors: true,
            enableTimestamps: true,
            enableStackTrace: true,
            cliLevel: 'normal'
        });

        // Muestra el init banner solo en el primer uso real, no en el import.
        try {
            if (typeof window !== 'undefined' || typeof document !== 'undefined') {
                displayInitBanner();
            }
        } catch {
            // Fail silencioso si no se puede mostrar el banner (SSR, workers, etc.)
        }
    }
    return _defaultLogger;
}

/**
 * Resetea el singleton por defecto. Limpia la instancia cacheada para que la
 * próxima llamada a `getDefaultLogger()` la reconstruya desde defaults. Útil
 * para tests y escenarios de hot reload.
 *
 */
export function resetDefaultLogger(): void {
    if (_defaultLogger) {
        // Cleanup best-effort; el user puede tener ya una referencia y
        // querer drenar logs pendientes a propósito.
        void _defaultLogger.cleanup().catch(() => {});
    }
    _defaultLogger = null;
}

/**
 * Lazy default export — every property access defers to `getDefaultLogger()`.
 * Sin side-effects al importar el módulo (la primera llamada al singleton
 * se produce en el primer acceso a una propiedad, no en el `import`).
 *
 * @example
 * import logger from 'better-logger';
 * logger.info('hello'); // first call here triggers singleton init
 */
const loggerProxy: Logger = new Proxy({} as Logger, {
    get(_target, prop, receiver) {
        const instance = getDefaultLogger();
        const value = Reflect.get(instance, prop, receiver);
        return typeof value === 'function' ? value.bind(instance) : value;
    }
});

export default loggerProxy;

// ===== Internal converters =====

/**
 * Estrecha un contexto free-form `Record<string, unknown>` a un bag tipado
 * `ILogAttributes`. Los shapes desconocidos caen a strings JSON-encoded,
 * lo que mantiene conforme al transport OTLP (cada valor cae en un slot tipado).
 *
 * @param input - Contexto suministrado por el usuario (típicamente `Logger.context`).
 * @returns Un nuevo bag de attributes que satisface `ILogAttributes`.
 */
function toLogAttributes(input: Record<string, unknown>): ILogAttributes {
    const out: Record<string, LogAttributeValue> = {};
    for (const [key, value] of Object.entries(input)) {
        const mapped = toAttributeValue(value);
        if (mapped !== undefined) {
            out[key] = mapped;
        }
    }
    return out;
}

function toAttributeValue(value: unknown): LogAttributeValue | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (Array.isArray(value)) {
        const values: LogAttributeValue[] = [];
        for (const item of value) {
            const mapped = toAttributeValue(item);
            if (mapped !== undefined) values.push(mapped);
        }
        return values;
    }
    // Plain objects → fallback a string JSON (el transport OTLP lo maneja)
    try {
        return JSON.stringify(value);
    } catch {
        return undefined;
    }
}

/**
 * Métodos individuales exportados para conveniencia
 * @description Todos los métodos están correctamente enlazados al singleton lazy
 */
export const debug = (...args: unknown[]) => getDefaultLogger().debug(...args);
export const info = (...args: unknown[]) => getDefaultLogger().info(...args);
export const warn = (...args: unknown[]) => getDefaultLogger().warn(...args);
export const error = (...args: unknown[]) => getDefaultLogger().error(...args);
export const success = (...args: unknown[]) => getDefaultLogger().success(...args);
export const trace = (...args: unknown[]) => getDefaultLogger().trace(...args);
export const critical = (...args: unknown[]) => getDefaultLogger().critical(...args);
export const table = (data: unknown, columns?: string[]) => getDefaultLogger().table(data, columns);
export const group = (label: string, collapsed?: boolean) => getDefaultLogger().group(label, collapsed);
export const groupEnd = () => getDefaultLogger().groupEnd();
export const time = (label: string) => getDefaultLogger().time(label);
export const timeEnd = (label: string) => getDefaultLogger().timeEnd(label);
export const setGlobalPrefix = (prefix: string) => getDefaultLogger().setGlobalPrefix(prefix);
export const setVerbosity = (level: Verbosity) => getDefaultLogger().setVerbosity(level);
export const addHandler = (handler: ILogHandler) => getDefaultLogger().addHandler(handler);
export const setTheme = (theme: ThemeVariant) => getDefaultLogger().setTheme(theme);
export const setBannerType = (bannerType: BannerType) => getDefaultLogger().setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => getDefaultLogger().showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) =>
    getDefaultLogger().logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) =>
    getDefaultLogger().logAnimated(message, duration);
export const cli = (command: string) => getDefaultLogger().cli(command);
export const cleanup = () => getDefaultLogger().cleanup();

// Simplified API exports
export const preset = (name: string) => getDefaultLogger().preset(name);
export const presets = () => getDefaultLogger().presets();
export const hideTimestamp = () => getDefaultLogger().hideTimestamp();
export const showTimestamp = () => getDefaultLogger().showTimestamp();
export const hideLocation = () => getDefaultLogger().hideLocation();
export const showLocation = () => getDefaultLogger().showLocation();
export const hideBadges = () => getDefaultLogger().hideBadges();
export const showBadges = () => getDefaultLogger().showBadges();
export const badges = (badgeList: string[]) => getDefaultLogger().badges(badgeList);
export const badge = (badgeName: string) => getDefaultLogger().badge(badgeName);
export const clearBadges = () => getDefaultLogger().clearBadges();
export const component = (name: string) => getDefaultLogger().component(name);
export const api = (name: string) => getDefaultLogger().api(name);
export const scope = (name: string) => getDefaultLogger().scope(name);
export const customize = (overrides: Parameters<Logger['customize']>[0]) => getDefaultLogger().customize(overrides);

// Enterprise features exports
export const addSerializer = <T>(
    type: new (...args: unknown[]) => T,
    serializer: SerializerFn<T>,
    priority?: number
) => getDefaultLogger().addSerializer(type, serializer, priority);
export const removeSerializer = <T>(type: new (...args: unknown[]) => T) =>
    getDefaultLogger().removeSerializer(type);
export const on = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getDefaultLogger().on(event, callback, priority);
export const once = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getDefaultLogger().once(event, callback, priority);
export const off = (event: HookEvent, callback: HookCallback) =>
    getDefaultLogger().off(event, callback);
export const use = (middleware: MiddlewareFn, priority?: number) =>
    getDefaultLogger().use(middleware, priority);
export const addTransport = (target: TransportTarget) =>
    getDefaultLogger().addTransport(target);
export const removeTransport = (id: string) =>
    getDefaultLogger().removeTransport(id);
export const flushTransports = () =>
    getDefaultLogger().flushTransports();
export const closeTransports = () =>
    getDefaultLogger().closeTransports();

// Re-export utilities
export { StyleBuilder, StylePresets as Styles } from './styling/index.js';

// Re-export enterprise features
export { SerializerRegistry } from './serializers/index.js';
export { HookManager } from './hooks/index.js';
export { TransportManager, ConsoleTransport, FileTransport, HttpTransport } from './transports/index.js';
