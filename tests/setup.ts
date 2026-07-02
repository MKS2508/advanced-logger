/**
 * Shared test setup — resets global state between every test file.
 * Import this in each unit test via `import '../setup'` at the top.
 */
import { vi } from 'vitest';

/**
 * Cleans up after each test:
 * - Resets `process.env` to the baseline snapshot
 * - Clears any captured console output
 * - Resets module-level singletons (Logger, HookManager, etc.)
 */
export const cleanup = (): void => {
    // Reset process.env to a clean baseline (preserve only safe vars)
    const SAFE_ENV_KEYS = [
        'NODE_ENV', 'CI', 'GITHUB_ACTIONS', 'TERM', 'COLORTERM',
        'OTEL_INGEST_KEY', 'SIGNOZ_KEY', 'TEST_SIGNOZ_KEY'
    ];
    for (const key of Object.keys(process.env)) {
        if (!SAFE_ENV_KEYS.includes(key)) {
            delete process.env[key];
        }
    }

    // Reset stdout.isTTY
    if (process.stdout.isTTY !== undefined) {
        Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    }
};

/**
 * Mock helper: delete a property from globalThis for browser-fallback testing.
 */
export function deleteGlobalProperty(name: string): void {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    if (descriptor) {
        delete (globalThis as Record<string, unknown>)[name];
    }
}

/**
 * Restore a property deleted by deleteGlobalProperty.
 */
export function restoreGlobalProperty(name: string, value: unknown): void {
    Object.defineProperty(globalThis, name, {
        value,
        writable: true,
        configurable: true
    });
}
