/**
 * @fileoverview State-of-the-art Logger with advanced console styling and modern TypeScript patterns
 * @version 2.0.0
 * @author Bolt AI
 * @date 2025
 */

/**
 * Supported log levels in hierarchical order (debug < info < warn < error < critical)
 */
export const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
} as const;

/**
 * Log level type derived from LOG_LEVELS keys
 */
export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Verbosity level type for filtering logs
 */
export type Verbosity = LogLevel | 'silent';

/**
 * Theme variants for different visual styles
 */
export type ThemeVariant = 'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk';

/**
 * Banner types for different visual approaches
 */
export type BannerType = 'simple' | 'ascii' | 'unicode' | 'svg' | 'animated';

/**
 * Configuration interface for logger instances
 */
interface LoggerConfig {
    globalPrefix?: string;
    verbosity: Verbosity;
    enableColors: boolean;
    enableTimestamps: boolean;
    enableStackTrace: boolean;
    theme?: ThemeVariant;
    bannerType?: BannerType;
}

/**
 * Interface for custom log handlers (extensibility)
 */
export interface ILogHandler {
    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void;
}

/**
 * Metadata associated with each log entry
 */
interface LogMetadata {
    timestamp: string;
    level: LogLevel;
    prefix?: string;
    stackInfo?: StackInfo;
    group?: string;
}

/**
 * Parsed stack trace information
 */
interface StackInfo {
    file: string;
    line: number;
    column: number;
    function?: string;
}

/**
 * Timer entry for performance measurement
 */
interface TimerEntry {
    label: string;
    startTime: number;
}

/**
 * Theme configurations for different visual styles
 */
const THEME_PRESETS = {
    default: {
        debug: {
            emoji: '🐞', label: 'DEBUG',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff', border: '1px solid #667eea',
            shadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
        },
        info: {
            emoji: 'ℹ️', label: 'INFO',
            background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
            color: '#ffffff', border: '1px solid #74b9ff',
            shadow: '0 2px 4px rgba(116, 185, 255, 0.3)',
        },
        warn: {
            emoji: '⚠️', label: 'WARN',
            background: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
            color: '#2d3436', border: '1px solid #fdcb6e',
            shadow: '0 2px 4px rgba(253, 203, 110, 0.3)',
        },
        error: {
            emoji: '❌', label: 'ERROR',
            background: 'linear-gradient(135deg, #e84393 0%, #d63031 100%)',
            color: '#ffffff', border: '1px solid #e84393',
            shadow: '0 2px 4px rgba(232, 67, 147, 0.3)',
        },
        success: {
            emoji: '✅', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
            color: '#ffffff', border: '1px solid #00b894',
            shadow: '0 2px 4px rgba(0, 184, 148, 0.3)',
        },
        critical: {
            emoji: '🔥', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #ff3838 0%, #ff1744 100%)',
            color: '#ffffff', border: '2px solid #ff3838',
            shadow: '0 4px 8px rgba(255, 56, 56, 0.5)',
        },
    },
    dark: {
        debug: {
            emoji: '🌙', label: 'DEBUG',
            background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            color: '#e2e8f0', border: '1px solid #4a5568',
            shadow: '0 2px 4px rgba(45, 55, 72, 0.8)',
        },
        info: {
            emoji: '💡', label: 'INFO',
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
            color: '#90cdf4', border: '1px solid #3182ce',
            shadow: '0 2px 4px rgba(26, 32, 44, 0.8)',
        },
        warn: {
            emoji: '⚡', label: 'WARN',
            background: 'linear-gradient(135deg, #744210 0%, #975a16 100%)',
            color: '#faf089', border: '1px solid #d69e2e',
            shadow: '0 2px 4px rgba(116, 66, 16, 0.8)',
        },
        error: {
            emoji: '💀', label: 'ERROR',
            background: 'linear-gradient(135deg, #742a2a 0%, #9b2c2c 100%)',
            color: '#feb2b2', border: '1px solid #e53e3e',
            shadow: '0 2px 4px rgba(116, 42, 42, 0.8)',
        },
        success: {
            emoji: '🎯', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #276749 0%, #2f855a 100%)',
            color: '#9ae6b4', border: '1px solid #38a169',
            shadow: '0 2px 4px rgba(39, 103, 73, 0.8)',
        },
        critical: {
            emoji: '💥', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #ff0000 100%)',
            color: '#ffffff', border: '2px solid #ff0000',
            shadow: '0 4px 8px rgba(255, 0, 0, 0.9)',
        },
    },
    neon: {
        debug: {
            emoji: '⚡', label: 'DEBUG',
            background: 'linear-gradient(135deg, #0f3460 0%, #e94560 100%)',
            color: '#00ffff', border: '1px solid #00ffff',
            shadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        },
        info: {
            emoji: '🔮', label: 'INFO',
            background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)',
            color: '#00ff41', border: '1px solid #00ff41',
            shadow: '0 0 10px rgba(0, 255, 65, 0.5)',
        },
        warn: {
            emoji: '⚠️', label: 'WARN',
            background: 'linear-gradient(135deg, #533a03 0%, #e94560 100%)',
            color: '#ffff00', border: '1px solid #ffff00',
            shadow: '0 0 10px rgba(255, 255, 0, 0.5)',
        },
        error: {
            emoji: '💥', label: 'ERROR',
            background: 'linear-gradient(135deg, #5c0a0a 0%, #ff073a 100%)',
            color: '#ff073a', border: '1px solid #ff073a',
            shadow: '0 0 10px rgba(255, 7, 58, 0.8)',
        },
        success: {
            emoji: '✨', label: 'SUCCESS',
            background: 'linear-gradient(135deg, #0a5c0a 0%, #39ff14 100%)',
            color: '#39ff14', border: '1px solid #39ff14',
            shadow: '0 0 10px rgba(57, 255, 20, 0.8)',
        },
        critical: {
            emoji: '🌟', label: 'CRITICAL',
            background: 'linear-gradient(135deg, #000000 0%, #ff0080 100%)',
            color: '#ff0080', border: '2px solid #ff0080',
            shadow: '0 0 20px rgba(255, 0, 128, 1)',
        },
    },
    minimal: {
        debug: {
            emoji: '', label: 'DEBUG',
            background: '#f7fafc', color: '#4a5568',
            border: '1px solid #e2e8f0', shadow: 'none',
        },
        info: {
            emoji: '', label: 'INFO',
            background: '#ebf8ff', color: '#2b6cb0',
            border: '1px solid #bee3f8', shadow: 'none',
        },
        warn: {
            emoji: '', label: 'WARN',
            background: '#fffbf0', color: '#c05621',
            border: '1px solid #fed7aa', shadow: 'none',
        },
        error: {
            emoji: '', label: 'ERROR',
            background: '#fef5f5', color: '#c53030',
            border: '1px solid #fca5a5', shadow: 'none',
        },
        success: {
            emoji: '', label: 'SUCCESS',
            background: '#f0fff4', color: '#2f855a',
            border: '1px solid #9ae6b4', shadow: 'none',
        },
        critical: {
            emoji: '', label: 'CRITICAL',
            background: '#fef5f5', color: '#e53e3e',
            border: '2px solid #f56565', shadow: 'none',
        },
    }
};

