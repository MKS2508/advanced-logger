/**
 * @fileoverview Better Logger - Librería completa con todas las características
 * @version 0.3.0
 * @since 2024
 * 
 * Punto de entrada principal que proporciona la experiencia completa de Better Logger
 * con características avanzadas incluyendo estilos CSS, soporte SVG, animaciones,
 * capacidades de exportación y logging remoto.
 * 
 * @module @mks2508/better-logger
 */

// Main Logger class with all features
import { Logger } from './Logger.js';
import type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    StyleOptions,
    ILogHandler
} from './types/index.js';

// Lazy singleton - se inicializa solo cuando se necesita
let _logger: Logger | null = null;

function getLogger(): Logger {
    if (!_logger) {
        _logger = new Logger();
    }
    return _logger;
}

/**
 * Clase principal Logger con conjunto completo de características
 * 
 * @example
 * // Importación y uso básico
 * import { Logger } from '@mks2508/better-logger';
 * 
 * const logger = new Logger();
 * logger.preset('cyberpunk');  // Aplicar preset completo
 * logger.info('¡Hola mundo!');
 * 
 * @example
 * // Logger con scope para componentes
 * const auth = logger.component('Auth');
 * auth.info('Usuario autenticando...');
 * auth.success('Login exitoso');
 * 
 * @example
 * // Logger para APIs con badges
 * const api = logger.api('GraphQL');
 * api.badges(['v2', 'cached']).info('Query ejecutada');
 * 
 * @since 0.3.0
 */
export { Logger };

/**
 * Instancia singleton del logger lista para usar
 * @default
 * 
 * @example
 * // Uso directo sin crear instancia
 * import logger from '@mks2508/better-logger';
 * 
 * logger.info('Aplicación iniciada');
 * logger.success('Conexión establecida');
 * logger.warn('Memoria al 80%');
 * logger.error('Fallo en conexión');
 */
export default getLogger();

/**
 * Métodos de logging individuales (enlazados al singleton)
 * 
 * @example
 * // Importar solo los métodos necesarios
 * import { info, error, success } from '@mks2508/better-logger';
 * 
 * info('Proceso iniciado');
 * success('✓ Completado exitosamente');
 * error('Error:', errorDetails);
 * 
 * @since 0.3.0
 */
export const debug = (...args: any[]) => getLogger().debug(...args);
export const info = (...args: any[]) => getLogger().info(...args);
export const warn = (...args: any[]) => getLogger().warn(...args);
export const error = (...args: any[]) => getLogger().error(...args);
export const success = (...args: any[]) => getLogger().success(...args);
export const critical = (...args: any[]) => getLogger().critical(...args);
export const trace = (...args: any[]) => getLogger().trace(...args);
export const table = (data: any, columns?: string[]) => getLogger().table(data, columns);
export const group = (label: string, collapsed?: boolean) => getLogger().group(label, collapsed);
export const groupEnd = () => getLogger().groupEnd();
export const time = (label: string) => getLogger().time(label);
export const timeEnd = (label: string) => getLogger().timeEnd(label);
export const setGlobalPrefix = (prefix: string) => getLogger().setGlobalPrefix(prefix);
export const scope = (name: string) => getLogger().scope(name);
export const component = (name: string) => getLogger().component(name);
export const api = (name: string) => getLogger().api(name);
export const badges = (badgeList: string[]) => getLogger().badges(badgeList);
export const badge = (badgeName: string) => getLogger().badge(badgeName);
export const clearBadges = () => getLogger().clearBadges();
export const setVerbosity = (level: Verbosity) => getLogger().setVerbosity(level);
export const addHandler = (handler: ILogHandler) => getLogger().addHandler(handler);
export const setTheme = (theme: ThemeVariant) => getLogger().setTheme(theme);
export const setBannerType = (bannerType: BannerType) => getLogger().setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => getLogger().showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) => 
    getLogger().logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) => 
    getLogger().logAnimated(message, duration);
export const cli = (command: string) => getLogger().cli(command);

// Type exports
export type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    StyleOptions,
    ILogHandler,
    LoggerConfig,
    LogMetadata,
    StackInfo,
    TimerEntry,
    TimerResult,
    OutputFormat,
    IScopedLogger,
    IAPILogger,
    IComponentLogger,
    Bindings,
    SerializerFn,
    SerializerContext,
    SerializerConfig,
    ISerializerRegistry,
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    IHookManager,
    TransportRecord,
    TransportOptions,
    TransportTarget,
    ITransport,
    StyleCacheConfig
} from './types/index.js';

