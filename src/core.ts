/**
 * @fileoverview Módulo Core Logger — logging minimal sin features avanzadas
 *
 * Provee la funcionalidad esencial de logging sin mejoras visuales,
 * soporte SVG ni styling avanzado. Adecuado para apps ligeras o uso server-side.
 */

// Tipos core
import type {
    LogLevel,
    Verbosity,
    LoggerConfig,
    ILogHandler,
    LogMetadata,
    TimerEntry
} from './types/index.js';

// Utilidades core
import {
    parseStackTrace,
    formatTimestamp
} from './utils/index.js';

// Formato universal y detección de entorno
import {
    createPlainOutput,
    getConsoleMethod,
    createLogEntry,
    formatTablePlain,
    safeSerialize,
    type OutputFormat
} from './utils/formatting.js';

import {
    isBrowser,
    isNode
} from './utils/environment-detector.js';

import { createStyledOutput } from './utils/output.js';

// Constantes
import { DEFAULT_CONFIG, LEVEL_STYLES } from './constants.js';
import { LOG_LEVELS } from './types/core.js';

/**
 * Logger minimal con solo la funcionalidad core.
 *
 * @example
 * ```typescript
 * import { CoreLogger } from '@mks2508/better-logger/core';
 *
 * const logger = new CoreLogger();
 * logger.info('Hello world');
 * logger.error('Something went wrong', error);
 * ```
 */
export class CoreLogger {
    private config: LoggerConfig;
    private scopedPrefix?: string;
    private handlers: ILogHandler[] = [];
    private timers: Map<string, TimerEntry> = new Map();
    private groupDepth: number = 0;

