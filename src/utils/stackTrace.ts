/**
 * @fileoverview Utilidades de parseo de stack traces para Advanced Logger
 */

import type { StackInfo } from '../types/index.js';

/**
 * Comprueba si un nombre de archivo corresponde a un archivo minificado/bundle
 */
function isMinifiedFile(filename: string): boolean {
    // Salta si el nombre contiene patrones de minificado
    const minifiedPatterns = [
        /\.min\.js$/,
        /\.bundle\.js$/,
        /\.chunk\.js$/,
        /-[\w\d]{8,}\.js$/, // Nombres basados en hash
        /Logger-[A-Za-z0-9]+\.js$/, // Bundles de Logger
        /node_modules/,
        /dist\//,
        /build\//,
        /\.mjs$/
    ];

    return minifiedPatterns.some(pattern => pattern.test(filename));
}

/**
 * Extrae un nombre de archivo limpio a partir de la ruta completa
 */
function extractCleanFilename(fullPath: string): string {
    // Extrae solo el nombre de archivo de la ruta completa
    const filename = fullPath.split(/[/\\]/).pop() || fullPath;

    // Elimina sufijos comunes de build/minificado
    return filename
        .replace(/\.min\.js$/, '.js')
        .replace(/\.bundle\.js$/, '.js')
        .replace(/\.chunk\.js$/, '.js')
        .replace(/-[\w\d]{8,}\.js$/, '.js')
        .replace(/Logger-[A-Za-z0-9]+\.js$/, 'logger.ts');
}

/**
 * Parsea el stack trace actual para extraer la información del caller
 */
export function parseStackTrace(): StackInfo | null {
    try {
        const stack = new Error().stack;
        if (!stack) {
            return null;
        }

        const lines = stack.split('\n').filter(line => line.trim());

        // Busca el primer caller que no provenga de métodos de Logger
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            if (!line) {
                continue;
            }

            // Salta si la línea contiene métodos de Logger o parseStackTrace
            if (line.includes('parseStackTrace') ||
                line.includes('Logger.') ||
                line.includes('.log(') ||
                line.includes('createStyledOutput')) {
                continue;
            }

            // Parsea distintos formatos de stack trace
            let match;

            // Formato Chrome: "at functionName (file:line:column)" o "at file:line:column"
            const chromeMatch = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
            if (chromeMatch) {
                const filename = chromeMatch[2];
                // Salta archivos minificados/bundle
                if (filename && isMinifiedFile(filename)) {
                    continue;
                }
                match = chromeMatch;
            } else {
                // Formato Firefox: "functionName@file:line:column"
                const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)$/);
                if (firefoxMatch) {
                    const filename = firefoxMatch[2];
                    // Salta archivos minificados/bundle
                    if (filename && isMinifiedFile(filename)) {
                        continue;
                    }
                    match = firefoxMatch;
                } else {
                    // Formato Safari/otros
                    const safariMatch = line.match(/(\S+)?@(.+?):(\d+):(\d+)$/);
                    if (safariMatch) {
                        const filename = safariMatch[2];
                        // Salta archivos minificados/bundle
                        if (filename && isMinifiedFile(filename)) {
                            continue;
                        }
                        match = safariMatch;
                    }
                }
            }

            if (!match) {
                continue;
            }

            const [, functionName, file, lineStr, columnStr] = match;

            if (!file) {
                continue;
            }

            // Usa la extracción limpia para evitar archivos minificados
            const cleanFileName = extractCleanFilename(file).split('?')[0];
            if (!cleanFileName) {
                continue;
            }

            // Parsea los números de línea y columna
            const lineNum = lineStr ? parseInt(lineStr, 10) : 0;
            const columnNum = columnStr ? parseInt(columnStr, 10) : 0;

            // Limpia el nombre de la función
            const cleanFunction = functionName && functionName.trim()
                ? functionName.trim()
                : undefined;
                
            return {
                file: cleanFileName ? cleanFileName : 'unknown',
                line: lineNum,
                column: columnNum,
                function: cleanFunction
            };
        }
        
        return null;
    } catch {
        return null;
    }
}