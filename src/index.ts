/**
 * @fileoverview Better Logger - Complete library with all features
 * @version 0.0.1
 * 
 * This is the main entry point that provides the complete Better Logger experience
 * with all advanced features including styling, SVG support, animations, export 
 * capabilities, and remote logging.
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
 * Main Logger class with complete feature set
 * 
 * @example
 * ```typescript
 * import { Logger } from '@mks2508/better-logger';
 * 
 * const logger = new Logger();
 * logger.setTheme('neon');
 * logger.info('Hello world!');
 * logger.logWithSVG('Custom SVG', svgContent);
 * ```
 */
export { Logger };

// Export the singleton as default
export default logger;

// Individual logging methods (bound to singleton)
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
 * Styling utilities for creating custom console styles
 * 
 * @example
 * ```typescript
 * import { createStyle, stylePresets } from '@mks2508/better-logger';
 * 
 * const customStyle = createStyle()
 *   .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
 *   .color('white')
 *   .padding('10px')
 *   .build();
 * 
 * console.log('%cStyled message', customStyle);
 * console.log('%cSuccess!', stylePresets.success);
 * ```
 */
import { StyleBuilder, StylePresets } from './styling/index.js';

/**
 * Creates a new StyleBuilder instance for custom console styling
 */
export const createStyle = () => new StyleBuilder();

/**
 * Pre-built style presets for common use cases
 */
export const stylePresets = {
    success: StylePresets.success().build(),
    error: StylePresets.error().build(),
    warning: StylePresets.warning().build(),
    info: StylePresets.info().build(),
    accent: StylePresets.accent().build(),
};