    /**
     * Crea una nueva instancia de CoreLogger.
     * @param config - Configuración opcional.
     */
    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            // Auto-configurar según entorno
            enableColors: config.enableColors ?? (isBrowser ? true : false),
            enableTimestamps: config.enableTimestamps ?? true,
            enableStackTrace: config.enableStackTrace ?? false,
            autoDetectTheme: config.autoDetectTheme ?? true,
            outputFormat: config.outputFormat ?? 'auto'
        };
    }

    // ===== MÉTODOS DE CONFIGURACIÓN =====

    /**
     * Obtiene la configuración actual.
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    /**
     * Define el prefijo global para todos los mensajes de log.
     * @param prefix - Prefijo a aplicar a todos los mensajes.
     */
    setGlobalPrefix(prefix: string): void {
        this.config.globalPrefix = prefix;
    }

    /**
     * Define el nivel de verbosity para filtrar la salida de log.
     * @param level - Nivel de verbosity.
     */
    setVerbosity(level: Verbosity): void {
        this.config.verbosity = level;
    }

    /**
     * Crea un logger con scope y un prefijo específico.
     * @param prefix - Prefijo del scope.
     * @returns Nueva instancia de CoreLogger con el prefijo asignado.
     */
    scope(prefix: string): CoreLogger {
        const scopedLogger = new CoreLogger(this.config);
        scopedLogger.scopedPrefix = prefix;
        scopedLogger.handlers = [...this.handlers];
        return scopedLogger;
    }

    /**
     * Añade un handler personalizado para extensibilidad.
     * @param handler - Handler que implementa la interfaz ILogHandler.
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    // ===== MÉTODOS CORE DE LOGGING =====

    /**
     * Comprueba si un nivel debe emitirse según el verbosity actual.
     * @param level - Nivel a evaluar.
     * @returns `true` si el nivel debe emitirse.
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        const verbosity = this.config.verbosity as LogLevel;
        return LOG_LEVELS[level] >= LOG_LEVELS[verbosity];
    }

    /**
     * Obtiene el prefijo efectivo (global + scope).
     * @returns Prefijo combinado o `undefined` si no hay ninguno.
     */
    private getEffectivePrefix(): string | undefined {
        const parts = [this.config.globalPrefix, this.scopedPrefix].filter(Boolean);
        return parts.length > 0 ? parts.join(':') : undefined;
    }

    /**
     * Método principal de log con formato universal.
     * @param level - Nivel del mensaje.
     * @param args - Argumentos del mensaje.
     */
    private log(level: LogLevel, ...args: unknown[]): void {
        if (!this.shouldLog(level)) return;

        const prefix = this.getEffectivePrefix();
        const message = String(args[0] || '');
        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const consoleMethod = getConsoleMethod(level);

        // Elegir formato según entorno y configuración
        if (isBrowser && this.config.enableColors) {
            // Browser con styling CSS
            try {
                const [format, ...styles] = createStyledOutput(
                    level,
                    LEVEL_STYLES,
                    prefix,
                    message,
                    stackInfo,
                    this.config.autoDetectTheme
                );
                console[consoleMethod](format, ...styles, ...args.slice(1));
            } catch (error) {
                // Fallback a formato plano si falla el CSS
                const output = createPlainOutput(level, message, prefix, stackInfo);
                console[consoleMethod](output, ...args.slice(1));
            }
        } else {
            // Node.js o browser sin colores: formato plano
            const groupIndent = '  '.repeat(this.groupDepth);
            const output = groupIndent + createPlainOutput(level, message, prefix, stackInfo);
            console[consoleMethod](output, ...args.slice(1));
        }

        // Llama a los handlers con metadata estructurada
        const logEntry = createLogEntry(level, message, args, prefix, stackInfo);
        const metadata: LogMetadata = {
            timestamp: logEntry.timestamp,
            level,
            prefix,
            stackInfo: logEntry.location,
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle(level, message, args, metadata);
            } catch (error) {
                console.error('Log handler failed:', error);
            }
        });
    }

    /**
     * Emite mensajes de debug (prioridad más baja).
     * @param args - Argumentos del mensaje.
     */
    debug(...args: unknown[]): void {
        this.log('debug', ...args);
    }

    /**
     * Emite mensajes informativos.
     * @param args - Argumentos del mensaje.
     */
    info(...args: unknown[]): void {
        this.log('info', ...args);
    }

    /**
     * Emite mensajes de advertencia.
     * @param args - Argumentos del mensaje.
     */
    warn(...args: unknown[]): void {
        this.log('warn', ...args);
    }

    /**
     * Emite mensajes de error.
     * @param args - Argumentos del mensaje.
     */
    error(...args: unknown[]): void {
        this.log('error', ...args);
    }

    /**
     * Emite errores críticos (prioridad más alta).
     * @param args - Argumentos del mensaje.
     */
    critical(...args: unknown[]): void {
        this.log('critical', ...args);
    }

    /**
     * Emite información de trace (debugging detallado).
     * @param args - Argumentos del mensaje.
     */
    trace(...args: unknown[]): void {
        this.log('debug', ...args);
        if (this.shouldLog('debug')) {
            console.trace(...args);
        }
    }

    // ===== FEATURES AVANZADAS BÁSICAS =====

    /**
     * Muestra datos en formato tabla.
     * @param data - Datos a mostrar.
     * @param columns - Columnas opcionales a incluir.
     */
    table(data: any, columns?: string[]): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.getEffectivePrefix();
        const tableHeader = `[TABLE]${prefix ? ` [${prefix}]` : ''}:`;
        
        if (isBrowser && typeof console.table === 'function') {
            // Browser con soporte nativo de table
            console.log(tableHeader);
            if (columns) {
                console.table(data, columns);
            } else {
                console.table(data);
            }
        } else {
            // Node.js o fallback: formato de texto plano
            console.log(tableHeader);
            const tableText = formatTablePlain(data, columns);
            console.log(tableText);
        }
    }

    /**
     * Inicia un grupo colapsable en la console.
     * @param label - Etiqueta del grupo.
     * @param collapsed - Si el grupo inicia colapsado.
     */
    group(label: string, collapsed: boolean = false): void {
        const prefix = this.getEffectivePrefix();
        const fullLabel = `${prefix ? `[${prefix}] ` : ''}${label}`;
        
        if (isBrowser && console.group && console.groupCollapsed) {
            // Browser soporta grouping nativo
            if (collapsed) {
                console.groupCollapsed(fullLabel);
            } else {
                console.group(fullLabel);
            }
        } else {
            // Fallback Node.js: solo emite el label del grupo
            const groupStart = '┌─ ' + fullLabel;
            console.log(groupStart);
        }
        
        this.groupDepth++;
    }

    /**
     * Cierra el grupo actual de la console.
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            if (isBrowser && console.groupEnd) {
                console.groupEnd();
            } else {
                // Fallback Node.js: emite el cierre del grupo
                const groupEnd = '└─ (end group)';
                console.log(groupEnd);
            }
            this.groupDepth--;
        }
    }

    /**
     * Inicia un timer con el label indicado.
     * @param label - Identificador del timer.
     */
    time(label: string): void {
        const startTime = this.getPerformanceNow();
        const timer: TimerEntry = {
            label,
            startTime,
        };
        this.timers.set(label, timer);
        
        const prefix = this.getEffectivePrefix();
        const message = `Timer started: ${label}`;
        const output = createPlainOutput('info', message, prefix);
        console.log(output);
    }

    /**
     * Detiene un timer y emite el tiempo transcurrido.
     * @param label - Identificador del timer previamente iniciado.
     */
    timeEnd(label: string): void {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }

        const elapsed = this.getPerformanceNow() - timer.startTime;
        this.timers.delete(label);
        
        const prefix = this.getEffectivePrefix();
        const message = `Timer ended: ${label} - ${elapsed.toFixed(2)}ms`;
        const output = createPlainOutput('info', message, prefix);
        console.log(output);
    }

    /**
     * Obtiene `performance.now()` o un fallback para entornos antiguos.
     * @returns Timestamp en milisegundos.
     */
    private getPerformanceNow(): number {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        
        if (isNode && process.hrtime) {
            // Node.js high-resolution time
            const [seconds, nanoseconds] = process.hrtime();
            return seconds * 1000 + nanoseconds / 1000000;
        }
        
        // Fallback a Date.now()
        return Date.now();
    }
}

// Crea y exporta una instancia singleton por conveniencia
const coreLogger = new CoreLogger();

/**
 * Exporta métodos individuales por conveniencia (con binding correcto).
 */
export const debug = (...args: any[]) => coreLogger.debug(...args);
export const info = (...args: any[]) => coreLogger.info(...args);
export const warn = (...args: any[]) => coreLogger.warn(...args);
export const error = (...args: any[]) => coreLogger.error(...args);
export const critical = (...args: any[]) => coreLogger.critical(...args);
export const trace = (...args: any[]) => coreLogger.trace(...args);
export const table = (data: any, columns?: string[]) => coreLogger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => coreLogger.group(label, collapsed);
export const groupEnd = () => coreLogger.groupEnd();
export const time = (label: string) => coreLogger.time(label);
export const timeEnd = (label: string) => coreLogger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => coreLogger.setGlobalPrefix(prefix);
export const scope = (prefix: string) => coreLogger.scope(prefix);
export const setVerbosity = (level: Verbosity) => coreLogger.setVerbosity(level);
export const addHandler = (handler: ILogHandler) => coreLogger.addHandler(handler);

// Exporta el singleton como default
export default coreLogger;

// Re-exporta tipos core
export type {
    LogLevel,
    Verbosity,
    LoggerConfig,
    ILogHandler,
    LogMetadata
} from './types/index.js';