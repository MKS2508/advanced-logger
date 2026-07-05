/**
 * @fileoverview Theme and banner commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';
import type { BannerType } from '../../types/index.js';
import { THEME_PRESETS, BANNER_VARIANTS } from '../../styling/index.js';
import { StyleBuilder } from '../../styling/index.js';

/**
 * Comando `/themes` del CLI runtime del {@link Logger}. Lista los presets
 * temáticos disponibles en {@link THEME_PRESETS}, renderizando una preview
 * con los colores reales de cada tema (background, foreground, border).
 *
 * Es de solo lectura: no muta el logger. Útil para descubrir qué tema
 * aplicar antes de correr `/config theme=<name>`.
 *
 * @example
 * // Listar todos los temas con preview coloreada
 * // > /themes
 *
 * @see {@link THEME_PRESETS} para el catálogo completo de temas.
 * @see {@link ConfigCommand} para aplicar un tema vía `/config theme=...`.
 */
export class ThemesCommand implements ICommand {
    name = 'themes';
    description = 'Show available theme presets';
    usage = '/themes';

    /**
     * Ejecuta el comando `/themes` contra el logger dado.
     *
     * @param _args - Ignorado (comando sin parámetros).
     * @param logger - Instancia usada para abrir/cerrar el `group` de salida.
     */
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
 * Comando `/banners` del CLI runtime del {@link Logger}. Enumera los tipos
 * de banner disponibles en {@link BANNER_VARIANTS} (`simple`, `ascii`,
 * `unicode`, ...) con una mini-preview de cada uno para inspección visual.
 *
 * Es de solo lectura: no muta el logger. Para cambiar el banner activo
 * usar {@link BannerCommand}.
 *
 * @example
 * // Listar todas las variantes de banner con preview
 * // > /banners
 *
 * @see {@link BANNER_VARIANTS} para el catálogo completo de variantes.
 * @see {@link BannerCommand} para aplicar un tipo concreto.
 */
export class BannersCommand implements ICommand {
    name = 'banners';
    description = 'Show available banner types';
    usage = '/banners';

    /**
     * Ejecuta el comando `/banners` contra el logger dado.
     *
     * @param _args - Ignorado (comando sin parámetros).
     * @param logger - Instancia usada para abrir/cerrar el `group` de salida.
     */
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
 * Comando `/banner [type]` del CLI runtime del {@link Logger}.
 *
 * - Sin argumentos: re-renderiza el banner actualmente activo.
 * - Con un tipo válido: lo aplica vía {@link Logger.setBannerType} y lo
 *   muestra inmediatamente.
 * - Con un tipo inválido: loguea un `error` listando las opciones válidas.
 *
 * @example
 * // Mostrar el banner actual
 * // > /banner
 *
 * @example
 * // Cambiar a un tipo concreto
 * // > /banner ascii
 *
 * @see {@link BANNER_VARIANTS} para los tipos aceptados.
 * @see {@link Logger.setBannerType} y {@link Logger.showBanner} para los
 *      métodos subyacentes.
 */
export class BannerCommand implements ICommand {
    name = 'banner';
    description = 'Change or show current banner type';
    usage = '/banner [type]';

    /**
     * Ejecuta el comando `/banner` contra el logger dado.
     *
     * @param args - Tipo de banner solicitado. Vacío = mostrar banner actual.
     * @param logger - Instancia destino cuyo banner se actualiza/muestra.
     */
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