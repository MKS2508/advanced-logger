/**
 * @fileoverview Export and clipboard log handler for Advanced Logger
 */

import type { 
    ILogHandler, 
    LogLevel, 
    LogMetadata, 
    LogEntry, 
    ExportFilters, 
    ExportOptions, 
    ExportResult, 
    BufferStats,
    ExportFormat
} from '../types/index.js';
import { parseTimeInput, formatDisplayTime, safeStringify, escapeHtml, generateLogId } from '../utils/index.js';
import { BUFFER_LIMITS } from '../constants.js';

/**
 * Export log handler with circular buffer and multiple export formats
 */
export class ExportLogHandler implements ILogHandler {
    private buffer: LogEntry[] = [];
    private maxSize: number;
    private groupDepth: number = 0;
    private currentGroup?: string;

    constructor(maxSize: number = BUFFER_LIMITS.DEFAULT_SIZE) {
        this.maxSize = Math.min(Math.max(maxSize, BUFFER_LIMITS.MIN_SIZE), BUFFER_LIMITS.MAX_SIZE);
    }

    /**
     * Handle incoming log and store in buffer
     */
    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void {
        const entry: LogEntry = {
            id: generateLogId(),
            timestamp: metadata.timestamp,
            level,
            prefix: metadata.prefix,
            message,
            args,
            location: metadata.stackInfo,
            groupInfo: this.groupDepth > 0 ? {
                depth: this.groupDepth,
                groupName: this.currentGroup
            } : undefined
        };

        // Add to circular buffer
        this.buffer.push(entry);
        if (this.buffer.length > this.maxSize) {
            this.buffer.shift(); // Remove oldest entry
        }
    }

    /**
     * Set group tracking for nested logs
     */
    setGroupInfo(depth: number, groupName?: string): void {
        this.groupDepth = depth;
        this.currentGroup = groupName;
    }

    /**
     * Get buffer statistics
     */
    getBufferStats(): BufferStats {
        const levelCounts = this.buffer.reduce((acc, entry) => {
            const currentCount = acc[entry.level] ? acc[entry.level] : 0;
            acc[entry.level] = currentCount + 1;
            return acc;
        }, {} as Record<LogLevel, number>);

        let oldestLog: Date | undefined;
        let newestLog: Date | undefined;
        
        if (this.buffer.length > 0) {
            const firstEntry = this.buffer[0];
            const lastEntry = this.buffer[this.buffer.length - 1];
            
            if (firstEntry && firstEntry.timestamp) {
                oldestLog = new Date(firstEntry.timestamp);
            }
            
            if (lastEntry && lastEntry.timestamp) {
                newestLog = new Date(lastEntry.timestamp);
            }
        }

        return {
            size: this.buffer.length,
            maxSize: this.maxSize,
            usage: (this.buffer.length / this.maxSize) * 100,
            oldestLog,
            newestLog,
            levelCounts: {
                debug: levelCounts.debug ? levelCounts.debug : 0,
                info: levelCounts.info ? levelCounts.info : 0,
                warn: levelCounts.warn ? levelCounts.warn : 0,
                error: levelCounts.error ? levelCounts.error : 0,
                critical: levelCounts.critical ? levelCounts.critical : 0
            }
        };
    }

    /**
     * Clear the buffer
     */
    clearBuffer(): void {
        this.buffer = [];
    }

    /**
     * Set buffer size (with limits)
     */
    setBufferSize(size: number): void {
        this.maxSize = Math.min(Math.max(size, BUFFER_LIMITS.MIN_SIZE), BUFFER_LIMITS.MAX_SIZE);
        
        // Trim buffer if new size is smaller
        if (this.buffer.length > this.maxSize) {
            this.buffer = this.buffer.slice(-this.maxSize);
        }
    }

