/**
 * @fileoverview Divider renderer for CLI primitives
 */

import { ANSI } from '../terminal/color-converter.js';
import { getTerminalWidth } from '../utils/environment-detector.js';

/**
 * Renderiza una línea divisoria horizontal dimmed (ANSI `2`) usando el
 * caracter `─`. Por defecto el ancho es `min(terminalWidth - 4, 60)` para
 * no ocupar todo el ancho de ventana y quedar visualmente alineado con otros
 * primitives (box, header, table) que dejan 2 espacios de indentación.
 *
 * @param width - Ancho explícito en columnas visibles. Si se omite, se calcula
 *   automáticamente a partir del ancho del terminal (capped a 60).
 * @returns String de una línea con `width` caracteres `─` envueltos en ANSI dim.
 *
 * @example
 * ```ts
 * // Divider automático (respeta el ancho del terminal)
 * process.stdout.write(renderDivider() + '\n');
 * ```
 *
 * @example
 * ```ts
 * // Divider de ancho fijo para alinear con otra salida
 * process.stdout.write(renderDivider(40) + '\n');
 * ```
 *
 * @see {@link getTerminalWidth} para la detección de ancho cuando `width` se omite.
 */
export function renderDivider(width?: number): string {
    const w = width ?? Math.min(getTerminalWidth() - 4, 60);
    return ANSI.dim + '  ' + '\u2500'.repeat(w) + ANSI.reset;
}
