/**
 * @fileoverview Environment detection utilities for Universal Logger
 */

/**
 * Checks if running in Node.js environment
 */
export const isNode = typeof process !== 'undefined' &&
                      process.versions &&
                      process.versions.node;

/**
 * Checks if running in browser environment
 */
export const isBrowser = typeof window !== 'undefined' &&
                          typeof document !== 'undefined';

/**
 * Checks if ANSI colors are supported (terminal environments)
 */
export function supportsANSIColors(): boolean {
    if (isNode) {
        return process.stdout?.isTTY === true ||
               process.env.FORCE_COLOR === '1' ||
               process.env.FORCE_COLOR === 'true';
    }

    return false;
}