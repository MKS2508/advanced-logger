/**
 * Terminal Formatter - Alignment, key-value, and advanced terminal formatting
 */

import { getTerminalWidth } from '../utils/environment-detector.js';
import { getANSIForeground, ANSI, type ColorCapability } from './color-converter.js';
import type { ColumnConfig, ColumnAlign, BadgeStyle, TimestampFormat, LogOptions } from '../types/index.js';

export function stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function getVisibleLength(str: string): number {
    return stripAnsi(str).length;
}

export function padToWidth(str: string, width: number, align: ColumnAlign = 'left'): string {
    const visibleLen = getVisibleLength(str);
    if (visibleLen >= width) return str;

    const padding = width - visibleLen;

    switch (align) {
        case 'right':
            return ' '.repeat(padding) + str;
        case 'center':
            const leftPad = Math.floor(padding / 2);
            const rightPad = padding - leftPad;
            return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
        case 'left':
        default:
            return str + ' '.repeat(padding);
    }
}

export function formatWithRightAlign(
    leftContent: string,
    rightContent: string,
    maxWidth?: number
): string {
    const width = maxWidth ?? getTerminalWidth();
    const leftLen = getVisibleLength(leftContent);
    const rightLen = getVisibleLength(rightContent);

    const gap = width - leftLen - rightLen;
    if (gap <= 1) {
        return `${leftContent} ${rightContent}`;
    }

    return `${leftContent}${' '.repeat(gap)}${rightContent}`;
}

export function formatColumns(
    columns: ColumnConfig[],
    maxWidth?: number,
    colorCapability: ColorCapability = 'full'
): string {
    const width = maxWidth ?? getTerminalWidth();
    const totalColumns = columns.length;

    const columnsWithWidths = columns.map((col, idx) => {
        if (col.width) return { ...col, calculatedWidth: col.width };

        const remainingWidth = width - columns
            .filter((c, i) => i !== idx && c.width)
            .reduce((sum, c) => sum + (c.width ?? 0), 0);

        const autoColumns = columns.filter(c => !c.width).length;
        const calculatedWidth = Math.floor(remainingWidth / autoColumns);

        return { ...col, calculatedWidth };
    });

    return columnsWithWidths.map(col => {
        let content = col.content;

        if (col.color && colorCapability !== 'none') {
            const colorCode = getANSIForeground(col.color, colorCapability);
            content = `${colorCode}${content}${ANSI.reset}`;
        }

        return padToWidth(content, col.calculatedWidth, col.align);
    }).join('');
}

export function formatKeyValue(
    obj: Record<string, unknown>,
    colorCapability: ColorCapability = 'full',
    options: { separator?: string; keyColor?: string; valueColor?: string } = {}
): string {
    const {
        separator = '  ',
        keyColor = '#888888',
        valueColor = '#00ffff'
    } = options;

    const entries = Object.entries(obj);
    if (entries.length === 0) return '';

    const keyColorCode = colorCapability !== 'none'
        ? getANSIForeground(keyColor, colorCapability)
        : '';
    const valueColorCode = colorCapability !== 'none'
        ? getANSIForeground(valueColor, colorCapability)
        : '';
    const reset = colorCapability !== 'none' ? ANSI.reset : '';

    return entries
        .map(([key, value]) => {
            const valueStr = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
            return `${keyColorCode}${key}:${reset} ${valueColorCode}${valueStr}${reset}`;
        })
        .join(separator);
}

export function isKeyValueObject(obj: unknown): obj is Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null) return false;
    if (Array.isArray(obj)) return false;

    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) return false;

    const values = Object.values(obj);
    return values.every(v =>
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        v === null
    );
}

export function formatBadge(
    badge: string,
    style: BadgeStyle = 'brackets',
    colorCapability: ColorCapability = 'full',
    color?: string
): string {
    const colorCode = color && colorCapability !== 'none'
        ? getANSIForeground(color, colorCapability)
        : '';
    const reset = colorCapability !== 'none' ? ANSI.reset : '';
    const bgBlack = colorCapability !== 'none' ? ANSI.bg.black : '';

    const text = badge.toUpperCase();

    switch (style) {
        case 'rounded':
            return `${bgBlack}${colorCode}⟨${text}⟩${reset}`;
        case 'plain':
            return `${colorCode}${text}${reset}`;
        case 'unicode':
            return `${bgBlack}${colorCode}╭${text}╮${reset}`;
        case 'pill':
            return `${bgBlack}${colorCode}⦗${text}⦘${reset}`;
        case 'brackets':
        default:
            return `${bgBlack}${colorCode}[${text}]${reset}`;
    }
}

export function formatTimestamp(
    date: Date = new Date(),
    format: TimestampFormat = 'time'
): string {
    switch (format) {
        case 'iso':
            return date.toISOString();
        case 'date':
            return date.toISOString().split('T')[0] ?? '';
        case 'time':
            return date.toTimeString().slice(0, 8);
        case 'timeMs':
            return date.toTimeString().slice(0, 8) + '.' +
                   String(date.getMilliseconds()).padStart(3, '0');
        case 'relative':
            return formatRelativeTime(date);
        case 'elapsed':
            return formatElapsedTime(date);
        case 'custom':
        default:
            return date.toLocaleTimeString();
    }
}

let startTime: number | null = null;

export function formatRelativeTime(date: Date): string {
    if (startTime === null) {
        startTime = Date.now();
    }

    const diff = date.getTime() - startTime;

    if (diff < 1000) {
        return `+${diff}ms`;
    } else if (diff < 60000) {
        return `+${(diff / 1000).toFixed(1)}s`;
    } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `+${mins}m${secs}s`;
    }
}

export function formatElapsedTime(date: Date): string {
    if (startTime === null) {
        startTime = Date.now();
    }

    const diff = date.getTime() - startTime;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function resetStartTime(): void {
    startTime = Date.now();
}

export function applyLogOptions(
    message: string,
    options: LogOptions,
    colorCapability: ColorCapability = 'full'
): string {
    let result = message;

    if (options.rightAlign) {
        result = formatWithRightAlign(message, options.rightAlign);
    }

    return result;
}
