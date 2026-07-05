/**
 * @fileoverview Utilidades para crear output estilizado para Advanced Logger
 */

import type { LogLevel, StackInfo, DevToolsTheme, AdaptiveColors } from '../types/index.js';
import { formatTimestamp } from './timestamps.js';
import { StyleBuilder } from '../styling/index.js';
import { ADAPTIVE_COLORS } from '../constants.js';
import { getEnvironment, supportsANSI } from './environment-detector.js';
import { formatLogLevelANSI, formatTimestampANSI, formatPrefixANSI, formatLocationANSI } from './ansi-colors.js';
import type { LogStyles } from '../types/index.js';

/**
 * Configuración de estilo para cada nivel de log
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
 * Detecta la preferencia de theme actual de DevTools
 */
export function detectDevToolsTheme(): DevToolsTheme {
    try {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return 'light'; // Fallback seguro para SSR o browsers antiguos
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
        console.warn('Failed to detect DevTools theme:', error);
        return 'light'; // Fallback al theme light
    }
}

/**
 * Obtiene el color adaptativo según el theme actual de DevTools
 */
export function getAdaptiveColor(colors: AdaptiveColors, theme?: DevToolsTheme): string {
    const currentTheme = theme ?? detectDevToolsTheme();
    return colors[currentTheme];
}

/**
 * Registra un listener de cambios de theme para actualizaciones dinámicas
 */
export function setupThemeChangeListener(callback: (theme: DevToolsTheme) => void): (() => void) | null {
    try {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return null;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            callback(e.matches ? 'dark' : 'light');
        };

        // Usa addEventListener si está disponible, fallback a addListener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener?.(handler);
        }

        return null;
    } catch (error) {
        console.warn('Failed to set up theme change listener:', error);
        return null;
    }
}


/**
 * Crea output estilizado para consola con múltiples formatters `%c`
 * Se adapta automáticamente al entorno (browser o terminal)
 */
export function createStyledOutput(
    level: LogLevel,
    levelStyles: Record<LogLevel | 'success', LevelStyleConfig>,
    prefix: string | undefined,
    message: string,
    stackInfo: StackInfo | null,
    autoDetectTheme: boolean = true,
    presetStyles?: LogStyles,
    presetName?: string
): [string, ...string[]] {
    const levelConfig = levelStyles[level] ?? {
        emoji: '📝',
        label: level.toUpperCase(),
        background: '#6c757d',
        color: '#ffffff',
        border: '1px solid #6c757d',
        shadow: 'none'
    };
    const timestamp = formatTimestamp();
    const environment = getEnvironment();

    // Comprueba si se debe usar rendering en terminal
    if (environment !== 'browser' && supportsANSI()) {
        return createTerminalOutput(level, message, timestamp, prefix, stackInfo);
    }

    // Rendering en browser (lógica existente)
    const currentTheme = autoDetectTheme ? detectDevToolsTheme() : 'light';

    // Estilos base con colores adaptativos
    const timestampStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.timestamp, currentTheme))
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
        .bg(getAdaptiveColor(ADAPTIVE_COLORS.prefixBackground, currentTheme))
        .color(getAdaptiveColor(ADAPTIVE_COLORS.prefix, currentTheme))
        .padding('2px 6px')
        .rounded('3px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('11px')
        .build();

    const messageStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.messageText, currentTheme))
        .font('system-ui, -apple-system, sans-serif')
        .size('14px')
        .build();

    const locationStyle = new StyleBuilder()
        .color(getAdaptiveColor(ADAPTIVE_COLORS.location, currentTheme))
        .size('11px')
        .font('Monaco, Consolas, monospace')
        .build();

    // Construye el format string y los estilos
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
 * Construye una línea apta para terminal usando los helpers ANSI. Se usa
 * cuando el runtime no es browser pero soporta códigos ANSI (TTY, terminal moderna).
 *
 * Layout: `[HH:MM:SS.mmm] [LEVEL] [prefix] message (file:line)`
 */
export function createTerminalOutput(
    level: LogLevel,
    message: string,
    timestamp?: string,
    prefix?: string,
    stackInfo?: StackInfo | null
): [string, ...string[]] {
    const ts = timestamp?.slice(11, 23) ?? '';
    const location = stackInfo ? `${stackInfo.file}:${stackInfo.line}:${stackInfo.column}` : undefined;

    const parts: string[] = [];
    parts.push(formatTimestampANSI(`[${ts}]`));
    parts.push(formatLogLevelANSI(level));
    if (prefix) parts.push(formatPrefixANSI(prefix));
    parts.push(message);
    if (location) parts.push(formatLocationANSI(`(${location})`));

    return [parts.join(' ') + '\n'];
}