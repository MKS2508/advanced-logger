/**
 * @fileoverview CLI-only entry point for @mks2508/better-logger/cli
 * Exports only CLI primitives for minimal bundle size in CLI tools.
 * @version 5.0.0
 * @since 5.0.0
 */

export { renderStep } from './cli-primitives/step.js';
export { renderHeader } from './cli-primitives/header.js';
export { renderDivider } from './cli-primitives/divider.js';
export { renderBox } from './cli-primitives/box.js';
export { renderTable } from './cli-primitives/cli-table.js';
export { SpinnerManager, NoopSpinner } from './cli-primitives/spinner.js';
export { ServerFallback } from './cli-primitives/server-fallback.js';

export type {
    CLILogLevel,
    ISpinnerHandle,
    IBoxOptions,
    ITableOptions,
} from './types/index.js';
