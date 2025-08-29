/**
 * @fileoverview Stack trace parsing utilities for Advanced Logger
 */

import type { StackInfo } from '../types/index.js';

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
                match = chromeMatch;
            } else {
                // Firefox format: "functionName@file:line:column"
                const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)$/);
                if (firefoxMatch) {
                    match = firefoxMatch;
                } else {
                    // Safari/other formats
                    const safariMatch = line.match(/(\S+)?@(.+?):(\d+):(\d+)$/);
                    if (safariMatch) {
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
            
            // Process file path - remove query params and get filename
            const fileParts = file.split('/');
            const fileName = fileParts[fileParts.length - 1];
            if (!fileName) {
                continue;
            }
            const cleanFileName = fileName.split('?')[0];
            
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