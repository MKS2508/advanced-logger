/**
 * @fileoverview Status and demo commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';

/**
 * Status command - show logger configuration and statistics
 */
export class StatusCommand implements ICommand {
    name = 'status';
    description = 'Show current logger status and configuration';
    usage = '/status';

    execute(_args: string, logger: Logger): void {
        const config = logger.getConfig();
        const statusData = {
            theme: config.theme ? config.theme : 'default',
            verbosity: config.verbosity,
            colors: config.enableColors,
            timestamps: config.enableTimestamps,
            stackTrace: config.enableStackTrace,
            globalPrefix: config.globalPrefix ? config.globalPrefix : 'none',
            bannerType: config.bannerType ? config.bannerType : 'simple',
            handlers: logger.getHandlers().length,
            bufferSize: config.bufferSize ? config.bufferSize : 1000
        };

        logger.group('⚙️ Logger Configuration');
        logger.table(statusData);
        logger.groupEnd();

        // Show buffer stats if ExportLogHandler is present
        const exportHandler = logger.getExportHandler();
        if (exportHandler) {
            const bufferStats = exportHandler.getBufferStats();
            logger.group('📊 Buffer Statistics');
            logger.table({
                size: `${bufferStats.size}/${bufferStats.maxSize}`,
                usage: `${bufferStats.usage.toFixed(1)}%`,
                oldestLog: bufferStats.oldestLog ? bufferStats.oldestLog.toISOString() : 'None',
                newestLog: bufferStats.newestLog ? bufferStats.newestLog.toISOString() : 'None',
                errorCount: bufferStats.levelCounts.error + bufferStats.levelCounts.critical,
                warningCount: bufferStats.levelCounts.warn
            });
            logger.groupEnd();
        }
    }
}

/**
 * Reset command - reset logger to defaults
 */
export class ResetCommand implements ICommand {
    name = 'reset';
    description = 'Reset logger configuration to defaults';
    usage = '/reset';

    execute(_args: string, logger: Logger): void {
        logger.resetConfig();
    }
}

/**
 * Demo command - show logger feature demonstration
 */
export class DemoCommand implements ICommand {
    name = 'demo';
    description = 'Show comprehensive feature demonstration';
    usage = '/demo';

    execute(_args: string, logger: Logger): void {
        logger.group('🎪 Advanced Logger Demo');
        
        // Basic logging demo
        logger.debug('Debug message with detailed information');
        logger.info('Informational message about system state'); 
        logger.warn('Warning about deprecated feature');
        logger.error('Error processing user request');
        logger.success('Operation completed successfully');
        logger.critical('Critical system failure detected');
        
        // Advanced features demo
        logger.group('📊 Advanced Features Demo');
        
        // Table demo
        logger.table([
            { feature: 'Styled Console', status: '✅ Active', performance: 'Excellent' },
            { feature: 'Theme System', status: '✅ Active', performance: 'Great' },
            { feature: 'CLI Interface', status: '✅ Active', performance: 'Good' },
            { feature: 'Export System', status: '✅ Active', performance: 'Excellent' }
        ]);
        
        // Timer demo
        logger.time('demo-operation');
        setTimeout(() => {
            logger.timeEnd('demo-operation');
        }, 100);
        
        // SVG demo
        logger.logWithSVG('SVG Demo');
        
        // Animated demo
        logger.logAnimated('🌟 Animated Logger Demo 🌟', 2);
        
        logger.groupEnd();
        logger.groupEnd();

        logger.info('Demo completed! Check the console for styled output.');
    }
}