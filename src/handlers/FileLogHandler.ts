/**
 * @fileoverview File-based log handler for Advanced Logger
 */

import type { ILogHandler, LogLevel, LogMetadata } from '../types/index.js';
import { isNode, isBrowser } from '../utils/environment.js';
import { safeSerialize } from '../utils/formatting.js';

/**
 * Universal file-based log handler for persistent logging
 * Works in both Node.js (real files) and browser (localStorage)
 */
export class FileLogHandler implements ILogHandler {
    private filename: string;
    private maxSize?: number;
    private fs?: any; // Node.js fs module

    constructor(filename: string = 'app.log', maxSize?: number) {
        this.filename = filename;
        this.maxSize = maxSize;
        
        // Load Node.js fs module if in Node environment
        if (isNode) {
            try {
                this.fs = require('fs');
            } catch (error) {
                console.warn('FileLogHandler: Unable to load fs module:', error);
            }
        }
    }

    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void {
        const logEntry = {
            timestamp: metadata.timestamp,
            level: level.toUpperCase(),
            prefix: metadata.prefix,
            message,
            args: args.slice(1).map(arg => safeSerialize(arg)),
            location: metadata.stackInfo,
        };

        const logLine = this.formatLogLine(logEntry);

        if (isNode && this.fs) {
            this.writeToFileNode(logLine);
        } else if (isBrowser) {
            this.writeToFileLocal(logLine);
        } else {
            // Fallback - just console output
            console.log(`[FILE-LOG] ${logLine}`);
        }
    }

    /**
     * Format log entry as a single line for file storage
     */
    private formatLogLine(entry: any): string {
        const parts = [
            entry.timestamp,
            `[${entry.level}]`,
            entry.prefix ? `[${entry.prefix}]` : '',
            entry.message
        ].filter(Boolean);

        let line = parts.join(' ');
        
        if (entry.args && entry.args.length > 0) {
            line += ' ' + entry.args.map((arg: any) => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
        }
        
        if (entry.location) {
            line += ` (${entry.location.file}:${entry.location.line}:${entry.location.column})`;
        }
        
        return line;
    }

    /**
     * Write to actual file in Node.js environment
     */
    private writeToFileNode(logLine: string): void {
        if (!this.fs) return;

        try {
            // Check file size if maxSize is set
            if (this.maxSize) {
                try {
                    const stats = this.fs.statSync(this.filename);
                    if (stats.size > this.maxSize) {
                        // Simple rotation: backup current file and start fresh
                        const backupName = `${this.filename}.bak`;
                        this.fs.renameSync(this.filename, backupName);
                    }
                } catch (error) {
                    // File doesn't exist yet, that's fine
                }
            }

            // Append to file
            this.fs.appendFileSync(this.filename, logLine + '\n', 'utf8');
        } catch (error) {
            console.error('FileLogHandler: Failed to write to file:', error);
        }
    }

    /**
     * Write to localStorage in browser environment
     */
    private writeToFileLocal(logLine: string): void {
        try {
            const storageKey = `logger_${this.filename}`;
            const existingLogs = localStorage.getItem(storageKey) || '';
            
            let newLogs = existingLogs;
            if (existingLogs.length > 0) {
                newLogs += '\n';
            }
            newLogs += logLine;
            
            // Simple size management - keep last 1000 lines max
            if (this.maxSize || newLogs.split('\n').length > 1000) {
                const lines = newLogs.split('\n');
                const maxLines = this.maxSize ? Math.floor(this.maxSize / 100) : 1000;
                if (lines.length > maxLines) {
                    newLogs = lines.slice(-maxLines).join('\n');
                }
            }
            
            localStorage.setItem(storageKey, newLogs);
        } catch (error) {
            console.error('FileLogHandler: Failed to write to localStorage:', error);
        }
    }

    /**
     * Get stored logs (useful for debugging)
     */
    getLogs(): string | null {
        if (isNode && this.fs) {
            try {
                return this.fs.readFileSync(this.filename, 'utf8');
            } catch (error) {
                return null;
            }
        } else if (isBrowser) {
            const storageKey = `logger_${this.filename}`;
            return localStorage.getItem(storageKey);
        }
        return null;
    }

    /**
     * Clear stored logs
     */
    clearLogs(): void {
        if (isNode && this.fs) {
            try {
                this.fs.writeFileSync(this.filename, '', 'utf8');
            } catch (error) {
                console.error('FileLogHandler: Failed to clear file:', error);
            }
        } else if (isBrowser) {
            const storageKey = `logger_${this.filename}`;
            localStorage.removeItem(storageKey);
        }
    }
}