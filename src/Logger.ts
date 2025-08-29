/**
 * @fileoverview Refactored Advanced Logger with modular architecture
 * @version 2.0.0
 */

// Type imports
import type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    LoggerConfig,
    TimerEntry,
    ILogHandler,
    LogMetadata,
    StyleOptions
} from './types/index.js';

// Utility imports
import {
    parseStackTrace,
    formatTimestamp,
    createStyledOutput
} from './utils/index.js';

// Styling imports
import {
    THEME_PRESETS,
    THEME_BANNERS,
    displayInitBanner,
    StylePresets,
    StyleBuilder
} from './styling/index.js';

// Handler imports
import { ExportLogHandler } from './handlers/index.js';

// CLI imports
import { createDefaultCLI, type CommandProcessor } from './cli/index.js';

// Constants
import { DEFAULT_CONFIG } from './constants.js';

/**
 * Current active theme styles
 */
let LEVEL_STYLES = THEME_PRESETS.default;

/**
 * Main Logger class implementing state-of-the-art logging capabilities
 */
export class Logger {
    private config: LoggerConfig;
    private scopedPrefix?: string;
    private handlers: ILogHandler[] = [];
    private timers: Map<string, TimerEntry> = new Map();
    private groupDepth: number = 0;
    private exportHandler?: ExportLogHandler;
    private cliProcessor?: CommandProcessor;

