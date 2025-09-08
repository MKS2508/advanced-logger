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
 * Checks if running in web worker environment
 */
export const isWebWorker = typeof self !== 'undefined' && 
                            typeof (self as any).importScripts === 'function';

/**
 * Checks if running in Deno environment
 */
export const isDeno = typeof globalThis !== 'undefined' && 
                      'Deno' in globalThis;

/**
 * Gets the current runtime environment
 */
export function getRuntimeEnvironment(): 'node' | 'browser' | 'webworker' | 'deno' | 'unknown' {
    if (isNode) return 'node';
    if (isBrowser) return 'browser';
    if (isWebWorker) return 'webworker';
    if (isDeno) return 'deno';
    return 'unknown';
}

/**
 * Checks if colors/styling should be supported in current environment
 */
export function supportsColors(): boolean {
    if (isBrowser) {
        // Browser always supports CSS colors
        return true;
    }
    
    if (isNode) {
        // Check if Node.js supports colors
        return process.stdout?.isTTY === true || 
               process.env.FORCE_COLOR === '1' ||
               process.env.FORCE_COLOR === 'true';
    }
    
    return false;
}

/**
 * Checks if CSS styling is supported (browser-only feature)
 */
export function supportsCSSColors(): boolean {
    return isBrowser;
}

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

/**
 * Gets environment-specific information
 */
export function getEnvironmentInfo() {
    const env = getRuntimeEnvironment();
    
    return {
        runtime: env,
        supportsColors: supportsColors(),
        supportsCSSColors: supportsCSSColors(),
        supportsANSIColors: supportsANSIColors(),
        isProduction: isNode ? process.env.NODE_ENV === 'production' : false,
        version: isNode ? process.versions.node : (isBrowser ? navigator.userAgent : 'unknown')
    };
}