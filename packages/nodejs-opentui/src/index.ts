/**
 * @fileoverview OpenTUI Logger - Tier 2 Enhanced Terminal Logging
 */

// Core exports
export { OpenTUILogHandler, createOpenTUILogHandler, isOpenTUIAvailable } from './OpenTUILogHandler.js';
export { OpenTUILogRenderer } from './LogRenderer.js';

// Types
export type {
    OpenTUILogEntry,
    LogAnimation,
    LogComponentStyle,
    InteractiveLogConfig,
    LogDashboardConfig,
    ProgressLogEntry,
    TableLogEntry,
    LogStatistics,
    LogFilter,
    OpenTUIRendererOptions,
    LogLevelStyling,
    OpenTUILogHandlerConfig
} from './types.js';

// Convenience function to create and initialize OpenTUI logger
import { OpenTUILogHandler } from './OpenTUILogHandler.js';
import type { OpenTUILogHandlerConfig } from './types.js';

/**
 * Create and initialize OpenTUI log handler
 * 
 * @example
 * ```typescript
 * import { createOpenTUILogger } from '@mks2508/better-logger-nodejs-opentui';
 * import logger from '@mks2508/better-logger-core';
 * 
 * const openTUIHandler = await createOpenTUILogger({
 *   animated: true,
 *   components: { badges: true }
 * });
 * 
 * if (openTUIHandler) {
 *   logger.addHandler(openTUIHandler);
 *   logger.info('Rich terminal logging enabled!');
 * }
 * ```
 */
export async function createOpenTUILogger(
    config?: OpenTUILogHandlerConfig
): Promise<OpenTUILogHandler | null> {
    try {
        const handler = new OpenTUILogHandler(config);
        const initialized = await handler.initialize();
        
        if (initialized) {
            return handler;
        } else {
            console.warn('OpenTUI not available, using fallback logging');
            return null;
        }
    } catch (error) {
        console.error('Failed to create OpenTUI logger:', error);
        return null;
    }
}

/**
 * Utility to enhance existing logger with OpenTUI capabilities
 * 
 * @example
 * ```typescript
 * import logger from '@mks2508/better-logger-core';
 * import { enhanceLoggerWithOpenTUI } from '@mks2508/better-logger-nodejs-opentui';
 * 
 * await enhanceLoggerWithOpenTUI(logger, {
 *   animated: true,
 *   theme: 'dark'
 * });
 * 
 * logger.info('Now with OpenTUI superpowers!');
 * ```
 */
export async function enhanceLoggerWithOpenTUI(
    logger: any, // Accept any logger with addHandler method
    config?: OpenTUILogHandlerConfig
): Promise<boolean> {
    const handler = await createOpenTUILogger(config);
    
    if (handler && logger.addHandler) {
        logger.addHandler(handler);
        return true;
    }
    
    return false;
}

/**
 * Quick setup function for common use cases
 */
export async function quickSetup() {
    try {
        // Try to import and enhance the default core logger
        const { default: logger } = await import('@mks2508/better-logger-core');
        
        const enhanced = await enhanceLoggerWithOpenTUI(logger, {
            renderer: {
                animated: true,
                theme: 'auto',
                components: {
                    badges: true,
                    progressBars: false,
                    tables: false,
                    charts: false
                }
            }
        });
        
        if (enhanced) {
            console.log('🚀 OpenTUI enhanced logging activated!');
            return logger;
        } else {
            console.warn('⚠️ OpenTUI not available, using standard logging');
            return logger;
        }
    } catch (error) {
        console.error('❌ Failed to setup OpenTUI logging:', error);
        return null;
    }
}

// Package info
export const version = '0.1.0';
export const name = '@mks2508/better-logger-nodejs-opentui';