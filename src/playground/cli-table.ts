/**
 * @fileoverview CLI table renderer for CLI primitives
 * @since 5.0.0
 */

import type { ITableOptions } from '../types/core.js';
import type { ColorCapability } from '../terminal/color-converter.js';
import { getANSIForeground, ANSI } from '../terminal/color-converter.js';
import { getVisibleLength, padToWidth } from '../terminal/formatter.js';

/**
 * Renders an array of objects as a formatted ASCII table
 * @param rows - Array of row objects
 * @param options - Table rendering options
 * @param colorCap - Terminal color capability
 * @returns Formatted table string
 */
export function renderTable(
    rows: Record<string, unknown>[],
    options: ITableOptions = {},
    colorCap: ColorCapability = 'full'
): string {
    if (rows.length === 0) return '';

    // Determine columns from options or first row's keys
    const columns = options.columns ?? Object.keys(rows[0]!);
    const headers = options.head ?? columns;

    // Calculate column widths (max of header and all values)
    const colWidths = columns.map((col, i) => {
        const headerLen = getVisibleLength(headers[i] ?? col);
        const maxValueLen = rows.reduce((max, row) => {
            const val = String(row[col] ?? '');
            return Math.max(max, getVisibleLength(val));
        }, 0);
        return Math.max(headerLen, maxValueLen) + 2; // +2 for padding
    });

    // Color helpers
    const cyan = colorCap !== 'none' ? getANSIForeground('#00bcd4', colorCap) : '';
    const dim = colorCap !== 'none' ? ANSI.dim : '';
    const reset = colorCap !== 'none' ? ANSI.reset : '';

    // Build header row
    const headerRow = '  ' + columns.map((col, i) => {
        const label = headers[i] ?? col;
        return cyan + ANSI.bold + padToWidth(` ${label}`, colWidths[i]!) + reset;
    }).join('');

    // Build separator
    const separator = '  ' + dim + colWidths.map(w => '\u2500'.repeat(w)).join('\u2500') + reset;

    // Build data rows
    const dataRows = rows.map(row => {
        return '  ' + columns.map((col, i) => {
            const val = String(row[col] ?? '');
            return padToWidth(` ${val}`, colWidths[i]!);
        }).join('');
    });

    return [headerRow, separator, ...dataRows].join('\n');
}
