/**
 * @fileoverview Styling Module - Advanced visual features for Better Logger
 * @version 0.0.1
 * 
 * This module provides advanced styling features including SVG support, CSS animations,
 * themed banners, and visual enhancements for console logging.
 */

// Import core logger
import { Logger } from './Logger.js';

// Styling imports
import {
    StyleBuilder,
    StylePresets,
    THEME_PRESETS,
    THEME_BANNERS,
    displayInitBanner,
    BANNER_VARIANTS
} from './styling/index.js';

// Types
import type {
    ThemeVariant,
    BannerType,
    StyleOptions
} from './types/index.js';

/**
 * Enhanced Logger with advanced styling capabilities
 * 
 * @example
 * ```typescript
 * import { StyledLogger } from '@mks2508/better-logger/styling';
 * 
 * const logger = new StyledLogger();
 * logger.setTheme('neon');
 * logger.logAnimated('🌟 Animated message!');
 * logger.logWithSVG('Custom SVG Logo', svgContent);
 * ```
 */
export class StyledLogger extends Logger {
    /**
     * Log with SVG background image
     * 
     * @param message - The message to log
     * @param svgContent - SVG content as string (optional)
     * @param options - Styling options
     * 
     * @example
     * ```typescript
     * logger.logWithSVG('My App', '<svg>...</svg>', {
     *   width: 400,
     *   height: 80,
     *   padding: '40px 200px'
     * });
     * ```
     */
    logWithSVG(message: string, svgContent?: string, options: StyleOptions = {}): void {
        super.logWithSVG(message, svgContent, options);
    }

    /**
     * Log with animated background gradient
     * 
     * @param message - The message to log  
     * @param duration - Animation duration in seconds
     * 
     * @example
     * ```typescript
     * logger.logAnimated('🚀 Loading...', 2);
     * ```
     */
    logAnimated(message: string, duration: number = 3): void {
        super.logAnimated(message, duration);
    }

    /**
     * Display banner with specified type
     * 
     * @param bannerType - Type of banner to display
     * 
     * @example
     * ```typescript
     * logger.showBanner('animated');
     * ```
     */
    showBanner(bannerType?: BannerType): void {
        super.showBanner(bannerType);
    }

    /**
     * Set banner type for initialization display
     * 
     * @param bannerType - Type of banner to display
     * 
     * @example
     * ```typescript
     * logger.setBannerType('svg');
     * ```
     */
    setBannerType(bannerType: BannerType): void {
        super.setBannerType(bannerType);
    }

    /**
     * Sets the logger theme with visual banner
     * 
     * @param theme - Theme variant to apply
     * 
     * @example
     * ```typescript
     * logger.setTheme('cyberpunk'); // Shows themed banner
     * ```
     */
    setTheme(theme: ThemeVariant): void {
        super.setTheme(theme);
    }
}

// Create singleton instance
const styledLogger = new StyledLogger();

/**
 * Utility functions for creating custom styles
 * 
 * @example
 * ```typescript
 * import { createStyle, StyleBuilder } from '@mks2508/better-logger/styling';
 * 
 * const myStyle = createStyle()
 *   .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
 *   .color('white')
 *   .padding('10px')
 *   .build();
 * 
 * console.log('%cCustom Message', myStyle);
 * ```
 */
export const createStyle = () => new StyleBuilder();

/**
 * Pre-built style presets
 * 
 * @example
 * ```typescript
 * import { stylePresets } from '@mks2508/better-logger/styling';
 * 
 * console.log('%cSuccess!', stylePresets.success);
 * console.log('%cError!', stylePresets.error);
 * ```
 */
export const stylePresets = {
    success: StylePresets.success().build(),
    error: StylePresets.error().build(),
    warning: StylePresets.warning().build(),
    info: StylePresets.info().build(),
    accent: StylePresets.accent().build(),
};

/**
 * Available themes for the logger
 * 
 * @example
 * ```typescript
 * import { themes } from '@mks2508/better-logger/styling';
 * 
 * console.log('Available themes:', Object.keys(themes));
 * ```
 */
export const themes = Object.keys(THEME_PRESETS);

/**
 * Available banner types
 * 
 * @example
 * ```typescript
 * import { bannerTypes } from '@mks2508/better-logger/styling';
 * 
 * console.log('Available banners:', bannerTypes);
 * ```
 */
export const bannerTypes = Object.keys(BANNER_VARIANTS);

/**
 * Display initialization banner
 * 
 * @param bannerType - Type of banner to display
 * 
 * @example
 * ```typescript
 * import { showInitBanner } from '@mks2508/better-logger/styling';
 * 
 * showInitBanner('animated');
 * ```
 */
export const showInitBanner = (bannerType?: BannerType) => {
    displayInitBanner(bannerType);
};

/**
 * Export individual styled logging methods
 */
export const debug = (...args: any[]) => styledLogger.debug(...args);
export const info = (...args: any[]) => styledLogger.info(...args);
export const warn = (...args: any[]) => styledLogger.warn(...args);
export const error = (...args: any[]) => styledLogger.error(...args);
export const success = (...args: any[]) => styledLogger.success(...args);
export const critical = (...args: any[]) => styledLogger.critical(...args);
export const trace = (...args: any[]) => styledLogger.trace(...args);
export const table = (data: any, columns?: string[]) => styledLogger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => styledLogger.group(label, collapsed);
export const groupEnd = () => styledLogger.groupEnd();
export const time = (label: string) => styledLogger.time(label);
export const timeEnd = (label: string) => styledLogger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => styledLogger.setGlobalPrefix(prefix);
export const createScopedLogger = (prefix: string) => styledLogger.createScopedLogger(prefix);
export const setVerbosity = (level: any) => styledLogger.setVerbosity(level);
export const setTheme = (theme: ThemeVariant) => styledLogger.setTheme(theme);
export const setBannerType = (bannerType: BannerType) => styledLogger.setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => styledLogger.showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) => 
    styledLogger.logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) => 
    styledLogger.logAnimated(message, duration);

// Export the singleton as default
export default styledLogger;

// Re-export styling utilities
export {
    StyleBuilder,
    StylePresets,
    THEME_PRESETS,
    THEME_BANNERS,
    BANNER_VARIANTS
} from './styling/index.js';

// Re-export types
export type {
    ThemeVariant,
    BannerType,
    StyleOptions
} from './types/index.js';