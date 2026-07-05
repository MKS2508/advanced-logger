/**
 * @fileoverview Built-in spinner implementation for CLI primitives.
 *
 * Expone dos implementaciones de {@link ISpinnerHandle}:
 *   - {@link SpinnerManager}: spinner braille animado para TTY interactiva.
 *   - {@link NoopSpinner}: fallback sin animaci\u00f3n para non-TTY / silent mode.
 *
 * La factor\u00eda que decide cu\u00e1l instanciar vive en `TerminalBridge.spinner()`;
 * los consumers rara vez construyen estas clases directamente.
 */

import type { ISpinnerHandle, LoggerConfig } from '../types/core.js';
import type { Logger } from '../Logger.js';
import { ANSI } from '../terminal/color-converter.js';

/**
 * Frames braille usados por la animaci\u00f3n del spinner. Cada frame es un
 * car\u00e1cter del bloque Unicode Braille Patterns (U+2800\u2013U+28FF) que da la
 * ilusi\u00f3n de rotaci\u00f3n al ciclarlos a ~12 FPS. Elegidos sobre caracteres
 * ASCII (`|/-\`) porque renderizan m\u00e1s suaves en terminales modernas.
 */
const SPINNER_FRAMES = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

/**
 * Intervalo entre frames del spinner en milisegundos. 80 ms \u2248 12.5 FPS:
 * suficientemente r\u00e1pido para sentirse responsivo sin consumir CPU
 * perceptiblemente en runs largos.
 */
const FRAME_INTERVAL = 80;

/**
 * Spinner interactivo para TTY: cicla frames braille reescribiendo la l\u00ednea
 * actual en su sitio (no emite l\u00edneas nuevas hasta el stop).
 *
 * Para no poluir stdout piped ni entrelazarse con el output normal del
 * {@link Logger}, hace dos cosas no obvias:
 *   1. Escribe SIEMPRE a `process.stderr` (carriage return + `\x1b[K` para
 *      limpiar la l\u00ednea antes de cada render).
 *   2. Con `start()` mutea el logger (`outputMode: 'silent'`) y lo restaura a
 *      `'console'` en cualquier m\u00e9todo de finalizaci\u00f3n (`stop`/`succeed`/`fail`).
 *      Sin esto, los logs del usuario se imprimir\u00edan encima del frame animado.
 *
 * No gestiona TTY detection \u2014 quien lo instancia (`TerminalBridge`) ya valid\u00f3
 * que hay TTY. Para non-TTY ver {@link NoopSpinner}.
 *
 * @implements {ISpinnerHandle}
 *
 * @example
 * ```ts
 * const spinner = new SpinnerManager('Compilando...', logger.config, logger);
 * spinner.start();
 * // ...trabajo as\u00edncrono...
 * spinner.succeed('Build OK');
 * // stderr: "  \u2713 Build OK"
 * ```
 *
 * @see {@link NoopSpinner} para el path non-TTY.
 * @see {@link ISpinnerHandle} para el contrato de la API p\u00fablica.
 */
export class SpinnerManager implements ISpinnerHandle {
    private message: string;
    private frameIndex = 0;
    private interval: ReturnType<typeof setInterval> | null = null;
    private _logger: Logger;

    /**
     * @param {string} message - Texto a mostrar al lado del frame animado.
     *   Mutables luego v\u00eda {@link SpinnerManager.text}.
     * @param {LoggerConfig} _config - Reservado para configuraci\u00f3n futura;
     *   actualmente no se lee dentro de la clase (lo conserva solo el caller).
     * @param {Logger} logger - Instancia del logger due\u00f1a del spinner. Se
     *   mutea/restaura con `updateConfig({ outputMode })` en start/stop.
     */
    constructor(message: string, _config: LoggerConfig, logger: Logger) {
        this.message = message;
        this._logger = logger;
    }

    /**
     * Arranca la animaci\u00f3n. Idempotente: si ya est\u00e1 corriendo, no hace nada.
     *
     * Como efecto lateral mutea el logger pasado al constructor cambiando su
     * `outputMode` a `'silent'` \u2014 cualquier log durante la animaci\u00f3n quedar\u00eda
     * bufferizado y se descarta al restaurar el modo. Llama siempre a
     * {@link stop}, {@link succeed} o {@link fail} para restaurar el output.
     *
     * @returns {void}
     */
    start(): void {
        if (this.interval) return; // Already running

        // Switch logger to buffer mode to prevent garbled output
        this._logger.updateConfig({ outputMode: 'silent' });

        this.frameIndex = 0;
        this.render();
        this.interval = setInterval(() => {
            this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
            this.render();
        }, FRAME_INTERVAL);
    }