    /**
     * Filter logs based on criteria
     */
    private filterLogs(filters: ExportFilters = {}): LogEntry[] {
        let filtered = [...this.buffer];

        // Filter by levels
        if (filters.levels?.length) {
            filtered = filtered.filter(entry => filters.levels!.includes(entry.level));
        }

        // Filter by prefixes
        if (filters.prefixes?.length) {
            filtered = filtered.filter(entry => 
                entry.prefix && filters.prefixes!.includes(entry.prefix)
            );
        }

        // Exclude prefixes
        if (filters.excludePrefixes?.length) {
            filtered = filtered.filter(entry => 
                !entry.prefix || !filters.excludePrefixes!.includes(entry.prefix)
            );
        }

        // Filter by time range
        if (filters.since) {
            const sinceDate = parseTimeInput(filters.since);
            filtered = filtered.filter(entry => new Date(entry.timestamp) >= sinceDate);
        }

        if (filters.until) {
            const untilDate = parseTimeInput(filters.until);
            filtered = filtered.filter(entry => new Date(entry.timestamp) <= untilDate);
        }

        // Filter by stack trace presence
        if (filters.withStackTrace) {
            filtered = filtered.filter(entry => entry.location);
        }

        // Filter errors only
        if (filters.errorsOnly) {
            filtered = filtered.filter(entry => entry.level === 'error' || entry.level === 'critical');
        }

        // Search in messages
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(entry => 
                entry.message.toLowerCase().includes(searchTerm) ||
                entry.args.some(arg => 
                    String(arg).toLowerCase().includes(searchTerm)
                )
            );
        }

        // Limit results
        if (filters.last) {
            filtered = filtered.slice(-filters.last);
        }

        if (filters.first) {
            filtered = filtered.slice(0, filters.first);
        }

