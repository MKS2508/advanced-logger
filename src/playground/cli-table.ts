/**
 * @fileoverview CLI table renderer for CLI primitives
 */

import type { ITableOptions } from '../types/core.js';
import type { ColorCapability } from '../terminal/color-converter.js';
import { getANSIForeground, ANSI } from '../terminal/color-converter.js';
import { getVisibleLength, padToWidth } from '../terminal/formatter.js';

/**
 * Renderiza un array de objetos como tabla ASCII alineada, con headers en
 * cian bold y separador (`─`) bajo la cabecera. Las columnas se autodetectan
 * a partir de las keys del primer row salvo que `options.columns` las imponga,
 * y los labels se toman de `options.head` (default: nombres de columna).
 *
 * El ancho de cada columna se calcula como `max(header, valor más largo) + 2`
 * para garantizar padding horizontal consistente. Si `colorCap` es `'none'`,
 * se omiten todas las secuencias ANSI (útil para logs plain-text o CI).
 *
 * @param rows - Array de row objects. Un array vacío devuelve string vacío.
 * @param options - Ver {@link ITableOptions} para `columns` y `head`.
 * @param colorCap - Capacidad de color del terminal destino.
 * @returns String multilinea con la tabla (header + separator + data rows),
 *   o `''` si `rows` está vacío.
 *
 * @example
 * ```ts
 * // Auto-detect columnas desde las keys del primer row
 * const rows = [
 *   { service: 'auth', status: 'healthy', latency: 12 },
 *   { service: 'api',  status: 'degraded', latency: 245 }
 * ];
 * process.stdout.write(renderTable(rows) + '\n');
 * // ┌─────────┬──────────┬─────────┐
 * // │ service │ status   │ latency │
 * // ─────────────────────────────────
 * // │ auth    │ healthy  │ 12      │
 * // │ api     │ degraded │ 245     │
 * ```
 *
 * @example
 * ```ts
 * // Forzar columnas y renombrar headers
 * process.stdout.write(renderTable(rows, {
 *   columns: ['service', 'latency'],
 *   head:    ['Service', 'Latency (ms)']
 * }, 'none') + '\n');
 * ```
 *
 * @see {@link ITableOptions} para las opciones disponibles.
 * @see {@link getVisibleLength} y {@link padToWidth} para el cálculo de ancho.
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
