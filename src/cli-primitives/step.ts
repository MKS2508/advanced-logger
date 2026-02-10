/**
 * @fileoverview Step progress renderer for CLI primitives
 * @since 5.0.0
 */

import { getANSIForeground, ANSI, type ColorCapability } from '../terminal/color-converter.js';

/**
 * Renders a step progress indicator like `  [2/5] Analyzing repository...`
 * @param current - Current step number
 * @param total - Total number of steps
 * @param msg - Step description message
 * @param colorCap - Terminal color capability
 * @returns Formatted step string
 */
export function renderStep(current: number, total: number, msg: string, colorCap: ColorCapability): string {
    const label = `[${current}/${total}]`;
    const colored = colorCap !== 'none'
        ? getANSIForeground('#00bcd4', colorCap) + ANSI.bold + label + ANSI.reset
        : label;
    return `  ${colored} ${msg}`;
}
