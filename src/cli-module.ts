/**
 * @fileoverview CLI-only entry point for @mks2508/better-logger/cli
 * Exports only CLI primitives for minimal bundle size in CLI tools.
 * @version 5.0.0
 * @since 5.0.0
 */

export { renderStep } from './playground/step.js';
export { renderHeader } from './playground/header.js';
export { renderDivider } from './playground/divider.js';
export { renderBox } from './playground/box.js';
export { renderTable } from './playground/cli-table.js';
export { SpinnerManager, NoopSpinner } from './playground/spinner.js';
export { ServerFallback } from './playground/server-fallback.js';

export type {
    CLILogLevel,
    ISpinnerHandle,
    IBoxOptions,
    ITableOptions,
} from './types/index.js';
