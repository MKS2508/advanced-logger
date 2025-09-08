/**
 * @fileoverview Log Badge component with animations and styling
 */

import React from 'react';
import type { LogLevel } from '@mks2508/better-logger-core';
import type { LogComponentStyle } from '../types.js';

interface LogBadgeProps {
    level: LogLevel;
    animated?: boolean;
    style?: LogComponentStyle;
}

/**
 * Get default styling for log level
 */
function getDefaultLevelStyle(level: LogLevel): LogComponentStyle {
    const styles: Record<LogLevel, LogComponentStyle> = {
        debug: {
            backgroundColor: '#6c757d',
            color: '#ffffff',
            animation: 'none'
        },
        info: {
            backgroundColor: '#007bff',
            color: '#ffffff',
            animation: 'none'
        },
        warn: {
            backgroundColor: '#ffc107',
            color: '#000000',
            animation: 'pulse'
        },
        error: {
            backgroundColor: '#dc3545',
            color: '#ffffff', 
            animation: 'shake'
        },
        critical: {
            backgroundColor: '#8B0000',
            color: '#ffffff',
            animation: 'pulse',
            duration: 1000
        }
    };
    
    return styles[level];
}

/**
 * Get emoji icon for log level
 */
function getLevelIcon(level: LogLevel): string {
    const icons: Record<LogLevel, string> = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        critical: '🚨'
    };
    
    return icons[level];
}

/**
 * Log badge component with styling and animations
 */
export function LogBadge({ level, animated = true, style = {} }: LogBadgeProps) {
    const defaultStyle = getDefaultLevelStyle(level);
    const finalStyle = { ...defaultStyle, ...style };
    const icon = getLevelIcon(level);
    
    // Convert our style to OpenTUI box style
    const boxStyle = {
        backgroundColor: finalStyle.backgroundColor,
        color: finalStyle.color,
        padding: finalStyle.padding || 1,
        margin: finalStyle.margin || 0,
        border: finalStyle.border || 'none',
        ...(animated && finalStyle.animation !== 'none' && {
            animation: `${finalStyle.animation} ${finalStyle.duration || 500}ms ease-in-out`
        })
    };
    
    return (
        <box style={boxStyle}>
            <text bold fg={finalStyle.color}>
                {icon} {level.toUpperCase()}
            </text>
        </box>
    );
}

/**
 * Compact log badge (icon only)
 */
export function CompactLogBadge({ level, animated = true }: Omit<LogBadgeProps, 'style'>) {
    const style = getDefaultLevelStyle(level);
    const icon = getLevelIcon(level);
    
    return (
        <text 
            fg={style.color}
            style={{
                ...(animated && style.animation !== 'none' && {
                    animation: `${style.animation} ${style.duration || 500}ms ease-in-out`
                })
            }}
        >
            {icon}
        </text>
    );
}

/**
 * Inline log badge (for embedded use)
 */
export function InlineLogBadge({ level }: Pick<LogBadgeProps, 'level'>) {
    const style = getDefaultLevelStyle(level);
    const icon = getLevelIcon(level);
    
    return (
        <text 
            fg={style.color}
            bold
        >
            [{icon} {level.toUpperCase()}]
        </text>
    );
}