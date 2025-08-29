/**
 * @fileoverview Export and clipboard commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';
import type { ExportFormat, ExportFilters, ExportOptions, LogLevel } from '../../types/index.js';
import { EXPORT_FORMATS } from '../../constants.js';

/**
 * Parse command line arguments into filters and options
 */
function parseArguments(args: string): { filters: ExportFilters; options: ExportOptions; format?: ExportFormat } {
    const filters: ExportFilters = {};
    const options: ExportOptions = {};
    let format: ExportFormat | undefined;

    if (!args.trim()) return { filters, options };

    // Split args by spaces, but keep quoted strings together
    const argParts = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    for (let i = 0; i < argParts.length; i++) {
        const arg = argParts[i];

        // Skip if arg is null/undefined
        if (!arg) {
            continue;
        }

        // Format (first argument without --)
        if (i === 0 && !arg.startsWith('--') && arg in EXPORT_FORMATS) {
            format = arg as ExportFormat;
            continue;
        }

        // Parse --flags
        if (arg.startsWith('--')) {
            const [flag, value] = arg.slice(2).split('=');
            
            switch (flag) {
                case 'level':
                case 'levels':
                    if (value) {
                        filters.levels = value.split(',').map(l => l.trim()) as LogLevel[];
                    }
                    break;
                case 'since':
                    if (value) filters.since = value;
                    break;
                case 'until':
                    if (value) filters.until = value;
                    break;
                case 'prefix':
                case 'prefixes':
                    if (value) {
                        filters.prefixes = value.split(',').map(p => p.trim());
                    }
                    break;
                case 'exclude-prefix':
                case 'exclude-prefixes':
                    if (value) {
                        filters.excludePrefixes = value.split(',').map(p => p.trim());
                    }
                    break;
                case 'last':
                    if (value) filters.last = parseInt(value, 10);
                    break;
                case 'first':
                    if (value) filters.first = parseInt(value, 10);
                    break;
                case 'search':
                    if (value) filters.search = value.replace(/['"]/g, '');
                    break;
                case 'with-stack':
                    filters.withStackTrace = true;
                    break;
                case 'errors-only':
                    filters.errorsOnly = true;
                    break;
                case 'group-by':
                    if (value) {
                        filters.groupBy = value as ExportFilters['groupBy'];
                        options.groupBy = value as ExportOptions['groupBy'];
                    }
                    break;
                case 'minimal':
                    options.minimal = true;
                    break;
                case 'compact':
                    options.compact = true;
                    break;
                case 'styled':
                    options.styled = true;
                    break;
            }
        }
    }

    return { filters, options, format };
}

/**
 * Export command - export logs in various formats
 */
export class ExportCommand implements ICommand {
    name = 'export';
    description = 'Export logs to various formats';
    usage = '/export <format> [--filter=value] [--option]';

    execute(args: string, logger: Logger): void {
        const exportHandler = logger.getExportHandler();
        if (!exportHandler) {
            logger.error('Export handler not available. Make sure ExportLogHandler is registered.');
            return;
        }

        const { filters, options, format } = parseArguments(args);

        if (!format) {
            logger.error('Format required. Available formats: ' + Object.keys(EXPORT_FORMATS).join(', '));
            logger.info('Usage: /export <format> [--filter=value]');
            logger.info('Example: /export json --level=error,warn --last=50');
            return;
        }

        try {
            const result = exportHandler.export(format, filters, options);
            
            // Log success with metadata
            logger.success(`✅ Export completed: ${result.metadata.filteredLogs} logs exported in ${format} format`);
            
            // Show preview for small exports
            if (result.data.length < 1000) {
                logger.group(`📄 Preview (${format.toUpperCase()})`);
                console.log(result.data);
                logger.groupEnd();
            } else {
                logger.info(`📄 Export size: ${(result.data.length / 1024).toFixed(2)}KB`);
            }

            // Show metadata
            logger.table({
                format: result.format,
                totalLogs: result.metadata.totalLogs,
                filtered: result.metadata.filteredLogs,
                exported: result.metadata.exportedAt
            });

        } catch (error) {
            logger.error('Export failed:', error);
        }
    }
}

/**
 * Copy command - copy logs to clipboard
 */
export class CopyCommand implements ICommand {
    name = 'copy';
    description = 'Copy logs to clipboard';
    usage = '/copy <format> [--filter=value] [--option]';

    async execute(args: string, logger: Logger): Promise<void> {
        const exportHandler = logger.getExportHandler();
        if (!exportHandler) {
            logger.error('Export handler not available. Make sure ExportLogHandler is registered.');
            return;
        }

        const { filters, options, format } = parseArguments(args);

        if (!format) {
            logger.error('Format required. Available formats: ' + Object.keys(EXPORT_FORMATS).join(', '));
            logger.info('Usage: /copy <format> [--filter=value]');
            logger.info('Example: /copy plain --level=error --last=25');
            return;
        }

        try {
            const success = await exportHandler.copyToClipboard(format, filters, options);
            
            if (success) {
                const result = exportHandler.export(format, filters, options);
                logger.success(`📋 Copied ${result.metadata.filteredLogs} logs to clipboard (${format} format)`);
            } else {
                logger.error('Failed to copy to clipboard. Browser may not support clipboard API.');
            }

        } catch (error) {
            logger.error('Copy failed:', error);
        }
    }
}

/**
 * Buffer-size command - configure buffer size
 */
export class BufferSizeCommand implements ICommand {
    name = 'buffer-size';
    description = 'Set log buffer size';
    usage = '/buffer-size <size>';

    execute(args: string, logger: Logger): void {
        const exportHandler = logger.getExportHandler();
        if (!exportHandler) {
            logger.error('Export handler not available.');
            return;
        }

        const size = parseInt(args.trim(), 10);
        if (isNaN(size) || size <= 0) {
            logger.error('Invalid buffer size. Must be a positive number.');
            logger.info('Example: /buffer-size 2000');
            return;
        }

        exportHandler.setBufferSize(size);
        logger.success(`Buffer size set to ${size}`);
    }
}

/**
 * Clear-buffer command - clear log buffer
 */
export class ClearBufferCommand implements ICommand {
    name = 'clear-buffer';
    description = 'Clear the log buffer';
    usage = '/clear-buffer';

    execute(_args: string, logger: Logger): void {
        const exportHandler = logger.getExportHandler();
        if (!exportHandler) {
            logger.error('Export handler not available.');
            return;
        }

        const stats = exportHandler.getBufferStats();
        exportHandler.clearBuffer();
        
        logger.success(`✅ Buffer cleared. Removed ${stats.size} log entries.`);
    }
}

/**
 * Buffer-info command - show buffer information
 */
export class BufferInfoCommand implements ICommand {
    name = 'buffer-info';
    description = 'Show buffer statistics and information';
    usage = '/buffer-info';

    execute(_args: string, logger: Logger): void {
        const exportHandler = logger.getExportHandler();
        if (!exportHandler) {
            logger.error('Export handler not available.');
            return;
        }

        const stats = exportHandler.getBufferStats();
        
        logger.group('📊 Buffer Information');
        logger.table({
            size: `${stats.size}/${stats.maxSize}`,
            usage: `${stats.usage.toFixed(1)}%`,
            oldestLog: stats.oldestLog?.toLocaleString() || 'None',
            newestLog: stats.newestLog?.toLocaleString() || 'None'
        });
        
        logger.group('📈 Log Level Counts');
        logger.table(stats.levelCounts);
        logger.groupEnd();
        
        logger.groupEnd();
    }
}