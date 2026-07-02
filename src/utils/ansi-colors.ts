/**
 * @fileoverview ANSI color utilities for terminal environments
 */

import type { LogLevel } from '../types/index.js';
import { supportsANSI } from './environment-detector.js';

/**
 * ANSI color codes for terminal styling
 */
export const ANSI_CODES = {
    // Colors
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,

    // Bright colors
    brightBlack: 90,
    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97,

    // Background colors
    bgBlack: 40,
    bgRed: 41,
    bgGreen: 42,
    bgYellow: 43,
    bgBlue: 44,
    bgMagenta: 45,
    bgCyan: 46,
    bgWhite: 47,

    // Background bright colors
    bgBrightBlack: 100,
    bgBrightRed: 101,
    bgBrightGreen: 102,
    bgBrightYellow: 103,
    bgBrightBlue: 104,
    bgBrightMagenta: 105,
    bgBrightCyan: 106,
    bgBrightWhite: 107,

    // Styles
    reset: 0,
    bold: 1,
    dim: 2,
    italic: 3,
    underline: 4,
    blink: 5,
    inverse: 7,
    hidden: 8,
    strikethrough: 9,

    // Reset specific
    resetBold: 22,
    resetDim: 22,
    resetItalic: 23,
    resetUnderline: 24,
    resetBlink: 25,
    resetInverse: 27,
    resetHidden: 28,
    resetStrikethrough: 29
} as const;

/**
 * ANSI color presets for different log levels
 */
export const ANSI_LEVEL_STYLES: Record<LogLevel | 'success', {
    color: number;
    background?: number;
    styles: number[];
    emoji: string;
}> = {
    trace: {
        color: ANSI_CODES.brightBlack,
        styles: [ANSI_CODES.dim],
        emoji: '🔬'
    },
    debug: {
        color: ANSI_CODES.brightBlack,
        styles: [ANSI_CODES.dim],
        emoji: '🔍'
    },
    info: {
        color: ANSI_CODES.blue,
        styles: [ANSI_CODES.bold],
        emoji: 'ℹ️'
    },
    warn: {
        color: ANSI_CODES.yellow,
        background: ANSI_CODES.bgYellow,
        styles: [ANSI_CODES.bold, ANSI_CODES.black],
        emoji: '⚠️'
    },
    error: {
        color: ANSI_CODES.red,
        background: ANSI_CODES.bgRed,
        styles: [ANSI_CODES.bold],
        emoji: '❌'
    },
    critical: {
        color: ANSI_CODES.white,
        background: ANSI_CODES.bgRed,
        styles: [ANSI_CODES.bold, ANSI_CODES.blink],
        emoji: '🚨'
    },
    success: {
        color: ANSI_CODES.green,
        background: ANSI_CODES.bgGreen,
        styles: [ANSI_CODES.bold],
        emoji: '✅'
    }
};

/**
 * Creates an ANSI escape sequence
 */
function ansi(code: number | number[]): string {
    const codes = Array.isArray(code) ? code : [code];
    return `\x1b[${codes.join(';')}m`;
}

/**
 * Applies ANSI styling to text
 */
export function ansiStyle(text: string, codes: number[]): string {
    if (!supportsANSI()) return text;
    return `${ansi(codes)}${text}${ansi(ANSI_CODES.reset)}`;
}

/**
 * Applies color to text
 */
export function ansiColor(text: string, color: number): string {
    return ansiStyle(text, [color]);
}

/**
 * Applies background color to text
 */
export function ansiBackground(text: string, bg: number, color?: number): string {
    if (color) {
        return ansiStyle(text, [color, bg]);
    }
    return ansiStyle(text, [bg]);
}

/**
 * Makes text bold
 */
export function ansiBold(text: string): string {
    return ansiStyle(text, [ANSI_CODES.bold]);
}

/**
 * Makes text dim
 */
export function ansiDim(text: string): string {
    return ansiStyle(text, [ANSI_CODES.dim]);
}

/**
 * Underlines text
 */
export function ansiUnderline(text: string): string {
    return ansiStyle(text, [ANSI_CODES.underline]);
}

/**
 * Specialized formatters for different contexts
 */

/**
 * Format timestamp for terminal
 */
export function formatTimestampANSI(timestamp: string): string {
    return ansiColor(timestamp, ANSI_CODES.brightBlack);
}

/**
 * Format log level for terminal
 */
export function formatLogLevelANSI(level: LogLevel, useEmojis: boolean = true): string {
    const style = ANSI_LEVEL_STYLES[level];
    const emoji = useEmojis ? style.emoji : '';
    const label = level.toUpperCase().padEnd(8);

    if (!supportsANSI()) {
        return `${emoji} ${label}`;
    }

    let codes = [style.color, ...style.styles];
    if (style.background) {
        codes.push(style.background);
    }

    return ansiStyle(`${emoji} ${label}`, codes);
}

/**
 * Format success message for terminal
 */
export function formatSuccessANSI(message: string, useEmojis: boolean = true): string {
    const style = ANSI_LEVEL_STYLES.success;
    const emoji = useEmojis ? style.emoji : '';

    if (!supportsANSI()) {
        return `${emoji} SUCCESS: ${message}`;
    }

    const prefix = ansiStyle(`${emoji} SUCCESS:`, [style.color, ...style.styles]);
    return `${prefix} ${message}`;
}

/**
 * Format prefix for terminal
 */
export function formatPrefixANSI(prefix: string): string {
    if (!supportsANSI()) {
        return `[${prefix}]`;
    }

    return ansiStyle(`[${prefix}]`, [ANSI_CODES.cyan, ANSI_CODES.bold]);
}

/**
 * Format file location for terminal
 */
export function formatLocationANSI(location: string): string {
    if (!supportsANSI()) {
        return `(${location})`;
    }

    return ansiColor(`(${location})`, ANSI_CODES.brightBlack);
}