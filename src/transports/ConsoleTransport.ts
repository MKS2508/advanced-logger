import type { TransportRecord, TransportOptions, ITransport, LogLevel } from '../types/index.js';

/**
 * Transport por defecto que escribe cada {@link TransportRecord} al `console`
 * global del runtime (navegador o Node.js).
 *
 * Es el transport que el Logger registra automáticamente cuando no se configura
 * ninguno explícito, garantizando que los registros siempre lleguen a un
 * destino visible sin configuración adicional.
 *
 * **Mapeo level → console method**: traduce cada nivel de log al método más
 * cercano de la API `console`, de forma que el filtrado nativo del DevTools /
 * `NODE_DEBUG` siga funcionando:
 *
 * | LogLevel     | console method |
 * |--------------|----------------|
 * | `debug`      | `console.log`  |
 * | `info`       | `console.info` |
 * | `warn`       | `console.warn` |
 * | `error`      | `console.error`|
 * | `critical`   | `console.error`|
 *
 * **Formato de output**: cada línea se compone como
 * `[LEVEL] [prefix] message (file:line)`, donde `prefix` y la localización
 * se omiten si el registro no las trae.
 *
 * @example
 * // Uso directo como ITransport
 * import { ConsoleTransport } from '@mks2508/better-logger/transports';
 * const transport = new ConsoleTransport();
 * transport.write({
 *   level: 'info',
 *   msg: 'Arrancando worker',
 *   prefix: 'worker',
 *   // ... resto del TransportRecord
 * });
 * // → console.info("[INFO] [worker] Arrancando worker (worker.ts:12)")
 *
 * @example
 * // Registro a través del Logger (típico — el logger lo añade por defecto)
 * logger.addTransport({ target: new ConsoleTransport() });
 *
 * @see {@link ITransport}
 * @see {@link TransportRecord}
 */
export class ConsoleTransport implements ITransport {
    /** Identificador del transport usado por el Logger para deduplicar y exponer metadatos. */
    readonly name = 'console';

    /**
     * Crea una instancia de {@link ConsoleTransport}.
     *
     * El parámetro `options` se acepta para cumplir con la firma canónica de
     * {@link TransportOptions} (filtros de nivel, formateadores, etc.), aunque
     * la implementación actual escribe el registro tal cual llega sin
     * transformaciones adicionales.
     *
     * @param {TransportOptions} [options] - Configuración opcional del transport
     * (nivel mínimo, formatter, etc.).
     *
     * @example
     * const transport = new ConsoleTransport({ level: 'warn' });
     */
    constructor(private options?: TransportOptions) {}

    /**
     * Escribe un {@link TransportRecord} al `console` global.
     *
     * Selecciona el método de console según el nivel del registro, compone el
     * prefijo `[LEVEL] [prefix]` y, si la localización está disponible, añade
     * el sufijo `(file:line)`. No lanza ni retorna errores: si `console[method]`
     * fallara (raro), la excepción propagaría al caller.
     *
     * @param {TransportRecord} record - Registro normalizado producido por el Logger.
     * @returns {void}
     *
     * @example
     * transport.write({
     *   level: 'error',
     *   msg: 'DB connection lost',
     *   prefix: 'db',
     *   location: { file: 'pool.ts', line: 87, function: 'acquire' },
     *   // ... resto del TransportRecord
     * });
     * // → console.error("[ERROR] [db] DB connection lost (pool.ts:87)")
     */
    write(record: TransportRecord): void {
        const method = this.getConsoleMethod(record.level);
        const prefix = record.prefix ? `[${record.prefix}] ` : '';
        const location = record.location
            ? ` (${record.location.file}:${record.location.line})`
            : '';

        console[method](`[${record.level.toUpperCase()}]${prefix} ${record.msg}${location}`);
    }

    /**
     * Resuelve el método de `console` apropiado para un {@link LogLevel}.
     *
     * Tabla de mapeo:
     * - `debug`    → `log`    (sin ruido en DevTools por defecto)
     * - `info`     → `info`
     * - `warn`     → `warn`
     * - `error`    → `error`
     * - `critical` → `error`  (no existe `console.critical`)
     * - cualquier otro → `log` (fallback seguro)
     *
     * @internal Método privado; no forma parte de la API pública del transport.
     *
     * @param {LogLevel} level - Nivel del registro a traducir.
     * @returns {'log' | 'info' | 'warn' | 'error'} Nombre del método de `console`.
     */
    private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
        switch (level) {
            case 'debug': return 'log';
            case 'info': return 'info';
            case 'warn': return 'warn';
            case 'error':
            case 'critical': return 'error';
            default: return 'log';
        }
    }
}
