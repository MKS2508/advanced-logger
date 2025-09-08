/**
 * @fileoverview Types for OpenTUI logger integration
 */

import type { LogLevel } from '@mks2508/better-logger-core';

/**
 * Enhanced log entry with OpenTUI capabilities
 */
export interface OpenTUILogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    args?: any[];
    prefix?: string;
    stackInfo?: {
        file: string;
        line: number;
        column: number;
        function?: string;
    };
    metadata?: Record<string, any>;
}

/**
 * Animation types for log entries
 */
export type LogAnimation = 'none' | 'slideIn' | 'fadeIn' | 'shake' | 'pulse' | 'bounce';

/**
 * Log component styling options
 */
export interface LogComponentStyle {
    backgroundColor?: string;
    color?: string;
    border?: string;
    padding?: number;
    margin?: number;
    animation?: LogAnimation;
    duration?: number;
    delay?: number;
}

/**
 * Interactive log configuration
 */
export interface InteractiveLogConfig {
    clickable?: boolean;
    expandable?: boolean;
    selectable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
}

/**
 * Log dashboard configuration
 */
export interface LogDashboardConfig {
    title?: string;
    maxLogs?: number;
    autoScroll?: boolean;
    showStats?: boolean;
    showFilters?: boolean;
    refreshInterval?: number;
    layout?: 'vertical' | 'horizontal' | 'grid';
}

/**
 * Progress log entry
 */
export interface ProgressLogEntry extends OpenTUILogEntry {
    progress?: {
        current: number;
        total: number;
        unit?: string;
        showPercentage?: boolean;
        showBar?: boolean;
    };
}

/**
 * Table log entry
 */
export interface TableLogEntry extends OpenTUILogEntry {
    table?: {
        data: Record<string, any>[];
        columns?: string[];
        title?: string;
        maxRows?: number;
    };
}

/**
 * Log statistics
 */
export interface LogStatistics {
    total: number;
    byLevel: Record<LogLevel, number>;
    errors: number;
    warnings: number;
    recent: number; // Last hour
    rate: number; // Logs per second
}

/**
 * Filter options for logs
 */
export interface LogFilter {
    levels?: LogLevel[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    search?: string;
    prefix?: string;
    includeStackTrace?: boolean;
}

/**
 * OpenTUI renderer options
 */
export interface OpenTUIRendererOptions {
    interactive?: boolean;
    animated?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    dashboard?: boolean;
    maxHistory?: number;
    components?: {
        badges?: boolean;
        progressBars?: boolean;
        tables?: boolean;
        charts?: boolean;
    };
}

/**
 * Log level styling configuration
 */
export interface LogLevelStyling {
    [K in LogLevel]: {
        color: string;
        backgroundColor?: string;
        icon?: string;
        animation?: LogAnimation;
    };
}

/**
 * OpenTUI log handler configuration
 */
export interface OpenTUILogHandlerConfig {
    renderer?: OpenTUIRendererOptions;
    interactive?: InteractiveLogConfig;
    dashboard?: LogDashboardConfig;
    styling?: LogLevelStyling;
    filters?: LogFilter;
}