    /**
     * Creates a new Logger instance
     */
    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };

        // Initialize export handler if buffer size is specified
        if (this.config.bufferSize) {
            this.exportHandler = new ExportLogHandler(this.config.bufferSize);
            this.handlers.push(this.exportHandler);
        }

        // Initialize CLI processor
        this.cliProcessor = createDefaultCLI();
    }

    // ===== CONFIGURATION METHODS =====

    /**
     * Get current configuration
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    /**
     * Sets the global prefix for all log messages
     */
    setGlobalPrefix(prefix: string): void {
        this.config.globalPrefix = prefix;
    }

    /**
     * Sets the verbosity level for filtering log output
     */
    setVerbosity(level: Verbosity): void {
        this.config.verbosity = level;
    }

    /**
     * Sets the logger theme
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
     * Set banner type for initialization display
     */
    setBannerType(bannerType: BannerType): void {
        this.config.bannerType = bannerType;
        this.success(`Banner type changed to: ${bannerType}`);
    }

    /**
     * Reset logger to default configuration
     */
    resetConfig(): void {
        this.config = { ...DEFAULT_CONFIG };
        LEVEL_STYLES = THEME_PRESETS.default;
        this.success('Logger configuration reset to defaults');
    }

    // ===== SCOPED LOGGER =====

    /**
     * Creates a scoped logger with a specific prefix
     */
    createScopedLogger(prefix: string): Logger {
        const scopedLogger = new Logger(this.config);
        scopedLogger.scopedPrefix = prefix;
        scopedLogger.handlers = [...this.handlers];
        scopedLogger.exportHandler = this.exportHandler;
        return scopedLogger;
    }

    // ===== HANDLER MANAGEMENT =====

    /**
     * Adds a custom log handler for extensibility
     */
    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler);
    }

    /**
     * Get all registered handlers
     */
    getHandlers(): ILogHandler[] {
        return [...this.handlers];
    }

    /**
     * Get export handler if available
     */
    getExportHandler(): ExportLogHandler | undefined {
        return this.exportHandler;
    }

    // ===== CORE LOGGING METHODS =====

    /**
     * Checks if a log level should be output based on current verbosity
     */
    private shouldLog(level: LogLevel): boolean {
        if (this.config.verbosity === 'silent') return false;
        const levels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
        return levels[level] >= levels[this.config.verbosity];
    }

    /**
     * Gets the effective prefix (global + scoped)
     */
    private getEffectivePrefix(): string | undefined {
        const parts = [this.config.globalPrefix, this.scopedPrefix].filter(Boolean);
        return parts.length > 0 ? parts.join(':') : undefined;
    }

    /**
     * Core logging method that handles styling and formatting
     */
    private log(level: LogLevel, ...args: any[]): void {
        if (!this.shouldLog(level)) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const message = args.length > 0 ? String(args[0]) : '';
        const additionalArgs = args.slice(1);

        // Create styled output
        const [format, ...styles] = createStyledOutput(level, LEVEL_STYLES, prefix, message, stackInfo);

        // Add group indentation
        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + format;

        // Output to console
        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        // Update export handler group info
        if (this.exportHandler) {
            this.exportHandler.setGroupInfo(this.groupDepth);
        }

        // Call custom handlers
        const metadata: LogMetadata = {
            timestamp: formatTimestamp(),
            level,
            prefix,
            stackInfo: stackInfo ? stackInfo : undefined,
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
     */
    debug(...args: any[]): void {
        this.log('debug', ...args);
    }

    /**
     * Logs informational messages
     */
    info(...args: any[]): void {
        this.log('info', ...args);
    }

    /**
     * Logs warning messages
     */
    warn(...args: any[]): void {
        this.log('warn', ...args);
    }

    /**
     * Logs error messages
     */
    error(...args: any[]): void {
        this.log('error', ...args);
    }

    /**
     * Logs success messages (special info level)
     */
    success(...args: any[]): void {
        if (!this.shouldLog('info')) return;

        const stackInfo = this.config.enableStackTrace ? parseStackTrace() : null;
        const prefix = this.getEffectivePrefix();
        const message = args.length > 0 ? String(args[0]) : '';
        const additionalArgs = args.slice(1);

        // Handle success as special case - use info level with success styling
        const [format, ...styles] = createStyledOutput('info', LEVEL_STYLES, prefix, message, stackInfo);
        
        // Override with success styling
        const successStyle = LEVEL_STYLES.success;
        let emoji = '✅';
        let label = 'SUCCESS';
        
        if (successStyle) {
            if (successStyle.emoji) {
                emoji = successStyle.emoji;
            }
            if (successStyle.label) {
                label = successStyle.label;
            }
        }
        
        const successFormat = format.replace(/ℹ️ INFO/, `${emoji} ${label}`);

        const groupIndent = '  '.repeat(this.groupDepth);
        const finalFormat = groupIndent + successFormat;

        if (additionalArgs.length > 0) {
            console.log(finalFormat, ...styles, ...additionalArgs);
        } else {
            console.log(finalFormat, ...styles);
        }

        // Call handlers
        const metadata: LogMetadata = {
            timestamp: formatTimestamp(),
            level: 'info',
            prefix,
            stackInfo: stackInfo ? stackInfo : undefined,
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
     */
    trace(...args: any[]): void {
        this.log('debug', ...args);
        if (this.shouldLog('debug')) {
            console.trace(...args);
        }
    }

    /**
     * Logs critical errors (highest priority)
     */
    critical(...args: any[]): void {
        this.log('critical', ...args);
    }

    // ===== ADVANCED LOGGING FEATURES =====

    /**
     * Displays data in a table format
     */
    table(data: any, columns?: string[]): void {
        if (!this.shouldLog('info')) return;

        const prefix = this.getEffectivePrefix();
        const tableStyle = StylePresets.accent().build();

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

    // ===== PERFORMANCE TIMING =====

    /**
     * Starts a timer with the given label
     */
    time(label: string): void {
        const timer: TimerEntry = {
            label,
            startTime: performance.now(),
        };
        this.timers.set(label, timer);

        const timerStyle = StylePresets.warning().build();
        console.log(`%c⏱️ Timer started: ${label}`, timerStyle);
    }

    /**
     * Ends a timer and logs the elapsed time
     */
    timeEnd(label: string): void {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }

        const elapsed = performance.now() - timer.startTime;
        this.timers.delete(label);

        const timerStyle = StylePresets.success().build();
        console.log(`%c⏱️ Timer ended: ${label} - ${elapsed.toFixed(2)}ms`, timerStyle);
    }

    // ===== ADVANCED VISUAL FEATURES =====

    /**
     * Display banner with specified or configured type
     */
    showBanner(bannerType?: BannerType): void {
        const effectiveBannerType = bannerType ? bannerType : this.config.bannerType;
        displayInitBanner(effectiveBannerType);
    }

    /**
     * Log with SVG background image
     */
    logWithSVG(message: string, svgContent?: string, options: StyleOptions = {}): void {
        const { width = 300, height = 60, padding = '30px 150px' } = options;
        
        let svgDataUri = '';
        if (svgContent) {
            const encodedSVG = encodeURIComponent(svgContent);
            svgDataUri = `data:image/svg+xml,${encodedSVG}`;
        } else {
            const defaultSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='100%' style='stop-color:%23764ba2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)' rx='4'/><text x='${width/2}' y='${height/2 + 5}' text-anchor='middle' fill='white' font-family='monospace' font-size='14' font-weight='bold'>${message}</text></svg>`;
            svgDataUri = `data:image/svg+xml,${encodeURIComponent(defaultSVG)}`;
        }

        const svgStyle = new StyleBuilder()
            .bg(`url("${svgDataUri}") no-repeat center center`)
            .padding(padding)
            .color('transparent')
            .rounded('4px')
            .build();

        console.log(`%c${message}`, svgStyle);
    }

    /**
     * Log with animated background gradient
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
            `;
            document.head.appendChild(style);
        }

        const animatedStyle = new StyleBuilder()
            .bg('linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)')
            .css('background-size', '400% 400%')
            .color('#ffffff')
            .padding('12px 20px')
            .rounded('8px')
            .bold()
            .font('Monaco, Consolas, monospace')
            .animation(`loggerGradient ${duration}s ease infinite`)
            .display('inline-block')
            .build();

        console.log(`%c${message}`, animatedStyle);
    }

    /**
     * Groups logs by a specific property using modern Object.groupBy (when available)
     */
    logGrouped<T>(items: T[], groupBy: (item: T) => string): void {
        try {
            // Use Object.groupBy if available (ES2024), otherwise fallback to reduce
            let grouped: Record<string, T[]>;
            
            if ((Object as any).groupBy) {
                grouped = (Object as any).groupBy(items, groupBy);
            } else {
                grouped = items.reduce((acc, item) => {
                    const key = groupBy(item);
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(item);
                    return acc;
                }, {} as Record<string, T[]>);
            }

            Object.entries(grouped).forEach(([group, groupItems]) => {
                this.group(`Group: ${group}`);
                this.table(groupItems);
                this.groupEnd();
            });
        } catch {
            this.info('Grouped data:', items);
        }
    }

    // ===== CLI SYSTEM =====

    /**
     * CLI command processor for logger configuration and export
     */
    async cli(command: string): Promise<void> {
        if (!this.cliProcessor) {
            this.error('CLI processor not initialized');
            return;
        }

        await this.cliProcessor.processCommand(command, this);
    }
}

// Create and export the singleton instance
const defaultLogger = new Logger({
    verbosity: 'info',
    enableColors: true,
    enableTimestamps: true,
    enableStackTrace: true,
    bufferSize: 1000, // Enable export functionality by default
});

// Display initialization banner
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
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) => 
    defaultLogger.logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) => 
    defaultLogger.logAnimated(message, duration);
export const cli = (command: string) => defaultLogger.cli(command);

// Re-export handlers and utilities for backward compatibility
export { FileLogHandler, RemoteLogHandler, AnalyticsLogHandler, ExportLogHandler } from './handlers/index.js';
export { StyleBuilder, StylePresets as Styles } from './styling/index.js';// Test change to trigger workflow
