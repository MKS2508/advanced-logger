/**
 * @fileoverview Procesador central del CLI del logger. Resuelve comandos,
 * despacha ejecución, mantiene historial y soporta plugins. No es un binario
 * standalone: se invoca vía `logger.cli()` o `window.cli()` en browser.
 */

import type { Logger } from '../Logger.js';

/**
 * Comando del CLI del logger. Cada implementación se registra en un
 * {@link CommandProcessor} para ser invocable vía `/name` desde la consola
 * del navegador o cualquier host interactivo.
 *
 * @see {@link CommandProcessor.registerCommand}
 * @see {@link HelpCommand}
 */
export interface ICommand {
    /** Nombre canónico del comando, sin la barra inicial `/`. Debe ser único. */
    name: string;
    /** Descripción corta humana; la usa el sistema de help. */
    description: string;
    /** Sintaxis de uso mostrada en `/help`, p.ej. `/export <format>`. */
    usage: string;
    /** Agrupación opcional para el help (`Configuration`, `Export`, ...). */
    category?: string;
    /** Nombres alternativos sin la `/`; se resuelven al comando real. */
    aliases?: string[];
    /**
     * Ejecuta el comando. Recibe los argumentos como string plano (todo lo
     * posterior al primer token, re-joined con espacios) y el {@link Logger}
     * activo para emitir output.
     *
     * @param args - Argumentos del comando (string), puede ser `''`.
     * @param logger - Logger activo.
     */
    execute(args: string, logger: Logger): void | Promise<void>;
}

/**
 * Plugin de CLI: agrupa uno o más {@link ICommand} con lifecycle
 * `initialize`/`cleanup`. Permite a terceros empaquetar funcionalidad
 * extendida (ej: integración con un dashboard, transport custom) y
 * registrarla de golpe vía {@link CommandProcessor.registerPlugin}.
 *
 * @example
 * ```ts
 * const telemetryPlugin: ICLIPlugin = {
 *   name: 'telemetry',
 *   version: '1.0.0',
 *   description: 'Comandos de telemetría',
 *   commands: [new TelemetryDumpCommand()],
 *   initialize(processor, logger) {
 *     logger.info('telemetry plugin cargado');
 *   },
 *   cleanup() {
 *     // liberar suscripciones/recursos
 *   }
 * };
 * processor.registerPlugin(telemetryPlugin, logger);
 * ```
 *
 * @see {@link CommandProcessor.registerPlugin}
 */
export interface ICLIPlugin {
    /** Identificador único del plugin. */
    name: string;
    /** Versión semántica del plugin. */
    version: string;
    /** Descripción humana corta. */
    description: string;
    /** Comandos que el plugin aporta al registry al registrarse. */
    commands: ICommand[];
    /** Hook opcional llamado tras el registro — útil para suscribirse a eventos del processor. */
    initialize?(processor: CommandProcessor, logger: Logger): void;
    /** Hook opcional llamado al desregistrar el plugin — liberar recursos. */
    cleanup?(): void;
}

/**
 * Entrada del historial de comandos ejecutados. No se exporta; solo circula
 * internamente entre {@link CommandProcessor.getHistory} y el storage privado.
 *
 * @internal
 */
interface HistoryEntry {
    command: string;
    timestamp: Date;
    success: boolean;
}

/**
 * Procesador central del CLI del logger. Resuelve nombres de comando (con
 * aliases), despacha ejecución, mantiene historial acotado (max 100 entradas)
 * y soporta un sistema de plugins para extensión de terceros.
 *
 * No es un binario standalone: se invoca desde la consola del navegador vía
 * `window.cli("<command>")` (modo interactivo habilitado por
 * {@link enterInteractiveMode}) o desde código vía `logger.cli()`. El
 * constructor no registra ningún comando por defecto — usar
 * {@link createDefaultCLI} para obtener una instancia con los 8 comandos
 * estándar ya cargados.
 *
 * @example
 * ```ts
 * const cli = createDefaultCLI();
 * await cli.processCommand('/themes', logger);
 * await cli.processCommand('/config theme=neon', logger);
 * ```
 *
 * @example
 * ```ts
 * // Modo interactivo: expone `window.cli` en el navegador
 * cli.enterInteractiveMode(logger);
 * // Desde la devtools: cli('help')  →  procesa '/help'
 * ```
 *
 * @see {@link createDefaultCLI}
 * @see {@link ICommand}
 * @see {@link ICLIPlugin}
 */
export class CommandProcessor {
    private commands: Map<string, ICommand> = new Map();
    private aliases: Map<string, string> = new Map();
    private plugins: Map<string, ICLIPlugin> = new Map();
    private history: HistoryEntry[] = [];
    private maxHistorySize: number = 100;
    private isInteractiveMode: boolean = false;

