/**
 * @fileoverview Header renderer for CLI primitives
 */

import { ANSI } from '../terminal/color-converter.js';

/**
 * Renderiza un header de sección: `title` en bold seguido opcionalmente de
 * `subtitle` en dim (ANSI `2`), ideal para marcar bloques en output de CLI.
 * No usa colores de foreground — sólo atributos de texto, así que el renderer
 * es seguro para cualquier terminal sin importar la paleta del theme activo.
 *
 * @param title - Texto principal del header (siempre en bold).
 * @param subtitle - Texto secundario a la derecha del título; se renderiza
 *   dimmed y separado por un espacio. Omitir si no aplica.
 * @returns String de una línea con formato `  <bold>title</bold> <dim>subtitle</dim>`.
 *
 * @example
 * ```ts
 * process.stdout.write(renderHeader('Deploy', 'production · us-east-1') + '\n');
 * //   **Deploy** production · us-east-1   (con atributos ANSI aplicados)
 * ```
 *
 * @example
 * ```ts
 * // Header sin subtítulo
 * process.stdout.write(renderHeader('Build summary') + '\n');
 * ```
 */
export function renderHeader(title: string, subtitle?: string): string {
    const t = ANSI.bold + title + ANSI.reset;
    const s = subtitle ? ANSI.dim + ` ${subtitle}` + ANSI.reset : '';
    return `  ${t}${s}`;
}
