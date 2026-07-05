/**
 * @fileoverview Box renderer for CLI primitives
 */

import type { IBoxOptions } from '../types/core.js';
import type { ColorCapability } from '../terminal/color-converter.js';
import { getANSIForeground, ANSI } from '../terminal/color-converter.js';
import { getTerminalWidth } from '../utils/environment-detector.js';
import { stripAnsi, getVisibleLength } from '../terminal/formatter.js';

/**
 * Mapa de juegos de caracteres Unicode para los 4 estilos de borde soportados
 * por {@link renderBox}. Cada entrada expone las 4 esquinas (`tl`, `tr`, `bl`,
 * `br`), el caracter horizontal (`h`) y el vertical (`v`) que componen el marco.
 *
 * - `single`: l\u00edneas finas (U+2500 / U+2502).
 * - `rounded`: igual que `single` con esquinas redondeadas.
 * - `double`: l\u00edneas dobles (U+2550 / U+2551), alto contraste visual.
 * - `bold`: l\u00edneas gruesas (U+2501 / U+2503), para destacar bloques cr\u00edticos.
 *
 * @internal Lookup interno del renderer; no es API p\u00fablica.
 */
const BORDER_CHARS = {
    single:  { tl: '\u250c', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' },
    rounded: { tl: '\u256d', tr: '\u256e', bl: '\u2570', br: '\u256f', h: '\u2500', v: '\u2502' },
    double:  { tl: '\u2554', tr: '\u2557', bl: '\u255a', br: '\u255d', h: '\u2550', v: '\u2551' },
    bold:    { tl: '\u250f', tr: '\u2513', bl: '\u2517', br: '\u251b', h: '\u2501', v: '\u2503' },
} as const;

/**
 * Renderiza `content` envuelto en un box con borde Unicode, respetando el
 * ancho del terminal. El ancho interno se calcula a partir de la l\u00ednea m\u00e1s
 * larga (o del {@link IBoxOptions.title} si es m\u00e1s ancho) y se acota a
 * `min(terminalWidth - 4, 80)` columnas para no romper layouts estrechos.
 *
 * El padding se aplica como l\u00edneas vac\u00edas sim\u00e9tricas arriba/abajo del
 * contenido. Si `borderColor` se omite o `colorCap` es `'none'`, el borde se
 * emite sin secuencias ANSI (output plain-text seguro para logs y pipes).
 *
 * @param content - Texto a envolver; puede contener m\u00faltiples l\u00edneas (`\n`) y
 *   secuencias ANSI embebidas \u2014 el c\u00e1lculo de ancho usa el largo visible.
 * @param options - Configuraci\u00f3n del box (title, borderColor, borderStyle,
 *   padding). Ver {@link IBoxOptions}.
 * @param colorCap - Capacidad de color del terminal destino. Si es `'none'`,
 *   se omite cualquier secuencia ANSI.
 * @returns String multilinea con el box ya construido (sin trailing newline).
 *
 * @example
 * ```ts
 * // Box b\u00e1sico con borde redondeado (default)
 * process.stdout.write(renderBox('Deploy completado') + '\n');
 * ```
 *
 * @example
 * ```ts
 * // Box con t\u00edtulo embebido en el borde superior y color custom
 * process.stdout.write(renderBox('Service: auth-svc\nStatus: healthy', {
 *   title: 'Health Check',
 *   borderColor: '#00bcd4',
 *   borderStyle: 'double',
 *   padding: 1
 * }) + '\n');
 * ```
 *
 * @see {@link IBoxOptions} para el detalle de cada opci\u00f3n.
 * @see {@link getTerminalWidth} para la detecci\u00f3n de ancho.
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
