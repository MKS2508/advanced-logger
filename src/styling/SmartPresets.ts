/**
 * @fileoverview Smart presets para configurar el layout del logger.
 */

import type { LogStyles, LogLayout } from '../types/index.js';

/**
 * Catálogo de smart presets que configuran el layout completo de un log.
 *
 * A diferencia de {@link THEME_PRESETS} — que solo controla los colores
 * y emojis del badge del nivel — los smart presets controlan la
 * composición entera del output: timestamp, badge de nivel, prefix,
 * mensaje, location, fuentes, padding/spacing y efectos visuales
 * (blur, transparency). Cada clave es un {@link LogStyles} completo.
 *
 * Presets disponibles:
 *  - `default`       — adaptativo (claro/oscuro según DevTools), legible.
 *  - `cyberpunk`     — neón, glow, fondo oscuro, location oculta.
 *  - `glassmorphism` — blur + transparencia, layout spacious.
 *  - `minimal`       — sin timestamp, sin location, badges flat.
 *  - `debug`         — monospace, todo visible, compacto para dev.
 *  - `production`    — solo lo esencial: timestamp + level + mensaje.
 *
 * Los presets son ortogonales a los themes: pueden combinarse (por
 * ejemplo, `theme: 'dark'` + `preset: 'debug'` aplica el layout debug
 * sobre la paleta oscura).
 *
 * @example
 * ```ts
 * import logger from '@mks2508/better-logger';
 *
 * logger.preset('glassmorphism');
 * logger.info('Vidrio esmerilado en DevTools');
 * ```
 *
 * @example
 * ```ts
 * // Componer: theme custom + preset de layout
 * logger.configure({ theme: 'dark' });
 * logger.preset('debug');
 * logger.warn('Layout debug sobre theme dark');
 * ```
 *
 * @see {@link getSmartPreset} para resolver un preset por nombre.
 * @see {@link LogStyles} para la shape completa de un preset.
 */
export const SMART_PRESETS: Record<string, LogStyles> = {
    /**
     * Preset por defecto — funciona out-of-the-box.
     * Limpio, legible, adaptativo a themes claro/oscuro.
     */
    default: {
        layout: {
            spacing: 'normal',
            innerPadding: '2px',
            outerMargin: '1px'
        },
        timestamp: {
            show: true,
            color: 'auto', // Adaptativo automático
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
            style: 'dark', // Adaptativo automático
            padding: '2px 6px'
        },
        message: {
            show: true,
            color: 'auto', // Adaptativo automático
            font: 'system-ui, -apple-system, sans-serif',
            size: '14px'
        },
        location: {
            show: true,
            color: 'auto', // Adaptativo automático
            font: 'Monaco, Consolas, monospace',
            size: '11px'
        }
    },

    /**
     * Preset cyberpunk — neón, glow y fondo oscuro.
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
            show: false // Oculto para un look más limpio
        },
        backdrop: 'blur(2px)',
        transparency: 0.9
    },

    /**
     * Preset glassmorphism — blur moderno y transparencia.
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
     * Preset minimal — limpio, sin decoraciones, máxima legibilidad.
     */
    minimal: {
        layout: {
            spacing: 'compact',
            innerPadding: '0px',
            outerMargin: '0px'
        },
        timestamp: {
            show: false // Oculto para look minimal
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
            show: false // Oculto para look minimal
        }
    },

    /**
     * Preset debug — monospace, detallado, compacto para desarrollo.
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
     * Preset production — limpio, solo info esencial.
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
            show: false // Oculto en production
        },
        message: {
            show: true,
            color: 'auto',
            font: 'system-ui, sans-serif',
            size: '14px'
        },
        location: {
            show: false // Oculto en production
        }
    }
};

/**
 * Resuelve un smart preset por nombre desde {@link SMART_PRESETS}.
 *
 * @param {string} name - Nombre del preset (`'default'`, `'cyberpunk'`,
 *   `'glassmorphism'`, `'minimal'`, `'debug'`, `'production'`).
 * @returns {LogStyles | null} El preset encontrado, o `null` si el nombre
 *   no existe en el catálogo.
 *
 * @example
 * ```ts
 * import { getSmartPreset } from '@mks2508/better-logger/styles';
 *
 * const preset = getSmartPreset('cyberpunk');
 * if (preset) {
 *   console.log(preset.level?.style); // 'glowing'
 * }
 * ```
 *
 * @see {@link hasPreset} para un check booleano sin traer el objeto.
 */
export function getSmartPreset(name: string): LogStyles | null {
    return SMART_PRESETS[name] || null;
}

/**
 * Lista los nombres de todos los smart presets registrados.
 *
 * Útil para alimentar menús de configuración, CLIs o help text.
 *
 * @returns {string[]} Array con las claves de {@link SMART_PRESETS}.
 *
 * @example
 * ```ts
 * import { getAvailablePresets } from '@mks2508/better-logger/styles';
 *
 * console.log(getAvailablePresets());
 * // ['default', 'cyberpunk', 'glassmorphism', 'minimal', 'debug', 'production']
 * ```
 */
export function getAvailablePresets(): string[] {
    return Object.keys(SMART_PRESETS);
}

/**
 * Comprueba si un smart preset existe en el catálogo.
 *
 * @param {string} name - Nombre del preset a verificar.
 * @returns {boolean} `true` si el preset está registrado, `false` en caso contrario.
 *
 * @example
 * ```ts
 * import { hasPreset, getSmartPreset } from '@mks2508/better-logger/styles';
 *
 * const name = 'glassmorphism';
 * const preset = hasPreset(name) ? getSmartPreset(name) : null;
 * ```
 *
 * @see {@link getSmartPreset} para resolver el preset (retorna `null` si no existe).
 */
export function hasPreset(name: string): boolean {
    return name in SMART_PRESETS;
}

/**
 * Descripciones cortas y legibles para humanos de cada smart preset.
 *
 * Pensadas para help text, CLI output o UI de selección. Las claves
 * coinciden con {@link SMART_PRESETS}; los valores son strings de una
 * línea describiendo el propósito del preset.
 *
 * @example
 * ```ts
 * import { PRESET_DESCRIPTIONS, getAvailablePresets } from '@mks2508/better-logger/styles';
 *
 * for (const name of getAvailablePresets()) {
 *   console.log(`${name.padEnd(14)} — ${PRESET_DESCRIPTIONS[name]}`);
 * }
 * ```
 *
 * @see {@link SMART_PRESETS} para los objetos {@link LogStyles} completos.
 */
export const PRESET_DESCRIPTIONS: Record<string, string> = {
    default: 'Clean, readable, automatically adaptive to dark/light themes',
    cyberpunk: 'Neon colors, glowing effects, perfect for dark themes',
    glassmorphism: 'Modern blur effects with transparency and spacious layout',
    minimal: 'Clean and simple, no decorations, maximum readability',
    debug: 'Monospace fonts, detailed info, compact layout for development',
    production: 'Professional look with essential information only'
};