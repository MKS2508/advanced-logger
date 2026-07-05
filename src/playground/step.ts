/**
 * @fileoverview Step progress renderer for CLI primitives
 */

import { getANSIForeground, ANSI, type ColorCapability } from '../terminal/color-converter.js';

/**
 * Renderiza un indicador de progreso de step con el formato `  [n/total] msg`,
 * donde el `[n/total]` se emite en cian bold (respetando `colorCap`) para
 * destacarlo del mensaje descriptivo. Pensado para output secuencial de CLI
 * tipo "steps de un build", "fases de un deploy" o "tareas de un script".
 *
 * No hace ningún chequeo de rango sobre `current`/`total` — el caller es
 * responsable de pasar valores coherentes (se renderizan tal cual).
 *
 * @param current - Número de step actual (típicamente 1-based).
 * @param total - Total de steps del proceso.
 * @param msg - Descripción corta del step en curso.
 * @param colorCap - Capacidad de color del terminal destino. Si es `'none'`,
 *   el label `[n/total]` se emite sin color.
 * @returns String de una sola línea con formato `  [n/total] msg`.
 *
 * @example
 * ```ts
 * const steps = ['Resolving deps', 'Bundling', 'Writing dist'];
 * steps.forEach((step, i) => {
 *   process.stdout.write(renderStep(i + 1, steps.length, step, 'full') + '\n');
 * });
 * //   [1/3] Resolving deps
 * //   [2/3] Bundling
 * //   [3/3] Writing dist
 * ```
 */
export function renderStep(current: number, total: number, msg: string, colorCap: ColorCapability): string {
    const label = `[${current}/${total}]`;
    const colored = colorCap !== 'none'
        ? getANSIForeground('#00bcd4', colorCap) + ANSI.bold + label + ANSI.reset
        : label;
    return `  ${colored} ${msg}`;
}
