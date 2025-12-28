/**
 * Terminal Renderer - ANSI color rendering for terminal environments
 * Converts CSS-based styling to ANSI escape sequences for terminal output
 */

import type { LogLevel } from '../types/index.js';
import type { LogStyles } from '../types/index.js';

export type ANSIStyle = {
    text: string;
    timestamp?: string;
    level?: string;
    prefix?: string;
    message?: string;
    location?: string;
    reset: string;
};

export class TerminalRenderer {
    private colorCapability: 'full' | 'basic' | 'none';

    constructor(colorCapability: 'full' | 'basic' | 'none' = 'full') {
        this.colorCapability = colorCapability;
    }

    /**
     * Get ANSI color codes for basic colors
     */
    private getColorCode(color: string, background: boolean = false): string {
        const colorCodes: Record<string, { normal: string; bright: string }> = {
            'black': { normal: '30', bright: '90' },
            'red': { normal: '31', bright: '91' },
            'green': { normal: '32', bright: '92' },
            'yellow': { normal: '33', bright: '93' },
            'blue': { normal: '34', bright: '94' },
            'magenta': { normal: '35', bright: '95' },
            'cyan': { normal: '36', bright: '96' },
            'white': { normal: '37', bright: '97' },
            'gray': { normal: '90', bright: '37' },
            'grey': { normal: '90', bright: '37' }
        };

        const codes = colorCodes[color.toLowerCase()] || { normal: '37', bright: '97' };
        const prefix = background ? '4' : '3';
        return `\x1b[${codes.normal}m`;
    }

    /**
     * Get ANSI style codes
     */
    private getStyleCode(styles: string[]): string {
        const styleCodes: Record<string, string> = {
            'bold': '1',
            'dim': '2',
            'italic': '3',
            'underline': '4',
            'reset': '0'
        };

        const codes = styles.map(style => styleCodes[style] || '0').join(';');
        return codes ? `\x1b[${codes}m` : '';
    }

    /**
     * Convert log styles to ANSI formatting
     */
    renderTerminal(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string,
        styles?: LogStyles
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const result: ANSIStyle = { text: '', reset };

        // Apply preset styles if provided
        if (styles) {
            result.timestamp = this.styleTimestamp(timestamp, styles.timestamp);
            result.level = this.styleLevel(level, styles.level);
            result.prefix = this.stylePrefix(prefix, styles.prefix);
            result.message = this.styleMessage(message, styles.message);
            result.location = this.styleLocation(location, styles.location);
        } else {
            // Default styling based on level
            result.timestamp = this.styleTimestamp(timestamp);
            result.level = this.styleLevel(level);
            result.prefix = this.stylePrefix(prefix);
            result.message = this.styleMessage(message);
            result.location = this.styleLocation(location);
        }

        // Build complete text
        const parts: string[] = [];
        if (result.timestamp) parts.push(result.timestamp);
        if (result.level) parts.push(result.level);
        if (result.prefix) parts.push(result.prefix);
        if (result.message) parts.push(result.message);
        if (result.location) parts.push(result.location);

        result.text = parts.join(' ') + reset;
        return result;
    }

    /**
     * Style timestamp based on preset or defaults
     */
    private styleTimestamp(timestamp?: string, style?: LogStyles['timestamp']): string {
        if (!timestamp || !style?.show) return '';

        if (this.colorCapability === 'none') {
            return timestamp;
        }

        const dimStyle = this.getStyleCode(['dim']);
        return `${dimStyle}${timestamp}${'\x1b[0m'}`;
    }

    /**
     * Style level with appropriate colors and formatting
     */
    private styleLevel(level: LogLevel, style?: LogStyles['level']): string {
        if (!style?.show) return '';

        const levelText = this.getLevelText(level);
        const levelColors: Record<LogLevel, string> = {
            'debug': 'magenta',
            'info': 'blue',
            'warn': 'yellow',
            'error': 'red',
            'critical': 'red'
        };

        if (this.colorCapability === 'none') {
            return `[${levelText}]`;
        }

        const color = levelColors[level] || 'white';
        const colorCode = this.getColorCode(color);
        const boldStyle = this.getStyleCode(['bold']);

        if (style?.style === 'compact') {
            return `${colorCode}[${levelText}]${'\x1b[0m'}`;
        } else {
            return `${colorCode}${boldStyle}[${levelText}]${'\x1b[0m'}`;
        }
    }

    /**
     * Style prefix based on preset - now as a badge
     */
    private stylePrefix(prefix?: string, style?: LogStyles['prefix']): string {
        if (!prefix || !style?.show) return '';

        if (this.colorCapability === 'none') {
            return `[${prefix}]`;
        }

        // Create badge styling similar to level badges
        const colorCode = this.getColorCode('cyan');
        const bgBlack = '\x1b[40m';
        return `${bgBlack}${colorCode}[${prefix.toUpperCase()}]${'\x1b[0m'}`;
    }

