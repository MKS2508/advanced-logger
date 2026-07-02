/**
 * @fileoverview Timestamp utilities for Advanced Logger
 */

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