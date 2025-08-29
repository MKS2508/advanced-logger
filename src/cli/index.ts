/**
 * @fileoverview CLI system exports for Advanced Logger
 */

// Core CLI system
export { CommandProcessor, type ICommand } from './CommandProcessor.js';
import { CommandProcessor } from './CommandProcessor.js';

// Commands
export { ConfigCommand } from './commands/ConfigCommand.js';
export { ThemesCommand, BannersCommand, BannerCommand } from './commands/ThemeCommand.js';
export { StatusCommand, ResetCommand, DemoCommand } from './commands/StatusCommand.js';
export { 
    ExportCommand, 
    CopyCommand, 
    BufferSizeCommand, 
    ClearBufferCommand, 
    BufferInfoCommand 
} from './commands/ExportCommand.js';

// Help system
export { HelpCommand } from './help.js';

// Import all commands
import { HelpCommand } from './help.js';
import { ConfigCommand } from './commands/ConfigCommand.js';
import { ThemesCommand, BannersCommand, BannerCommand } from './commands/ThemeCommand.js';
import { StatusCommand, ResetCommand, DemoCommand } from './commands/StatusCommand.js';
import { 
    ExportCommand, 
    CopyCommand, 
    BufferSizeCommand, 
    ClearBufferCommand, 
    BufferInfoCommand 
} from './commands/ExportCommand.js';

/**
 * Create and configure default CLI processor
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
    processor.registerCommand(new ExportCommand());
    processor.registerCommand(new CopyCommand());
    processor.registerCommand(new BufferSizeCommand());
    processor.registerCommand(new ClearBufferCommand());
    processor.registerCommand(new BufferInfoCommand());
    
    return processor;
}