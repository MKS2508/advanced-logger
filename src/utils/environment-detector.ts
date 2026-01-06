/**
 * Environment Detector - Robust environment detection for logger
 * Detects browser, terminal, server, and other runtime environments
 */

export type Environment = 'browser' | 'terminal' | 'server' | 'webworker' | 'deno' | 'unknown';

/**
 * Main environment detection function
 */
export function getEnvironment(): Environment {
    // Check for Deno first
    if (typeof globalThis !== 'undefined' && (globalThis as any).Deno) {
        return 'deno';
    }

    // Check for WebWorker
    if (typeof window === 'undefined' && typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
        return 'webworker';
    }

    // Check for Node.js (server environment)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Determine if it's running in a terminal or as a server
        if (isRunningInTerminal()) {
            return 'terminal';
        }
        return 'server';
    }

    // Check for browser
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return 'browser';
    }

    return 'unknown';
}

/**
 * Check if running in an interactive terminal
 */
export function isRunningInTerminal(): boolean {
    // Check for common terminal indicators
    if (typeof process === 'undefined') return false;

    const isTTY = process.stdout && process.stdout.isTTY;
    const hasTerminalEnv = process.env && (
        process.env.TERM ||
        process.env.TERM_PROGRAM ||
        process.env.SSH_TTY ||
        process.env.TERM_SESSION_ID
    );

    // Check if we're running in common terminal programs
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
 * Check if environment supports ANSI colors
 */
export function supportsANSI(): boolean {
    const env = getEnvironment();

    if (env === 'browser') return false;
    if (env === 'terminal') return true;
    if (env === 'server') return checkServerANSISupport();

    return false;
}

/**
 * Check if server environment supports ANSI colors
 */
function checkServerANSISupport(): boolean {
    if (typeof process === 'undefined') return false;

    // Check common environment variables that indicate ANSI support
    const supportsANSI = process.env && (
        process.env.COLORTERM ||
        process.env.FORCE_COLOR ||
        (process.env.TERM && process.env.TERM !== 'dumb') ||
        process.env.TERM_PROGRAM
    );

    return Boolean(supportsANSI);
}

/**
 * Get environment-specific color capability
 */
export function getColorCapability(): 'full' | 'basic' | 'none' {
    const env = getEnvironment();

    if (env === 'browser') {
        return 'full'; // CSS colors
    }

    if (!supportsANSI()) {
        return 'none';
    }

    // Check for 256-color or truecolor support
    if (typeof process !== 'undefined' && process.env) {
        const hasTrueColor = process.env.COLORTERM === 'truecolor' || process.env.COLORTERM === '24bit';
        const has256Colors = process.env.TERM && process.env.TERM.includes('256');

        if (hasTrueColor || has256Colors) {
            return 'full';
        }
    }

    return 'basic'; // Basic 16 colors
}

/**
 * Get terminal width in columns
 */
export function getTerminalWidth(): number {
    if (typeof process !== 'undefined' && process.stdout?.columns) {
        return process.stdout.columns;
    }
    return 80;
}

/**
 * Get terminal height in rows
 */
export function getTerminalHeight(): number {
    if (typeof process !== 'undefined' && process.stdout?.rows) {
        return process.stdout.rows;
    }
    return 24;
}

/**
 * Environment information for debugging
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