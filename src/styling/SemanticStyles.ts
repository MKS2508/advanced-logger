/**
 * @fileoverview Semantic styling system for Advanced Logger
 */

import { StyleBuilder } from './StyleBuilder.js';
import type { AdaptiveColors } from '../types/index.js';
import { ADAPTIVE_COLORS } from '../constants.js';
import { getAdaptiveColor } from '../utils/index.js';

/**
 * Base semantic styler with common style methods
 */
export abstract class BaseStyler {
    protected builder: StyleBuilder;

    constructor(builder: StyleBuilder = new StyleBuilder()) {
        this.builder = builder;
    }

    /**
     * Primary brand color (typically blue)
     */
    primary(): this {
        return this.color('#007bff');
    }

    /**
     * Secondary color (typically gray)
     */
    secondary(): this {
        return this.color('#6c757d');
    }

    /**
     * Accent color for highlights
     */
    accent(): this {
        return this.color('#17a2b8');
    }

    /**
     * Muted/subtle color - automatically adaptive
     */
    muted(): this {
        const mutedColors: AdaptiveColors = { light: '#6c757d', dark: '#a0aec0' };
        return this.color(getAdaptiveColor(mutedColors));
    }

    /**
     * Success color (green)
     */
    success(): this {
        return this.color('#28a745');
    }

    /**
     * Warning color (yellow/orange)
     */
    warning(): this {
        return this.color('#ffc107');
    }

    /**
     * Danger/error color (red)
     */
    danger(): this {
        return this.color('#dc3545');
    }

    /**
     * Monospace font family
     */
    mono(): this {
        this.builder.font('Monaco, Consolas, "Courier New", monospace');
        return this;
    }

    /**
     * System font family
     */
    system(): this {
        this.builder.font('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
        return this;
    }

    /**
     * Readable font optimized for text
     */
    readable(): this {
        this.builder.font('Georgia, "Times New Roman", serif');
        return this;
    }

    /**
     * Compact spacing
     */
    compact(): this {
        this.builder.padding('1px 4px').margin('0 1px');
        return this;
    }

    /**
     * Spacious layout
     */
    spacious(): this {
        this.builder.padding('6px 12px').margin('2px 4px');
        return this;
    }

    /**
     * Inline display
     */
    inline(): this {
        this.builder.display('inline-block');
        return this;
    }

    /**
     * Glass morphism effect
     */
    glassmorphic(): this {
        this.builder
            .css('backdrop-filter', 'blur(10px)')
            .css('background', 'rgba(255, 255, 255, 0.1)')
            .border('1px solid rgba(255, 255, 255, 0.2)')
            .rounded('8px');
        return this;
    }

    /**
     * Neon glow effect
     */
    neon(): this {
        const neonColor = '#00ffff';
        this.builder
            .color(neonColor)
            .border(`1px solid ${neonColor}`)
            .shadow(`0 0 10px ${neonColor}, 0 0 20px ${neonColor}`)
            .css('text-shadow', `0 0 5px ${neonColor}`);
        return this;
    }

    /**
     * Gradient background
     */
    gradient(from: string = '#667eea', to: string = '#764ba2'): this {
        this.builder.bg(`linear-gradient(135deg, ${from} 0%, ${to} 100%)`);
        return this;
    }

    /**
     * Bold text
     */
    bold(): this {
        this.builder.bold();
        return this;
    }

    /**
     * Set color with automatic adaptation
     */
    protected color(color: string): this {
        this.builder.color(color);
        return this;
    }

    /**
     * Build the final CSS string
     */
    build(): string {
        return this.builder.build();
    }
}

/**
 * Timestamp-specific styling
 */
export class TimestampStyler extends BaseStyler {
    /**
     * Default timestamp style - subtle and informative
     */
    default(): this {
        this.muted().mono();
        this.builder.size('11px');
        return this;
    }

    /**
     * Hide timestamp
     */
    hidden(): this {
        this.builder.display('none');
        return this;
    }

    /**
     * Minimal timestamp (just time, no date)
     */
    minimal(): this {
        this.muted().mono();
        this.builder.size('10px').opacity(0.7);
        return this;
    }

    /**
     * Set font size
     */
    size(size: string): this {
        this.builder.size(size);
        return this;
    }
}

/**
 * Level badge styling
 */
export class LevelStyler extends BaseStyler {
    /**
     * Colorful gradient badge
     */
    badge(): this {
        this.builder
            .padding('2px 8px')
            .rounded('4px')
            .bold()
            .color('#ffffff');
        return this;
    }

    /**
     * Glowing effect for dark themes
     */
    glowing(): this {
        return this.neon().badge();
    }

    /**
     * Minimal flat style
     */
    flat(): this {
        this.builder
            .padding('1px 6px')
            .rounded('2px')
            .border('1px solid currentColor')
            .css('background', 'transparent');
        return this;
    }

    /**
     * Uppercase text
     */
    uppercase(): this {
        this.builder.uppercase();
        return this;
    }
}

/**
 * Prefix styling
 */
export class PrefixStyler extends BaseStyler {
    /**
     * Dark theme prefix
     */
    dark(): this {
        const prefixColors: AdaptiveColors = { light: '#2d3748', dark: '#4a5568' };
        const textColors: AdaptiveColors = { light: '#e2e8f0', dark: '#f7fafc' };
        
        this.builder
            .bg(getAdaptiveColor(prefixColors))
            .color(getAdaptiveColor(textColors))
            .padding('2px 6px')
            .rounded('3px')
            .bold()
            .mono()
            .size('11px');
        return this;
    }

    /**
     * Light theme prefix
     */
    light(): this {
        this.builder
            .bg('#f8f9fa')
            .color('#495057')
            .padding('2px 6px')
            .rounded('3px')
            .bold()
            .mono()
            .size('11px')
            .border('1px solid #dee2e6');
        return this;
    }

    /**
     * Compact prefix
     */
    compact(): this {
        this.builder
            .padding('1px 4px')
            .size('10px')
            .rounded('2px');
        return this;
    }
}

/**
 * Message text styling
 */
export class MessageStyler extends BaseStyler {
    /**
     * Readable message text - automatically adaptive
     */
    readable(): this {
        this.builder
            .color(getAdaptiveColor(ADAPTIVE_COLORS.messageText))
            .system()
            .size('14px');
        return this;
    }

    /**
     * Code-style monospace text
     */
    code(): this {
        this.builder
            .mono()
            .size('13px')
            .color(getAdaptiveColor(ADAPTIVE_COLORS.messageText))
            .bg('rgba(0, 0, 0, 0.05)')
            .padding('1px 4px')
            .rounded('3px');
        return this;
    }

    /**
     * Large, prominent text
     */
    large(): this {
        this.builder
            .size('16px')
            .color(getAdaptiveColor(ADAPTIVE_COLORS.messageText));
        return this;
    }
}

/**
 * Location info styling
 */
export class LocationStyler extends BaseStyler {
    /**
     * Subtle location info - automatically adaptive
     */
    subtle(): this {
        this.builder
            .color(getAdaptiveColor(ADAPTIVE_COLORS.location))
            .mono()
            .size('11px')
            .opacity(0.7);
        return this;
    }

    /**
     * Hide location info
     */
    hidden(): this {
        this.builder.display('none');
        return this;
    }

    /**
     * Clickable style (for IDE integration)
     */
    clickable(): this {
        this.subtle();
        this.builder.css('text-decoration', 'underline').cursor('pointer');
        return this;
    }
}