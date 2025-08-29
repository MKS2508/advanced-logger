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
    category?: string;
    aliases?: string[];
    execute(args: string, logger: Logger): void | Promise<void>;
}

/**
 * Plugin interface for extending CLI functionality
 */
export interface ICLIPlugin {
    name: string;
    version: string;
    description: string;
    commands: ICommand[];
    initialize?(processor: CommandProcessor, logger: Logger): void;
    cleanup?(): void;
}

/**
 * Command history entry
 */
interface HistoryEntry {
    command: string;
    timestamp: Date;
    success: boolean;
}

/**
 * CLI command processor
 */
export class CommandProcessor {
    private commands: Map<string, ICommand> = new Map();
    private aliases: Map<string, string> = new Map();
    private plugins: Map<string, ICLIPlugin> = new Map();
    private history: HistoryEntry[] = [];
    private maxHistorySize: number = 100;
    private isInteractiveMode: boolean = false;

    /**
     * Register a command
     */
    registerCommand(command: ICommand): void {
        this.commands.set(command.name, command);
        
        // Register aliases
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliases.set(alias, command.name);
            }
        }
    }
    
    /**
     * Register a plugin
     */
    registerPlugin(plugin: ICLIPlugin, logger?: Logger): void {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already registered`);
        }
        
        this.plugins.set(plugin.name, plugin);
        
        // Register plugin commands
        for (const command of plugin.commands) {
            this.registerCommand(command);
        }
        
        // Initialize plugin
        if (plugin.initialize && logger) {
            plugin.initialize(this, logger);
        }
    }
    
    /**
     * Unregister a plugin
     */
    unregisterPlugin(pluginName: string): void {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return;
        
        // Remove plugin commands
        for (const command of plugin.commands) {
            this.commands.delete(command.name);
            if (command.aliases) {
                for (const alias of command.aliases) {
                    this.aliases.delete(alias);
                }
            }
        }
        
        // Cleanup plugin
        if (plugin.cleanup) {
            plugin.cleanup();
        }
        
        this.plugins.delete(pluginName);
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
        // Check direct command name
        let command = this.commands.get(name);
        if (command) return command;
        
        // Check aliases
        const aliasTarget = this.aliases.get(name);
        if (aliasTarget) {
            return this.commands.get(aliasTarget);
        }
        
        return undefined;
    }
    
    /**
     * Get command history
     */
    getHistory(): HistoryEntry[] {
        return [...this.history];
    }
    
    /**
     * Clear command history
     */
    clearHistory(): void {
        this.history = [];
    }
    
    /**
     * Get registered plugins
     */
    getPlugins(): ICLIPlugin[] {
        return Array.from(this.plugins.values());
    }
    
    /**
     * Enter interactive mode
     */
    enterInteractiveMode(logger: Logger): void {
        this.isInteractiveMode = true;
        logger.info('🔧 Interactive CLI mode activated. Type /exit to quit, /help for commands.');
        
        // Set up browser console listener for interactive commands
        if (typeof window !== 'undefined') {
            this.setupBrowserInteractiveMode(logger);
        }
    }
    
    /**
     * Exit interactive mode
     */
    exitInteractiveMode(): void {
        this.isInteractiveMode = false;
    }
    
    /**
     * Setup browser interactive mode
     */
    private setupBrowserInteractiveMode(logger: Logger): void {
        // Add global CLI function for browser usage
        (window as any).cli = (commandString: string) => {
            return this.processCommand(`/${commandString}`, logger);
        };
        
        logger.info('💡 Use cli("command") to execute CLI commands in browser console.');
    }

    /**
     * Process a CLI command
     */
    async processCommand(commandString: string, logger: Logger): Promise<void> {
        if (!commandString.startsWith('/')) {
            logger.error('Invalid command. Commands must start with /');
            this.addToHistory(commandString, false);
            return;
        }

        const parts = commandString.slice(1).split(' ');
        const commandName = parts[0] || '';
        const args = parts.slice(1).join(' ');

        const command = this.getCommand(commandName);
        if (!command) {
            logger.error(`Unknown command: ${commandName}. Type /help for available commands.`);
            
            // Suggest similar commands
            const suggestions = this.getSuggestions(commandName);
            if (suggestions.length > 0) {
                logger.info(`📋 Did you mean: ${suggestions.slice(0, 3).join(', ')}?`);
            }
            
            this.addToHistory(commandString, false);
            return;
        }

        try {
            await command.execute(args || '', logger);
            this.addToHistory(commandString, true);
        } catch (error) {
            logger.error(`Command '${commandName}' failed:`, error);
            this.addToHistory(commandString, false);
        }
    }
    
    /**
     * Add command to history
     */
    private addToHistory(command: string, success: boolean): void {
        this.history.unshift({
            command,
            timestamp: new Date(),
            success
        });
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
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