// Styling utilities
export { 
    StyleBuilder,
    StylePresets,
    THEME_PRESETS,
    THEME_BANNERS,
    BANNER_VARIANTS
} from './styling/index.js';

// Handler exports
export {
    FileLogHandler,
    RemoteLogHandler,
    AnalyticsLogHandler
} from './handlers/index.js';

// Serializers
export { SerializerRegistry } from './serializers/index.js';

// Hooks & Middleware
export { HookManager } from './hooks/index.js';

// Transports
export {
    TransportManager,
    ConsoleTransport,
    FileTransport,
    HttpTransport
} from './transports/index.js';

// Style Cache
export { StyleCache, getStyleCache } from './styling/StyleCache.js';

// Enterprise feature function exports
import type { SerializerFn, HookEvent, HookCallback, MiddlewareFn, TransportTarget } from './types/index.js';
export const addSerializer = <T>(
    type: new (...args: any[]) => T,
    serializer: SerializerFn<T>,
    priority?: number
) => getLogger().addSerializer(type, serializer, priority);
export const removeSerializer = <T>(type: new (...args: any[]) => T) =>
    getLogger().removeSerializer(type);
export const on = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getLogger().on(event, callback, priority);
export const once = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getLogger().once(event, callback, priority);
export const off = (event: HookEvent, callback: HookCallback) =>
    getLogger().off(event, callback);
export const use = (middleware: MiddlewareFn, priority?: number) =>
    getLogger().use(middleware, priority);
export const addTransport = (target: TransportTarget) =>
    getLogger().addTransport(target);
export const removeTransport = (id: string) =>
    getLogger().removeTransport(id);
export const flushTransports = () =>
    getLogger().flushTransports();
export const closeTransports = () =>
    getLogger().closeTransports();

// Scoped loggers
export {
    ScopedLogger,
    APILogger,
    ComponentLogger,
    ContextLogger
} from './ScopedLogger.js';

// Constants
export { DEFAULT_CONFIG } from './constants.js';

// Utility exports
export {
    parseStackTrace,
    formatTimestamp,
    detectOptimalFormat,
    createOutput,
    createANSIOutput,
    createBuildOutput,
    createCIOutput
} from './utils/index.js';

// ANSI color utilities
export {
    ansiStyle,
    ansiColor,
    ansiBackground,
    ansiBold,
    ansiDim,
    ansiUnderline,
    formatLogLevelANSI,
    formatSuccessANSI,
    BUILD_FORMATTERS,
    sanitizeEmojis
} from './utils/ansi-colors.js';

// Environment detection and presets
export {
    BUILD_PRESETS,
    ENVIRONMENT_DETECTION,
    detectEnvironmentPreset,
    getOptimalConfig
} from './constants.js';

/**
 * Utilidades de estilo para crear estilos personalizados de consola
 * 
 * @example
 * // Crear estilo personalizado
 * import { createStyle, stylePresets } from '@mks2508/better-logger';
 * 
 * const miEstilo = createStyle()
 *   .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
 *   .color('white')
 *   .padding('10px')
 *   .rounded('8px')
 *   .bold()
 *   .build();
 * 
 * console.log('%cMensaje estilizado', miEstilo);
 * 
 * @example
 * // Usar presets predefinidos
 * console.log('%cÉxito!', stylePresets.success);
 * console.log('%cError!', stylePresets.error);
 * 
 * @since 0.3.0
 */
import { StyleBuilder, StylePresets } from './styling/index.js';

/**
 * Crea una nueva instancia de StyleBuilder para estilos personalizados de consola
 * 
 * @returns {StyleBuilder} Constructor de estilos encadenable
 * 
 * @example
 * const estilo = createStyle()
 *   .gradient('#667eea', '#764ba2')
 *   .color('white')
 *   .padding('8px 16px')
 *   .rounded('4px')
 *   .shadow('0 2px 4px rgba(0,0,0,0.2)')
 *   .build();
 * 
 * @since 0.3.0
 */
export const createStyle = () => new StyleBuilder();

/**
 * Presets de estilo predefinidos para casos de uso comunes
 * 
 * @constant {Object} stylePresets
 * 
 * @example
 * console.log('%cOperación exitosa', stylePresets.success);
 * console.log('%cAdvertencia', stylePresets.warning);
 * console.log('%cError crítico', stylePresets.error);
 * console.log('%cInformación', stylePresets.info);
 * console.log('%cDestacado', stylePresets.accent);
 * 
 * @since 0.3.0
 */
export const stylePresets = {
    success: StylePresets.success().build(),
    error: StylePresets.error().build(),
    warning: StylePresets.warning().build(),
    info: StylePresets.info().build(),
    accent: StylePresets.accent().build(),
};