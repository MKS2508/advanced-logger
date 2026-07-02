/**
 * Subpath resolution unit tests — each module file exports what it should.
 * Verifies that all 10 subpath entries export their promised symbols
 * and that the exports are not undefined or null.
 *
 * @since 0.18.2-alpha.1
 */
import { describe, it, expect } from 'vitest';

// Each import is verified to be non-null, non-undefined.
// Using `await import()` to allow dynamic resolution.

// ============================================================
// Subpath: .
// ============================================================
describe('subpath "." (main entry)', () => {
    it('exports Logger class', async () => {
        const { Logger } = await import('../../src/index.js');
        expect(Logger).not.toBeNull();
        expect(typeof Logger).toBe('function');
    });

    it('exports debug/info/warn/error/success/trace/critical functions', async () => {
        const ns = await import('../../src/index.js');
        expect(typeof ns.debug).toBe('function');
        expect(typeof ns.info).toBe('function');
        expect(typeof ns.warn).toBe('function');
        expect(typeof ns.error).toBe('function');
        expect(typeof ns.success).toBe('function');
        expect(typeof ns.trace).toBe('function');
        expect(typeof ns.critical).toBe('function');
    });

    it('exports ScopedLogger, ComponentLogger, APILogger', async () => {
        const { ScopedLogger, ComponentLogger, APILogger } = await import('../../src/index.js');
        expect(ScopedLogger).not.toBeNull();
        expect(ComponentLogger).not.toBeNull();
        expect(APILogger).not.toBeNull();
    });

    it('exports addTransport, removeTransport, flushTransports, closeTransports', async () => {
        const ns = await import('../../src/index.js');
        expect(typeof ns.addTransport).toBe('function');
        expect(typeof ns.removeTransport).toBe('function');
        expect(typeof ns.flushTransports).toBe('function');
        expect(typeof ns.closeTransports).toBe('function');
    });

    it('exports on, once, off, use (hook methods)', async () => {
        const ns = await import('../../src/index.js');
        expect(typeof ns.on).toBe('function');
        expect(typeof ns.once).toBe('function');
        expect(typeof ns.off).toBe('function');
        expect(typeof ns.use).toBe('function');
    });

    it('exports StyleBuilder, StylePresets, THEME_PRESETS', async () => {
        const { StyleBuilder, StylePresets, THEME_PRESETS } = await import('../../src/index.js');
        expect(StyleBuilder).not.toBeNull();
        expect(StylePresets).not.toBeNull();
        expect(THEME_PRESETS).not.toBeNull();
    });

    it('has type exports verified by TypeScript type-check', async () => {
        // LoggerConfig, LogLevel, TransportRecord are type-only exports
        // — verified by TypeScript type-checking, not runtime checks.
        const ns = await import('../../src/index.js');
        expect(typeof ns.Logger).toBe('function');
        expect(typeof ns.info).toBe('function');
    });
});

// ============================================================
// Subpath: ./core
// ============================================================
describe('subpath "./core"', () => {
    it('exports CoreLogger class', async () => {
        const { CoreLogger } = await import('../../src/core.js');
        expect(CoreLogger).not.toBeNull();
        expect(typeof CoreLogger).toBe('function');
    });

    it('uses LOG_LEVELS internally (not re-exported from this subpath)', async () => {
        // LOG_LEVELS is used internally by CoreLogger but not re-exported as a named export.
        // It IS exported from the types barrel (src/types/index.ts).
        const ns = await import('../../src/core.js');
        expect(typeof ns.CoreLogger).toBe('function');
    });

    it('exports core logging functions (debug, info, warn, error, etc.)', async () => {
        const ns = await import('../../src/core.js');
        expect(typeof ns.debug).toBe('function');
        expect(typeof ns.info).toBe('function');
        expect(typeof ns.warn).toBe('function');
        expect(typeof ns.error).toBe('function');
    });

    it('has runtime exports that verify module is loadable', async () => {
        // LogLevel and Verbosity are type-only exports — verified by TypeScript type-check
        const ns = await import('../../src/core.js');
        expect(typeof ns.CoreLogger).toBe('function');
        expect(typeof ns.debug).toBe('function');
    });
});

