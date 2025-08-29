/**
 * @fileoverview History management commands for CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';

/**
 * Show command history
 */
export class HistoryCommand implements ICommand {
    name = 'history';
    description = 'Show command execution history';
    usage = '/history [limit] - Show recent commands (default: 10)';
    category = 'system';
    aliases = ['hist', 'h'];

    execute(args: string, logger: Logger): void {
        const processor = (logger as any).cliProcessor;
        if (!processor) {
            logger.error('CLI processor not available');
            return;
        }

        const limit = parseInt(args) || 10;
        const history = processor.getHistory().slice(0, limit);
        
        if (history.length === 0) {
            logger.info('📝 No command history available');
            return;
        }

        logger.info(`📋 Last ${history.length} commands:`);
        
        history.forEach((entry, index) => {
            const status = entry.success ? '✅' : '❌';
            const time = entry.timestamp.toLocaleTimeString();
            logger.info(`${status} [${time}] ${entry.command}`);
        });
    }
}

/**
 * Clear command history
 */
export class ClearHistoryCommand implements ICommand {
    name = 'clearhistory';
    description = 'Clear command execution history';
    usage = '/clearhistory - Remove all command history';
    category = 'system';
    aliases = ['clrhist'];

    execute(args: string, logger: Logger): void {
        const processor = (logger as any).cliProcessor;
        if (!processor) {
            logger.error('CLI processor not available');
            return;
        }

        processor.clearHistory();
        logger.success('🗑️ Command history cleared');
    }
}

/**
 * Interactive mode command
 */
export class InteractiveCommand implements ICommand {
    name = 'interactive';
    description = 'Enter interactive CLI mode';
    usage = '/interactive - Start interactive command mode';
    category = 'system';
    aliases = ['i', 'repl'];

    execute(args: string, logger: Logger): void {
        const processor = (logger as any).cliProcessor;
        if (!processor) {
            logger.error('CLI processor not available');
            return;
        }

        processor.enterInteractiveMode(logger);
    }
}

/**
 * Plugin management command
 */
export class PluginsCommand implements ICommand {
    name = 'plugins';
    description = 'List loaded CLI plugins';
    usage = '/plugins - Show all registered plugins';
    category = 'system';
    aliases = ['plug'];

    execute(args: string, logger: Logger): void {
        const processor = (logger as any).cliProcessor;
        if (!processor) {
            logger.error('CLI processor not available');
            return;
        }

        const plugins = processor.getPlugins();
        
        if (plugins.length === 0) {
            logger.info('🔌 No plugins registered');
            return;
        }

        logger.info(`🔌 Loaded plugins (${plugins.length}):`);
        
        plugins.forEach(plugin => {
            logger.info(`  📦 ${plugin.name} v${plugin.version} - ${plugin.description}`);
            logger.info(`     Commands: ${plugin.commands.map(c => c.name).join(', ')}`);
        });
    }
}