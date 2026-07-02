/**
 * @fileoverview Logger avanzado con arquitectura modular y API simplificada
 * @version 0.3.0
 * @since 2024
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
    LogAttributeValue,
    ExportLogHandler,
    ExportResult,
    ExportFilters,
    ExportOptions,
    BufferStats
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
 * @since 0.3.0
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
    /** Set during success() so log() skips its own dispatch (N2 fix). */
    private _successTagDispatched = false;
    private styleManager: StyleManager;

    /** Whether CLI primitives (step, box, header, etc.) should be shown @since 5.0.0 */
    private _showPrimitives = true;
    private terminalBridge: TerminalBridge;

    /**
     * Active smart-preset reference (set by `preset()`). Typed as `unknown`
     * to keep the public surface clean; consumed by `createStyledOutput`.
     */
    private _activePreset?: unknown;
    /**
     * Name of the active smart-preset. Stored separately so theme-change
     * detection can re-render without re-running the preset body.
     */
    private _activePresetName?: string;
    /**
     * Last-applied `customize()` overrides. Stored for later read by
     * `createStyledOutput`.
     */
    private _customization?: unknown;

    /**
     * This logger's own context bindings (from child() calls).
     * Single source of truth for this logger's contribution to the context chain.
     * @private
     */
    private _bindings: Record<string, unknown> = {};

    /**
     * Reference to the parent's merged context record at the time this logger
     * was created. Together with _bindings, forms the context chain.
     * Undefined for the root logger.
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

        // Initialize enterprise features
        this.serializerBridge = createSerializerBridge();
        this.hookBridge = createHookBridge();

        // Initialize LogContext bridge
        this.logContext = createLogContext({
            initialResource: this.config.resource,
            childLoggerFactory: (childConfig: Partial<LoggerConfig>): Logger => {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                return new Logger({ ...this.config, ...childConfig });
            },
            // F4.5.5 fix: capture the parent's full merged context at child-creation
            // time so child loggers can build the chain correctly.
            getParentContextRecord: () => this._captureMergedContext()
        });

        // Initialize TransportBridge
        this.transportBridge = createTransportBridge();

        // Initialize StyleManager bridge
        this.styleManager = createStyleManager();

        // Initialize TerminalBridge (lazy — uses getter to avoid circular ref)
        this.terminalBridge = createTerminalBridge({
            config: this.config,
            getLogger: () => this
        });

        // Legacy ExportLogHandler has been removed in 5.1.0 (F013-delete).
        // For log capture & export, use transports (`addTransport({ target: new FileTransport(...) })`)
        // or the new `withContext` + `OtlpTransport` for SigNoz ingestion.

        // Initialize CLI processor lazily (BUG-N13)
        // We don't trigger the full CLI machinery here; consumers who use
        // `logger.cli(...)` or related commands will pay for the setup at call time.
        this.cliProcessor = createDefaultCLI();

        // Set up theme change listener if auto-detection is enabled
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
        // Clean up existing listener if any
        if (this.themeChangeListener) {
            this.themeChangeListener();
            this.themeChangeListener = null;
        }

        // Set up new listener
        this.themeChangeListener = setupThemeChangeListener((theme) => {
            // Theme changed - logs will automatically use new colors on next call
            // No need to update anything as colors are resolved dynamically
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
     * @since 0.3.0
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
     * @since 0.3.0
     */
    updateConfig(updates: Partial<LoggerConfig>): void {
        const previousAutoDetect = this.config.autoDetectTheme;
        this.config = { ...this.config, ...updates };
        
        // Handle auto-detection changes
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
     */
    setTheme(theme: ThemeVariant): void {
        // First check if it's a smart preset
        if (hasPreset(theme)) {
            this.preset(theme);
            return;
        }

        // Fallback to old theme system — delegate to StyleManager to keep
        // the module-level LEVEL_STYLES in sync with the bridge.
        const applied = this.styleManager.setTheme(theme);
        if (applied) {
            this.config.theme = theme;

            // Show theme-specific banner through the centralised writer
            // so silent/custom output modes are respected.
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
     * @since 0.3.0
     */
    setBannerType(bannerType: BannerType): void {
        this.config.bannerType = bannerType;
        this.success(`Banner type changed to: ${bannerType}`);
    }

    /**
     * Runs `fn` within an AsyncLocalStorage scope where `bindings` are
     * merged into the context for all log calls inside `fn`.
     *
     * Without `fn` (the old setter shape): no-op for backwards compatibility.
     * Prefer `child()` for persistent bindings or `withContextAsync()` for
     * async callbacks.
     *
     * @param bindings - Key-value pairs to attach for the duration of `fn`
     * @param fn - Optional synchronous function to run with scoped bindings
     * @returns The return value of `fn`, or undefined if no fn provided
     *
     * @example
     * // Scoped synchronous callback
     * logger.withContext({ requestId: 'r-42' }, () => {
     *   doWork(); // logs inside see requestId in attributes
     * });
     *
     * @example
     * // Persistent binding: use child()
     * const reqLog = logger.child({ requestId: 'r-42' });
     * reqLog.info('handling request'); // attributes include requestId
     *
     * @see {@link child} for an immutable copy with the merged context
     * @see {@link withContextAsync} for async callback variant
     */
    withContext<R>(bindings: Record<string, unknown>, fn?: () => R): R | undefined {
        return this.logContext.withContext(bindings, fn);
    }

    /**
     * Async variant of `withContext`. Runs `fn` within an AsyncLocalStorage
     * scope so bindings are available to all async log calls inside `fn`.
     *
     * @param bindings - Key-value pairs to attach for the duration of `fn`
     * @param fn - Async function to run with the scoped bindings
     * @returns The return value of `fn`
     *
     * @example
     * await logger.withContextAsync({ requestId: 'r-42' }, async () => {
     *   await fetchData(); // logs inside see requestId in attributes
     * });
     *
     * @see {@link child} for a persistent child logger
     * @see {@link withContext} for synchronous callback variant
     */
    withContextAsync<R>(bindings: Record<string, unknown>, fn: () => Promise<R>): Promise<R> {
        return this.logContext.withContextAsync(bindings, fn);
    }

    /**
     * Returns an immutable copy of this logger with the extra context bound.
     * Future calls on the child emit with the merged context, without
     * mutating the parent — the canonical MDC pattern.
     *
     * @param extra - Key-value pairs to attach (requestId, userId, ...)
     * @returns A new Logger with merged context
     *
     * @example
     * const reqLog = logger.child({ requestId: req.id });
     * reqLog.info('start');     // emits attributes: { requestId }
     * logger.info('unrelated'); // NOT affected — parent's context untouched
     *
     */
    child(extra: Record<string, unknown>): Logger {
        // LogContext.child() creates the child Logger via factory and captures
        // the parent's _getContextRecord() snapshot (parent context + ALS) in
        // __parentSnapshot on the child. We pick that up here and assign it to
        // _parentContextRecord, then set the child's _bindings.
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
     * Drops every key from the bound context. After this call, emitted
     * records no longer carry `attributes` until {@link withContext} or
     * {@link child} re-establish one.
     *
     * @returns The same logger instance, now context-free
     */
    clearContext(): this {
        this.logContext.clearContext();
        return this;
    }

    /**
     * Snapshot of the bound context. Returned object is a shallow copy:
     * mutating it does NOT affect what subsequent log calls emit.
     *
     * @returns A read-only snapshot of the current context
     */
    getContext(): Readonly<Record<string, unknown>> {
        // Return the context chain (parent snapshot + own bindings), NOT including
        // ALS scope (which is transient). This mirrors what dispatchToTransports
        // uses for attributes, but without ALS overlay.
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }
        return merged;
    }

    /**
     * Updates the default OTel resource (service.name, version, env).
     * Persisted into every emitted record's `resource` field unless the
     * record itself overrides it.
     *
     * @param resource - Partial OTel resource to merge into the current one
     * @returns The same logger instance, for chaining
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
     * @since 0.3.0
     */
    resetConfig(): void {
        // Clean up theme listener
        if (this.themeChangeListener) {
            this.themeChangeListener();
            this.themeChangeListener = null;
        }
        
        this.config = { ...DEFAULT_CONFIG };
        this.styleManager.resetStyles();
        
        // Re-setup auto theme detection if enabled in default config
        if (this.config.autoDetectTheme) {
            this.setupAutoThemeDetection();
        }
        
        this.success('Logger configuration reset to defaults');
    }

    /**
     * Método de limpieza para eliminar listeners y liberar recursos
     * 
     * @example
     * // Antes de cerrar la aplicación
     * logger.cleanup();
     * 
     * @since 0.3.0
     */
    /**
     * Tears down every resource held by this Logger. Safe to call multiple
     * times. Fixed in 5.1.0 to fully drain transports + clear timers +
     * drop the legacy handler list + reset group depth + clear context.
     *
     * @example
     * await logger.cleanup(); // before process exit / hot reload
     *
     * @since 0.3.0 (rewritten in 5.1.0 to await transports fully)
     */
    async cleanup(): Promise<void> {
        if (this.themeChangeListener) {
            try {
                this.themeChangeListener();
            } catch {
                // Listener cleanup is best-effort
            }
            this.themeChangeListener = null;
        }

        // Drain transport queue (fixed: was fire-and-forget in 5.0.x — BUG-N14)
        await this.transportBridge.closeTransports();

        // Drop legacy handler refs so GC can collect them (BUG-N17)
        this.handlers.length = 0;
        // Reset mutable runtime state
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
     * logger.preset('production');    // Optimizado para producción
     * 
     * @since 0.3.0
     */
    preset(name: string): void {
        if (!hasPreset(name)) {
            this.error(`Unknown preset: ${name}. Available presets:`, getAvailablePresets());
            return;
        }

        const presetConfig = getSmartPreset(name);
        if (presetConfig) {
            // Apply the smart preset configuration
            this.displaySettings.showTimestamp = presetConfig.timestamp?.show ?? true;
            this.displaySettings.showLocation = presetConfig.location?.show ?? true;

            // Store the preset config for use in createStyledOutput
            this._activePreset = presetConfig;
            this._activePresetName = name;

            // Only show success message in browser to avoid verbose terminal logs
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 3.0.0
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
     * @since 3.0.0
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
     * @since 3.0.0
     */
    clearBadges(): this {
        this.badgeList = [];
        return this;
    }

    // ===== SCOPED LOGGERS =====

    component(name: string): ComponentLogger {
        return new ComponentLogger(this, name);
    }

    api(name: string): APILogger {
        return new APILogger(this, name);
    }

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
     * @since 0.3.0
     */
    customize(overrides: {
        message?: { color?: string; font?: string; size?: string };
        timestamp?: { show?: boolean; color?: string };
        location?: { show?: boolean; color?: string };
        level?: { uppercase?: boolean; style?: string };
        prefix?: { show?: boolean; style?: string };
        spacing?: 'compact' | 'normal' | 'spacious';
    }): void {
        // Apply simple overrides
        if (overrides.timestamp?.show !== undefined) {
            this.displaySettings.showTimestamp = overrides.timestamp.show;
        }
        if (overrides.location?.show !== undefined) {
            this.displaySettings.showLocation = overrides.location.show;
        }
        if (overrides.prefix?.show !== undefined) {
            // Will be handled when we integrate with preset system
        }

        // Store customization for use in createStyledOutput
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
     * @since 0.3.0
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Obtiene todos los handlers registrados
     * 
     * @returns {ILogHandler[]} Array de handlers activos
     * @since 0.3.0
     */
    getHandlers(): ILogHandler[] {
        return [...this.handlers];
    }

    /**
     * Removed in 5.1.0 (F013-delete). The legacy `ExportLogHandler` is gone;
     * for log capture + export use `addTransport({ target: new FileTransport(...) })`.
     *
     * Returns a no-op stub that satisfies the `ExportLogHandler` interface
     * (so existing CLI commands don't crash) but never produces output.
     *
     * @returns A no-op handler instance
     * @since 0.3.0 (deprecated in 5.1.0)
     */
    getExportHandler(): ExportLogHandler {
        return _noopExportHandler;
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
     * @since 3.0.0
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
     * @since 3.0.0
     */
    removeSerializer<T>(type: new (...args: unknown[]) => T): boolean {
        return this.serializerBridge.removeSerializer(type);
    }

    /**
     * Obtiene el registry de serializadores
     *
     * @returns SerializerRegistry
     * @since 3.0.0
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
     * @since 3.0.0
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
     * @since 3.0.0
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
     * @since 3.0.0
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
     * @since 3.0.0
     */
    use(middleware: MiddlewareFn, priority?: number): () => void {
        return this.hookBridge.use(middleware, priority);
    }

    /**
     * Obtiene el HookManager
     *
     * @returns HookManager
     * @since 3.0.0
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
     * @since 3.0.0
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
     * @since 3.0.0
     */
    removeTransport(id: string): boolean {
        return this.transportBridge.removeTransport(id);
    }

    /**
     * Fuerza el flush de todos los transports
     *
     * @returns Promise que resuelve cuando todos los buffers están vaciados
     *
     * @since 3.0.0
     */
    async flushTransports(): Promise<void> {
        await this.transportBridge.flushTransports();
    }

    /**
     * Cierra todos los transports
     *
     * @returns Promise que resuelve cuando todos están cerrados
     *
     * @since 3.0.0
     */
    async closeTransports(): Promise<void> {
        await this.transportBridge.closeTransports();
    }

    /**
     * Obtiene el TransportManager
     *
     * @returns TransportManager o undefined si no hay transports
     * @since 3.0.0
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
     * Builds and dispatches a `TransportRecord` to the {@link TransportManager}
     * (no-op if no transports are registered). Shared by every log path —
     * `log()`, `success()`, and visual methods like `table()` / `group()` /
     * `time()` — so all emissions hit the same transport pipeline.
     *
     * @param level - The canonical log level (trace/debug/info/warn/error/critical)
     * @param message - Final, post-hook message text
     * @param prefix - Effective prefix (global + scope)
     * @param stackInfo - Optional caller location
     * @param extra - Optional fields to merge into the record (e.g. `{ tag: 'success' }`)
     */
    protected _dispatchTag: string | undefined;

    /**
     * Computes the fully-merged context for this logger.
     *
     * The context chain is built at child-creation time: each child stores
     * its parent's fully-merged context (at that moment) as _parentContextRecord.
     * This means _parentContextRecord already contains all ancestors' bindings
     * in the correct precedence order (root first, nearest child last).
     *
     * Merge order (later wins):
     *   1. _parentContextRecord — parent's merged context snapshot at creation time
     *   2. _bindings            — this logger's own bindings (child() calls)
     *   3. ALS store            — withContext/withContextAsync scope (highest priority)
     *
     * @internal
     * @returns The merged context record
     */
    private _getMergedContext(): Record<string, unknown> {
        // Start with parent's snapshot (already contains all ancestors)
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};

        // Layer in this logger's own bindings (nearest wins)
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }

        // Layer in ALS scope (highest priority)
        const alsContext = this.logContext._getAlsStore?.() ?? {};
        if (alsContext && Object.keys(alsContext).length > 0) {
            merged = { ...merged, ...alsContext };
        }

        return merged;
    }

    /** @internal Exposes base merged context (no ALS) to LogContext child factory closure. */
    _captureMergedContext(): Record<string, unknown> {
        // Return base context without ALS — ALS is transient and should not be
        // baked into _parentContextRecord at child-creation time.
        let merged: Record<string, unknown> = this._parentContextRecord ?? {};
        if (this._bindings && Object.keys(this._bindings).length > 0) {
            merged = { ...merged, ...this._bindings };
        }
        return merged;
    }

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

        // Fire-and-forget via bridge — never breaks the sync log path.
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
     * Método central de logging. Awaits the `beforeLog` hook pipeline
     * synchronously (so redactions / enrichments are reflected in the
     * emitted message before console + transport dispatch).
     *
     * Fire-and-forget callers (e.g. `logger.info(...)` without `await`)
     * still work — the resulting `Promise<void>` is dropped on the floor.
     * Awaiting is recommended when `beforeLog` hooks mutate `message`
     * (e.g. PII redaction, correlation IDs).
     *
     * @protected
     * @param level - Nivel del log
     * @param args - Argumentos a loggear
     * @returns Promise that resolves once the record has been dispatched
     *
     * @since 0.3.0 (return type changed to `Promise<void>` in 5.1.0)
     */
    /**
     * Protected logging method. Awaits the `beforeLog` hook pipeline
     * synchronously (so redactions / enrichments are reflected in the
     * emitted message before console + transport dispatch).
     *
     * Fire-and-forget callers (e.g. `logger.info(...)` without `await`)
     * still work — the resulting `Promise<void>` is dropped on the floor.
     * Awaiting is recommended when `beforeLog` hooks mutate `message`
     * (e.g. PII redaction, correlation IDs).
     *
     * @protected
     * @param level - Nivel del log
     * @param args - Argumentos a loggear
     * @param tag - Optional tag forwarded to `dispatchToTransports` as
     *              `TransportRecord.tag` (e.g. `'success'` for success records).
     * @returns Promise that resolves once the record has been dispatched
     *
     * @since 0.3.0 (return type changed to `Promise<void>` in 5.1.0)
     * @since 0.18.2-alpha.1 (tag parameter added for N2 fix)
     */
    protected async log(level: LogLevel, ...args: unknown[]): Promise<void> {
        if (!this.shouldLog(level)) return;

        // N2 fix: check _dispatchTag BEFORE processing args so the tag does
        // NOT end up in additionalArgs. success() sets this instead of
        // passing 'success' as an arg.
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

        // Await beforeLog hooks so redactions / enrichments are reflected
        // in the emitted message. Fixed in 5.1.0 (BUG-N / F002).
        let processed;
        try {
            processed = await this.hookBridge.getHookManager().emit('beforeLog', hookEntry);
        } catch (error) {
            // Hook manager already fires onError on its own; fall back to
            // the pre-hook values to keep the log call from breaking.
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

        // N2 fix: if dispatchTag was set (by success()), dispatch with it.
        if (dispatchTag !== undefined) {
            this.dispatchToTransports(level, message, prefix, stackInfo, { tag: dispatchTag as LogTag });
        } else {
            this.dispatchToTransports(level, message, prefix, stackInfo);
        }

        // Fire-and-forget afterLog — after-side mutations don't change the
        // message that's already on screen, so we don't block on it.
        this.hookBridge.getHookManager().emit('afterLog', processed).catch(() => {});
    }

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
     * Like `logWithBindings()` but sets _dispatchTag first so that
     * `log()` dispatches with the tag. Used by ScopedLogger.success()
     * to propagate tag:'success' through the normal log() pipeline.
     */
    logWithBindingsAndTag(bindings: Bindings, level: LogLevel, tag: LogTag, ...args: unknown[]): Promise<void> {
        this._dispatchTag = tag;
        return this.logWithBindings(bindings, level, ...args);
    }

    debug(...args: unknown[]): Promise<void> {
        return this.log('debug', ...args);
    }

    /**
     * Registra mensajes informativos. Devuelve `Promise<void>` desde 5.1.0.
     *
     * @param args - Mensajes y datos informativos
     *
     * @example
     * logger.info('Servidor iniciado en puerto 3000');
     * await logger.info('Procesando', totalItems, 'elementos'); // espera hooks
     *
     * @since 0.3.0 (return type changed in 5.1.0)
     */
    info(...args: unknown[]): Promise<void> {
        return this.log('info', ...args);
    }

    /**
     * Registra mensajes de advertencia. Devuelve `Promise<void>` desde 5.1.0.
     *
     * @param args - Mensajes de advertencia
     *
     * @since 0.3.0 (return type changed in 5.1.0)
     */
    warn(...args: unknown[]): Promise<void> {
        return this.log('warn', ...args);
    }

    /**
     * Registra mensajes de error. Devuelve `Promise<void>` desde 5.1.0.
     *
     * @param args - Mensaje de error y stack traces
     *
     * @since 0.3.0 (return type changed in 5.1.0)
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
     * @since 0.3.0 (refactor 5.1.0 — emits to transports + respects outputMode)
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

        // Await beforeLog so redactions propagate (matches log())
        try {
            const processed = await this.hookBridge.getHookManager().emit('beforeLog', hookEntry);
            message = processed.message;
        } catch {
            // Hook manager has already fired onError
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

        // N2 fix: set _dispatchTag so log() dispatches with the tag.
        // 'success' is NOT passed as an arg (avoids it appearing in additionalArgs).
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
     * @since 0.3.0 (refactor 5.1.0 — emits as level=trace, not double debug)
     */
    trace(...args: unknown[]): void {
        this.log('trace', ...args);
    }

    /**
     * Registra errores críticos (prioridad más alta). Devuelve `Promise<void>` desde 5.1.0.
     *
     * @param args - Errores críticos del sistema
     *
     * @example
     * await logger.critical('Sistema caído - reinicio inmediato requerido');
     *
     * @since 0.3.0 (return type changed in 5.1.0)
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
     * @since 0.3.0 (refactor 5.1.0)
     */
    table(data: unknown, columns?: string[]): void {
        if (!this.shouldLog('info')) return;
        const prefix = this.getEffectivePrefix();
        const tableStyle = StylePresets.accent().build();

        const headerLabel = `📊 TABLE${prefix ? ` [${prefix}]` : ''}`;
        const format = `%c${headerLabel}`;
        const styles = [tableStyle];

        // Emit header via centralised writer
        this.writeOutput(format, 'info', styles, []);

        // console.table doesn't honour outputMode — but we still want the
        // data to flow through to transports. Solution: serialise the data
        // as the second argument so transports observe a structured payload.
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
     * @since 0.3.0 (refactor 5.1.0)
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

        // Emit a synthetic info record marking the group boundary
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
     * @since 0.3.0 (refactor 5.1.0)
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
     * @since 0.3.0
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
     * @returns {number} Elapsed milliseconds, or -1 if timer not found
     *
     * @example
     * logger.time('consulta-db');
     * await consultarBaseDatos();
     * const elapsed = logger.timeEnd('consulta-db'); // ⏱️ Timer ended: consulta-db - 234.56ms
     *
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
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
     * @since 0.3.0
     */
    logAnimated(message: string, duration: number = 3): void {
        if (!this.shouldLog('info')) return;

        // DOM-guard: animations only make sense in a real browser environment.
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
     * Displays a step progress indicator in the terminal
     *
     * @param {number} current - Current step number
     * @param {number} total - Total number of steps
     * @param {string} message - Step description
     *
     * @example
     * logger.step(1, 5, 'Analyzing repository...');
     * logger.step(2, 5, 'Generating commit message...');
     *
     * @since 5.0.0
     */
    step(current: number, total: number, message: string): void {
        this.terminalBridge.step(current, total, message);
    }

    /**
     * Displays a styled header with optional subtitle
     *
     * @param {string} title - Main title text
     * @param {string} subtitle - Optional subtitle (rendered dimmed)
     *
     * @example
     * logger.header('Commit Wizard', 'v2.0.0');
     *
     * @since 5.0.0
     */
    header(title: string, subtitle?: string): void {
        this.terminalBridge.header(title, subtitle);
    }

    /**
     * Displays a horizontal divider line
     *
     * @example
     * logger.divider();
     *
     * @since 5.0.0
     */
    divider(): void {
        this.terminalBridge.divider();
    }

    /**
     * Outputs a blank line
     *
     * @example
     * logger.blank();
     *
     * @since 5.0.0
     */
    blank(): void {
        this.terminalBridge.blank();
    }

    /**
     * Renders content inside a bordered box
     *
     * @param {string} content - Content string (may contain newlines)
     * @param {IBoxOptions} options - Box rendering options
     *
     * @example
     * logger.box('3 commits generated\nProvider: Groq', { title: 'Done', borderColor: '#00ff00' });
     *
     * @since 5.0.0
     */
    box(content: string, options?: IBoxOptions): void {
        this.terminalBridge.box(content, options);
    }

    /**
     * Renders an array of objects as a formatted ASCII table.
     * Note: This is distinct from the existing table() method which uses console.table.
     *
     * @param {Record<string, unknown>[]} rows - Array of row objects
     * @param {ITableOptions} options - Table rendering options
     *
     * @example
     * logger.cliTable([
     *   { provider: 'Groq', status: 'Available', model: 'llama-3.3-70b' },
     *   { provider: 'Gemini', status: 'Configured', model: 'gemini-2.5-flash' },
     * ]);
     *
     * @since 5.0.0
     */
    cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void {
        this.terminalBridge.cliTable(rows, options);
    }

    /**
     * Creates a spinner handle for showing progress during async operations.
     * Returns a NoopSpinner in non-TTY environments.
     *
     * @param {string} message - Initial spinner text
     * @returns {ISpinnerHandle} Spinner controller
     *
     * @example
     * const s = logger.spinner('Analyzing repository...');
     * s.start();
     * await analyzeRepo();
     * s.succeed('Analysis complete (1.2s)');
     *
     * @since 5.0.0
     */
    spinner(message: string): ISpinnerHandle {
        return this.terminalBridge.spinner(message);
    }

    /**
     * Sets the CLI verbosity level, controlling both log verbosity and primitive visibility
     *
     * @param {CLILogLevel} level - CLI log level
     *
     * @example
     * logger.setCLILevel('quiet');   // Only errors, no CLI primitives
     * logger.setCLILevel('verbose'); // Debug logs + all CLI primitives
     *
     * @since 5.0.0
     */
    setCLILevel(level: CLILogLevel): void {
        const mapping = CLI_LEVEL_MAP[level];
        this.setVerbosity(mapping.verbosity);
        this.terminalBridge.setShowPrimitives(mapping.showPrimitives);
        this.config.cliLevel = level;
    }

    /**
     * Returns the current CLI log level
     * @returns {CLILogLevel} Current CLI log level
     * @since 5.0.0
     */
    get cliLevel(): CLILogLevel {
        return this.config.cliLevel ?? 'normal';
    }

    // ===== OUTPUT WRITER SYSTEM =====

    /**
     * Writes formatted output to the configured destination.
     * Respects outputMode configuration for console, silent, or custom output.
     *
     * @private
     * @param {string} message - Formatted log message
     * @param {LogLevel} level - Log level
     * @param {string[]} styles - CSS styles for browser console
     * @param {unknown[]} additionalArgs - Additional arguments to log
     * @since 4.0.0
     */
    private writeOutput(
        message: string,
        level: LogLevel,
        styles: string[],
        additionalArgs: unknown[]
    ): void {
        const mode = this.config.outputMode ?? 'console';

        // Silent mode: no output
        if (mode === 'silent') {
            return;
        }

        // Custom mode: use configured writer
        if (mode === 'custom' && this.config.outputWriter) {
            const fullMessage = additionalArgs.length > 0
                ? `${message} ${additionalArgs.map(a => String(a)).join(' ')}`
                : message;
            this.config.outputWriter.write(fullMessage, level, styles);
            return;
        }

        // Default: console output
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
     * @since 0.3.0
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
 /**
 * Lazy singleton instance — initialised on first call to {@link getDefaultLogger},
 * not on module import. Fixes BUG-N11 (eager side-effect at import time).
 *
 * @private
 */
let _defaultLogger: Logger | null = null;

/**
 * Lazily creates the default Logger singleton.
 *
 * - The singleton is only built on first call, so importing the module
 *   never executes `new Logger(...)` or `displayInitBanner()` (BUG-N11).
 * - The default config disables `bufferSize` so the legacy `ExportLogHandler`
 *   is not auto-constructed (BUG-N12). Tests / power users can opt back in
 *   by setting `bufferSize` themselves.
 *
 * @returns The shared Logger instance
 */
function getDefaultLogger(): Logger {
    if (!_defaultLogger) {
        _defaultLogger = new Logger({
            verbosity: 'info',
            enableColors: true,
            enableTimestamps: true,
            enableStackTrace: true,
            // bufferSize intentionally NOT set — keeps ExportLogHandler dormant
            // unless the caller opts in (BUG-N12)
            cliLevel: 'normal'
        });

        // Display the init banner only on first actual use, not on import.
        try {
            if (typeof window !== 'undefined' || typeof document !== 'undefined') {
                displayInitBanner();
            }
        } catch {
            // Silent fail if banner cannot be displayed (SSR, workers, etc.)
        }
    }
    return _defaultLogger;
}

/**
 * Resets the default singleton. Clears the cached instance so the next call
 * to `getDefaultLogger()` rebuilds it from defaults. Useful for tests and
 * hot reload scenarios.
 *
 */
export function resetDefaultLogger(): void {
    if (_defaultLogger) {
        // Best-effort cleanup; the user may already have a reference and
        // intentionally want to drain pending logs.
        void _defaultLogger.cleanup().catch(() => {});
    }
    _defaultLogger = null;
}

/**
 * Lazy default export — every property access defers to `getDefaultLogger()`.
 * Side-effect-free at module import (BUG-N11).
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
 * No-op {@link ExportLogHandler} returned by `Logger.getExportHandler()`
 * after F013-delete in 5.1.0. Keeps old CLI commands from crashing while
 * making it explicit in user code that the legacy export path is gone.
 * @private
 */
const _noopExportHandler: ExportLogHandler = {
    setBufferSize: () => {
        /* removed in 5.1.0 */
    },
    getBufferStats: (): BufferStats => ({
        size: 0,
        maxSize: 0,
        usage: 0,
        levelCounts: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, critical: 0 }
    }),
    clearBuffer: () => {
        /* removed in 5.1.0 */
    },
    export: (_format: string, _filters?: ExportFilters, _options?: ExportOptions): ExportResult => ({
        format: 'noop',
        data: '',
        metadata: {
            totalLogs: 0,
            filteredLogs: 0,
            exportedAt: new Date().toISOString(),
            filters: _filters,
            options: _options
        }
    }),
    copyToClipboard: async (): Promise<boolean> => false,
    setGroupInfo: () => {
        /* removed in 5.1.0 */
    }
};

/**
 * Narrow a free-form `Record<string, unknown>` context into a typed
 * `ILogAttributes` bag. Unknown shapes fall back to JSON-encoded strings,
 * which keeps the OTLP transport happy (every value lands in a typed slot).
 *
 * @param input - The user-supplied context (typically `Logger.context`).
 * @returns A new attribute bag matching `ILogAttributes`.
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
    // Plain objects → JSON string fallback (OTLP transport handles this)
    try {
        return JSON.stringify(value);
    } catch {
        return undefined;
    }
}

/**
 * Métodos individuales exportados para conveniencia
 * @description Todos los métodos están correctamente enlazados al singleton lazy
 * @since 0.3.0
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
export { StyleCache, getStyleCache } from './styling/StyleCache.js';