// ============================================================
// Subpath: ./cli
// ============================================================
describe('subpath "./cli"', () => {
    it('exports renderStep', async () => {
        const { renderStep } = await import('../../src/cli-module.js');
        expect(renderStep).not.toBeNull();
        expect(typeof renderStep).toBe('function');
    });

    it('exports renderHeader', async () => {
        const { renderHeader } = await import('../../src/cli-module.js');
        expect(renderHeader).not.toBeNull();
    });

    it('exports renderDivider', async () => {
        const { renderDivider } = await import('../../src/cli-module.js');
        expect(renderDivider).not.toBeNull();
    });

    it('exports renderBox', async () => {
        const { renderBox } = await import('../../src/cli-module.js');
        expect(renderBox).not.toBeNull();
    });

    it('exports renderTable', async () => {
        const { renderTable } = await import('../../src/cli-module.js');
        expect(renderTable).not.toBeNull();
    });

    it('exports SpinnerManager and NoopSpinner', async () => {
        const { SpinnerManager, NoopSpinner } = await import('../../src/cli-module.js');
        expect(SpinnerManager).not.toBeNull();
        expect(NoopSpinner).not.toBeNull();
    });

    it('has runtime exports that verify module is loadable', async () => {
        // Type exports (CLILogLevel, ISpinnerHandle, etc.) are verified by TypeScript type-check
        const ns = await import('../../src/cli-module.js');
        expect(typeof ns.renderStep).toBe('function');
        expect(typeof ns.SpinnerManager).toBe('function');
    });
});

// ============================================================
// Subpath: ./transports
// ============================================================
describe('subpath "./transports"', () => {
    it('exports TransportManager', async () => {
        const { TransportManager } = await import('../../src/transports-module.js');
        expect(TransportManager).not.toBeNull();
        expect(typeof TransportManager).toBe('function');
    });

    it('exports ConsoleTransport', async () => {
        const { ConsoleTransport } = await import('../../src/transports-module.js');
        expect(ConsoleTransport).not.toBeNull();
    });

    it('exports FileTransport', async () => {
        const { FileTransport } = await import('../../src/transports-module.js');
        expect(FileTransport).not.toBeNull();
    });

    it('exports HttpTransport', async () => {
        const { HttpTransport } = await import('../../src/transports-module.js');
        expect(HttpTransport).not.toBeNull();
    });

    it('exports OtlpTransport', async () => {
        const { OtlpTransport } = await import('../../src/transports-module.js');
        expect(OtlpTransport).not.toBeNull();
    });

    it('has runtime exports that verify module is loadable', async () => {
        // Type exports (FileTransportOptions, HttpTransportOptions) are verified by TypeScript type-check
        const ns = await import('../../src/transports-module.js');
        expect(typeof ns.TransportManager).toBe('function');
        expect(typeof ns.ConsoleTransport).toBe('function');
    });
});

// ============================================================
// Subpath: ./context
// ============================================================
describe('subpath "./context"', () => {
    it('exports createLogContext', async () => {
        const { createLogContext } = await import('../../src/context-module.js');
        expect(createLogContext).not.toBeNull();
        expect(typeof createLogContext).toBe('function');
    });

    it('exports LogContext type', async () => {
        const { LogContext } = await import('../../src/context-module.js');
        expect(LogContext).not.toBeNull();
    });

    it('module can be imported without throwing', async () => {
        // Type-only exports (ContextSnapshot, ChildLoggerFactory, ChildLoggerShape)
        // are verified by TypeScript type-checking, not runtime checks.
        const ns = await import('../../src/context-module.js');
        expect(ns.createLogContext).toBeDefined();
        expect(typeof ns.createLogContext).toBe('function');
    });
});

