/**
 * @fileoverview Punto de entrada del subsistema CLI del logger. Re-exporta el
 * processor, los comandos estándar y expone {@link createDefaultCLI} como
 * factory principal. El CLI no es un binario standalone — se invoca desde
 * código vía `logger.cli()` o desde la devtools vía `window.cli()` (cuando el
 * modo interactivo está activo).
 */

// Core CLI system
export { CommandProcessor, type ICommand } from './CommandProcessor.js';
import { CommandProcessor } from './CommandProcessor.js';

// Commands
export { ConfigCommand } from './commands/ConfigCommand.js';
export { ThemesCommand, BannersCommand, BannerCommand } from './commands/ThemeCommand.js';
export { StatusCommand, ResetCommand, DemoCommand } from './commands/ExportCommand.js';

// Help system
export { HelpCommand } from './help.js';

// Import all commands
import { HelpCommand } from './help.js';
import { ConfigCommand } from './commands/ConfigCommand.js';
import { ThemesCommand, BannersCommand, BannerCommand } from './commands/ThemeCommand.js';
import { StatusCommand, ResetCommand, DemoCommand } from './commands/ExportCommand.js';

/**
 * Crea un {@link CommandProcessor} con los 8 comandos estándar ya registrados:
 * `help`, `config`, `themes`, `banners`, `banner`, `status`, `reset` y
 * `demo`. Es el factory canónico — los consumidores normalmente no construyen
 * un `CommandProcessor` vacío a mano, ya que este no trae comandos cargados.
 *
 * @returns {CommandProcessor} Processor listo para usar, sin modo interactivo activo.
 *
 * @example
 * ```ts
 * const cli = createDefaultCLI();
 * await cli.processCommand('/help', logger);
 * await cli.processCommand('/config theme=neon', logger);
 * ```
 *
 * @example
 * ```ts
 * // Modo interactivo en el navegador: expone `window.cli`
 * const cli = createDefaultCLI();
 * cli.enterInteractiveMode(logger);
 * // desde devtools: cli('themes')  →  procesa '/themes'
 * ```
 *
 * @see {@link CommandProcessor}
 * @see {@link HelpCommand}
 */
export function createDefaultCLI(): CommandProcessor {
    const processor = new CommandProcessor();

    // Register all default commands
    processor.registerCommand(new HelpCommand());
    processor.registerCommand(new ConfigCommand());
    processor.registerCommand(new ThemesCommand());
    processor.registerCommand(new BannersCommand());
    processor.registerCommand(new BannerCommand());
    processor.registerCommand(new StatusCommand());
    processor.registerCommand(new ResetCommand());
    processor.registerCommand(new DemoCommand());

    return processor;
}