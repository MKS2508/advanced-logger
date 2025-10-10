/**
 * @fileoverview ANSI color utilities for terminal environments
 * @since 1.0.0
 */

import type { LogLevel } from '../types/index.js';
import { supportsANSIColors } from './environment.js';

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
    if (!supportsANSIColors()) return text;
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

    if (!supportsANSIColors()) {
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

    if (!supportsANSIColors()) {
        return `${emoji} SUCCESS: ${message}`;
    }

    const prefix = ansiStyle(`${emoji} SUCCESS:`, [style.color, ...style.styles]);
    return `${prefix} ${message}`;
}

/**
 * Format prefix for terminal
 */
export function formatPrefixANSI(prefix: string): string {
    if (!supportsANSIColors()) {
        return `[${prefix}]`;
    }

    return ansiStyle(`[${prefix}]`, [ANSI_CODES.cyan, ANSI_CODES.bold]);
}

/**
 * Format file location for terminal
 */
export function formatLocationANSI(location: string): string {
    if (!supportsANSIColors()) {
        return `(${location})`;
    }

    return ansiColor(`(${location})`, ANSI_CODES.brightBlack);
}

/**
 * Format build-specific messages
 */
export const BUILD_FORMATTERS = {
    /**
     * Format compilation step
     */
    compilation: (step: string, status: 'starting' | 'completed' | 'failed' = 'starting') => {
        const stepText = ansiBold(step);

        switch (status) {
            case 'starting':
                return `${ansiColor('⚙️', ANSI_CODES.blue)} ${stepText}...`;
            case 'completed':
                return `${ansiColor('✓', ANSI_CODES.green)} ${stepText} ${ansiColor('completed', ANSI_CODES.green)}`;
            case 'failed':
                return `${ansiColor('✗', ANSI_CODES.red)} ${stepText} ${ansiColor('failed', ANSI_CODES.red)}`;
            default:
                return stepText;
        }
    },

    /**
     * Format warning message
     */
    warning: (message: string) => {
        return `${ansiColor('⚠', ANSI_CODES.yellow)} ${ansiStyle('Warning:', [ANSI_CODES.yellow, ANSI_CODES.bold])} ${message}`;
    },

    /**
     * Format error message
     */
    error: (message: string) => {
        return `${ansiColor('✗', ANSI_CODES.red)} ${ansiStyle('Error:', [ANSI_CODES.red, ANSI_CODES.bold])} ${message}`;
    },

    /**
     * Format success message
     */
    success: (message: string) => {
        return `${ansiColor('✓', ANSI_CODES.green)} ${ansiColor(message, ANSI_CODES.green)}`;
    },

    /**
     * Format info message
     */
    info: (message: string) => {
        return `${ansiColor('ℹ', ANSI_CODES.blue)} ${message}`;
    }
};

/**
 * Terminal-friendly emoji alternatives for environments that don't support them
 */
export const EMOJI_ALTERNATIVES = {
    '🔍': '[DEBUG]',
    'ℹ️': '[INFO]',
    '⚠️': '[WARN]',
    '❌': '[ERROR]',
    '🚨': '[CRITICAL]',
    '✅': '[OK]',
    '✓': '[OK]',
    '✗': '[FAIL]',
    '⚙️': '[BUILD]',
    '📦': '[PKG]'
};

/**
 * Replace emojis with text alternatives for non-emoji terminals
 */
export function sanitizeEmojis(text: string): string {
    // Check if we're in a terminal that likely supports emojis
    const isModernTerminal = process.env.TERM &&
        (process.env.TERM.includes('xterm') ||
         process.env.TERM.includes('screen') ||
         process.env.TERM.includes('tmux'));

    const isCI = process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL;

    // Use emojis if we have a modern terminal and not in CI
    if (isModernTerminal && !isCI) {
        return text;
    }

    // Replace emojis with text alternatives
    let result = text;
    Object.entries(EMOJI_ALTERNATIVES).forEach(([emoji, alt]) => {
        result = result.replace(new RegExp(emoji, 'g'), alt);
    });

    return result;
}