    /**
     * Style message based on preset
     */
    private styleMessage(message: string, style?: LogStyles['message']): string {
        if (!style?.show) return message;

        return message; // Messages usually don't need styling
    }

    /**
     * Style location (file:line) information
     */
    private styleLocation(location?: string, style?: LogStyles['location']): string {
        if (!location || !style?.show) return '';

        if (this.colorCapability === 'none') {
            return `(${location})`;
        }

        const dimStyle = this.getStyleCode(['dim']);
        if (style?.style === 'clickable') {
            const underlineStyle = this.getStyleCode(['dim', 'underline']);
            return `${underlineStyle}(${location})${'\x1b[0m'}`;
        }

        return `${dimStyle}(${location})${'\x1b[0m'}`;
    }

    /**
     * Get text representation of log level
     */
    public getLevelText(level: LogLevel): string {
        const levelMap: Record<LogLevel, string> = {
            'debug': 'DEBUG',
            'info': 'INFO',
            'warn': 'WARN',
            'error': 'ERROR',
            'critical': 'CRITICAL'
        };

        return levelMap[level] || String(level).toUpperCase();
    }

    /**
     * Create cyberpunk-style ANSI rendering
     */
    renderCyberpunk(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const levelColors: Record<LogLevel, string> = {
            'debug': '\x1b[95m', // Bright magenta
            'info': '\x1b[94m',  // Bright blue
            'warn': '\x1b[93m',  // Bright yellow
            'error': '\x1b[91m', // Bright red
            'critical': '\x1b[91m\x1b[1m' // Bright red + bold
        };

        const parts: string[] = [];

        if (timestamp) {
            parts.push(`\x1b[90m${timestamp}${reset}`);
        }

        // Cyberpunk level styling
        const levelColor = levelColors[level] || '\x1b[97m';
        const bgBlack = '\x1b[40m';
        parts.push(`${bgBlack}${levelColor} ${this.getLevelText(level)} ${reset}`);

        if (prefix) {
            const bgBlack = '\x1b[40m';
            parts.push(`${bgBlack}\x1b[96m[${prefix.toUpperCase()}]${reset}`);
        }

        parts.push(message);

        if (location) {
            parts.push(`\x1b[90m(${location})${reset}`);
        }

        return {
            text: parts.join(' '),
            reset
        };
    }

    /**
     * Create minimal ANSI rendering
     */
    renderMinimal(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const levelColors: Record<LogLevel, string> = {
            'debug': '\x1b[95m', // Magenta
            'info': '\x1b[94m',  // Blue
            'warn': '\x1b[93m',  // Yellow
            'error': '\x1b[91m', // Red
            'critical': '\x1b[91m\x1b[1m' // Red + bold
        };

        const parts: string[] = [];

        if (timestamp) {
            parts.push(`\x1b[90m${timestamp}${reset}`);
        }

        const levelColor = levelColors[level] || '\x1b[97m';
        parts.push(`${levelColor}${this.getLevelText(level)}:${reset}`);

        if (prefix) {
            parts.push(`\x1b[96m[${prefix.toUpperCase()}]${reset}`);
        }

        parts.push(message);

        return {
            text: parts.join(' '),
            reset
        };
    }

    /**
     * Get chalk instance for log level (for compatibility with adapter)
     */
    public getChalkForLevel(level: LogLevel): any {
        const levelColors: Record<LogLevel, string> = {
            'debug': 'magenta',
            'info': 'blue',
            'warn': 'yellow',
            'error': 'red',
            'critical': 'red'
        };

        return {
            color: (text: string) => {
                const color = levelColors[level] || 'white';
                const colorCode = this.getColorCode(color);
                return `${colorCode}${text}${'\x1b[0m'}`;
            },
            bold: (text: string) => {
                const boldStyle = this.getStyleCode(['bold']);
                return `${boldStyle}${text}${'\x1b[0m'}`;
            },
            dim: (text: string) => {
                const dimStyle = this.getStyleCode(['dim']);
                return `${dimStyle}${text}${'\x1b[0m'}`;
            },
            bgGray: (text: string) => {
                return `\x1b[100m${text}${'\x1b[0m'}`;
            },
            bgBlue: (text: string) => {
                return `\x1b[104m${text}${'\x1b[0m'}`;
            },
            reset: (text: string) => text,
            cyan: {
                bold: (text: string) => {
                    const cyan = this.getColorCode('cyan');
                    const bold = this.getStyleCode(['bold']);
                    return `${cyan}${bold}${text}${'\x1b[0m'}`;
                },
                dim: (text: string) => {
                    const cyan = this.getColorCode('cyan');
                    const dim = this.getStyleCode(['dim']);
                    return `${cyan}${dim}${text}${'\x1b[0m'}`;
                },
                bg: (text: string) => {
                    const bgBlack = '\x1b[40m';
                    const cyan = this.getColorCode('cyan');
                    return `${bgBlack}${cyan}[${text.toUpperCase()}]${'\x1b[0m'}`;
                }
            }
        };
    }
}