/**
 * @fileoverview Styled output creation utilities for Advanced Logger
 */

import type { LogLevel, StackInfo, DevToolsTheme, AdaptiveColors } from '../types/index.js';
import { formatTimestamp } from './timestamps.js';
import { StyleBuilder } from '../styling/index.js';
import { ADAPTIVE_COLORS } from '../constants.js';
import { getEnvironment, supportsANSI } from './environment-detector.js';
import { adaptToTerminal } from './adapter.js';
import type { LogStyles } from '../types/index.js';

/**
 * Style configuration for each log level
 */
export interface LevelStyleConfig {
    emoji: string;
    label: string;
    background: string;
    color: string;
    border: string;
    shadow: string;
}

/**
 * Detects the current DevTools theme preference
 */
export function detectDevToolsTheme(): DevToolsTheme {
    try {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return 'light'; // Safe fallback for SSR or older browsers
        }
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
        console.warn('Failed to detect DevTools theme:', error);
        return 'light'; // Fallback to light theme
    }
}

/**
 * Gets adaptive color based on current DevTools theme
 */
export function getAdaptiveColor(colors: AdaptiveColors, theme?: DevToolsTheme): string {
    const currentTheme = theme ?? detectDevToolsTheme();
    return colors[currentTheme];
}

/**
 * Sets up theme change listener for dynamic updates
 */
export function setupThemeChangeListener(callback: (theme: DevToolsTheme) => void): (() => void) | null {
    try {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return null;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            callback(e.matches ? 'dark' : 'light');
        };

        // Use newer addEventListener if available, fallback to addListener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener?.(handler);
        }

        return null;
    } catch (error) {
        console.warn('Failed to set up theme change listener:', error);
        return null;
    }
}


/**
 * Creates styled console output with multiple %c formatters
 * Automatically adapts to browser or terminal environment
 */
export function createStyledOutput(
    level: LogLevel,
    levelStyles: Record<LogLevel | 'success', LevelStyleConfig>,
    prefix: string | undefined,
    message: string,
    stackInfo: StackInfo | null,
    autoDetectTheme: boolean = true,
    presetStyles?: LogStyles,
    presetName?: string
): [string, ...string[]] {
    const levelConfig = levelStyles[level];
    const timestamp = formatTimestamp();
    const environment = getEnvironment();

    // Check if we should use terminal rendering
    if (environment !== 'browser' && supportsANSI()) {
        return createTerminalOutput(level, message, timestamp, prefix, stackInfo, presetStyles, presetName);
    }

    // Browser rendering (existing logic)
    const currentTheme = autoDetectTheme ? detectDevToolsTheme() : 'light';

    // Base styles with adaptive colors
    const timestampStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.timestamp, currentTheme))
        .size('11px')
        .font('Monaco, Consolas, monospace')
        .build();

    const levelStyle = new StyleBuilder()
        .bg(levelConfig.background)
        .color(levelConfig.color)
        .border(levelConfig.border)
        .shadow(levelConfig.shadow)
        .padding('2px 8px')
        .rounded('4px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('12px')
        .build();

    const prefixStyle = new StyleBuilder()
        .bg(getAdaptiveColor(ADAPTIVE_COLORS.prefixBackground, currentTheme))
        .color(getAdaptiveColor(ADAPTIVE_COLORS.prefix, currentTheme))
        .padding('2px 6px')
        .rounded('3px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('11px')
        .build();

    const messageStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.messageText, currentTheme))
        .font('system-ui, -apple-system, sans-serif')
        .size('14px')
        .build();

    const locationStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.location, currentTheme))
        .size('11px')
        .font('Monaco, Consolas, monospace')
        .build();

    // Build format string and styles
    let format = `%c${timestamp.slice(11, 23)} %c${levelConfig.emoji} ${levelConfig.label}`;
    const styles = [timestampStyle, levelStyle];

    if (prefix) {
        format += ` %c${prefix}`;
        styles.push(prefixStyle);
    }

    format += ` %c${message}`;
    styles.push(messageStyle);

    if (stackInfo) {
        format += ` %c(${stackInfo.file}:${stackInfo.line}:${stackInfo.column})`;
        styles.push(locationStyle);
    }

    return [format, ...styles];
}

/**
 * Create a unique ID for log entries
 */
export function generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Escape HTML entities for safe HTML output
 */
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Convert objects to safe string representation for logging
 */
export function safeStringify(obj: any, _maxDepth = 3): string {
    try {
        return JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Error) return `[Error: ${value.message}]`;
            if (value instanceof Date) return value.toISOString();
            if (typeof value === 'undefined') return '[undefined]';
            return value;
        }, 2);
    } catch (error) {
        return String(obj);
    }
}

/**
 * Create terminal output with ANSI colors and formatting
 */
export function createTerminalOutput(
    level: LogLevel,
    message: string,
    timestamp?: string,
    prefix?: string,
    stackInfo?: StackInfo | null,
    presetStyles?: LogStyles,
    presetName?: string
): [string, ...string[]] {
    const location = stackInfo ? `${stackInfo.file}:${stackInfo.line}:${stackInfo.column}` : undefined;

    // Use the adapter to convert styles to ANSI
    const ansiStyle = adaptToTerminal(
        level,
        message,
        timestamp,
        prefix,
        location,
        presetStyles,
        presetName
    );

    return [ansiStyle.text];
}