    /**
     * Detiene la animaci\u00f3n y limpia la l\u00ednea, sin emitir mensaje de estado.
     * Restaura el `outputMode` del logger a `'console'`.
     *
     * \u00datil cuando el caller ya emiti\u00f3 su propio output final y solo necesita
     * desmontar el spinner. Para terminaci\u00f3n con tick/cross usa
     * {@link succeed} / {@link fail}.
     *
     * @returns {void}
     */
    stop(): void {
        this.clearInterval();
        this.clearLine();
        // Restore logger output
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /**
     * Detiene la animaci\u00f3n y emite el mensaje con un check verde (`\u2713`).
     * Restaura el `outputMode` del logger a `'console'`.
     *
     * @param {string} [msg] - Texto final a mostrar. Si se omite, reutiliza
     *   el `message` con el que se construy\u00f3 el spinner (o el \u00faltimo seteado
     *   v\u00eda {@link text}).
     * @returns {void}
     *
     * @example
     * ```ts
     * spinner.succeed();           // \u2192 "  \u2713 <message inicial>"
     * spinner.succeed('Hecho');    // \u2192 "  \u2713 Hecho"
     * ```
     */
    succeed(msg?: string): void {
        this.clearInterval();
        this.clearLine();
        const text = msg ?? this.message;
        process.stderr.write(`  ${ANSI.fg.green}\u2713${ANSI.reset} ${text}\n`);
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /**
     * Detiene la animaci\u00f3n y emite el mensaje con una cruz roja (`\u2717`).
     * Restaura el `outputMode` del logger a `'console'`.
     *
     * @param {string} [msg] - Texto final a mostrar. Si se omite, reutiliza
     *   el `message` con el que se construy\u00f3 el spinner (o el \u00faltimo seteado
     *   v\u00eda {@link text}).
     * @returns {void}
     *
     * @example
     * ```ts
     * try {
     *   await build();
     *   spinner.succeed('Build OK');
     * } catch (e) {
     *   spinner.fail(`Build fallido: ${e.message}`);
     * }
     * ```
     */
    fail(msg?: string): void {
        this.clearInterval();
        this.clearLine();
        const text = msg ?? this.message;
        process.stderr.write(`  ${ANSI.fg.red}\u2717${ANSI.reset} ${text}\n`);
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /**
     * Reemplaza el texto mostrado al lado del frame sin reiniciar la animaci\u00f3n
     * ni perder el frame actual. Pensado para actualizar progreso in-place
     * (p.ej. contador de items procesados).
     *
     * @param {string} msg - Nuevo texto a mostrar.
     * @returns {void}
     */
    text(msg: string): void {
        this.message = msg;
    }

    private render(): void {
        const frame = SPINNER_FRAMES[this.frameIndex] ?? SPINNER_FRAMES[0];
        const line = `  ${ANSI.fg.cyan}${frame}${ANSI.reset} ${this.message}`;
        process.stderr.write(`\r\x1b[K${line}`);
    }

    private clearLine(): void {
        process.stderr.write('\r\x1b[K');
    }

    private clearInterval(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

/**
 * Spinner degenerate para non-TTY (CI logs, pipes, `outputMode: 'silent'`).
 *
 * No anima nada: traduce los eventos del ciclo de vida del spinner a llamadas
 * normales del logger (`info` en start, `success`/`error` en finish). Así el
 * consumidor mantiene la misma API {@link ISpinnerHandle} sin saber si está
 * corriendo en terminal interactiva o en un job de CI.
 *
 * A diferencia de {@link SpinnerManager}, **no** toca el `outputMode` del
 * logger — no hay nada que mutear porque no hay frame animado que proteger.
 *
 * @implements {ISpinnerHandle}
 *
 * @example
 * ```ts
 * // En CI (sin TTY) el TerminalBridge entrega un NoopSpinner automáticamente:
 * const s = logger.spinner('Running tests...');
 * s.start();                 // logger.info('Running tests...')
 * s.succeed('All green');    // logger.success('All green')
 * ```
 *
 * @see {@link SpinnerManager} para el path interactivo con animación.
 */
export class NoopSpinner implements ISpinnerHandle {
    private message: string;
    private _logger: Logger;

    /**
     * @param {string} message - Texto base; se reutiliza como mensaje final
     *   si {@link succeed} / {@link fail} se llaman sin argumento.
     * @param {Logger} logger - Logger sobre el que se emiten los eventos.
     */
    constructor(message: string, logger: Logger) {
        this.message = message;
        this._logger = logger;
    }

    /**
     * Emite el mensaje inicial como `logger.info(...)`. No arranca ningún
     * timer — en non-TTY no hay nada que animar.
     *
     * @returns {void}
     */
    start(): void {
        this._logger.info(this.message);
    }

    /**
     * No-op — no hay animación que detener ni output que restaurar.
     *
     * @returns {void}
     */
    stop(): void {
        // No-op
    }

    /**
     * Emite el mensaje final como `logger.success(...)`.
     *
     * @param {string} [msg] - Texto final; si se omite usa el `message`
     *   inicial o el último seteado vía {@link text}.
     * @returns {void}
     */
    succeed(msg?: string): void {
        this._logger.success(msg ?? this.message);
    }

    /**
     * Emite el mensaje final como `logger.error(...)`.
     *
     * @param {string} [msg] - Texto final; si se omite usa el `message`
     *   inicial o el último seteado vía {@link text}.
     * @returns {void}
     */
    fail(msg?: string): void {
        this._logger.error(msg ?? this.message);
    }

    /**
     * Actualiza el mensaje interno (sin output). Solo afecta al texto que
     * emitirán {@link succeed} / {@link fail} cuando se invoquen sin argumento.
     *
     * @param {string} msg - Nuevo texto base.
     * @returns {void}
     */
    text(msg: string): void {
        this.message = msg;
    }
}
