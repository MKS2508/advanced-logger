/**
 * Detector de entorno — Detección robusta del entorno para el logger
 * Detecta entornos browser, terminal, server y otros runtime
 */

export type Environment = 'browser' | 'terminal' | 'server' | 'webworker' | 'deno' | 'unknown';

/**
 * Comprueba si se ejecuta en entorno Node.js
 */
export const isNode = typeof process !== 'undefined' &&
                      process.versions &&
                      process.versions.node;

/**
 * Comprueba si se ejecuta en entorno browser
 */
export const isBrowser = typeof window !== 'undefined' &&
                          typeof document !== 'undefined';

/**
 * Función principal de detección de entorno
 */
export function getEnvironment(): Environment {
    // Comprueba Deno primero
    if (typeof globalThis !== 'undefined' && (globalThis as any).Deno) {
        return 'deno';
    }

    // Comprueba WebWorker
    if (typeof window === 'undefined' && typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
        return 'webworker';
    }

    // Comprueba Node.js (entorno server)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Determina si corre en una terminal o como server
        if (isRunningInTerminal()) {
            return 'terminal';
        }
        return 'server';
    }

    // Comprueba browser
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return 'browser';
    }

    return 'unknown';
}

/**
 * Comprueba si se ejecuta en una terminal interactiva
 */
export function isRunningInTerminal(): boolean {
    // Comprueba indicadores comunes de terminal
    if (typeof process === 'undefined') return false;

    const isTTY = process.stdout && process.stdout.isTTY;
    const hasTerminalEnv = process.env && (
        process.env.TERM ||
        process.env.TERM_PROGRAM ||
        process.env.SSH_TTY ||
        process.env.TERM_SESSION_ID
    );

    // Comprueba si corre dentro de programas de terminal comunes
    const terminalPrograms = [
        'vscode',
        'hyper',
        'iterm',
        'terminal',
        'alacritty',
        'kitty',
        'gnome-terminal',
        'konsole',
        'xterm',
        'tmux',
        'screen'
    ];

    const isTerminalProgram = hasTerminalEnv && terminalPrograms.some(program =>
        process.env.TERM_PROGRAM?.toLowerCase().includes(program) ||
        process.env.TERM?.toLowerCase().includes(program)
    );

    return Boolean(isTTY || hasTerminalEnv || isTerminalProgram);
}

/**
 * Comprueba si el entorno soporta colores ANSI
 */
export function supportsANSI(): boolean {
    const env = getEnvironment();

    if (env === 'browser') return false;
    if (env === 'terminal') return true;
    if (env === 'server') return checkServerANSISupport();

    return false;
}

/**
 * Comprueba si el entorno server soporta colores ANSI
 */
function checkServerANSISupport(): boolean {
    if (typeof process === 'undefined') return false;

    // Comprueba variables de entorno comunes que indican soporte ANSI
    const supportsANSI = process.env && (
        process.env.COLORTERM ||
        process.env.FORCE_COLOR ||
        (process.env.TERM && process.env.TERM !== 'dumb') ||
        process.env.TERM_PROGRAM
    );

    return Boolean(supportsANSI);
}

/**
 * Obtiene la capacidad de color específica del entorno
 */
export function getColorCapability(): 'full' | 'basic' | 'none' {
    const env = getEnvironment();

    if (env === 'browser') {
        return 'full'; // Colores CSS
    }

    if (!supportsANSI()) {
        return 'none';
    }

    // Comprueba soporte de 256 colores o truecolor
    if (typeof process !== 'undefined' && process.env) {
        const hasTrueColor = process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit';
        const has256Colors = process.env.TERM && process.env.TERM.includes('256');

        if (hasTrueColor || has256Colors) {
            return 'full';
        }
    }

    return 'basic'; // 16 colores básicos
}

/**
 * Obtiene el ancho de la terminal en columnas
 */
export function getTerminalWidth(): number {
    if (typeof process !== 'undefined' && process.stdout?.columns) {
        return process.stdout.columns;
    }
    return 80;
}

/**
 * Obtiene el alto de la terminal en filas
 */
export function getTerminalHeight(): number {
    if (typeof process !== 'undefined' && process.stdout?.rows) {
        return process.stdout.rows;
    }
    return 24;
}

/**
 * Información del entorno para debugging
 */
export function getEnvironmentInfo() {
    return {
        environment: getEnvironment(),
        supportsANSI: supportsANSI(),
        colorCapability: getColorCapability(),
        isTTY: typeof process !== 'undefined' ? Boolean(process.stdout?.isTTY) : false,
        platform: typeof process !== 'undefined' ? process.platform : 'unknown',
        nodeVersion: typeof process !== 'undefined' ? process.versions?.node : null,
        term: typeof process !== 'undefined' ? process.env?.TERM : null,
        colorTerm: typeof process !== 'undefined' ? process.env?.COLORTERM : null,
        terminalWidth: getTerminalWidth(),
        terminalHeight: getTerminalHeight()
    };
}