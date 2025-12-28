/**
 * CSS to ANSI Adapter - Converts CSS-based styles to ANSI terminal styles
 * Bridges the gap between browser styling and terminal rendering
 */

import type { LogStyles } from '../types/index.js';
import type { ANSIStyle } from '../terminal/terminal-renderer.js';
import { TerminalRenderer } from '../terminal/terminal-renderer.js';
import type { LogLevel } from '../types/index.js';
import { getColorCapability } from './environment-detector.js';

export class CSS2ANSIAdapter {
    private renderer: TerminalRenderer;

    constructor() {
        const colorCapability = getColorCapability();
        this.renderer = new TerminalRenderer(colorCapability);
    }

    /**
     * Convert LogStyles to ANSIStyle for terminal rendering
     */
    adaptStyles(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string,
        styles?: LogStyles,
        presetName?: string
    ): ANSIStyle {
        // Special handling for specific presets that need unique terminal representations
        if (presetName) {
            switch (presetName) {
                case 'cyberpunk':
                    return this.renderer.renderCyberpunk(level, message, timestamp, prefix, location);
                case 'minimal':
                    return this.renderer.renderMinimal(level, message, timestamp, prefix);
                case 'production':
                    return this.adaptProductionStyles(level, message, timestamp, prefix, location, styles);
                case 'debug':
                    return this.adaptDebugStyles(level, message, timestamp, prefix, location, styles);
                case 'glassmorphism':
                    return this.adaptGlassmorphismStyles(level, message, timestamp, prefix, location, styles);
            }
        }

        // Default adaptation using the renderer
        return this.renderer.renderTerminal(level, message, timestamp, prefix, location, styles);
    }

    /**
     * Adapt production preset for terminal
     */
    private adaptProductionStyles(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string,
        styles?: LogStyles
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const levelChalk = this.renderer.getChalkForLevel(level);

        const parts: string[] = [];

        // Production: clean, essential info only
        if (timestamp && styles?.timestamp?.show) {
            parts.push(levelChalk.dim(timestamp));
        }

        if (styles?.level?.show) {
            parts.push(levelChalk.color(`[${this.renderer['getLevelText'](level)}]`));
        }

        // Skip prefix in production (as per preset config)
        if (prefix && styles?.prefix?.show) {
            parts.push(levelChalk.dim(`[${prefix}]`));
        }

        if (message && styles?.message?.show) {
            parts.push(levelChalk.reset(message));
        }

        // Skip location in production (as per preset config)
        if (location && styles?.location?.show) {
            parts.push(levelChalk.dim(`(${location})`));
        }

        return {
            text: parts.join(' ') + reset,
            reset
        };
    }

    /**
     * Adapt debug preset for terminal
     */
    private adaptDebugStyles(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string,
        styles?: LogStyles
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const levelChalk = this.renderer.getChalkForLevel(level);

        const parts: string[] = [];

        // Debug: monospace fonts, detailed info, compact layout
        if (timestamp && styles?.timestamp?.show) {
            parts.push(levelChalk.dim(timestamp));
        }

        if (styles?.level?.show) {
            if (styles?.level?.style === 'compact') {
                parts.push(levelChalk.color(`[${this.renderer['getLevelText'](level)}]`));
            } else {
                parts.push(levelChalk.bold(`[${this.renderer['getLevelText'](level)}]`));
            }
        }

        if (prefix && styles?.prefix?.show) {
            if (styles?.prefix?.style === 'compact') {
                parts.push(levelChalk.cyan.dim(`[${prefix}]`));
            } else {
                parts.push(levelChalk.cyan.bold(`[${prefix}]`));
            }
        }

        if (message && styles?.message?.show) {
            parts.push(levelChalk.reset(message));
        }

        // Debug usually shows location
        if (location && styles?.location?.show) {
            if (styles?.location?.style === 'clickable') {
                parts.push(levelChalk.dim(`${location} (clickable)`));
            } else {
                parts.push(levelChalk.dim(`(${location})`));
            }
        }

        return {
            text: parts.join(' ') + reset,
            reset
        };
    }

