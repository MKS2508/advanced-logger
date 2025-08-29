/**
 * @fileoverview Styled output creation utilities for Advanced Logger
 */

import type { LogLevel, StackInfo } from '../types/index.js';
import { formatTimestamp } from './timestamps.js';
import { StyleBuilder } from '../styling/index.js';

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
 * Creates styled console output with multiple %c formatters
 */
export function createStyledOutput(
    level: LogLevel,
    levelStyles: Record<LogLevel | 'success', LevelStyleConfig>,
    prefix: string | undefined,
    message: string,
    stackInfo: StackInfo | null
): [string, ...string[]] {
    const levelConfig = levelStyles[level];
    const timestamp = formatTimestamp();

    // Base styles
    const timestampStyle = new StyleBuilder()
        .color('#666')
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
        .bg('#2d3748')
        .color('#e2e8f0')
        .padding('2px 6px')
        .rounded('3px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('11px')
        .build();

    const messageStyle = new StyleBuilder()
        .color('#2d3748')
        .font('system-ui, -apple-system, sans-serif')
        .size('14px')
        .build();

    const locationStyle = new StyleBuilder()
        .color('#718096')
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