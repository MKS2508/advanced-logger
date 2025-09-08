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

// Create singleton instance with all features enabled
const logger = new Logger();

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
export default logger;

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
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
export const success = (...args: any[]) => logger.success(...args);
export const critical = (...args: any[]) => logger.critical(...args);
export const trace = (...args: any[]) => logger.trace(...args);
export const table = (data: any, columns?: string[]) => logger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => logger.group(label, collapsed);
export const groupEnd = () => logger.groupEnd();
export const time = (label: string) => logger.time(label);
export const timeEnd = (label: string) => logger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => logger.setGlobalPrefix(prefix);
export const scope = (prefix: string) => logger.scope(prefix);
export const setVerbosity = (level: Verbosity) => logger.setVerbosity(level);
export const addHandler = (handler: ILogHandler) => logger.addHandler(handler);
export const setTheme = (theme: ThemeVariant) => logger.setTheme(theme);
export const setBannerType = (bannerType: BannerType) => logger.setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => logger.showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) => 
    logger.logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) => 
    logger.logAnimated(message, duration);
export const cli = (command: string) => logger.cli(command);

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
    TimerEntry
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

// Constants
export { DEFAULT_CONFIG } from './constants.js';

// Utility exports
export {
    parseStackTrace,
    formatTimestamp
} from './utils/index.js';

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