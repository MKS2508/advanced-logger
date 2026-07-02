/**
 * @fileoverview Better Logger — default entry point.
 *
 * Re-exports `Logger`, the scoped loggers, subpath-style bridges, and
 * cross-runtime styling/utility helpers. Side-effect free at import.
 */

// Main Logger class with all features
import { Logger } from './Logger.js';
import type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    StyleOptions,
    ILogHandler,
    CLILogLevel,
    IBoxOptions,
    ITableOptions,
} from './types/index.js';

// Lazy singleton - se inicializa solo cuando se necesita
let _logger: Logger | null = null;

function getLogger(): Logger {
    if (!_logger) {
        _logger = new Logger();
    }
    return _logger;
}

/**
 * Main `Logger` class — orchestrator for styling, transports, hooks,
 * serializers, MDC, and CLI primitives. Construct directly or use the
 * default singleton below.
 */
export { Logger };

/**
 * Default Logger singleton (lazy). Use this for the common case.
 */
export default getLogger();

/**
 * Top-level log methods bound to the default singleton.
 */
export const debug = (...args: unknown[]) => getLogger().debug(...args);
export const info = (...args: unknown[]) => getLogger().info(...args);
export const warn = (...args: unknown[]) => getLogger().warn(...args);
export const error = (...args: unknown[]) => getLogger().error(...args);
export const success = (...args: unknown[]) => getLogger().success(...args);
export const critical = (...args: unknown[]) => getLogger().critical(...args);
export const trace = (...args: unknown[]) => getLogger().trace(...args);
export const table = (data: unknown, columns?: string[]) => getLogger().table(data, columns);
export const group = (label: string, collapsed?: boolean) => getLogger().group(label, collapsed);
export const groupEnd = () => getLogger().groupEnd();
export const time = (label: string) => getLogger().time(label);
export const timeEnd = (label: string) => getLogger().timeEnd(label);
export const setGlobalPrefix = (prefix: string) => getLogger().setGlobalPrefix(prefix);
export const scope = (name: string) => getLogger().scope(name);
export const component = (name: string) => getLogger().component(name);
export const api = (name: string) => getLogger().api(name);
export const badges = (badgeList: string[]) => getLogger().badges(badgeList);
export const badge = (badgeName: string) => getLogger().badge(badgeName);
export const clearBadges = () => getLogger().clearBadges();
export const setVerbosity = (level: Verbosity) => getLogger().setVerbosity(level);
export const addHandler = (handler: ILogHandler) => getLogger().addHandler(handler);
export const setTheme = (theme: ThemeVariant) => getLogger().setTheme(theme);
export const setBannerType = (bannerType: BannerType) => getLogger().setBannerType(bannerType);
export const showBanner = (bannerType?: BannerType) => getLogger().showBanner(bannerType);
export const logWithSVG = (message: string, svgContent?: string, options?: StyleOptions) =>
    getLogger().logWithSVG(message, svgContent, options);
export const logAnimated = (message: string, duration?: number) =>
    getLogger().logAnimated(message, duration);
export const cli = (command: string) => getLogger().cli(command);

// Type exports
export type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    StyleOptions,
    ILogHandler,
    LoggerConfig,
    LogMetadata,
    StackInfo,
    TimerEntry,
    TimerResult,
    OutputFormat,
    IScopedLogger,
    IAPILogger,
    IComponentLogger,
    Bindings,
    SerializerFn,
    SerializerContext,
    SerializerConfig,
    ISerializerRegistry,
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    IHookManager,
    TransportRecord,
    TransportOptions,
    TransportTarget,
    ITransport,
    TimestampFormat,
    ColumnAlign,
    ColumnConfig,
    LogOptions,
    CLILogLevel,
    ISpinnerHandle,
    IBoxOptions,
    ITableOptions,
} from './types/index.js';

// Styling utilities
export {
    StyleBuilder,
    StylePresets,
    THEME_PRESETS,
    THEME_BANNERS,
    BANNER_VARIANTS
} from './styling/index.js';

// Enterprise features — convenience wrappers bound to the singleton.
import type { SerializerFn, HookEvent, HookCallback, MiddlewareFn, TransportTarget } from './types/index.js';
export const addSerializer = <T>(
    type: new (...args: unknown[]) => T,
    serializer: SerializerFn<T>,
    priority?: number
) => getLogger().addSerializer(type, serializer, priority);
export const removeSerializer = <T>(type: new (...args: unknown[]) => T) =>
    getLogger().removeSerializer(type);
export const on = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getLogger().on(event, callback, priority);
export const once = (event: HookEvent, callback: HookCallback, priority?: number) =>
    getLogger().once(event, callback, priority);
export const off = (event: HookEvent, callback: HookCallback) =>
    getLogger().off(event, callback);
export const use = (middleware: MiddlewareFn, priority?: number) =>
    getLogger().use(middleware, priority);
export const addTransport = (target: TransportTarget) =>
    getLogger().addTransport(target);
export const removeTransport = (id: string) =>
    getLogger().removeTransport(id);
export const flushTransports = () =>
    getLogger().flushTransports();
export const closeTransports = () =>
    getLogger().closeTransports();

// Scoped loggers
export {
    ScopedLogger,
    APILogger,
    ComponentLogger,
    ContextLogger
} from './ScopedLogger.js';

// Constants
export { DEFAULT_CONFIG } from './constants.js';

// Utility exports
export {
    parseStackTrace,
    formatTimestamp,
    getConsoleMethod,
    createLogEntry,
    formatTablePlain,
    safeSerialize
} from './utils/index.js';

// ANSI color utilities
export {
    ansiStyle,
    ansiColor,
    ansiBackground,
    ansiBold,
    ansiDim,
    ansiUnderline,
    formatLogLevelANSI,
    formatSuccessANSI
} from './utils/ansi-colors.js';

// Environment detection
export {
    getEnvironment,
    isRunningInTerminal,
    supportsANSI,
    getColorCapability,
    getTerminalWidth,
    getTerminalHeight,
    getEnvironmentInfo,
} from './utils/environment-detector.js';

export type { Environment } from './utils/environment-detector.js';