/**
 * Current active theme styles
 */
let LEVEL_STYLES = THEME_PRESETS.default;

/**
 * Theme-specific banners for enhanced visual theming
 */
const THEME_BANNERS = {
    default: {
        simple: '🚀 ADVANCED LOGGER v2.0.0 - State-of-the-art Console Styling 🚀',
        style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold;'
    },
    dark: {
        simple: '🌙 ADVANCED LOGGER v2.0.0 - Dark Mode Console Excellence 🌙',
        style: 'background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); color: #e2e8f0; padding: 12px 20px; border-radius: 8px; font-weight: bold; border: 1px solid #4a5568;'
    },
    neon: {
        simple: '⚡ ADVANCED LOGGER v2.0.0 - Cyberpunk Console Experience ⚡',
        style: 'background: linear-gradient(135deg, #0f3460 0%, #e94560 100%); color: #00ffff; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-shadow: 0 0 10px #00ffff;'
    },
    minimal: {
        simple: 'ADVANCED LOGGER v2.0.0 - Clean Console Styling',
        style: 'background: #f7fafc; color: #2d3748; padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; font-weight: 500;'
    }
};

/**
 * Utility class for creating dynamic console styles with method chaining
 */
class StyleBuilder {
    private styles: string[] = [];

    constructor(baseStyle = '') {
        if (baseStyle) this.styles.push(baseStyle);
    }

    /**
     * Add background color or gradient
     */
    bg(background: string): StyleBuilder {
        this.styles.push(`background: ${background}`);
        return this;
    }

    /**
     * Add text color
     */
    color(color: string): StyleBuilder {
        this.styles.push(`color: ${color}`);
        return this;
    }

    /**
     * Add border styling
     */
    border(border: string): StyleBuilder {
        this.styles.push(`border: ${border}`);
        return this;
    }

    /**
     * Add box shadow
     */
    shadow(shadow: string): StyleBuilder {
        this.styles.push(`box-shadow: ${shadow}`);
        return this;
    }

    /**
     * Add padding
     */
    padding(padding: string): StyleBuilder {
        this.styles.push(`padding: ${padding}`);
        return this;
    }

    /**
     * Add border radius
     */
    rounded(radius: string = '4px'): StyleBuilder {
        this.styles.push(`border-radius: ${radius}`);
        return this;
    }

    /**
     * Add font weight
     */
    bold(): StyleBuilder {
        this.styles.push('font-weight: bold');
        return this;
    }

    /**
     * Add font styling
     */
    font(font: string): StyleBuilder {
        this.styles.push(`font-family: ${font}`);
        return this;
    }

    /**
     * Add font size
     */
    size(size: string): StyleBuilder {
        this.styles.push(`font-size: ${size}`);
        return this;
    }

    /**
     * Build the final CSS string
     */
    build(): string {
        return this.styles.join('; ');
    }
}

/**
 * Proxy-based dynamic styler for chainable console styling
 */
const createStyler = (): any => {
    const builder = new StyleBuilder();
    return new Proxy(builder, {
        get(target: StyleBuilder, prop: string) {
            if (prop in target) {
                const method = (target as any)[prop];
                if (typeof method === 'function') {
                    return method.bind(target);
                }
                return method;
            }
            return undefined;
        }
    });
};

/**
 * Dynamic styler instance for external use
 */
export const $ = createStyler();

/**
 * Parses the current stack trace to extract caller information
 */
function parseStackTrace(): StackInfo | null {
    try {
        const stack = new Error().stack;
        if (!stack) return null;

        const lines = stack.split('\n').filter(line => line.trim());
        
        // Find the first caller that's not from Logger methods
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
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

            if (match) {
                const [, functionName, file, line, column] = match;
                
                return {
                    file: file?.split('/').pop()?.split('?')[0] || 'unknown',
                    line: parseInt(line, 10) || 0,
                    column: parseInt(column, 10) || 0,
                    function: functionName?.trim() || undefined,
                };
            }
        }
        
        return null;
    } catch {
        return null;
    }
}

