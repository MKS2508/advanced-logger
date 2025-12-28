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
    TransportRecord
} from './types/index.js';

// Enterprise features
import { SerializerRegistry } from './serializers/index.js';
import { HookManager } from './hooks/index.js';
import { TransportManager } from './transports/index.js';

// Utility imports
import { parseStackTrace } from './utils/stackTrace.js';
import { formatTimestamp } from './utils/timestamps.js';
import { createStyledOutput, setupThemeChangeListener } from './utils/output.js';
import { getEnvironment } from './utils/environment-detector.js';

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
import { createLogStyleBuilder } from './styling/LogStyleBuilder.js';

// Scoped loggers (static import for performance)
import { ScopedLogger, APILogger, ComponentLogger } from './ScopedLogger.js';

// Handler imports
import { ExportLogHandler } from './handlers/index.js';

// CLI imports
import { createDefaultCLI, type CommandProcessor } from './cli/index.js';

// Constants
import { DEFAULT_CONFIG } from './constants.js';

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
    private exportHandler?: ExportLogHandler;
    private cliProcessor?: CommandProcessor;
    private themeChangeListener?: (() => void) | null;
    private badgeList: string[] = [];
    private displaySettings = {
        showTimestamp: true,
        showLocation: true,
        showBadges: true
    };

    private serializerRegistry: SerializerRegistry;
    private hookManager: HookManager;
    private transportManager?: TransportManager;

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
        this.serializerRegistry = new SerializerRegistry();
        this.hookManager = new HookManager();

        // Initialize export handler if buffer size is specified
        if (this.config.bufferSize) {
            this.exportHandler = new ExportLogHandler(this.config.bufferSize);
            this.handlers.push(this.exportHandler);
        }

        // Initialize CLI processor
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
        
        // Fallback to old theme system
        if (theme in THEME_PRESETS) {
            LEVEL_STYLES = (THEME_PRESETS as any)[theme];
            this.config.theme = theme;
            
            // Show theme-specific banner
            if (theme in THEME_BANNERS) {
                const themeBanner = (THEME_BANNERS as any)[theme];
                console.log(`%c${themeBanner.simple}`, themeBanner.style);
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
        LEVEL_STYLES = THEME_PRESETS.default;
        
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
    cleanup(): void {
        if (this.themeChangeListener) {
            this.themeChangeListener();
            this.themeChangeListener = null;
        }
        // Close transports
        this.transportManager?.close().catch(() => {});
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
            (this as any)._activePreset = presetConfig;
            (this as any)._activePresetName = name;

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
    hideTimestamp(): void {
        this.displaySettings.showTimestamp = false;
        this.success('Timestamp hidden');
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
    showTimestamp(): void {
        this.displaySettings.showTimestamp = true;
        this.success('Timestamp shown');
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
    hideLocation(): void {
        this.displaySettings.showLocation = false;
        this.success('Location info hidden');
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
    showLocation(): void {
        this.displaySettings.showLocation = true;
        this.success('Location info shown');
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
    hideBadges(): void {
        this.displaySettings.showBadges = false;
        this.success('Badges hidden');
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
    showBadges(): void {
        this.displaySettings.showBadges = true;
        this.success('Badges shown');
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
        (this as any)._customization = overrides;
        this.success('Customization applied');
    }

    /**
     * Access advanced styling API (for power users)
     */
    styles(): any {
        return createLogStyleBuilder(this);
    }

    // ===== HANDLER MANAGEMENT =====

    /**
     * Añade un handler personalizado para extender funcionalidad
     * 
     * @param {ILogHandler} handler - Handler que implementa ILogHandler
     * 
     * @example
     * // Handler personalizado para enviar logs a servidor
     * const remoteHandler = new RemoteLogHandler('https://api.ejemplo.com/logs');
     * logger.addHandler(remoteHandler);
     * 
     * @example
     * // Handler para guardar en archivo
     * const fileHandler = new FileLogHandler('./app.log');
     * logger.addHandler(fileHandler);
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
     * Obtiene el handler de exportación si está disponible
     *
     * @returns {ExportLogHandler | undefined} Handler de exportación o undefined
     * @since 0.3.0
     */
    getExportHandler(): ExportLogHandler | undefined {
        return this.exportHandler;
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
        type: new (...args: any[]) => T,
        serializer: SerializerFn<T>,
        priority?: number
    ): void {
        this.serializerRegistry.add(type, serializer, priority);
    }

    /**
     * Elimina un serializador registrado
     *
     * @param type - Constructor del tipo a remover
     * @returns true si se eliminó
     *
     * @since 3.0.0
     */
    removeSerializer<T>(type: new (...args: any[]) => T): boolean {
        return this.serializerRegistry.remove(type);
    }

    /**
     * Obtiene el registry de serializadores
     *
     * @returns SerializerRegistry
     * @since 3.0.0
     */
    getSerializerRegistry(): SerializerRegistry {
        return this.serializerRegistry;
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
        return this.hookManager.on(event, callback, priority);
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
        return this.hookManager.once(event, callback, priority);
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
        return this.hookManager.off(event, callback);
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
        return this.hookManager.use(middleware, priority);
    }

    /**
     * Obtiene el HookManager
     *
     * @returns HookManager
     * @since 3.0.0
     */
    getHookManager(): HookManager {
        return this.hookManager;
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
        if (!this.transportManager) {
            this.transportManager = new TransportManager();
        }
        return this.transportManager.add(target);
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
        return this.transportManager?.remove(id) ?? false;
    }

    /**
     * Fuerza el flush de todos los transports
     *
     * @returns Promise que resuelve cuando todos los buffers están vaciados
     *
     * @since 3.0.0
     */
    async flushTransports(): Promise<void> {
        await this.transportManager?.flush();
    }

    /**
     * Cierra todos los transports
     *
     * @returns Promise que resuelve cuando todos están cerrados
     *
     * @since 3.0.0
     */
    async closeTransports(): Promise<void> {
        await this.transportManager?.close();
    }

    /**
     * Obtiene el TransportManager
     *
     * @returns TransportManager o undefined si no hay transports
     * @since 3.0.0
     */
    getTransportManager(): TransportManager | undefined {
        return this.transportManager;
    }

    // ===== CORE LOGGING METHODS =====

    /**
     * Verifica si un nivel de log debe mostrarse según la verbosidad actual
     * @private
     * @param {LogLevel} level - Nivel de log a verificar
     * @returns {boolean} True si debe mostrarse, false si no
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        const levels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
        return levels[level] >= levels[this.config.verbosity];
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
     * Método central de logging que maneja estilos y formato
     * @protected
     * @param {LogLevel} level - Nivel del log
     * @param {...any} args - Argumentos a loggear
     */
    protected log(level: LogLevel, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const timestamp = formatTimestamp();

        // Serialize args using registry
        const serializedArgs = args.map(arg => this.serializerRegistry.serialize(arg));

        // Prepend badges to message if any
        let message = serializedArgs.length > 0 ? String(serializedArgs[0]) : '';
        if (this.badgeList.length > 0 && this.displaySettings.showBadges) {
            const badgePrefix = this.badgeList.map(b => `[${b}]`).join('');
            message = badgePrefix + ' ' + message;
        }
        const additionalArgs = serializedArgs.slice(1);

        // Process beforeLog hooks (sync for performance)
        let hookEntry = {
            level,
            message,
            args: serializedArgs,
            timestamp,
            prefix,
            stackInfo: stackInfo || undefined
        };

        // Emit beforeLog event (fire-and-forget for sync logging)
        this.hookManager.emit('beforeLog', hookEntry).then(processed => {
            message = processed.message;
        }).catch(() => {});

        // Create styled output with theme detection and display settings
        const [format, ...styles] = createStyledOutput(
            level,
            LEVEL_STYLES,
            prefix,
            message,
            this.displaySettings.showLocation ? stackInfo : null,
            this.config.autoDetectTheme,
            (this as any)._activePreset,
            (this as any)._activePresetName
        );

        // Add group indentation
        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + format;

        // Output to console
        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        // Update export handler group info
        if (this.exportHandler) {
            this.exportHandler.setGroupInfo(this.groupDepth);
        }

        // Call custom handlers
        const metadata: LogMetadata = {
            timestamp,
            level,
            prefix,
            stackInfo: stackInfo ? stackInfo : undefined,
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle(level, message, serializedArgs, metadata);
            } catch (error) {
                console.error('Log handler failed:', error);
            }
        });

        // Write to transports (async, fire-and-forget)
        if (this.transportManager) {
            const levelValues: Record<LogLevel, number> = {
                debug: 0, info: 1, warn: 2, error: 3, critical: 4
            };
            const record: TransportRecord = {
                level,
                levelValue: levelValues[level],
                time: Date.now(),
                msg: message,
                prefix,
                location: stackInfo ? {
                    file: stackInfo.file,
                    line: stackInfo.line,
                    column: stackInfo.column,
                    function: stackInfo.function
                } : undefined
            };
            this.transportManager.write(record).catch(() => {});
        }

        // Emit afterLog event (fire-and-forget)
        this.hookManager.emit('afterLog', hookEntry).catch(() => {});
    }

    logWithBindings(bindings: Bindings, level: LogLevel, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        let prefix = '';
        if (bindings.badges?.length) {
            prefix += bindings.badges.map(b => `[${b}]`).join('');
        }
        if (bindings.scope) {
            prefix += `[${bindings.scope}] `;
        }

        if (prefix && args.length > 0) {
            args[0] = prefix + String(args[0]);
        }

        this.log(level, ...args);
    }

    debug(...args: any[]): void {
        this.log('debug', ...args);
    }

    /**
     * Registra mensajes informativos
     * 
     * @param {...any} args - Mensajes y datos informativos
     * 
     * @example
     * logger.info('Servidor iniciado en puerto 3000');
     * logger.info('Usuario conectado:', userId);
     * logger.info('Procesando', totalItems, 'elementos');
     * 
     * @since 0.3.0
     */
    info(...args: any[]): void {
        this.log('info', ...args);
    }

    /**
     * Registra mensajes de advertencia
     * 
     * @param {...any} args - Mensajes de advertencia
     * 
     * @example
     * logger.warn('Memoria al 85% de capacidad');
     * logger.warn('API deprecada, usar v2');
     * logger.warn('Reintentos agotados:', maxRetries);
     * 
     * @since 0.3.0
     */
    warn(...args: any[]): void {
        this.log('warn', ...args);
    }

    /**
     * Registra mensajes de error
     * 
     * @param {...any} args - Mensajes de error y stack traces
     * 
     * @example
     * logger.error('Fallo en conexión a base de datos');
     * logger.error('Error al procesar:', error.message, error.stack);
     * logger.error('Código de error:', errorCode);
     * 
     * @since 0.3.0
     */
    error(...args: any[]): void {
        this.log('error', ...args);
    }

    /**
     * Registra mensajes de éxito (nivel info especial)
     * 
     * @param {...any} args - Mensajes de operaciones exitosas
     * 
     * @example
     * logger.success('Base de datos conectada');
     * logger.success('Usuario creado con ID:', userId);
     * logger.success('✓ Tests pasados: 42/42');
     * 
     * @since 0.3.0
     */
    success(...args: any[]): void {
        if (!this.shouldLog('info')) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const message = args.length > 0 ? String(args[0]) : '';
        const additionalArgs = args.slice(1);

        // Handle success as special case - use info level with success styling
        const [format, ...styles] = createStyledOutput(
            'info',
            LEVEL_STYLES,
            prefix,
            message,
            this.displaySettings.showLocation ? stackInfo : null,
            this.config.autoDetectTheme,
            (this as any)._activePreset,
            (this as any)._activePresetName
        );
        
        // Override with success styling
        const successStyle = LEVEL_STYLES.success;
        let emoji = '✅';
        let label = 'SUCCESS';
        
        if (successStyle) {
            if (successStyle.emoji) {
                emoji = successStyle.emoji;
            }
            if (successStyle.label) {
                label = successStyle.label;
            }
        }
        
        const successFormat = format.replace(/ℹ️ INFO/, `${emoji} ${label}`);

        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + successFormat;

        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        // Call handlers
        const metadata: LogMetadata = {
            timestamp: formatTimestamp(),
            level: 'info',
            prefix,
            stackInfo: stackInfo ? stackInfo : undefined,
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle('info', message, args, metadata);
            } catch (error) {
                console.error('Log handler failed:', error);
            }
        });
    }

    /**
     * Registra información de trace (debugging detallado)
     * 
     * @param {...any} args - Datos detallados para debugging
     * 
     * @example
     * logger.trace('Entrando en función processData');
     * logger.trace('Stack completo:', new Error().stack);
     * 
     * @since 0.3.0
     */
    trace(...args: any[]): void {
        this.log('debug', ...args);
        if (this.shouldLog('debug')) {
            console.trace(...args);
        }
    }

    /**
     * Registra errores críticos (prioridad más alta)
     * 
     * @param {...any} args - Errores críticos del sistema
     * 
     * @example
     * logger.critical('Sistema caído - reinicio inmediato requerido');
     * logger.critical('Pérdida de datos detectada');
     * logger.critical('Brecha de seguridad:', securityError);
     * 
     * @since 0.3.0
     */
    critical(...args: any[]): void {
        this.log('critical', ...args);
    }

    // ===== ADVANCED LOGGING FEATURES =====

    /**
     * Muestra datos en formato de tabla
     * 
     * @param {any} data - Datos a mostrar (array de objetos o matriz)
     * @param {string[]} columns - Columnas específicas a mostrar (opcional)
     * 
     * @example
     * const usuarios = [
     *   { id: 1, nombre: 'Juan', edad: 30 },
     *   { id: 2, nombre: 'María', edad: 25 }
     * ];
     * logger.table(usuarios);
     * logger.table(usuarios, ['nombre', 'edad']); // Solo estas columnas
     * 
     * @since 0.3.0
     */
    table(data: any, columns?: string[]): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.getEffectivePrefix();
        const tableStyle = StylePresets.accent().build();

        const format = `%c📊 TABLE${prefix ? ` [${prefix}]` : ''}`;
        console.log(format, tableStyle);

        if (columns) {
            console.table(data, columns);
        } else {
            console.table(data);
        }
    }

    /**
     * Inicia un grupo colapsable en la consola
     * 
     * @param {string} label - Etiqueta del grupo
     * @param {boolean} collapsed - Si el grupo inicia colapsado (default: false)
     * 
     * @example
     * logger.group('Procesando usuarios');
     * logger.info('Usuario 1 procesado');
     * logger.info('Usuario 2 procesado');
     * logger.groupEnd();
     * 
     * @example
     * // Grupo colapsado por defecto
     * logger.group('Detalles adicionales', true);
     * logger.debug('Información detallada aquí');
     * logger.groupEnd();
     * 
     * @since 0.3.0
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

        if (collapsed) {
            console.groupCollapsed(format, groupStyle);
        } else {
            console.group(format, groupStyle);
        }

        this.groupDepth++;
    }

    /**
     * Finaliza el grupo actual de la consola
     * 
     * @example
     * logger.group('Operaciones');
     * logger.info('Operación 1');
     * logger.info('Operación 2');
     * logger.groupEnd(); // Cierra el grupo
     * 
     * @since 0.3.0
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            console.groupEnd();
            this.groupDepth--;
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
            startTime: performance.now(),
        };
        this.timers.set(label, timer);

        const timerStyle = StylePresets.warning().build();
        console.log(`%c⏱️ Timer started: ${label}`, timerStyle);
    }

    /**
     * Finaliza un temporizador y muestra el tiempo transcurrido
     * 
     * @param {string} label - Etiqueta del temporizador a finalizar
     * 
     * @example
     * logger.time('consulta-db');
     * await consultarBaseDatos();
     * logger.timeEnd('consulta-db'); // ⏱️ Timer ended: consulta-db - 234.56ms
     * 
     * @since 0.3.0
     */
    timeEnd(label: string): void {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }

        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);

        const timerStyle = StylePresets.success().build();
        console.log(`%c⏱️ Timer ended: ${label} - ${elapsed.toFixed(2)}ms`, timerStyle);
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

        console.log(`%c${message}`, svgStyle);
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
        // Inject CSS animation if not already present
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

        console.log(`%c${message}`, animatedStyle);
    }

    /**
     * Agrupa logs por una propiedad específica usando Object.groupBy (cuando esté disponible)
     * 
     * @param {T[]} items - Array de elementos a agrupar
     * @param {Function} groupBy - Función que retorna la clave de agrupación
     * 
     * @example
     * const ventas = [
     *   { producto: 'Laptop', categoria: 'Electrónica', precio: 1200 },
     *   { producto: 'Mouse', categoria: 'Electrónica', precio: 25 },
     *   { producto: 'Libro', categoria: 'Literatura', precio: 15 }
     * ];
     * logger.logGrouped(ventas, item => item.categoria);
     * 
     * @since 0.3.0
     */
    logGrouped<T>(items: T[], groupBy: (item: T) => string): void {
        try {
            // Use Object.groupBy if available (ES2024), otherwise fallback to reduce
            let grouped: Record<string, T[]>;
            
            if ((Object as any).groupBy) {
                grouped = (Object as any).groupBy(items, groupBy);
            } else {
                grouped = items.reduce((acc, item) => {
                    const key = groupBy(item);
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(item);
                    return acc;
                }, {} as Record<string, T[]>);
            }

            Object.entries(grouped).forEach(([group, groupItems]) => {
                this.group(`Group: ${group}`);
                this.table(groupItems);
                this.groupEnd();
            });
        } catch {
            this.info('Grouped data:', items);
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
 * Lazy singleton instance - se inicializa solo cuando se necesita
 * @private
 */
let _defaultLogger: Logger | null = null;

/**
 * Obtiene o crea la instancia singleton del logger
 * @returns {Logger} Instancia singleton del logger
 */
function getDefaultLogger(): Logger {
    if (!_defaultLogger) {
        _defaultLogger = new Logger({
            verbosity: 'info',
            enableColors: true,
            enableTimestamps: true,
            enableStackTrace: true,
            bufferSize: 1000, // Enable export functionality by default
        });
        
        // Display initialization banner only once
        try {
            displayInitBanner();
        } catch (error) {
            // Silent fail if banner cannot be displayed
        }
    }
    return _defaultLogger;
}

// Export the lazy singleton getter as default
export default getDefaultLogger();

/**
 * Métodos individuales exportados para conveniencia
 * @description Todos los métodos están correctamente enlazados al singleton lazy
 * @since 0.3.0
 */
export const debug = (...args: any[]) => getDefaultLogger().debug(...args);
export const info = (...args: any[]) => getDefaultLogger().info(...args);
export const warn = (...args: any[]) => getDefaultLogger().warn(...args);
export const error = (...args: any[]) => getDefaultLogger().error(...args);
export const success = (...args: any[]) => getDefaultLogger().success(...args);
export const trace = (...args: any[]) => getDefaultLogger().trace(...args);
export const critical = (...args: any[]) => getDefaultLogger().critical(...args);
export const table = (data: any, columns?: string[]) => getDefaultLogger().table(data, columns);
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
export const customize = (overrides: any) => getDefaultLogger().customize(overrides);
export const styles = () => getDefaultLogger().styles();

// Enterprise features exports
export const addSerializer = <T>(
    type: new (...args: any[]) => T,
    serializer: SerializerFn<T>,
    priority?: number
) => getDefaultLogger().addSerializer(type, serializer, priority);
export const removeSerializer = <T>(type: new (...args: any[]) => T) =>
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

// Re-export handlers and utilities for backward compatibility
export { FileLogHandler, RemoteLogHandler, AnalyticsLogHandler, ExportLogHandler } from './handlers/index.js';
export { StyleBuilder, StylePresets as Styles } from './styling/index.js';

// Re-export enterprise features
export { SerializerRegistry } from './serializers/index.js';
export { HookManager } from './hooks/index.js';
export { TransportManager, ConsoleTransport, FileTransport, HttpTransport } from './transports/index.js';
export { StyleCache, getStyleCache } from './styling/StyleCache.js';
