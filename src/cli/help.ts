/**
 * @fileoverview Help system del CLI del logger. Expone {@link HelpCommand},
 * que renderiza un panel ASCII con la lista completa de comandos, opciones de
 * configuración, filtros de export y ejemplos de uso.
 */

import type { ICommand } from './CommandProcessor.js';
import type { Logger } from '../Logger.js';
import { StyleBuilder } from '../styling/index.js';

/**
 * Comando `/help`: renderiza en consola el panel de ayuda del CLI con todos
 * los comandos disponibles, opciones de configuración, filtros de export y
 * ejemplos. El panel usa un gradient claro con {@link StyleBuilder} y los
 * quick tips se agrupan vía `logger.group`.
 *
 * Registrado por defecto por {@link createDefaultCLI}.
 *
 * @example
 * ```ts
 * const cli = createDefaultCLI();
 * await cli.processCommand('/help', logger);
 * // Imprime el panel ASCII con gradient + grupo "Quick Tips".
 * ```
 *
 * @see {@link ICommand}
 * @see {@link createDefaultCLI}
 */
export class HelpCommand implements ICommand {
    name = 'help';
    description = 'Show CLI help and available commands';
    usage = '/help [command]';

    /**
     * Renderiza el panel de ayuda completo. Actualmente ignora `_args`: el
     * `usage` declara `/help [command]` (sub-comando opcional) pero la
     * implementación siempre muestra el panel global.
     *
     * @param {string} _args - Argumentos opcionales (reservado para ayuda por
     *   sub-comando; sin uso actual).
     * @param {Logger} logger - Logger activo; se usa solo para `group`/`info`
     *   de los quick tips.
     * @returns {void}
     */
    execute(_args: string, logger: Logger): void {
        const helpStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)')
            .color('#495057')
            .padding('15px 20px')
            .rounded('8px')
            .border('1px solid #dee2e6')
            .font('Monaco, Consolas, monospace')
            .size('13px')
            .build();

        const helpText = `
╭─────────────── ADVANCED LOGGER CLI COMMANDS ─────────────────╮
│                                                             │
│  CONFIGURATION                                              │
│  /config            Show current configuration              │
│  /config {json}     Apply JSON configuration                │
│  /config key=val    Apply key-value configuration           │
│  /themes            Show available themes                   │
│  /banners           Show available banner types             │
│  /banner [type]     Change/show banner type                 │
│  /status            Show logger status & buffer stats       │
│  /demo              Show feature demonstration              │
│  /reset             Reset to default configuration          │
│                                                             │
│  EXPORT & CLIPBOARD                                         │
│  /export <format>   Export logs (json|csv|md|plain|html)    │
│  /copy <format>     Copy logs to clipboard                  │
│  /buffer-size N     Set log buffer size                     │
│  /buffer-info       Show buffer statistics                  │
│  /clear-buffer      Clear stored logs                       │
│                                                             │
│  EXPORT FILTERS (for export/copy commands)                 │
│  --level error,warn     Filter by log levels                │
│  --since 2h             Logs from last 2 hours              │
│  --until 1h             Logs until 1 hour ago               │
│  --prefix API,DB        Filter by prefixes                  │
│  --exclude-prefix INT   Exclude prefixes                    │
│  --last 50             Last 50 logs only                    │
│  --first 25            First 25 logs only                   │
│  --search "error"      Search in log messages               │
│  --with-stack          Only logs with stack traces          │
│  --errors-only         Only error + critical logs           │
│  --group-by level      Group by level/prefix/hour           │
│                                                             │
│  EXPORT OPTIONS                                             │
│  --minimal             Minimal output format                │
│  --compact             Remove extra whitespace              │
│  --styled              Include styling (HTML format)        │
│                                                             │
├──────────────────── CONFIGURATION OPTIONS ─────────────────┤
│                                                             │
│  theme: default | dark | light | neon | minimal | cyberpunk│
│  bannerType: simple | ascii | unicode | svg | animated     │
│  verbosity: debug | info | warn | error | critical | silent│
│  enableColors: true | false                                 │
│  enableTimestamps: true | false                             │
│  enableStackTrace: true | false                             │
│  globalPrefix: "string"                                     │
│  bufferSize: number (50-10000)                             │
│                                                             │
├──────────────────────── EXAMPLES ──────────────────────────┤
│                                                             │
│  Basic Configuration:                                       │
│  /config {"theme":"dark","verbosity":"debug"}               │
│  /config theme=neon,bufferSize=2000                        │
│  /banner animated       Change to animated banner          │
│                                                             │
│  Export Examples:                                           │
│  /export json --level=error,warn --last=25                 │
│  /export csv --since=2h --prefix=API                       │
│  /export markdown --group-by=level --errors-only           │
│  /export html --styled --since=1h                          │
│                                                             │
│  Clipboard Examples:                                        │
│  /copy plain --minimal --last=10                           │
│  /copy json --search="authentication" --compact            │
│  /copy csv --since=30m --exclude-prefix=DEBUG              │
│                                                             │
│  Buffer Management:                                         │
│  /buffer-size 5000      Increase buffer to 5000 logs       │
│  /buffer-info           Show detailed buffer statistics     │
│  /clear-buffer          Clear all stored logs               │
│                                                             │
│  Time Formats:                                              │
│  --since=2h            2 hours ago                          │
│  --since=30m           30 minutes ago                       │
│  --since=1d            1 day ago                            │
│  --since="2024-01-01T10:00:00Z"  Specific ISO date         │
│                                                             │
╰─────────────────────────────────────────────────────────────╯`;

        console.log(`%c${helpText}`, helpStyle);

        // Show quick tips
        logger.group('💡 Quick Tips');
        const tips = [
            'Use /demo to see all logger features in action',
            'Logs are automatically stored in a circular buffer for export',
            'Export formats: JSON (structured), CSV (Excel), Markdown (readable), Plain (simple), HTML (styled)',
            'Time filters support relative (2h, 30m) and absolute (ISO) formats',
            'Combine multiple filters: /export json --level=error --since=1h --search="auth"',
            'Use /copy for quick clipboard access instead of /export'
        ];
        
        tips.forEach(tip => {
            logger.info(`• ${tip}`);
        });
        logger.groupEnd();
    }
}