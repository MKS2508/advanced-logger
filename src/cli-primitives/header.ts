/**
 * @fileoverview Header renderer for CLI primitives
 * @since 5.0.0
 */

import { ANSI } from '../terminal/color-converter.js';

/**
 * Renders a styled header with optional subtitle
 * @param title - Main title text
 * @param subtitle - Optional subtitle (rendered dimmed)
 * @returns Formatted header string
 */
export function renderHeader(title: string, subtitle?: string): string {
    const t = ANSI.bold + title + ANSI.reset;
    const s = subtitle ? ANSI.dim + ` ${subtitle}` + ANSI.reset : '';
    return `  ${t}${s}`;
}
