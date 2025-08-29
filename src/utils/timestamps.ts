/**
 * @fileoverview Timestamp utilities for Advanced Logger
 */

import { TIME_UNITS } from '../constants.js';

/**
 * Formats the timestamp using modern Date API
 */
export function formatTimestamp(): string {
    try {
        // Use modern Temporal API if available, fallback to Date
        const now = new Date();
        return now.toISOString();
    } catch {
        return new Date().toISOString();
    }
}

/**
 * Parse relative time strings like "2h", "30m", "1d" into milliseconds
 */
export function parseRelativeTime(timeStr: string): number {
    const match = timeStr.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
        throw new Error(`Invalid time format: ${timeStr}. Use format like "2h", "30m", "1d"`);
    }

    const [, amount, unit] = match;
    const multiplier = TIME_UNITS[unit as keyof typeof TIME_UNITS];
    
    return parseInt(amount || '0', 10) * multiplier;
}

/**
 * Parse time input which can be Date, ISO string, or relative time
 */
export function parseTimeInput(input: Date | string | number): Date {
    if (input instanceof Date) {
        return input;
    }

    if (typeof input === 'number') {
        // Assume hours ago
        return new Date(Date.now() - input * TIME_UNITS.h);
    }

    if (typeof input === 'string') {
        // Try parsing as ISO date first
        const isoDate = new Date(input);
        if (!isNaN(isoDate.getTime())) {
            return isoDate;
        }

        // Try parsing as relative time
        try {
            const ms = parseRelativeTime(input);
            return new Date(Date.now() - ms);
        } catch {
            throw new Error(`Invalid time format: ${input}`);
        }
    }

    throw new Error(`Unsupported time input type: ${typeof input}`);
}

/**
 * Format timestamp for display in different contexts
 */
export function formatDisplayTime(date: Date, format: 'short' | 'full' | 'time-only' = 'short'): string {
    switch (format) {
        case 'time-only':
            return date.toTimeString().slice(0, 8); // HH:MM:SS
        case 'full':
            return date.toISOString();
        case 'short':
        default:
            return date.toISOString().slice(11, 23); // HH:MM:SS.mmm
    }
}