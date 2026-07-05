/**
 * @fileoverview Status and demo commands for Advanced Logger CLI
 */

import type { ICommand } from '../CommandProcessor.js';
import type { Logger } from '../../Logger.js';

/**
 * Comando `/status` del CLI runtime del {@link Logger}. Vuelca la
 * configuración vigente y algunas estadísticas (theme, verbosity, flags
 * de features, handler count, bufferSize) en una tabla agrupada dentro
 * de la consola. Es de solo lectura: no muta el logger.
 *
 * @example
 * // Inspeccionar el estado actual del logger
 * // > /status
 *
 * @see {@link Logger.getConfig} fuente de los datos mostrados.
 */
export class StatusCommand implements ICommand {
    name = 'status';
    description = 'Show current logger status and configuration';
    usage = '/status';

    /**
     * Ejecuta el comando `/status` contra el logger dado.
     *
     * @param _args - Ignorado (comando sin parámetros).
     * @param logger - Instancia de la que se lee la configuración.
     */
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
    }
}

/**
 * Comando `/reset` del CLI runtime del {@link Logger}. Restaura la
 * configuración a sus defaults de fábrica vía {@link Logger.resetConfig}.
 * No resetea handlers ni transports registrados — solo config.
 *
 * @example
 * // Volver a la configuración por defecto
 * // > /reset
 *
 * @see {@link Logger.resetConfig} para el método subyacente.
 */
export class ResetCommand implements ICommand {
    name = 'reset';
    description = 'Reset logger configuration to defaults';
    usage = '/reset';

    /**
     * Ejecuta el comando `/reset` contra el logger dado.
     *
     * @param _args - Ignorado (comando sin parámetros).
     * @param logger - Instancia cuya configuración se resetea.
     */
    execute(_args: string, logger: Logger): void {
        logger.resetConfig();
    }
}

/**
 * Comando `/demo` del CLI runtime del {@link Logger}. Ejecuta una
 * demostración integral de las capacidades del logger: todos los niveles
 * de log (debug → critical), tablas, timers (`time`/`timeEnd`), SVG inline
 * y mensajes animados. Útil para validar que el styling funciona en un
 * entorno nuevo o tras un cambio de tema.
 *
 * @example
 * // Lanzar la demo completa
 * // > /demo
 *
 * @see {@link Logger} para cada feature individual (`table`, `time`,
 *      `logWithSVG`, `logAnimated`, ...).
 */
export class DemoCommand implements ICommand {
    name = 'demo';
    description = 'Show comprehensive feature demonstration';
    usage = '/demo';

    /**
     * Ejecuta el comando `/demo` contra el logger dado.
     *
     * @param _args - Ignorado (comando sin parámetros).
     * @param logger - Instancia sobre la que se ejecutan los ejemplos.
     */
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