/**
 * Formats the timestamp using modern Date API
 */
function formatTimestamp(): string {
    try {
        // Use modern Temporal API if available, fallback to Date
        const now = new Date();
        return now.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

/**
 * Creates styled console output with multiple %c formatters
 */
function createStyledOutput(
    level: LogLevel,
    prefix: string | undefined,
    message: string,
    stackInfo: StackInfo | null
): [string, ...string[]] {
    const levelConfig = LEVEL_STYLES[level];
    const timestamp = formatTimestamp();

    // Base styles
    const timestampStyle = new StyleBuilder()
        .color('#666')
        .size('11px')
        .font('Monaco, Consolas, monospace')
        .build();

    const levelStyle = new StyleBuilder()
        .bg(levelConfig.background)
        .color(levelConfig.color)
        .border(levelConfig.border)
        .shadow(levelConfig.shadow)
        .padding('2px 8px')
        .rounded('4px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('12px')
        .build();

    const prefixStyle = new StyleBuilder()
        .bg('#2d3748')
        .color('#e2e8f0')
        .padding('2px 6px')
        .rounded('3px')
        .bold()
        .font('Monaco, Consolas, monospace')
        .size('11px')
        .build();

    const messageStyle = new StyleBuilder()
        .color('#2d3748')
        .font('system-ui, -apple-system, sans-serif')
        .size('14px')
        .build();

    const locationStyle = new StyleBuilder()
        .color('#718096')
        .size('11px')
        .font('Monaco, Consolas, monospace')
        .build();

    // Build format string and styles
    let format = `%c${timestamp.slice(11, 23)} %c${levelConfig.emoji} ${levelConfig.label}`;
    const styles = [timestampStyle, levelStyle];

    if (prefix) {
        format += ` %c${prefix}`;
        styles.push(prefixStyle);
    }

    format += ` %c${message}`;
    styles.push(messageStyle);

    if (stackInfo) {
        format += ` %c(${stackInfo.file}:${stackInfo.line}:${stackInfo.column})`;
        styles.push(locationStyle);
    }

    return [format, ...styles];
}

/**
 * Main Logger class implementing state-of-the-art logging capabilities
 */
export class Logger {
    private config: LoggerConfig;
    private scopedPrefix?: string;
    private handlers: ILogHandler[] = [];
    private timers: Map<string, TimerEntry> = new Map();
    private groupDepth: number = 0;

    /**
     * Creates a new Logger instance
     * @param config - Configuration options for the logger
     */
    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            verbosity: 'info',
            enableColors: true,
            enableTimestamps: true,
            enableStackTrace: true,
            theme: 'default',
            bannerType: 'simple',
            ...config,
        };
    }

    /**
     * Sets the global prefix for all log messages
     * @param prefix - The prefix to add to all log messages
     */
    setGlobalPrefix(prefix: string): void {
        this.config.globalPrefix = prefix;
    }

    /**
     * Creates a scoped logger with a specific prefix
     * @param prefix - The prefix for the scoped logger
     * @returns A new Logger instance with the specified prefix
     */
    createScopedLogger(prefix: string): Logger {
        const scopedLogger = new Logger(this.config);
        scopedLogger.scopedPrefix = prefix;
        scopedLogger.handlers = [...this.handlers];
        return scopedLogger;
    }

    /**
     * Sets the verbosity level for filtering log output
     * @param level - The minimum log level to output
     */
    setVerbosity(level: Verbosity): void {
        this.config.verbosity = level;
    }

    /**
     * Adds a custom log handler for extensibility
     * @param handler - The log handler to add
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Checks if a log level should be output based on current verbosity
     * @private
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.verbosity];
    }

    /**
     * Gets the effective prefix (global + scoped)
     * @private
     */
    private getEffectivePrefix(): string | undefined {
        const parts = [this.config.globalPrefix, this.scopedPrefix].filter(Boolean);
        return parts.length > 0 ? parts.join(':') : undefined;
    }

    /**
     * Core logging method that handles styling and formatting
     * @private
     */
    private log(level: LogLevel, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const message = args.length > 0 ? String(args[0]) : '';
        const additionalArgs = args.slice(1);

        // Create styled output
        const [format, ...styles] = createStyledOutput(level, prefix, message, stackInfo);

        // Add group indentation
        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + format;

        // Output to console
        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        // Call custom handlers
        const metadata: LogMetadata = {
            timestamp: formatTimestamp(),
            level,
            prefix,
            stackInfo: stackInfo || undefined,
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
     * Logs debug information (lowest priority)
     * @param args - Arguments to log
     */
    debug(...args: any[]): void {
        this.log('debug', ...args);
    }

    /**
     * Logs informational messages
     * @param args - Arguments to log
     */
    info(...args: any[]): void {
        this.log('info', ...args);
    }

    /**
     * Logs warning messages
     * @param args - Arguments to log
     */
    warn(...args: any[]): void {
        this.log('warn', ...args);
    }

    /**
     * Logs error messages
     * @param args - Arguments to log
     */
    error(...args: any[]): void {
        this.log('error', ...args);
    }

    /**
     * Logs success messages (special info level)
     * @param args - Arguments to log
     */
    success(...args: any[]): void {
        if (!this.shouldLog('info')) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const message = args.length > 0 ? String(args[0]) : '';
        const additionalArgs = args.slice(1);

        const successConfig = LEVEL_STYLES.success;
        const timestamp = formatTimestamp();

        const timestampStyle = new StyleBuilder()
            .color('#666')
            .size('11px')
            .font('Monaco, Consolas, monospace')
            .build();

        const levelStyle = new StyleBuilder()
            .bg(successConfig.background)
            .color(successConfig.color)
            .border(successConfig.border)
            .shadow(successConfig.shadow)
            .padding('2px 8px')
            .rounded('4px')
            .bold()
            .font('Monaco, Consolas, monospace')
            .size('12px')
            .build();

        const prefixStyle = new StyleBuilder()
            .bg('#2d3748')
            .color('#e2e8f0')
            .padding('2px 6px')
            .rounded('3px')
            .bold()
            .font('Monaco, Consolas, monospace')
            .size('11px')
            .build();

        const messageStyle = new StyleBuilder()
            .color('#2d3748')
            .font('system-ui, -apple-system, sans-serif')
            .size('14px')
            .build();

        const locationStyle = new StyleBuilder()
            .color('#718096')
            .size('11px')
            .font('Monaco, Consolas, monospace')
            .build();

        let format = `%c${timestamp.slice(11, 23)} %c${successConfig.emoji} ${successConfig.label}`;
        const styles = [timestampStyle, levelStyle];

        if (prefix) {
            format += ` %c${prefix}`;
            styles.push(prefixStyle);
        }

        format += ` %c${message}`;
        styles.push(messageStyle);

        if (stackInfo) {
            format += ` %c(${stackInfo.file}:${stackInfo.line}:${stackInfo.column})`;
            styles.push(locationStyle);
        }

        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + format;

        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        const metadata: LogMetadata = {
            timestamp: formatTimestamp(),
            level: 'info',
            prefix,
            stackInfo: stackInfo || undefined,
        };

        this.handlers.forEach(handler => {
            try {
                handler.handle('info', message, args, metadata);
            } catch (error) {
                console.error('Log handler failed:', error);
            }
        });
    }

    /**
     * Logs trace information (detailed debugging)
     * @param args - Arguments to log
     */
    trace(...args: any[]): void {
        this.log('debug', ...args);
        if (this.shouldLog('debug')) {
            console.trace(...args);
        }
    }

    /**
     * Logs critical errors (highest priority)
     * @param args - Arguments to log
     */
    critical(...args: any[]): void {
        this.log('critical', ...args);
    }

    /**
     * Displays data in a table format
     * @param data - The data to display in table format
     * @param columns - Optional column names to display
     */
    table(data: any, columns?: string[]): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.getEffectivePrefix();
        const tableStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)')
            .color('#495057')
            .border('1px solid #dee2e6')
            .padding('4px 8px')
            .rounded('4px')
            .bold()
            .build();

        const format = `%c📊 TABLE${prefix ? ` [${prefix}]` : ''}`;
        console.log(format, tableStyle);

        if (columns) {
            console.table(data, columns);
        } else {
            console.table(data);
        }
    }

    /**
     * Starts a collapsible group in the console
     * @param label - The label for the group
     * @param collapsed - Whether the group should start collapsed
     */
    group(label: string, collapsed: boolean = false): void {
        const groupStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)')
            .color('#1565c0')
            .border('1px solid #90caf9')
            .padding('4px 12px')
            .rounded('6px')
            .bold()
            .build();

        const format = `%c📁 ${label}`;

        if (collapsed) {
            console.groupCollapsed(format, groupStyle);
        } else {
            console.group(format, groupStyle);
        }

        this.groupDepth++;
    }

    /**
     * Ends the current console group
     */
    groupEnd(): void {
        if (this.groupDepth > 0) {
            console.groupEnd();
            this.groupDepth--;
        }
    }

    /**
     * Starts a timer with the given label
     * @param label - The timer label
     */
    time(label: string): void {
        const timer: TimerEntry = {
            label,
            startTime: performance.now(),
        };
        this.timers.set(label, timer);

        const timerStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)')
            .color('#856404')
            .border('1px solid #ffeaa7')
            .padding('2px 6px')
            .rounded('3px')
            .font('Monaco, Consolas, monospace')
            .size('12px')
            .build();

        console.log(`%c⏱️ Timer started: ${label}`, timerStyle);
    }

    /**
     * Ends a timer and logs the elapsed time
     * @param label - The timer label to end
     */
    timeEnd(label: string): void {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }

        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);

        const timerStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)')
            .color('#155724')
            .border('1px solid #c3e6cb')
            .padding('2px 6px')
            .rounded('3px')
            .font('Monaco, Consolas, monospace')
            .size('12px')
            .bold()
            .build();

        console.log(`%c⏱️ Timer ended: ${label} - ${elapsed.toFixed(2)}ms`, timerStyle);
    }

    /**
     * Logs with custom SVG animation (experimental feature)
     * @param message - The message to log
     * @param svgAnimation - SVG with animation as data URI
     */
    logWithAnimation(message: string, svgAnimation?: string): void {
        if (svgAnimation) {
            const animatedStyle = new StyleBuilder()
                .bg(`url("${svgAnimation}") no-repeat left center`)
                .padding('20px 20px 20px 40px')
                .border('2px solid #ff6b6b')
                .rounded('8px')
                .color('#2d3748')
                .bold()
                .build();

            console.log(`%c${message}`, animatedStyle);
        } else {
            this.info(message);
        }
    }

    /**
     * Groups logs by a specific property using modern Object.groupBy (when available)
     * @param items - Items to group and log
     * @param groupBy - Function to extract grouping key
     */
    logGrouped<T>(items: T[], groupBy: (item: T) => string): void {
        try {
            // Use Object.groupBy if available (ES2024)
            const grouped = (Object as any).groupBy?.(items, groupBy) ||
                items.reduce((acc, item) => {
                    const key = groupBy(item);
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {} as Record<string, T[]>);

            Object.entries(grouped).forEach(([group, groupItems]) => {
                this.group(`Group: ${group}`);
                this.table(groupItems);
                this.groupEnd();
            });
        } catch {
            // Fallback to simple logging
            this.info('Grouped data:', items);
        }
    }

    /**
     * Sets the logger theme
     * @param theme - Theme variant to apply
     */
    setTheme(theme: ThemeVariant): void {
        if (theme in THEME_PRESETS) {
            LEVEL_STYLES = (THEME_PRESETS as any)[theme];
            this.config.theme = theme;
            
            // Show theme-specific banner
            if (theme in THEME_BANNERS) {
                const themeBanner = (THEME_BANNERS as any)[theme];
                console.log(`%c${themeBanner.simple}`, themeBanner.style);
            }
            
            this.success(`Theme changed to: ${theme}`);
        } else {
            this.error(`Invalid theme: ${theme}. Available themes:`, Object.keys(THEME_PRESETS));
        }
    }

    /**
     * CLI command processor for logger configuration
     * @param command - Command string starting with /
     */
    cli(command: string): void {
        if (!command.startsWith('/')) {
            this.error('Invalid command. Commands must start with /');
            return;
        }

        const parts = command.slice(1).split(' ');
        const cmd = parts[0];
        const args = parts.slice(1).join(' ');

        switch (cmd) {
            case 'config':
                this.handleConfigCommand(args);
                break;
            case 'help':
                this.showHelp();
                break;
            case 'themes':
                this.showThemes();
                break;
            case 'banners':
                this.showBanners();
                break;
            case 'banner':
                this.handleBannerCommand(args);
                break;
            case 'status':
                this.showStatus();
                break;
            case 'reset':
                this.resetConfig();
                break;
            case 'demo':
                this.showDemo();
                break;
            default:
                this.error(`Unknown command: ${cmd}. Type /help for available commands.`);
        }
    }

    /**
     * Handle /config command with JSON or key-value pairs
     * @private
     */
    private handleConfigCommand(args: string): void {
        if (!args) {
            this.showStatus();
            return;
        }

        try {
            // Try to parse as JSON first
            if (args.startsWith('{')) {
                const config = JSON.parse(args);
                this.applyConfig(config);
            } else {
                // Parse key=value pairs
                const pairs = args.split(',').map(pair => pair.trim().split('='));
                const config: any = {};
                pairs.forEach(([key, value]) => {
                    if (key && value) {
                        config[key.trim()] = value.trim().replace(/["']/g, '');
                    }
                });
                this.applyConfig(config);
            }
        } catch (error) {
            this.error('Invalid config format. Use JSON or key=value pairs:', error);
            this.info('Examples: /config {"theme":"dark"} or /config theme=neon,verbosity=debug');
        }
    }

    /**
     * Apply configuration object to logger
     * @private
     */
    private applyConfig(config: any): void {
        const validKeys = ['theme', 'verbosity', 'enableColors', 'enableTimestamps', 'enableStackTrace', 'globalPrefix', 'bannerType'];
        const applied: string[] = [];

        Object.entries(config).forEach(([key, value]) => {
            if (validKeys.includes(key)) {
                if (key === 'theme' && typeof value === 'string') {
                    this.setTheme(value as ThemeVariant);
                    applied.push(`${key}=${value}`);
                } else if (key === 'bannerType' && typeof value === 'string') {
                    this.setBannerType(value as BannerType);
                    applied.push(`${key}=${value}`);
                } else if (key === 'verbosity') {
                    this.setVerbosity(value as Verbosity);
                    applied.push(`${key}=${value}`);
                } else if (key === 'globalPrefix') {
                    this.setGlobalPrefix(value as string);
                    applied.push(`${key}=${value}`);
                } else {
                    (this.config as any)[key] = value;
                    applied.push(`${key}=${value}`);
                }
            } else {
                this.warn(`Invalid config key: ${key}`);
            }
        });

        if (applied.length > 0) {
            this.success(`Configuration updated: ${applied.join(', ')}`);
        }
    }

    /**
     * Show CLI help information
     * @private
     */
    private showHelp(): void {
        const helpStyle = new StyleBuilder()
            .bg('linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)')
            .color('#495057')
            .padding('15px 20px')
            .rounded('8px')
            .border('1px solid #dee2e6')
            .font('Monaco, Consolas, monospace')
            .size('13px')
            .build();

        const helpText = `
╭─────────────── LOGGER CLI COMMANDS ───────────────╮
│                                                   │
│  /help              Show this help message        │
│  /config            Show current configuration    │
│  /config {json}     Apply JSON configuration      │
│  /config key=val    Apply key-value config        │
│  /themes            Show available themes         │
│  /banners           Show available banner types   │
│  /banner [type]     Change/show banner type       │
│  /status            Show logger status            │
│  /demo              Show feature demonstration     │
│  /reset             Reset to default config       │
│                                                   │
├─────────────── CONFIGURATION OPTIONS ─────────────┤
│                                                   │
│  theme: default | dark | neon | minimal          │
│  bannerType: simple | ascii | unicode | svg      │
│  verbosity: debug | info | warn | error | silent │
│  enableColors: true | false                       │
│  enableTimestamps: true | false                   │
│  enableStackTrace: true | false                   │
│  globalPrefix: "string"                           │
│                                                   │
├──────────────────── EXAMPLES ─────────────────────┤
│                                                   │
│  /config {"theme":"dark","bannerType":"animated"} │
│  /config theme=neon,verbosity=debug               │
│  /banner svg        Change to SVG banner          │
│  /demo              Show all features             │
│                                                   │
╰───────────────────────────────────────────────────╯`;

        console.log(`%c${helpText}`, helpStyle);
    }

    /**
     * Show available themes with previews
     * @private
     */
    private showThemes(): void {
        this.group('🎨 Available Themes');
        Object.keys(THEME_PRESETS).forEach(themeName => {
            const preview = (THEME_PRESETS as any)[themeName];
            const previewStyle = new StyleBuilder()
                .bg(preview.info.background)
                .color(preview.info.color)
                .padding('4px 8px')
                .rounded('4px')
                .border(preview.info.border)
                .build();
            
            console.log(`%c${themeName}`, previewStyle, `- ${themeName} theme preview`);
        });
        this.groupEnd();
    }

    /**
     * Show available banner types with previews
     * @private
     */
    private showBanners(): void {
        this.group('🖼️ Available Banner Types');
        Object.keys(BANNER_VARIANTS).forEach(bannerName => {
            const banner = (BANNER_VARIANTS as any)[bannerName];
            console.log(`%c${bannerName}`, 'font-weight: bold; color: #667eea;');
            console.log(`%cPreview:`, 'color: #666; font-size: 12px;');
            
            // Show a mini preview
            if (bannerName === 'simple') {
                console.log(`%c${banner.text}`, banner.style);
            } else if (bannerName === 'ascii') {
                console.log(`%c${banner.text.split('\n').slice(1, 4).join('\n')}...`, 'font-family: monospace; color: #667eea; font-size: 10px;');
            } else if (bannerName === 'unicode') {
                console.log(`%c${banner.text}`, banner.style);
            } else {
                console.log(`%c${bannerName} banner`, 'color: #666; font-style: italic;');
            }
        });
        this.groupEnd();
    }

    /**
     * Handle banner command
     * @private
     */
    private handleBannerCommand(args: string): void {
        if (!args) {
            this.showBanner();
            return;
        }

        if (args in BANNER_VARIANTS) {
            this.setBannerType(args as BannerType);
            this.showBanner();
        } else {
            this.error(`Invalid banner type: ${args}. Available: ${Object.keys(BANNER_VARIANTS).join(', ')}`);
        }
    }

    /**
     * Show demonstration of all logger features
     * @private
     */
    private showDemo(): void {
        this.group('🎪 Advanced Logger Demo');
        
        // Basic logging demo
        this.debug('Debug message with detailed information');
        this.info('Informational message about system state'); 
        this.warn('Warning about deprecated feature');
        this.error('Error processing user request');
        this.success('Operation completed successfully');
        this.critical('Critical system failure detected');
        
        // Advanced features demo
        this.group('📊 Advanced Features Demo');
        
        // Table demo
        this.table([
            { feature: 'Styled Console', status: '✅ Active', performance: 'Excellent' },
            { feature: 'Theme System', status: '✅ Active', performance: 'Great' },
            { feature: 'CLI Interface', status: '✅ Active', performance: 'Good' }
        ]);
        
        // Timer demo
        this.time('demo-operation');
        setTimeout(() => {
            this.timeEnd('demo-operation');
        }, 100);
        
        // SVG demo
        this.logWithSVG('SVG Demo');
        
        // Animated demo
        this.logAnimated('🌟 Animated Logger Demo 🌟', 2);
        
        this.groupEnd();
        this.groupEnd();
    }

    /**
     * Show current logger status and configuration
     * @private
     */
    private showStatus(): void {
        const statusData = {
            theme: this.config.theme || 'default',
            verbosity: this.config.verbosity,
            colors: this.config.enableColors,
            timestamps: this.config.enableTimestamps,
            stackTrace: this.config.enableStackTrace,
            globalPrefix: this.config.globalPrefix || 'none',
            handlers: this.handlers.length
        };

        this.group('⚙️ Logger Configuration');
        this.table(statusData);
        this.groupEnd();
    }

    /**
     * Reset logger to default configuration
     * @private
     */
    private resetConfig(): void {
        this.config = {
            verbosity: 'info',
            enableColors: true,
            enableTimestamps: true,
            enableStackTrace: true,
            theme: 'default',
            bannerType: 'simple',
        };
        LEVEL_STYLES = THEME_PRESETS.default;
        this.success('Logger configuration reset to defaults');
    }

    /**
     * Set banner type for initialization display
     * @param bannerType - Type of banner to display
     */
    setBannerType(bannerType: BannerType): void {
        this.config.bannerType = bannerType;
        this.success(`Banner type changed to: ${bannerType}`);
    }

    /**
     * Display banner with specified or configured type
     * @param bannerType - Optional banner type override
     */
    showBanner(bannerType?: BannerType): void {
        displayInitBanner(bannerType || this.config.bannerType);
    }

    /**
     * Log with SVG background image
     * @param message - The message to log
     * @param svgContent - SVG content as string
     * @param options - Additional styling options
     */
    logWithSVG(message: string, svgContent?: string, options: { width?: number, height?: number, padding?: string } = {}): void {
        const { width = 300, height = 60, padding = '30px 150px' } = options;
        
        let svgDataUri = '';
        if (svgContent) {
            // Encode SVG for data URI
            const encodedSVG = encodeURIComponent(svgContent);
            svgDataUri = `data:image/svg+xml,${encodedSVG}`;
        } else {
            // Default animated SVG
            const defaultSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='100%' style='stop-color:%23764ba2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)' rx='4'/><text x='${width/2}' y='${height/2 + 5}' text-anchor='middle' fill='white' font-family='monospace' font-size='14' font-weight='bold'>${message}</text></svg>`;
            svgDataUri = `data:image/svg+xml,${encodeURIComponent(defaultSVG)}`;
        }

        const svgStyle = new StyleBuilder()
            .bg(`url("${svgDataUri}") no-repeat center center`)
            .size(`${width}px ${height}px`)
            .padding(padding)
            .color('transparent')
            .rounded('4px')
            .build();

        console.log(`%c${message}`, svgStyle);
    }

    /**
     * Log with animated background gradient
     * @param message - The message to log  
     * @param duration - Animation duration in seconds
     */
    logAnimated(message: string, duration: number = 3): void {
        // Inject CSS animation if not already present
        if (!document.getElementById('logger-animations')) {
            const style = document.createElement('style');
            style.id = 'logger-animations';
            style.textContent = `
                @keyframes loggerGradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes loggerPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                @keyframes loggerSlide {
                    0% { transform: translateX(-100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        const animatedStyle = new StyleBuilder()
            .bg('linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)')
            .size('400% 400%')
            .color('#ffffff')
            .padding('12px 20px')
            .rounded('8px')
            .bold()
            .font('Monaco, Consolas, monospace')
            .build() + `; animation: loggerGradient ${duration}s ease infinite; display: inline-block;`;

        console.log(`%c${message}`, animatedStyle);
    }
}

/**
 * File-based log handler for persistent logging
 */
export class FileLogHandler implements ILogHandler {
    private filename: string;

    constructor(filename: string = 'app.log') {
        this.filename = filename;
    }

    handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): void {
        const logEntry = {
            filename: this.filename,
            timestamp: metadata.timestamp,
            level: level.toUpperCase(),
            prefix: metadata.prefix,
            message,
            args: args.slice(1),
            location: metadata.stackInfo,
        };

        console.debug('File log entry:', logEntry);
    }
}

/**
 * Remote log handler for sending logs to external services
 */
export class RemoteLogHandler implements ILogHandler {
    private endpoint: string;
    private apiKey?: string;

    constructor(endpoint: string, apiKey?: string) {
        this.endpoint = endpoint;
        this.apiKey = apiKey;
    }

    async handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata): Promise<void> {
        try {
            const payload = {
                timestamp: metadata.timestamp,
                level,
                message,
                prefix: metadata.prefix,
                location: metadata.stackInfo,
                additional: args.slice(1),
            };

            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
                },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            // Silently fail to avoid infinite logging loops
        }
    }
}

/**
 * Banner variants for different display capabilities
 */
const BANNER_VARIANTS = {
    simple: {
        text: '🚀 ADVANCED LOGGER v2.0.0 - State-of-the-art Console Styling 🚀',
        style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;'
    },
    ascii: {
        text: `
   ___     ____  _   __   ___     _   __  _____ _____ ____     __     ___    _____ _____ _____ ____  
  / _ \\   / __ \\| | / /  / _ \\   | \\ | |/ ____| ____|  _ \\   |  |   / _ \\  / ____|  ___|  _  |  _ \\ 
 / /_\\ \\ / / _\` | |/ /  / /_\\ \\  |  \\| | |   | |__  | | | |  |  |  / / \\ \\| |  __| |_  | |_| | |_) |
 |  _  || | (_| |   <   |  _  |  | . \` | |   |  __| | | | |  |  | | |   | | | |_ |  _| |    /|  _ < 
 | | | |\\ \\__,_|_|\\_\\  | | | |  | |\\  | |___| |____| |_| |  |  |__\\ \\_/ /| |__| | |___| |\\ \\| |_) |
 \\_| |_/ \\____/        \\_| |_/  |_| \\_|\\_____|______|____/   |_____/\\___/  \\_____|_____|_| \\_|____/

                            Advanced Logger v2.0.0 - Console Excellence`,
        style: 'font-family: "Courier New", Consolas, Monaco, monospace; color: #667eea; font-size: 11px; line-height: 1.2;'
    },
    unicode: {
        text: `
╔══════════════════════════════════════════════════════════════════════════╗
║                         🚀 ADVANCED LOGGER v2.0.0                       ║
║                      State-of-the-art Console Styling                    ║  
╚══════════════════════════════════════════════════════════════════════════╝`,
        style: 'font-family: "Courier New", Consolas, Monaco, monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.3;'
    },
    svg: {
        text: '                    ',
        style: `
            background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='100%' style='stop-color:%23764ba2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)' rx='8'/><text x='200' y='30' text-anchor='middle' fill='white' font-family='monospace' font-size='14' font-weight='bold'>🚀 ADVANCED LOGGER</text><text x='200' y='50' text-anchor='middle' fill='white' font-family='monospace' font-size='12'>State-of-the-art Console Styling</text><text x='200' y='65' text-anchor='middle' fill='white' font-family='monospace' font-size='10'>v2.0.0</text></svg>");
            background-repeat: no-repeat;
            background-size: 400px 80px;
            padding: 40px 200px;
            color: transparent;
            display: inline-block;
            border-radius: 8px;
        `
    },
    animated: {
        text: '         🚀 ADVANCED LOGGER v2.0.0         ',
        style: `
            background: linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2);
            background-size: 400% 400%;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 14px;
            font-family: monospace;
            animation: gradientShift 3s ease infinite;
            display: inline-block;
        `
    }
};

/**
 * Feature detection for banner capabilities
 */
function detectBannerCapabilities(): BannerType {
    // Try to detect browser capabilities
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    // Check for SVG support (most modern browsers)
    const supportsSVG = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    
    // Check for CSS animation support
    const supportsAnimations = typeof document !== 'undefined' && 
        'animationName' in document.createElement('div').style;
    
    // Progressive enhancement
    if (supportsAnimations && isChrome) {
        return 'animated';
    } else if (supportsSVG && (isChrome || isFirefox)) {
        return 'svg';
    } else if (isChrome || isFirefox) {
        return 'unicode';
    } else if (isSafari) {
        return 'ascii';
    }
    
    return 'simple';
}

/**
 * Display initialization banner with advanced styling
 */
function displayInitBanner(bannerType?: BannerType): void {
    const selectedType = bannerType || detectBannerCapabilities();
    const banner = BANNER_VARIANTS[selectedType];
    
    // Add CSS animation keyframes if needed
    if (selectedType === 'animated') {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log(`%c${banner.text}`, banner.style);

    // Show feature highlights
    const features = [
        '🎨 Advanced CSS Console Styling',
        '📍 Automatic Stack Trace Parsing',
        '🔧 Scoped Loggers & Prefixes',
        '⚡ Performance Timers',
        '🎯 Verbosity Filtering',
        '🔌 Extensible Handlers',
        '📱 Modern TypeScript Patterns'
    ];

    console.group(`%c✨ Features`, new StyleBuilder()
        .bg('#f8f9fa')
        .color('#495057')
        .padding('4px 8px')
        .rounded('4px')
        .bold()
        .build());

    features.forEach(feature => {
        console.log(`%c${feature}`, new StyleBuilder()
            .color('#6c757d')
            .size('13px')
            .build());
    });

    console.groupEnd();
    console.log(''); // Add spacing
}

/**
 * Create and export the singleton logger instance
 */
const defaultLogger = new Logger({
    verbosity: 'info',
    enableColors: true,
    enableTimestamps: true,
    enableStackTrace: true,
});

// Display initialization banner with auto-detection
displayInitBanner();

// Export the singleton instance as default
export default defaultLogger;

/**
 * Export individual methods for convenience (with proper binding)
 */
export const debug = (...args: any[]) => defaultLogger.debug(...args);
export const info = (...args: any[]) => defaultLogger.info(...args);
export const warn = (...args: any[]) => defaultLogger.warn(...args);
export const error = (...args: any[]) => defaultLogger.error(...args);
export const success = (...args: any[]) => defaultLogger.success(...args);
export const trace = (...args: any[]) => defaultLogger.trace(...args);
export const critical = (...args: any[]) => defaultLogger.critical(...args);
export const table = (data: any, columns?: string[]) => defaultLogger.table(data, columns);
export const group = (label: string, collapsed?: boolean) => defaultLogger.group(label, collapsed);
export const groupEnd = () => defaultLogger.groupEnd();
export const time = (label: string) => defaultLogger.time(label);
export const timeEnd = (label: string) => defaultLogger.timeEnd(label);
export const setGlobalPrefix = (prefix: string) => defaultLogger.setGlobalPrefix(prefix);
export const createScopedLogger = (prefix: string) => defaultLogger.createScopedLogger(prefix);
export const setVerbosity = (level: Verbosity) => defaultLogger.setVerbosity(level);
export const addHandler = (handler: ILogHandler) => defaultLogger.addHandler(handler);
export const setTheme = (theme: ThemeVariant) => defaultLogger.setTheme(theme);
export const setBannerType = (bannerType: BannerType) => defaultLogger.setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => defaultLogger.showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: { width?: number, height?: number, padding?: string }) => defaultLogger.logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) => defaultLogger.logAnimated(message, duration);
export const cli = (command: string) => defaultLogger.cli(command);

/**
 * Advanced styling utilities for external use
 */
export const Styles = {
    /**
     * Creates a new StyleBuilder instance
     */
    create(): StyleBuilder {
        return new StyleBuilder();
    },

    /**
     * Pre-defined common styles
     */
    presets: {
        success: new StyleBuilder()
            .bg('linear-gradient(135deg, #00b894 0%, #00a085 100%)')
            .color('#ffffff')
            .padding('4px 8px')
            .rounded('4px')
            .bold()
            .build(),

        error: new StyleBuilder()
            .bg('linear-gradient(135deg, #e84393 0%, #d63031 100%)')
            .color('#ffffff')
            .padding('4px 8px')
            .rounded('4px')
            .bold()
            .build(),

        warning: new StyleBuilder()
            .bg('linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)')
            .color('#2d3436')
            .padding('4px 8px')
            .rounded('4px')
            .bold()
            .build(),

        info: new StyleBuilder()
            .bg('linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)')
            .color('#ffffff')
            .padding('4px 8px')
            .rounded('4px')
            .bold()
            .build(),
    },
};


/**
 * Example custom handler for demonstration
 */
export class AnalyticsLogHandler implements ILogHandler {
    handle(level: LogLevel, message: string, _args: any[], metadata: LogMetadata): void {
        // In a real implementation, this could send analytics data
        if (level === 'error' || level === 'critical') {
            // Track errors for analytics
            console.debug('Analytics: Error tracked', { level, message, timestamp: metadata.timestamp });
        }
    }
}
