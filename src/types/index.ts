/**
 * @fileoverview Type definitions exports for Advanced Logger
 */

// Core types
export type {
    LogLevel,
    Verbosity,
    ThemeVariant,
    BannerType,
    ExportFormat,
    LoggerConfig,
    StackInfo,
    TimerEntry,
    StyleOptions,
} from './core.js';

export { LOG_LEVELS } from './core.js';

// Handler types
export type {
    LogMetadata,
    ILogHandler,
    LogEntry,
    ExportFilters,
    ExportOptions,
    ExportResult,
    BufferStats,
} from './handlers.js';