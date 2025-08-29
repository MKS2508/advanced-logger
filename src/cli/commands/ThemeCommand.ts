/**
 * @fileoverview Theme and banner commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';
import type { BannerType } from '../../types/index.js';
import { THEME_PRESETS, BANNER_VARIANTS } from '../../styling/index.js';
import { StyleBuilder } from '../../styling/index.js';

/**
 * Themes command - show available themes
 */
export class ThemesCommand implements ICommand {
    name = 'themes';
    description = 'Show available theme presets';
    usage = '/themes';

    execute(_args: string, logger: Logger): void {
        logger.group('🎨 Available Themes');
        Object.keys(THEME_PRESETS).forEach(themeName => {
            const preview = (THEME_PRESETS as any)[themeName];
            const previewStyle = new StyleBuilder()
                .bg(preview.info.background)
                .color(preview.info.color)
                .padding('4px 8px')
                .rounded('4px')
                .border(preview.info.border)
                .build();
            
            console.log(`%c${themeName}`, previewStyle, `- ${themeName} theme preview`);
        });
        logger.groupEnd();
    }
}

/**
 * Banners command - show available banner types
 */
export class BannersCommand implements ICommand {
    name = 'banners';
    description = 'Show available banner types';
    usage = '/banners';

    execute(_args: string, logger: Logger): void {
        logger.group('🖼️ Available Banner Types');
        Object.keys(BANNER_VARIANTS).forEach(bannerName => {
            const banner = (BANNER_VARIANTS as any)[bannerName];
            console.log(`%c${bannerName}`, 'font-weight: bold; color: #667eea;');
            console.log(`%cPreview:`, 'color: #666; font-size: 12px;');
            
            // Show a mini preview
            if (bannerName === 'simple') {
                console.log(`%c${banner.text}`, banner.style);
            } else if (bannerName === 'ascii') {
                console.log(`%c${banner.text.split('\n').slice(1, 4).join('\n')}...`, 'font-family: monospace; color: #667eea; font-size: 10px;');
            } else if (bannerName === 'unicode') {
                console.log(`%c${banner.text}`, banner.style);
            } else {
                console.log(`%c${bannerName} banner`, 'color: #666; font-style: italic;');
            }
        });
        logger.groupEnd();
    }
}

/**
 * Banner command - change/show banner type
 */
export class BannerCommand implements ICommand {
    name = 'banner';
    description = 'Change or show current banner type';
    usage = '/banner [type]';

    execute(args: string, logger: Logger): void {
        if (!args) {
            logger.showBanner();
            return;
        }

        if (args in BANNER_VARIANTS) {
            logger.setBannerType(args as BannerType);
            logger.showBanner();
        } else {
            logger.error(`Invalid banner type: ${args}. Available: ${Object.keys(BANNER_VARIANTS).join(', ')}`);
        }
    }
}