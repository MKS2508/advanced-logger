/**
 * @fileoverview Core type definitions for Advanced Logger
 */

/**
 * Supported log levels in hierarchical order (debug < info < warn < error < critical)
 */
export const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
} as const;

/**
 * Log level type derived from LOG_LEVELS keys
 */
export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Verbosity level type for filtering logs
 */
export type Verbosity = LogLevel | 'silent';

/**
 * Theme variants for different visual styles
 */
export type ThemeVariant = 'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk';

/**
 * DevTools theme detection
 */
export type DevToolsTheme = 'light' | 'dark';

/**
 * Banner types for different visual approaches
 */
export type BannerType = 'simple' | 'ascii' | 'unicode' | 'svg' | 'animated';

/**
 * Export formats for log data
 */
export type ExportFormat = 'json' | 'csv' | 'markdown' | 'plain' | 'html';

/**
 * Configuration interface for logger instances
 */
export interface LoggerConfig {
    globalPrefix?: string;
    verbosity: Verbosity;
    enableColors: boolean;
    enableTimestamps: boolean;
    enableStackTrace: boolean;
    theme?: ThemeVariant;
    bannerType?: BannerType;
    bufferSize?: number;
    autoDetectTheme?: boolean;
}

/**
 * Parsed stack trace information
 */
export interface StackInfo {
    file: string;
    line: number;
    column: number;
    function?: string;
}

/**
 * Timer entry for performance measurement
 */
export interface TimerEntry {
    label: string;
    startTime: number;
}

/**
 * Options for styling components
 */
export interface StyleOptions {
    width?: number;
    height?: number;
    padding?: string;
}

/**
 * Adaptive color configuration for light/dark themes
 */
export interface AdaptiveColors {
    light: string;
    dark: string;
}

/**
 * Spacing configuration for log elements
 */
export type SpacingType = 'compact' | 'normal' | 'spacious';

/**
 * Layout configuration for log structure
 */
export interface LogLayout {
    spacing: SpacingType;
    innerPadding?: string;
    outerMargin?: string;
    separator?: string;
}

/**
 * Configuration for individual log parts
 */
export interface LogPartConfig {
    show?: boolean;
    style?: string;
    font?: string;
    size?: string;
    color?: string; // Automatically adaptive by default
    background?: string;
    padding?: string;
    margin?: string;
    border?: string;
    shadow?: string;
    uppercase?: boolean;
}

/**
 * Complete log styles configuration
 */
export interface LogStyles {
    layout?: LogLayout;
    timestamp?: LogPartConfig;
    level?: LogPartConfig;
    prefix?: LogPartConfig;
    message?: LogPartConfig;
    location?: LogPartConfig;
    backdrop?: string;
    transparency?: number;
}