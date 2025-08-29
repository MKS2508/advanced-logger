/**
 * @fileoverview Configuration commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';
import type { ThemeVariant, BannerType, Verbosity } from '../../types/index.js';

/**
 * Configuration command handler
 */
export class ConfigCommand implements ICommand {
    name = 'config';
    description = 'Show or update logger configuration';
    usage = '/config [json|key=value,...]';

    execute(args: string, logger: Logger): void {
        if (!args) {
            this.showStatus(logger);
            return;
        }

        try {
            // Try to parse as JSON first
            if (args.startsWith('{')) {
                const config = JSON.parse(args);
                this.applyConfig(config, logger);
            } else {
                // Parse key=value pairs
                const pairs = args.split(',').map(pair => pair.trim().split('='));
                const config: any = {};
                pairs.forEach(([key, value]) => {
                    if (key && value) {
                        config[key.trim()] = value.trim().replace(/["']/g, '');
                    }
                });
                this.applyConfig(config, logger);
            }
        } catch (error) {
            logger.error('Invalid config format. Use JSON or key=value pairs:', error);
            logger.info('Examples: /config {"theme":"dark"} or /config theme=neon,verbosity=debug');
        }
    }

    private showStatus(logger: Logger): void {
        const statusData = {
            theme: logger.getConfig().theme || 'default',
            verbosity: logger.getConfig().verbosity,
            colors: logger.getConfig().enableColors,
            timestamps: logger.getConfig().enableTimestamps,
            stackTrace: logger.getConfig().enableStackTrace,
            globalPrefix: logger.getConfig().globalPrefix || 'none',
            bannerType: logger.getConfig().bannerType || 'simple',
            handlers: logger.getHandlers().length
        };

        logger.group('⚙️ Logger Configuration');
        logger.table(statusData);
        logger.groupEnd();
    }

    private applyConfig(config: any, logger: Logger): void {
        const validKeys = ['theme', 'verbosity', 'enableColors', 'enableTimestamps', 'enableStackTrace', 'globalPrefix', 'bannerType'];
        const applied: string[] = [];

        Object.entries(config).forEach(([key, value]) => {
            if (validKeys.includes(key)) {
                if (key === 'theme' && typeof value === 'string') {
                    logger.setTheme(value as ThemeVariant);
                    applied.push(`${key}=${value}`);
                } else if (key === 'bannerType' && typeof value === 'string') {
                    logger.setBannerType(value as BannerType);
                    applied.push(`${key}=${value}`);
                } else if (key === 'verbosity') {
                    logger.setVerbosity(value as Verbosity);
                    applied.push(`${key}=${value}`);
                } else if (key === 'globalPrefix') {
                    logger.setGlobalPrefix(value as string);
                    applied.push(`${key}=${value}`);
                } else {
                    logger.updateConfig({ [key]: value });
                    applied.push(`${key}=${value}`);
                }
            } else {
                logger.warn(`Invalid config key: ${key}`);
            }
        });

        if (applied.length > 0) {
            logger.success(`Configuration updated: ${applied.join(', ')}`);
        }
    }
}