    /**
     * Registra un comando. Si el comando declara `aliases`, también se indexan
     * para resolución. Un comando con el mismo `name` sobreescribe al previo.
     *
     * @param {ICommand} command - Comando a registrar.
     * @see {@link ICommand}
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
     * Registra un plugin: indexa todos sus commands y, si el plugin define
     * `initialize`, lo invoca con el processor y el logger. Los comandos del
     * plugin se registran vía {@link registerCommand} y sus aliases quedan
     * resolvibles igual que los directos.
     *
     * @param {ICLIPlugin} plugin - Plugin a registrar.
     * @param {Logger} [logger] - Logger activo; requerido solo si el plugin define `initialize`.
     * @throws {Error} Si ya existe un plugin registrado con el mismo `name`.
     * @see {@link unregisterPlugin}
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
     * Desregistra un plugin por nombre: elimina todos sus commands (y los
     * aliases que aportasen), invoca su hook `cleanup` si existe y lo quita
     * del registry. No-op si el nombre no existe.
     *
     * @param {string} pluginName - Nombre del plugin a desregistrar.
     * @see {@link registerPlugin}
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
     * Lista todos los commands registrados (directamente o vía plugins).
     * No incluye aliases.
     *
     * @returns {ICommand[]} Snapshot array de los commands registrados.
     */
    getCommands(): ICommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Resuelve un comando por nombre canónico o alias. Devuelve `undefined`
     * si no existe ninguno que matchee.
     *
     * @param {string} name - Nombre canónico o alias del comando.
     * @returns {ICommand | undefined} El comando resuelto, o `undefined`.
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
     * Devuelve una copia del historial de comandos ejecutados (más recientes
     * primero). Acotado a 100 entradas por {@link maxHistorySize}; las más
     * viejas se descartan al insertar nuevas.
     *
     * @returns {HistoryEntry[]} Snapshot del historial; mutar el array devuelto
     *   no afecta al estado interno del processor.
     */
    getHistory(): HistoryEntry[] {
        return [...this.history];
    }

    /**
     * Vacía el historial de comandos en memoria.
     */
    clearHistory(): void {
        this.history = [];
    }

    /**
     * Lista los plugins actualmente registrados.
     *
     * @returns {ICLIPlugin[]} Snapshot array de plugins activos.
     */
    getPlugins(): ICLIPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Activa el modo interactivo. Marca el flag interno y, si se ejecuta en
     * navegador, expone `window.cli(command)` para invocar comandos desde la
     * devtools sin prefijo `/` (se añade automáticamente al input).
     *
     * @param {Logger} logger - Logger activo (emite el mensaje de bienvenida
     *   con hint sobre `cli(...)` en browser).
     * @see {@link exitInteractiveMode}
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
     * Desactiva el flag de modo interactivo. Nota: no elimina el `window.cli`
     * que {@link enterInteractiveMode} haya expuesto en el navegador — el
     * handler global sigue vivo hasta reload.
     *
     * @see {@link enterInteractiveMode}
     */
    exitInteractiveMode(): void {
        this.isInteractiveMode = false;
    }
    
    /**
     * Instala `window.cli(command)` como wrapper delgado alrededor de
     * {@link processCommand}, prefijando `/` automáticamente. Solo se invoca
     * desde {@link enterInteractiveMode} cuando `window` está disponible.
     *
     * @internal
     * @param logger - Logger activo, reenviado a cada invocación.
     */
    private setupBrowserInteractiveMode(logger: Logger): void {
        // Add global CLI function for browser usage
        (window as any).cli = (commandString: string) => {
            return this.processCommand(`/${commandString}`, logger);
        };
        
        logger.info('💡 Use cli("command") to execute CLI commands in browser console.');
    }

    /**
     * Parsea y ejecuta un comando. El formato esperado es `/name args...`:
     * split por espacios, primer token = nombre del comando, resto = args
     * (re-joined con espacios). Si el comando no existe, loguea el error y
     * sugiere similares vía {@link getSuggestions} ("Did you mean: ...?").
     *
     * Toda invocación (válida o no) se registra en el historial con flag de
     * éxito/fallo según si `execute` resolvió o throweó.
     *
     * @param {string} commandString - Comando completo, debe empezar con `/`.
     * @param {Logger} logger - Logger activo para output y errores.
     * @returns {Promise<void>} Resuelve cuando el comando termina (sync o async).
     *   Nunca rechaza: los errores de `execute` se capturan y se loguean.
     * @see {@link ICommand.execute}
     * @see {@link getSuggestions}
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
     * Inserta una entrada al frente del historial y trunca a
     * {@link maxHistorySize} (100) si hace falta.
     *
     * @internal
     * @param command - String crudo del comando ejecutado.
     * @param success - Si la ejecución tuvo éxito.
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
     * Devuelve nombres de comando que empiezan con el prefijo dado. Alimente
     * el hint "Did you mean" de {@link processCommand} cuando un comando no
     * se encuentra. Match por `startsWith` (no fuzzy).
     *
     * @param {string} partial - Prefijo parcial tipeado por el usuario.
     * @returns {string[]} Nombres canónicos que matchean; aliases excluidos.
     */
    getSuggestions(partial: string): string[] {
        const commandNames = Array.from(this.commands.keys());
        return commandNames.filter(name => name.startsWith(partial));
    }
}