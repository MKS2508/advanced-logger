/**
 * @fileoverview Server/JSON fallback para CLI primitives en entornos non-TTY.
 *
 * Cuando el logger corre con `outputMode: 'json'` o fuera de una TTY real
 * (CI logs, pipes, redirecciones), los primitives visuales — `step`,
 * `header`, `box`, `cliTable` — no tienen sentido como arte ASCII.
 * {@link ServerFallback} los degrada a llamadas `logger.info` / no-ops
 * conservando el contenido semántico, para que el log siga siendo parseable
 * línea por línea en aggregators centralizados.
 *
 * La factoría vive en `TerminalBridge.getServerFallback()` (lazy-singleton);
 * los consumers no construyen esta clase directamente.
 */

import type { IBoxOptions, ITableOptions } from '../types/core.js';
import type { Logger } from '../Logger.js';

/**
 * Degradación de CLI primitives para modo server/non-TTY.
 *
 * Cada método espeja uno del {@link TerminalBridge} (`step`/`header`/`box`/...)
 * y decide cómo renderizarlo sin depender de caracteres de caja ni control
 * ANSI: texto plano al logger, o no-op cuando no hay nada útil que emitir.
 *
 * @example
 * ```ts
 * // En CI (sin TTY), TerminalBridge enruta automáticamente aquí:
 * logger.step(2, 5, 'Compilando');      // logger.info('[2/5] Compilando')
 * logger.header('Build', 'v1.2.3');     // logger.info('Build v1.2.3')
 * logger.divider();                     // (no-op)
 * ```
 *
 * @see {@link TerminalBridge} para el dispatcher TTY-vs-server.
 */
export class ServerFallback {
    private logger: Logger;

    /**
     * @param {Logger} logger - Logger sobre el que se emiten los mensajes
     *   degradados. Respeta el `outputMode` que tenga configurado (json,
     *   console, ...), por lo que funciona tanto para logs estructurados
     *   como para texto plano.
     */
    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Emite un step como `logger.info` con el contador `[current/total]`
     * prefijado al mensaje. Conserva el orden y el progreso sin depender
     * de caracteres de caja.
     *
     * @param {number} current - Índice del step actual (1-based).
     * @param {number} total - Total de steps del run.
     * @param {string} msg - Descripción del step.
     * @returns {void}
     */
    step(current: number, total: number, msg: string): void {
        this.logger.info(`[${current}/${total}] ${msg}`);
    }

    /**
     * Emite el título (y subtítulo opcional) como `logger.info`. No pinta
     * bordes ni separadores — en modo server solo interesa el texto.
     *
     * @param {string} title - Texto principal del header.
     * @param {string} [subtitle] - Subtítulo optativo; se concatena con
     *   espacio si viene.
     * @returns {void}
     */
    header(title: string, subtitle?: string): void {
        const text = subtitle ? `${title} ${subtitle}` : title;
        this.logger.info(text);
    }

    /**
     * No-op: un divisor visual (`───`) no aporta nada a un log server/JSON
     * y solo ensuciaría el stream.
     *
     * @returns {void}
     */
    divider(): void {
        // No-op in server/JSON mode
    }

    /**
     * No-op: las líneas en blanco rompen la consistencia de un log JSON
     * (cada línea debería ser un registro parseable).
     *
     * @returns {void}
     */
    blank(): void {
        // No-op in server/JSON mode
    }

    /**
     * Emite el contenido del box como `logger.info`, ignorando bordes y
     * opciones de estilo (`title`, `borderColor`, ...). En modo server lo
     * que importa es el payload, no el embalaje.
     *
     * @param {string} content - Texto a registrar.
     * @param {IBoxOptions} [_options] - Opciones de box de la API TTY;
     *   ignoradas en este fallback.
     * @returns {void}
     */
    box(content: string, _options?: IBoxOptions): void {
        this.logger.info(content);
    }

    /**
     * Emite cada fila de la tabla como un `logger.info` con la fila
     * serializada a JSON, en lugar de pintar una grilla ASCII.
     *
     * Cada fila queda como su propio registro JSON — útil para filtrar por
     * columna en tools como `jq` o Loki. Las opciones de columnas/headers
     * (`ITableOptions.columns` / `ITableOptions.head`) se ignoran: en modo
     * server los keys del objeto son la fuente de verdad.
     *
     * @param {Record<string, unknown>[]} rows - Filas a emitir.
     * @param {ITableOptions} [_options] - Opciones de tabla de la API TTY;
     *   ignoradas en este fallback.
     * @returns {void}
     *
     * @example
     * ```ts
     * serverFallback.cliTable([
     *   { user: 'alice', age: 30 },
     *   { user: 'bob',   age: 25 }
     * ]);
     * // logger.info('{"user":"alice","age":30}')
     * // logger.info('{"user":"bob","age":25}')
     * ```
     */
    cliTable(rows: Record<string, unknown>[], _options?: ITableOptions): void {
        for (const row of rows) {
            this.logger.info(JSON.stringify(row));
        }
    }
}
