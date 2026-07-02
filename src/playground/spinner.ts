/**
 * @fileoverview Built-in spinner implementation for CLI primitives
 * @since 5.0.0
 */

import type { ISpinnerHandle, LoggerConfig } from '../types/core.js';
import type { Logger } from '../Logger.js';
import { ANSI } from '../terminal/color-converter.js';

/** Braille-based spinner animation frames */
const SPINNER_FRAMES = ['\u280b', '\u2819', '\u2839', '\u2838', '\u283c', '\u2834', '\u2826', '\u2827', '\u2807', '\u280f'];

/** Spinner frame interval in milliseconds */
const FRAME_INTERVAL = 80;

/**
 * Interactive terminal spinner with in-place line updates.
 * Writes to stderr to avoid polluting piped stdout.
 *
 * @implements {ISpinnerHandle}
 * @since 5.0.0
 */
export class SpinnerManager implements ISpinnerHandle {
    private message: string;
    private frameIndex = 0;
    private interval: ReturnType<typeof setInterval> | null = null;
    private _logger: Logger;

    constructor(message: string, _config: LoggerConfig, logger: Logger) {
        this.message = message;
        this._logger = logger;
    }

    /** Start the spinner animation */
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

    /** Stop the spinner without a status message */
    stop(): void {
        this.clearInterval();
        this.clearLine();
        // Restore logger output
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /** Stop with a success indicator */
    succeed(msg?: string): void {
        this.clearInterval();
        this.clearLine();
        const text = msg ?? this.message;
        process.stderr.write(`  ${ANSI.fg.green}\u2713${ANSI.reset} ${text}\n`);
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /** Stop with a failure indicator */
    fail(msg?: string): void {
        this.clearInterval();
        this.clearLine();
        const text = msg ?? this.message;
        process.stderr.write(`  ${ANSI.fg.red}\u2717${ANSI.reset} ${text}\n`);
        this._logger.updateConfig({ outputMode: 'console' });
    }

    /** Update the spinner text while running */
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
 * No-op spinner for non-TTY environments or silent mode.
 * Logs start/succeed/fail as plain log messages.
 *
 * @implements {ISpinnerHandle}
 * @since 5.0.0
 */
export class NoopSpinner implements ISpinnerHandle {
    private message: string;
    private _logger: Logger;

    constructor(message: string, logger: Logger) {
        this.message = message;
        this._logger = logger;
    }

    start(): void {
        this._logger.info(this.message);
    }

    stop(): void {
        // No-op
    }

    succeed(msg?: string): void {
        this._logger.success(msg ?? this.message);
    }

    fail(msg?: string): void {
        this._logger.error(msg ?? this.message);
    }

    text(msg: string): void {
        this.message = msg;
    }
}