    /**
     * Adapt glassmorphism preset for terminal
     */
    private adaptGlassmorphismStyles(
        level: LogLevel,
        message: string,
        timestamp?: string,
        prefix?: string,
        location?: string,
        styles?: LogStyles
    ): ANSIStyle {
        const reset = '\x1b[0m';
        const levelChalk = this.renderer.getChalkForLevel(level);

        const parts: string[] = [];

        // Glassmorphism: subtle, transparent effects
        if (timestamp && styles?.timestamp?.show) {
            parts.push(levelChalk.dim(timestamp));
        }

        if (styles?.level?.show) {
            // Subtle level styling with dim background effect
            parts.push(levelChalk.bgGray(` ${this.renderer['getLevelText'](level)} `));
        }

        if (prefix && styles?.prefix?.show) {
            parts.push(levelChalk.bgBlue(`[${prefix}]`));
        }

        if (message && styles?.message?.show) {
            parts.push(levelChalk.reset(message));
        }

        if (location && styles?.location?.show) {
            parts.push(levelChalk.dim(`(${location})`));
        }

        return {
            text: parts.join(' ') + reset,
            reset
        };
    }

    /**
     * Convert CSS color values to ANSI-friendly colors
     */
    adaptColor(cssColor: string): string {
        // Handle hex colors
        if (cssColor.startsWith('#')) {
            return cssColor; // TerminalRenderer will handle this
        }

        // Handle RGB colors
        if (cssColor.startsWith('rgb(')) {
            return cssColor; // TerminalRenderer will handle this
        }

        // Handle CSS gradients - extract primary color
        if (cssColor.includes('gradient')) {
            return this.extractColorFromGradient(cssColor);
        }

        // Handle CSS color names
        return this.cssNameToANSI(cssColor);
    }

    /**
     * Extract primary color from CSS gradient
     */
    private extractColorFromGradient(gradient: string): string {
        // Extract first color from linear-gradient
        const match = gradient.match(/#[0-9a-fA-F]{6}|rgb\([^)]+\)/);
        return match ? match[0] : '#ffffff';
    }

    /**
     * Convert CSS color names to ANSI-compatible names
     */
    private cssNameToANSI(cssColor: string): string {
        const colorMap: Record<string, string> = {
            'black': 'black',
            'white': 'white',
            'red': 'red',
            'green': 'green',
            'blue': 'blue',
            'yellow': 'yellow',
            'cyan': 'cyan',
            'magenta': 'magenta',
            'gray': 'gray',
            'grey': 'gray',
            'orange': 'yellow',
            'purple': 'magenta',
            'pink': 'red',
            'brown': 'yellow',
            'lightblue': 'cyan',
            'lightgreen': 'green',
            'lightgray': 'gray',
            'lightgrey': 'gray'
        };

        return colorMap[cssColor.toLowerCase()] || 'white';
    }

    /**
     * Check if a style should be rendered in terminal
     */
    shouldRenderStyle(styleType: string, styles?: LogStyles): boolean {
        if (!styles) return true;

        const styleConfig = (styles as any)[styleType];
        return styleConfig?.show !== false;
    }

    /**
     * Get renderer instance for advanced usage
     */
    getRenderer(): TerminalRenderer {
        return this.renderer;
    }
}

// Singleton instance for consistent styling
export const css2ansiAdapter = new CSS2ANSIAdapter();

/**
 * Convenience function for quick style adaptation
 */
export function adaptToTerminal(
    level: LogLevel,
    message: string,
    timestamp?: string,
    prefix?: string,
    location?: string,
    styles?: LogStyles,
    presetName?: string
): ANSIStyle {
    return css2ansiAdapter.adaptStyles(level, message, timestamp, prefix, location, styles, presetName);
}