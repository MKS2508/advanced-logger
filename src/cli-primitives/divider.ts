/**
 * @fileoverview Divider renderer for CLI primitives
 * @since 5.0.0
 */

import { ANSI } from '../terminal/color-converter.js';
import { getTerminalWidth } from '../utils/environment-detector.js';

/**
 * Renders a horizontal divider line
 * @param width - Optional explicit width (defaults to terminal width capped at 60)
 * @returns Formatted divider string
 */
export function renderDivider(width?: number): string {
    const w = width ?? Math.min(getTerminalWidth() - 4, 60);
    return ANSI.dim + '  ' + '\u2500'.repeat(w) + ANSI.reset;
}
