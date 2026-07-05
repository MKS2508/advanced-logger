/**
 * @fileoverview Utilidades de formatting para Universal Logger
 */

import type { LogLevel, StackInfo } from '../types/index.js';
import { formatTimestamp } from './timestamps.js';

// Re-export del tipo por conveniencia
export type { OutputFormat } from '../types/index.js';

/**
 * Crea output en texto plano para cualquier entorno
 * Sin colores ni estilos — máxima compatibilidad
 */
export function createPlainOutput(
    level: LogLevel,
    message: string,
    prefix?: string,
    stackInfo?: StackInfo | null
): string {
    const timestamp = formatTimestamp();
    const timeStr = timestamp.slice(11, 23); // HH:MM:SS.mmm

    let output = `[${timeStr}] [${level.toUpperCase()}]`;

    if (prefix) {
        output += ` [${prefix}]`;
    }

    output += ` ${message}`;

    if (stackInfo) {
        output += ` (${stackInfo.file}:${stackInfo.line}:${stackInfo.column})`;
    }

    return output;
}

/**
 * Obtiene el método de console adecuado para el nivel
 * Usa distintos métodos de console para mejor semántica
 */
export function getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
        case 'debug':
            return 'log';
        case 'info':
            return 'info';
        case 'warn':
            return 'warn';
        case 'error':
        case 'critical':
            return 'error';
        default:
            return 'log';
    }
}

/**
 * Crea un objeto simple de log entry para los handlers
 */
export function createLogEntry(
    level: LogLevel,
    message: string,
    args: any[],
    prefix?: string,
    stackInfo?: StackInfo | null
) {
    return {
        timestamp: formatTimestamp(),
        level: level.toUpperCase(),
        prefix,
        message,
        args: args.slice(1), // Excluye el primer argumento (el mensaje)
        location: stackInfo ? {
            file: stackInfo.file,
            line: stackInfo.line,
            column: stackInfo.column,
            function: stackInfo.function
        } : undefined,
        raw: args
    };
}

/**
 * Formatea datos para visualización en tabla como texto plano
 */
export function formatTablePlain(data: any, columns?: string[]): string {
    try {
        if (Array.isArray(data)) {
            if (data.length === 0) return '[Empty Array]';

            // Formateo simple de array
            if (typeof data[0] !== 'object') {
                return data.map((item, i) => `${i}: ${item}`).join('\n');
            }

            // Formateo de array de objetos
            const keys = columns || Object.keys(data[0] || {});
            const header = keys.join('\t');
            const rows = data.map(item =>
                keys.map(key => String(item[key] || '')).join('\t')
            );

            return [header, ...rows].join('\n');
        }

        if (typeof data === 'object' && data !== null) {
            // Formateo simple de objeto
            return Object.entries(data)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
        }

        return String(data);
    } catch (error) {
        return `[Error al formatear la tabla: ${error}]`;
    }
}

/**
 * Serialización segura de objetos para logging
 */
export function safeSerialize(obj: any, maxDepth: number = 3, currentDepth: number = 0): any {
    if (currentDepth >= maxDepth) {
        return '[Max Depth Reached]';
    }

    if (obj === null) return null;
    if (obj === undefined) return '[undefined]';
    if (typeof obj === 'function') return '[Function]';
    if (obj instanceof Error) return `[Error: ${obj.message}]`;
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => safeSerialize(item, maxDepth, currentDepth + 1));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = safeSerialize(value, maxDepth, currentDepth + 1);
    }
    return result;
}