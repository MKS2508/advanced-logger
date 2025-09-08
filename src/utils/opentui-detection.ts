/**
 * @fileoverview OpenTUI detection and enhancement utilities for core logger
 */

import { isNode } from './environment.js';

/**
 * Check if OpenTUI packages are available
 */
export async function hasOpenTUI(): Promise<boolean> {
    if (!isNode) {
        return false; // OpenTUI is Node.js only
    }
    
    try {
        // Try to dynamically import OpenTUI core
        // @ts-expect-error - Optional dependency, may not be installed
        await import('@opentui/core');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check if OpenTUI enhancement package is available
 */
export async function hasOpenTUILogHandler(): Promise<boolean> {
    if (!isNode) {
        return false;
    }
    
    try {
        // @ts-expect-error - Optional dependency, may not be installed
        await import('@mks2508/better-logger-nodejs-opentui');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Dynamically enhance logger with OpenTUI if available
 */
export async function tryEnhanceWithOpenTUI(logger: any): Promise<boolean> {
    try {
        // Check if both OpenTUI and our enhancement package are available
        const [hasCore, hasEnhancer] = await Promise.all([
            hasOpenTUI(),
            hasOpenTUILogHandler()
        ]);
        
        if (!hasCore || !hasEnhancer) {
            return false;
        }
        
        // Dynamically import and apply enhancement
        // @ts-expect-error - Optional dependency, may not be installed
        const { enhanceLoggerWithOpenTUI } = await import('@mks2508/better-logger-nodejs-opentui');
        
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
        
        return enhanced;
    } catch (error) {
        console.warn('Failed to enhance logger with OpenTUI:', error);
        return false;
    }
}

/**
 * Get OpenTUI environment information
 */
export async function getOpenTUIInfo(): Promise<{
    available: boolean;
    coreAvailable: boolean;
    handlerAvailable: boolean;
    nodeVersion: string | null;
    terminalSupport: boolean;
}> {
    const [coreAvailable, handlerAvailable] = await Promise.all([
        hasOpenTUI(),
        hasOpenTUILogHandler()
    ]);
    
    return {
        available: coreAvailable && handlerAvailable,
        coreAvailable,
        handlerAvailable,
        nodeVersion: isNode ? process.version : null,
        terminalSupport: isNode ? process.stdout?.isTTY === true : false
    };
}

/**
 * Auto-enhance logger with best available rendering
 */
export async function autoEnhanceLogger(logger: any): Promise<{
    enhanced: boolean;
    method: 'opentui' | 'ansi' | 'plain';
    info?: any;
}> {
    // Try OpenTUI first
    const openTUIEnhanced = await tryEnhanceWithOpenTUI(logger);
    if (openTUIEnhanced) {
        return {
            enhanced: true,
            method: 'opentui',
            info: await getOpenTUIInfo()
        };
    }
    
    // Fallback to ANSI colors if in Node.js
    if (isNode && process.stdout?.isTTY) {
        return {
            enhanced: false,
            method: 'ansi',
            info: { reason: 'OpenTUI not available, using ANSI colors' }
        };
    }
    
    // Plain text fallback
    return {
        enhanced: false,
        method: 'plain',
        info: { reason: 'No enhanced rendering available' }
    };
}