/**
 * @fileoverview Analytics log handler for Advanced Logger
 */

import type { ILogHandler, LogLevel, LogMetadata } from '../types/index.js';

/**
 * Example custom handler for analytics demonstration
 */
export class AnalyticsLogHandler implements ILogHandler {
    handle(level: LogLevel, message: string, _args: any[], metadata: LogMetadata): void {
        // In a real implementation, this could send analytics data
        if (level === 'error' || level === 'critical') {
            // Track errors for analytics
            console.debug('Analytics: Error tracked', { 
                level, 
                message, 
                timestamp: metadata.timestamp 
            });
        }
    }
}