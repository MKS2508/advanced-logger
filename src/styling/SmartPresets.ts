/**
 * @fileoverview Smart presets for simplified logger configuration
 */

import type { LogStyles, LogLayout } from '../types/index.js';

/**
 * Smart presets that configure the entire log appearance
 */
export const SMART_PRESETS: Record<string, LogStyles> = {
    /**
     * Default preset - works perfectly out-of-the-box
     * Clean, readable, automatically adaptive to dark/light themes
     */
    default: {
        layout: {
            spacing: 'normal',
            innerPadding: '2px',
            outerMargin: '1px'
        },
        timestamp: {
            show: true,
            color: 'auto', // Automatically adaptive
            font: 'Monaco, Consolas, monospace',
            size: '11px'
        },
        level: {
            show: true,
            style: 'badge',
            uppercase: false,
            padding: '2px 8px'
        },
        prefix: {
            show: true,
            style: 'dark', // Automatically adaptive
            padding: '2px 6px'
        },
        message: {
            show: true,
            color: 'auto', // Automatically adaptive
            font: 'system-ui, -apple-system, sans-serif',
            size: '14px'
        },
        location: {
            show: true,
            color: 'auto', // Automatically adaptive
            font: 'Monaco, Consolas, monospace',
            size: '11px'
        }
    },

    /**
     * Cyberpunk preset - neon colors, glowing effects, dark theme
     */
    cyberpunk: {
        layout: {
            spacing: 'compact',
            innerPadding: '1px',
            outerMargin: '0px'
        },
        timestamp: {
            show: true,
            color: '#00ffff',
            font: 'Monaco, Consolas, monospace',
            size: '10px',
            style: 'neon'
        },
        level: {
            show: true,
            style: 'glowing',
            uppercase: true,
            padding: '2px 8px'
        },
        prefix: {
            show: true,
            color: '#ff0080',
            background: 'rgba(255, 0, 128, 0.1)',
            border: '1px solid #ff0080',
            style: 'neon'
        },
        message: {
            show: true,
            color: '#00ff41',
            font: 'Monaco, Consolas, monospace',
            size: '13px'
        },
        location: {
            show: false // Hidden for cleaner look
        },
        backdrop: 'blur(2px)',
        transparency: 0.9
    },

    /**
     * Glassmorphism preset - modern blur effects, transparency
     */
    glassmorphism: {
        layout: {
            spacing: 'spacious',
            innerPadding: '4px',
            outerMargin: '2px'
        },
        timestamp: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '11px',
            style: 'glassmorphic'
        },
        level: {
            show: true,
            style: 'glassmorphic',
            uppercase: false,
            padding: '4px 12px'
        },
        prefix: {
            show: true,
            style: 'glassmorphic',
            padding: '3px 8px'
        },
        message: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '14px'
        },
        location: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '11px',
            style: 'glassmorphic'
        },
        backdrop: 'blur(10px)',
        transparency: 0.8
    },

    /**
     * Minimal preset - clean, no decorations, maximum readability
     */
    minimal: {
        layout: {
            spacing: 'compact',
            innerPadding: '0px',
            outerMargin: '0px'
        },
        timestamp: {
            show: false // Hidden for minimal look
        },
        level: {
            show: true,
            style: 'flat',
            uppercase: true,
            padding: '0px 4px',
            border: 'none',
            background: 'transparent'
        },
        prefix: {
            show: true,
            style: 'flat',
            padding: '0px 4px',
            border: 'none',
            background: 'transparent'
        },
        message: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '14px'
        },
        location: {
            show: false // Hidden for minimal look
        }
    },

    /**
     * Debug preset - monospace, detailed, compact for development
     */
    debug: {
        layout: {
            spacing: 'compact',
            innerPadding: '1px',
            outerMargin: '0px'
        },
        timestamp: {
            show: true,
            color: 'auto',
            font: 'Monaco, Consolas, monospace',
            size: '10px'
        },
        level: {
            show: true,
            style: 'compact',
            uppercase: true,
            padding: '1px 4px',
            font: 'Monaco, Consolas, monospace',
            size: '10px'
        },
        prefix: {
            show: true,
            style: 'compact',
            padding: '1px 4px',
            font: 'Monaco, Consolas, monospace',
            size: '10px'
        },
        message: {
            show: true,
            color: 'auto',
            font: 'Monaco, Consolas, monospace',
            size: '12px'
        },
        location: {
            show: true,
            color: 'auto',
            font: 'Monaco, Consolas, monospace',
            size: '10px',
            style: 'clickable'
        }
    },

    /**
     * Production preset - clean, essential info only
     */
    production: {
        layout: {
            spacing: 'normal',
            innerPadding: '2px',
            outerMargin: '1px'
        },
        timestamp: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '11px'
        },
        level: {
            show: true,
            style: 'badge',
            uppercase: false,
            padding: '2px 6px'
        },
        prefix: {
            show: false // Hidden in production
        },
        message: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '14px'
        },
        location: {
            show: false // Hidden in production
        }
    }
};

/**
 * Get a smart preset by name
 */
export function getSmartPreset(name: string): LogStyles | null {
    return SMART_PRESETS[name] || null;
}

/**
 * List all available smart presets
 */
export function getAvailablePresets(): string[] {
    return Object.keys(SMART_PRESETS);
}

/**
 * Check if a preset exists
 */
export function hasPreset(name: string): boolean {
    return name in SMART_PRESETS;
}

/**
 * Preset descriptions for help/documentation
 */
export const PRESET_DESCRIPTIONS: Record<string, string> = {
    default: 'Clean, readable, automatically adaptive to dark/light themes',
    cyberpunk: 'Neon colors, glowing effects, perfect for dark themes',
    glassmorphism: 'Modern blur effects with transparency and spacious layout',
    minimal: 'Clean and simple, no decorations, maximum readability',
    debug: 'Monospace fonts, detailed info, compact layout for development',
    production: 'Professional look with essential information only'
};