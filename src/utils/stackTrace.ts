/**
 * @fileoverview Stack trace parsing utilities for Advanced Logger
 */

import type { StackInfo } from '../types/index.js';

/**
 * Check if a filename represents a minified/bundle file
 */
function isMinifiedFile(filename: string): boolean {
    // Skip if filename contains minified patterns
    const minifiedPatterns = [
        /\.min\.js$/,
        /\.bundle\.js$/,
        /\.chunk\.js$/,
        /-[\w\d]{8,}\.js$/, // Hash-based filenames
        /Logger-[A-Za-z0-9]+\.js$/, // Logger bundle files
        /node_modules/,
        /dist\//,
        /build\//,
        /\.mjs$/
    ];

    return minifiedPatterns.some(pattern => pattern.test(filename));
}

/**
 * Extract clean filename from full path
 */
function extractCleanFilename(fullPath: string): string {
    // Extract just the filename from the full path
    const filename = fullPath.split(/[/\\]/).pop() || fullPath;

    // Remove common build/minified suffixes
    return filename
        .replace(/\.min\.js$/, '.js')
        .replace(/\.bundle\.js$/, '.js')
        .replace(/\.chunk\.js$/, '.js')
        .replace(/-[\w\d]{8,}\.js$/, '.js')
        .replace(/Logger-[A-Za-z0-9]+\.js$/, 'logger.ts');
}

/**
 * Parses the current stack trace to extract caller information
 */
export function parseStackTrace(): StackInfo | null {
    try {
        const stack = new Error().stack;
        if (!stack) {
            return null;
        }

        const lines = stack.split('\n').filter(line => line.trim());
        
        // Find the first caller that's not from Logger methods
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            if (!line) {
                continue;
            }
            
            // Skip if line contains Logger methods or parseStackTrace
            if (line.includes('parseStackTrace') || 
                line.includes('Logger.') || 
                line.includes('.log(') ||
                line.includes('createStyledOutput')) {
                continue;
            }

            // Parse different stack trace formats
            let match;
            
            // Chrome format: "at functionName (file:line:column)" or "at file:line:column"
            const chromeMatch = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
            if (chromeMatch) {
                const filename = chromeMatch[2];
                // Skip minified/bundle files
                if (filename && isMinifiedFile(filename)) {
                    continue;
                }
                match = chromeMatch;
            } else {
                // Firefox format: "functionName@file:line:column"
                const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)$/);
                if (firefoxMatch) {
                    const filename = firefoxMatch[2];
                    // Skip minified/bundle files
                    if (filename && isMinifiedFile(filename)) {
                        continue;
                    }
                    match = firefoxMatch;
                } else {
                    // Safari/other formats
                    const safariMatch = line.match(/(\S+)?@(.+?):(\d+):(\d+)$/);
                    if (safariMatch) {
                        const filename = safariMatch[2];
                        // Skip minified/bundle files
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
            
            // Use clean filename extraction to avoid minified files
            const cleanFileName = extractCleanFilename(file).split('?')[0];
            if (!cleanFileName) {
                continue;
            }
            
            // Parse line and column numbers
            const lineNum = lineStr ? parseInt(lineStr, 10) : 0;
            const columnNum = columnStr ? parseInt(columnStr, 10) : 0;
            
            // Clean function name
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