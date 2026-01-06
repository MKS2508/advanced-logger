/**
 * Terminal Renderer - ANSI color rendering for terminal environments
 * Converts CSS-based styling to ANSI escape sequences for terminal output
 */

import type { LogLevel } from '../types/index.js';
import type { LogStyles } from '../types/index.js';
import { getANSIForeground, getANSIBackground, ANSI, type ColorCapability } from './color-converter.js';

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
    private colorCapability: ColorCapability;

    constructor(colorCapability: ColorCapability = 'full') {
        this.colorCapability = colorCapability;
    }

    /**
     * Get ANSI color codes - now supports truecolor/256-color
     */
    private getColorCode(color: string, background: boolean = false): string {
        return background
            ? getANSIBackground(color, this.colorCapability)
            : getANSIForeground(color, this.colorCapability);
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
     * Create cyberpunk-style ANSI rendering with truecolor support
     */
    renderCyberpunk(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string
    ): ANSIStyle {
        const reset = ANSI.reset;

        const cyberpunkColors: Record<LogLevel, string> = {
            'debug': '#ff00ff',   // Neon magenta
            'info': '#00ffff',    // Neon cyan
            'warn': '#ffff00',    // Neon yellow
            'error': '#ff0040',   // Neon red-pink
            'critical': '#ff0000' // Pure red
        };

        const parts: string[] = [];

        if (timestamp) {
            parts.push(`${ANSI.dim}${timestamp}${reset}`);
        }

        const levelColor = this.getColorCode(cyberpunkColors[level] || '#ffffff');
        const bgBlack = ANSI.bg.black;
        const bold = level === 'critical' ? ANSI.bold : '';
        parts.push(`${bgBlack}${levelColor}${bold} ${this.getLevelText(level)} ${reset}`);

        if (prefix) {
            const cyanColor = this.getColorCode('#00ffff');
            parts.push(`${bgBlack}${cyanColor}[${prefix.toUpperCase()}]${reset}`);
        }

        parts.push(message);

        if (location) {
            parts.push(`${ANSI.dim}(${location})${reset}`);
        }

        return {
            text: parts.join(' '),
            reset
        };
    }

    /**
     * Create minimal ANSI rendering with truecolor support
     */
    renderMinimal(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string
    ): ANSIStyle {
        const reset = ANSI.reset;

        const minimalColors: Record<LogLevel, string> = {
            'debug': '#c678dd', // Soft purple
            'info': '#61afef',  // Soft blue
            'warn': '#e5c07b',  // Soft yellow
            'error': '#e06c75', // Soft red
            'critical': '#be5046' // Dark red
        };

        const parts: string[] = [];

        if (timestamp) {
            parts.push(`${ANSI.dim}${timestamp}${reset}`);
        }

        const levelColor = this.getColorCode(minimalColors[level] || '#abb2bf');
        const bold = level === 'critical' ? ANSI.bold : '';
        parts.push(`${levelColor}${bold}${this.getLevelText(level)}:${reset}`);

        if (prefix) {
            const cyanColor = this.getColorCode('#56b6c2');
            parts.push(`${cyanColor}[${prefix.toUpperCase()}]${reset}`);
        }

        parts.push(message);

        return {
            text: parts.join(' '),
            reset
        };
    }

    /**
     * Get chalk-like interface for log level with truecolor support
     */
    public getChalkForLevel(level: LogLevel): ChalkLikeInterface {
        const levelColors: Record<LogLevel, string> = {
            'debug': '#c678dd',
            'info': '#61afef',
            'warn': '#e5c07b',
            'error': '#e06c75',
            'critical': '#be5046'
        };

        const reset = ANSI.reset;

        return {
            color: (text: string) => {
                const color = levelColors[level] || '#abb2bf';
                const colorCode = this.getColorCode(color);
                return `${colorCode}${text}${reset}`;
            },
            bold: (text: string) => `${ANSI.bold}${text}${reset}`,
            dim: (text: string) => `${ANSI.dim}${text}${reset}`,
            bgGray: (text: string) => `${ANSI.bg.gray}${text}${reset}`,
            bgBlue: (text: string) => `${this.getColorCode('#1e3a5f', true)}${text}${reset}`,
            reset: (text: string) => text,
            cyan: {
                bold: (text: string) => {
                    const cyan = this.getColorCode('#00ffff');
                    return `${cyan}${ANSI.bold}${text}${reset}`;
                },
                dim: (text: string) => {
                    const cyan = this.getColorCode('#00ffff');
                    return `${cyan}${ANSI.dim}${text}${reset}`;
                },
                bg: (text: string) => {
                    const cyan = this.getColorCode('#00ffff');
                    return `${ANSI.bg.black}${cyan}[${text.toUpperCase()}]${reset}`;
                }
            }
        };
    }
}

export interface ChalkLikeInterface {
    color: (text: string) => string;
    bold: (text: string) => string;
    dim: (text: string) => string;
    bgGray: (text: string) => string;
    bgBlue: (text: string) => string;
    reset: (text: string) => string;
    cyan: {
        bold: (text: string) => string;
        dim: (text: string) => string;
        bg: (text: string) => string;
    };
}