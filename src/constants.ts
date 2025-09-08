/**
 * @fileoverview Global constants for Advanced Logger
 */

import type { LogLevel, AdaptiveColors } from './types/index.js';
import type { LevelStyleConfig } from './utils/index.js';

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
    autoDetectTheme: true,
} as const;

/**
 * Basic level styles for core module (minimal CSS styling)
 */
export const LEVEL_STYLES: Record<LogLevel | 'success', LevelStyleConfig> = {
    debug: {
        emoji: '🔍',
        label: 'DEBUG',
        background: 'linear-gradient(90deg, #6c757d, #495057)',
        color: '#ffffff',
        border: '1px solid #6c757d',
        shadow: '0 2px 4px rgba(108, 117, 125, 0.3)'
    },
    info: {
        emoji: 'ℹ️',
        label: 'INFO',
        background: 'linear-gradient(90deg, #007bff, #0056b3)',
        color: '#ffffff',
        border: '1px solid #007bff',
        shadow: '0 2px 4px rgba(0, 123, 255, 0.3)'
    },
    warn: {
        emoji: '⚠️',
        label: 'WARN',
        background: 'linear-gradient(90deg, #ffc107, #e0a800)',
        color: '#000000',
        border: '1px solid #ffc107',
        shadow: '0 2px 4px rgba(255, 193, 7, 0.3)'
    },
    error: {
        emoji: '❌',
        label: 'ERROR',
        background: 'linear-gradient(90deg, #dc3545, #c82333)',
        color: '#ffffff',
        border: '1px solid #dc3545',
        shadow: '0 2px 4px rgba(220, 53, 69, 0.3)'
    },
    critical: {
        emoji: '🚨',
        label: 'CRITICAL',
        background: 'linear-gradient(90deg, #8B0000, #FF0000)',
        color: '#ffffff',
        border: '2px solid #FF0000',
        shadow: '0 4px 8px rgba(255, 0, 0, 0.4)'
    },
    success: {
        emoji: '✅',
        label: 'SUCCESS',
        background: 'linear-gradient(90deg, #28a745, #1e7e34)',
        color: '#ffffff',
        border: '1px solid #28a745',
        shadow: '0 2px 4px rgba(40, 167, 69, 0.3)'
    }
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

/**
 * Adaptive color configurations for DevTools theme compatibility
 */
export const ADAPTIVE_COLORS = {
    timestamp: {
        light: '#666666',
        dark: '#a0a0a0',
    },
    messageText: {
        light: '#2d3748',
        dark: '#f7fafc',
    },
    prefix: {
        light: '#2d3748',
        dark: '#e2e8f0',
    },
    prefixBackground: {
        light: '#2d3748',
        dark: '#4a5568',
    },
    location: {
        light: '#718096',
        dark: '#a0aec0',
    },
} as const satisfies Record<string, AdaptiveColors>;