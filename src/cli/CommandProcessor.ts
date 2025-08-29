/**
 * @fileoverview CLI Command processor for Advanced Logger
 */

import type { Logger } from '../Logger.js';

/**
 * Base interface for CLI commands
 */
export interface ICommand {
    name: string;
    description: string;
    usage: string;
    execute(args: string, logger: Logger): void | Promise<void>;
}

/**
 * CLI command processor
 */
export class CommandProcessor {
    private commands: Map<string, ICommand> = new Map();

    /**
     * Register a command
     */
    registerCommand(command: ICommand): void {
        this.commands.set(command.name, command);
    }

    /**
     * Get all registered commands
     */
    getCommands(): ICommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get a specific command
     */
    getCommand(name: string): ICommand | undefined {
        return this.commands.get(name);
    }

    /**
     * Process a CLI command
     */
    async processCommand(commandString: string, logger: Logger): Promise<void> {
        if (!commandString.startsWith('/')) {
            logger.error('Invalid command. Commands must start with /');
            return;
        }

        const parts = commandString.slice(1).split(' ');
        const commandName = parts[0] || '';
        const args = parts.slice(1).join(' ');

        const command = this.commands.get(commandName);
        if (!command) {
            logger.error(`Unknown command: ${commandName}. Type /help for available commands.`);
            return;
        }

        try {
            await command.execute(args || '', logger);
        } catch (error) {
            logger.error(`Command '${commandName}' failed:`, error);
        }
    }

    /**
     * Get command suggestions for partial matches
     */
    getSuggestions(partial: string): string[] {
        const commandNames = Array.from(this.commands.keys());
        return commandNames.filter(name => name.startsWith(partial));
    }
}