        return filtered;
    }

    /**
     * Export logs in JSON format
     */
    private exportJSON(logs: LogEntry[], options: ExportOptions): string {
        const data = logs.map(entry => ({
            timestamp: entry.timestamp,
            level: entry.level,
            prefix: entry.prefix,
            message: entry.message,
            ...(options.minimal ? {} : {
                args: entry.args.slice(1),
                location: entry.location,
                groupInfo: entry.groupInfo
            })
        }));

        return options.compact 
            ? JSON.stringify(data)
            : JSON.stringify(data, null, 2);
    }

    /**
     * Export logs in CSV format
     */
    private exportCSV(logs: LogEntry[], options: ExportOptions): string {
        const headers = options.minimal 
            ? ['Timestamp', 'Level', 'Prefix', 'Message']
            : ['Timestamp', 'Level', 'Prefix', 'Message', 'File', 'Line', 'Args'];

        const rows = logs.map(entry => {
            const baseRow = [
                formatDisplayTime(new Date(entry.timestamp), 'full'),
                entry.level.toUpperCase(),
                entry.prefix || '',
                `"${entry.message.replace(/"/g, '""')}"`
            ];

            if (!options.minimal) {
                baseRow.push(
                    entry.location?.file || '',
                    entry.location?.line?.toString() || '',
                    `"${safeStringify(entry.args.slice(1)).replace(/"/g, '""')}"`
                );
            }

            return baseRow;
        });

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Export logs in Markdown format
     */
    private exportMarkdown(logs: LogEntry[], options: ExportOptions): string {
        const now = new Date();
        let content = `# Log Export - ${formatDisplayTime(now, 'full')}\n\n`;

        // Add summary if not minimal
        if (!options.minimal) {
            const summary = this.getBufferStats();
            content += `## Summary\n`;
            content += `- **Total logs**: ${logs.length}\n`;
            content += `- **Errors**: ${summary.levelCounts.error + summary.levelCounts.critical}\n`;
            content += `- **Warnings**: ${summary.levelCounts.warn}\n\n`;
        }

        // Group by level if specified
        if (options.groupBy === 'level') {
            const grouped = logs.reduce((acc, entry) => {
                const level = entry.level;
                if (!acc[level]) {
                    acc[level] = [];
                }
                // We just ensured the array exists above
                const levelArray = acc[level];
                if (levelArray) {
                    levelArray.push(entry);
                }
                return acc;
            }, {} as Record<string, LogEntry[]>);

            Object.entries(grouped).forEach(([level, entries]) => {
                const emoji = this.getLevelEmoji(level as LogLevel);
                content += `## ${emoji} ${level.toUpperCase()} (${entries.length})\n\n`;
                
                entries.forEach(entry => {
                    const time = formatDisplayTime(new Date(entry.timestamp), 'time-only');
                    const location = entry.location ? ` (${entry.location.file}:${entry.location.line})` : '';
                    const prefix = entry.prefix ? ` **${entry.prefix}**:` : '';
                    content += `- \`${time}\`${prefix} ${entry.message}${location}\n`;
                });
                content += '\n';
            });
        } else {
            content += '## Logs\n\n';
            logs.forEach(entry => {
                const time = formatDisplayTime(new Date(entry.timestamp), 'time-only');
                const emoji = this.getLevelEmoji(entry.level);
                const location = entry.location ? ` (${entry.location.file}:${entry.location.line})` : '';
                const prefix = entry.prefix ? ` **${entry.prefix}**:` : '';
                content += `- \`${time}\` ${emoji}${prefix} ${entry.message}${location}\n`;
            });
        }

        return content;
    }

    /**
     * Export logs in plain text format
     */
    private exportPlain(logs: LogEntry[], options: ExportOptions): string {
        return logs.map(entry => {
            const time = formatDisplayTime(new Date(entry.timestamp), options.minimal ? 'time-only' : 'short');
            const level = entry.level.toUpperCase().padEnd(8);
            const prefix = entry.prefix ? `[${entry.prefix}] ` : '';
            const location = (!options.minimal && entry.location) ? ` (${entry.location.file}:${entry.location.line})` : '';
            
            return `${time} ${level} ${prefix}${entry.message}${location}`;
        }).join('\n');
    }

    /**
     * Export logs in HTML format
     */
    private exportHTML(logs: LogEntry[], _options: ExportOptions): string {
        const title = `Log Export - ${formatDisplayTime(new Date(), 'full')}`;
        
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
        .log-entry { margin: 5px 0; padding: 8px; border-radius: 4px; font-family: 'Monaco', 'Consolas', monospace; }
        .timestamp { color: #666; font-size: 0.9em; }
        .level { font-weight: bold; padding: 2px 6px; border-radius: 3px; margin: 0 8px; }
        .prefix { background: #2d3748; color: #e2e8f0; padding: 2px 6px; border-radius: 3px; margin: 0 8px; }
        .location { color: #718096; font-size: 0.9em; }
        .debug { background: #f0f4ff; }
        .info { background: #f0f9ff; }
        .warn { background: #fffbeb; }
        .error { background: #fef2f2; }
        .critical { background: #fef2f2; border-left: 4px solid #dc2626; }
        .level.debug { background: #667eea; color: white; }
        .level.info { background: #74b9ff; color: white; }
        .level.warn { background: #fdcb6e; color: #2d3436; }
        .level.error { background: #e84393; color: white; }
        .level.critical { background: #ff3838; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Generated by Advanced Logger v2.0.0</p>
    </div>
    <div class="logs">`;

        logs.forEach(entry => {
            const time = formatDisplayTime(new Date(entry.timestamp), 'full');
            const location = entry.location ? ` <span class="location">(${escapeHtml(entry.location.file)}:${entry.location.line})</span>` : '';
            const prefix = entry.prefix ? ` <span class="prefix">${escapeHtml(entry.prefix)}</span>` : '';
            
            html += `
        <div class="log-entry ${entry.level}">
            <span class="timestamp">${time}</span>
            <span class="level ${entry.level}">${entry.level.toUpperCase()}</span>
            ${prefix}
            <span class="message">${escapeHtml(entry.message)}</span>
            ${location}
        </div>`;
        });

        html += `
    </div>
</body>
</html>`;

        return html;
    }

    /**
     * Get emoji for log level
     */
    private getLevelEmoji(level: LogLevel): string {
        const emojis = {
            debug: '🐞',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            critical: '🔥'
        };
        return emojis[level] || '';
    }

    /**
     * Main export function
     */
    export(format: ExportFormat, filters: ExportFilters = {}, options: ExportOptions = {}): ExportResult {
        const filteredLogs = this.filterLogs(filters);
        
        let data: string;
        switch (format) {
            case 'json':
                data = this.exportJSON(filteredLogs, options);
                break;
            case 'csv':
                data = this.exportCSV(filteredLogs, options);
                break;
            case 'markdown':
                data = this.exportMarkdown(filteredLogs, options);
                break;
            case 'plain':
                data = this.exportPlain(filteredLogs, options);
                break;
            case 'html':
                data = this.exportHTML(filteredLogs, options);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

        return {
            format,
            data,
            metadata: {
                totalLogs: this.buffer.length,
                filteredLogs: filteredLogs.length,
                exportedAt: new Date().toISOString(),
                filters,
                options
            }
        };
    }

    /**
     * Copy to clipboard with fallback
     */
    async copyToClipboard(format: ExportFormat, filters: ExportFilters = {}, options: ExportOptions = {}): Promise<boolean> {
        const result = this.export(format, filters, options);
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(result.data);
                return true;
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = result.data;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Get all logs (for debugging)
     */
    getAllLogs(): LogEntry[] {
        return [...this.buffer];
    }
}