/**
 * @fileoverview Global constants for Advanced Logger
 */

import type { LogLevel } from './types/index.js';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    verbosity: 'info' as const,
    enableColors: true,
    enableTimestamps: true,
    enableStackTrace: true,
    theme: 'default' as const,
    bannerType: 'simple' as const,
    bufferSize: 1000,
} as const;

/**
 * Maximum allowed buffer sizes for performance
 */
export const BUFFER_LIMITS = {
    MIN_SIZE: 50,
    DEFAULT_SIZE: 1000,
    MAX_SIZE: 10000,
} as const;

/**
 * Export format definitions with extensions
 */
export const EXPORT_FORMATS = {
    json: { extension: '.json', mimeType: 'application/json' },
    csv: { extension: '.csv', mimeType: 'text/csv' },
    markdown: { extension: '.md', mimeType: 'text/markdown' },
    plain: { extension: '.txt', mimeType: 'text/plain' },
    html: { extension: '.html', mimeType: 'text/html' },
} as const;

/**
 * CLI command definitions
 */
export const CLI_COMMANDS = {
    config: 'config',
    help: 'help',
    themes: 'themes',
    banners: 'banners',
    banner: 'banner',
    status: 'status',
    reset: 'reset',
    demo: 'demo',
    export: 'export',
    copy: 'copy',
    'buffer-size': 'buffer-size',
    'clear-buffer': 'clear-buffer',
    'buffer-info': 'buffer-info',
} as const;

/**
 * Time parsing constants for relative time filters
 */
export const TIME_UNITS = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
} as const;

/**
 * Default styling values
 */
export const STYLE_DEFAULTS = {
    FONT_FAMILY: 'Monaco, Consolas, monospace',
    FONT_SIZE: '12px',
    BORDER_RADIUS: '4px',
    PADDING: '4px 8px',
} as const;

/**
 * Level priority mapping for filtering
 */
export const LEVEL_PRIORITIES: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
} as const;