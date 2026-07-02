/**
 * @fileoverview Entry point for ./hooks subpath.
 * Hook manager: HookManager, createHookBridge, beforeLog, on, once, off, use.
 */
export { HookManager, getDefaultHookManager } from './hooks/index.js';
export { createHookBridge, type HookBridge } from './hooks/index.js';
