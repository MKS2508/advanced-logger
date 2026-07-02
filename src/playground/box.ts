/**
 * @fileoverview Box renderer for CLI primitives
 * @since 5.0.0
 */

import type { IBoxOptions } from '../types/core.js';
import type { ColorCapability } from '../terminal/color-converter.js';
import { getANSIForeground, ANSI } from '../terminal/color-converter.js';
import { getTerminalWidth } from '../utils/environment-detector.js';
import { stripAnsi, getVisibleLength } from '../terminal/formatter.js';

/**
 * Border character sets for different styles
 */
const BORDER_CHARS = {
    single:  { tl: '\u250c', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' },
    rounded: { tl: '\u256d', tr: '\u256e', bl: '\u2570', br: '\u256f', h: '\u2500', v: '\u2502' },
    double:  { tl: '\u2554', tr: '\u2557', bl: '\u255a', br: '\u255d', h: '\u2550', v: '\u2551' },
    bold:    { tl: '\u250f', tr: '\u2513', bl: '\u2517', br: '\u251b', h: '\u2501', v: '\u2503' },
} as const;

/**
 * Renders content inside a bordered box
 * @param content - Content string (may contain newlines)
 * @param options - Box rendering options
 * @param colorCap - Terminal color capability
 * @returns Formatted box string with border
 */
export function renderBox(content: string, options: IBoxOptions = {}, colorCap: ColorCapability = 'full'): string {
    const {
        title,
        borderColor,
        borderStyle = 'rounded',
        padding = 0,
    } = options;

    const chars = BORDER_CHARS[borderStyle] ?? BORDER_CHARS.rounded;
    const lines = content.split('\n');
    const maxTermWidth = Math.min(getTerminalWidth() - 4, 80);

    // Calculate content width from visible text
    const contentWidths = lines.map(l => getVisibleLength(l));
    const titleWidth = title ? stripAnsi(title).length + 2 : 0; // +2 for spaces around title
    const maxContentWidth = Math.max(...contentWidths, titleWidth);
    const innerWidth = Math.min(maxContentWidth + 2, maxTermWidth); // +2 for horizontal padding

    // Color wrapper for border chars
    const bc = borderColor && colorCap !== 'none'
        ? getANSIForeground(borderColor, colorCap)
        : '';
    const reset = bc ? ANSI.reset : '';

    const wrap = (char: string) => `${bc}${char}${reset}`;

    // Build top border (with optional title)
    let topBorder: string;
    if (title) {
        const titleStr = ` ${title} `;
        const afterTitle = innerWidth - stripAnsi(titleStr).length;
        topBorder = `  ${wrap(chars.tl)}${wrap(chars.h)}${wrap(titleStr)}${wrap(chars.h.repeat(Math.max(0, afterTitle - 1)))}${wrap(chars.tr)}`;
    } else {
        topBorder = `  ${wrap(chars.tl)}${wrap(chars.h.repeat(innerWidth))}${wrap(chars.tr)}`;
    }

    // Build bottom border
    const bottomBorder = `  ${wrap(chars.bl)}${wrap(chars.h.repeat(innerWidth))}${wrap(chars.br)}`;

    // Build padding lines
    const emptyLine = `  ${wrap(chars.v)}${' '.repeat(innerWidth)}${wrap(chars.v)}`;
    const paddingLines = padding > 0 ? Array(padding).fill(emptyLine) : [];

    // Build content lines
    const contentLines = lines.map(line => {
        const visible = getVisibleLength(line);
        const pad = innerWidth - visible - 1; // -1 for left space
        return `  ${wrap(chars.v)} ${line}${' '.repeat(Math.max(0, pad))}${wrap(chars.v)}`;
    });

    return [
        topBorder,
        ...paddingLines,
        ...contentLines,
        ...paddingLines,
        bottomBorder,
    ].join('\n');
}