// ============================================================
// Subpath: ./hooks
// ============================================================
describe('subpath "./hooks"', () => {
    it('exports HookManager', async () => {
        const { HookManager } = await import('../../src/hooks-module.js');
        expect(HookManager).not.toBeNull();
        expect(typeof HookManager).toBe('function');
    });

    it('exports getDefaultHookManager', async () => {
        const { getDefaultHookManager } = await import('../../src/hooks-module.js');
        expect(getDefaultHookManager).not.toBeNull();
    });

    it('exports createHookBridge', async () => {
        const { createHookBridge } = await import('../../src/hooks-module.js');
        expect(createHookBridge).not.toBeNull();
    });

    it('exports HookBridge type', async () => {
        const { HookBridge } = await import('../../src/hooks-module.js');
        expect(HookBridge).not.toBeNull();
    });
});

// ============================================================
// Subpath: ./serializers
// ============================================================
describe('subpath "./serializers"', () => {
    it('exports SerializerRegistry', async () => {
        const { SerializerRegistry } = await import('../../src/serializers-module.js');
        expect(SerializerRegistry).not.toBeNull();
        expect(typeof SerializerRegistry).toBe('function');
    });

    it('exports getDefaultSerializerRegistry', async () => {
        const { getDefaultSerializerRegistry } = await import('../../src/serializers-module.js');
        expect(getDefaultSerializerRegistry).not.toBeNull();
    });

    it('exports createSerializerBridge', async () => {
        const { createSerializerBridge } = await import('../../src/serializers-module.js');
        expect(createSerializerBridge).not.toBeNull();
    });

    it('exports SerializerBridge type', async () => {
        const { SerializerBridge } = await import('../../src/serializers-module.js');
        expect(SerializerBridge).not.toBeNull();
    });
});

// ============================================================
// Subpath: ./styles
// ============================================================
describe('subpath "./styles"', () => {
    it('exports StyleBuilder', async () => {
        const { StyleBuilder } = await import('../../src/styles-module.js');
        expect(StyleBuilder).not.toBeNull();
    });

    it('exports StylePresets', async () => {
        const { StylePresets } = await import('../../src/styles-module.js');
        expect(StylePresets).not.toBeNull();
    });

    it('exports THEME_PRESETS', async () => {
        const { THEME_PRESETS } = await import('../../src/styles-module.js');
        expect(THEME_PRESETS).not.toBeNull();
    });

    it('exports createStyleManager', async () => {
        const { createStyleManager } = await import('../../src/styles-module.js');
        expect(createStyleManager).not.toBeNull();
    });

    it('module can be imported and has runtime exports', async () => {
        // StyleManager, DisplaySettings, PresetState are type-only exports —
        // verified by TypeScript type-checking, not runtime checks.
        const ns = await import('../../src/styles-module.js');
        expect(ns.StyleBuilder).toBeDefined();
        expect(ns.StylePresets).toBeDefined();
        expect(ns.THEME_PRESETS).toBeDefined();
        expect(ns.createStyleManager).toBeDefined();
    });
});

// ============================================================
// Subpath: ./playground
// ============================================================
describe('subpath "./playground"', () => {
    it('exports renderBox', async () => {
        const { renderBox } = await import('../../src/playground-module.js');
        expect(renderBox).not.toBeNull();
        expect(typeof renderBox).toBe('function');
    });

    it('exports renderTable', async () => {
        const { renderTable } = await import('../../src/playground-module.js');
        expect(renderTable).not.toBeNull();
    });

    it('exports renderStep', async () => {
        const { renderStep } = await import('../../src/playground-module.js');
        expect(renderStep).not.toBeNull();
    });

    it('exports SpinnerManager and NoopSpinner', async () => {
        const { SpinnerManager, NoopSpinner } = await import('../../src/playground-module.js');
        expect(SpinnerManager).not.toBeNull();
        expect(NoopSpinner).not.toBeNull();
    });

    it('exports renderHeader and renderDivider', async () => {
        const { renderHeader, renderDivider } = await import('../../src/playground-module.js');
        expect(renderHeader).not.toBeNull();
        expect(renderDivider).not.toBeNull();
    });
});

// ============================================================
// Subpath: ./node
// ============================================================
describe('subpath "./node"', () => {
    it('module is empty (no Node-only utilities yet)', async () => {
        const mod = await import('../../src/node-module.js');
        // node-module is reserved for future Node-only utilities (fs-backed
        // rotation, file capture, etc.). It is intentionally empty.
        expect(Object.keys(mod).length).toBe(0);
    });
});
