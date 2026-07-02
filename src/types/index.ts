/**
 * @fileoverview Type definitions exports for Advanced Logger
 */

// Core types
export type {
    LogLevel,
    LogTag,
    Verbosity,
    ThemeVariant,
    DevToolsTheme,
    BannerType,
    ExportFormat,
    OutputFormat,
    LoggerConfig,
    StackInfo,
    TimerEntry,
    TimerResult,
    StyleOptions,
    AdaptiveColors,
    SpacingType,
    LogLayout,
    LogPartConfig,
    LogStyles,
    IScopedLogger,
    IAPILogger,
    IComponentLogger,
    Bindings,
    BadgeStyle,
    TimestampFormat,
    ColumnAlign,
    ColumnConfig,
    LogOptions,
    CLILogLevel,
    ISpinnerHandle,
    IBoxOptions,
    ITableOptions,
    ILogResourceRef,
} from './core.js';

export { LOG_LEVELS, SUCCESS_LEVEL } from './core.js';

// Handler types
export type {
    LogMetadata,
    ILogHandler,
    ExportLogHandler,
    LogEntry,
    ExportFilters,
    ExportOptions,
    ExportResult,
    BufferStats,
} from './handlers.js';

// Serializer types
export type {
    SerializerFn,
    SerializerContext,
    SerializerEntry,
    SerializerConfig,
    ISerializerRegistry,
} from './serializers.js';

// Hook types
export type {
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    HookRegistration,
    MiddlewareRegistration,
    IHookManager,
} from './hooks.js';

// Transport types
export type {
    TransportRecord,
    TransportOptions,
    TransportTarget,
    ITransport,
    IBufferedTransport,
    ITransportManager,
    ILogResource,
    ILogAttributes,
    LogAttributeValue,
} from './transports.js';

export {
    LOG_LEVEL_TO_SEVERITY_NUMBER,
    LOG_LEVEL_TO_SEVERITY_TEXT,
} from './transports.js';

// Style Cache types
export type { StyleCacheConfig } from '../styling/StyleCache.js';