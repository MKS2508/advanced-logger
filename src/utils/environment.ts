/**
 * @fileoverview Environment detection utilities for Universal Logger.
 * Re-exports from environment-detector.ts and provides isNode/isBrowser.
 */

// Re-export everything from environment-detector (except isNode/isBrowser which we define locally)
export {
    getEnvironment,
    isRunningInTerminal,
    supportsANSI,
    getColorCapability,
    getTerminalWidth,
    getTerminalHeight,
    getEnvironmentInfo,
    type Environment
} from './environment-detector.js';

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
 * Alias for supportsANSI — kept for backward compatibility.
 */
export const supportsANSIColors = (): boolean => {
    if (isNode) {
        return process.stdout?.isTTY === true ||
               process.env.FORCE_COLOR === '1' ||
               process.env.FORCE_COLOR === 'true';
    }
    return false;
};