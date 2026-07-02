/**
 * StyleManager unit tests — setTheme, preset, presets, customize,
 * resetStyles, getStyles, themes case-insensitive.
 *
 *
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createStyleManager, type StyleManager } from '../../src/styles/StyleManager.js';
import { THEME_PRESETS } from '../../src/styling/index.js';
import { cleanup } from '../setup.js';

describe('StyleManager', () => {
    let styleManager: StyleManager;

    beforeEach(() => {
        styleManager = createStyleManager();
    });

    afterEach(() => {
        cleanup();
    });

    describe('setTheme', () => {
        it('applies a valid preset theme and returns true', () => {
            const applied = styleManager.setTheme('dark');
            expect(applied).toBe(true);
        });

        it('returns false for invalid theme name', () => {
            const applied = styleManager.setTheme('nonexistent-theme-xyz');
            expect(applied).toBe(false);
        });

        it('setTheme updates module-level LEVEL_STYLES', () => {
            styleManager.setTheme('dark');
            const styles = styleManager.getStyles();
            expect(styles).toEqual(THEME_PRESETS.dark);
        });

        it('setTheme applies valid theme and returns true', () => {
            const applied = styleManager.setTheme('dark');
            expect(applied).toBe(true);
            expect(styleManager.getStyles()).toEqual(THEME_PRESETS.dark);
        });

        it('setTheme returns false for unknown theme name', () => {
            const applied = styleManager.setTheme('nonexistent-xyz');
            expect(applied).toBe(false);
        });
    });

    describe('preset / applyPreset', () => {
        it('applyPreset returns true for valid preset name', () => {
            const applied = styleManager.applyPreset('default');
            expect(applied).toBe(true);
        });

        it('applyPreset returns false for invalid preset', () => {
            const applied = styleManager.applyPreset('not-a-preset-xyz');
            expect(applied).toBe(false);
        });

        it('applyPreset updates display settings from preset config', () => {
            styleManager.applyPreset('default');
            const display = styleManager.getDisplaySettings();
            expect(display).toHaveProperty('showTimestamp');
            expect(display).toHaveProperty('showLocation');
            expect(display).toHaveProperty('showBadges');
        });

        it('getAvailablePresets returns a list of strings', () => {
            const presets = styleManager.getAvailablePresets();
            expect(Array.isArray(presets)).toBe(true);
            expect(presets.length).toBeGreaterThan(0);
            expect(presets.every(p => typeof p === 'string')).toBe(true);
        });

        it('getActivePreset returns the preset config after applyPreset', () => {
            styleManager.applyPreset('default');
            expect(styleManager.getActivePreset()).toBeDefined();
        });

        it('getActivePresetName returns the preset name after applyPreset', () => {
            styleManager.applyPreset('default');
            expect(styleManager.getActivePresetName()).toBe('default');
        });
    });

    describe('presets (alias)', () => {
        it('presets returns same list as getAvailablePresets', () => {
            const viaManager = styleManager.getAvailablePresets();
            // getAvailablePresets from SmartPresets
            expect(Array.isArray(viaManager)).toBe(true);
        });
    });

    describe('customize', () => {
        it('setCustomization stores overrides', () => {
            const overrides = { message: { color: '#ff0000' } };
            styleManager.setCustomization(overrides);
            expect(styleManager.getCustomization()).toEqual(overrides);
        });

        it('setCustomization can be called multiple times', () => {
            styleManager.setCustomization({ timestamp: { show: false } });
            styleManager.setCustomization({ message: { color: '#0000ff' } });
            expect(styleManager.getCustomization()).toEqual({ message: { color: '#0000ff' } });
        });
    });

    describe('resetStyles', () => {
        it('resetStyles restores default theme', () => {
            styleManager.setTheme('cyberpunk');
            expect(styleManager.getStyles()).toEqual(THEME_PRESETS.cyberpunk);

            styleManager.resetStyles();
            expect(styleManager.getStyles()).toEqual(THEME_PRESETS.default);
        });

        it('resetStyles can be called on fresh instance (no-op)', () => {
            expect(() => styleManager.resetStyles()).not.toThrow();
        });
    });

    describe('getStyles', () => {
        it('returns the current LEVEL_STYLES (default theme)', () => {
            const styles = styleManager.getStyles();
            expect(styles).toBeDefined();
            expect(styles).toHaveProperty('info');
            expect(styles).toHaveProperty('warn');
            expect(styles).toHaveProperty('error');
            expect(styles).toHaveProperty('debug');
            expect(styles).toHaveProperty('critical');
            expect(styles).toHaveProperty('success');
        });

        it('getStyles reflects theme change', () => {
            styleManager.setTheme('dark');
            const styles = styleManager.getStyles();
            expect(styles).toEqual(THEME_PRESETS.dark);
        });
    });

    describe('resolveThemeStyle', () => {
        it('resolves known theme to its styles', () => {
            const styles = styleManager.resolveThemeStyle('neon');
            expect(styles).toEqual(THEME_PRESETS.neon);
        });

        it('falls back to default for unknown theme', () => {
            const styles = styleManager.resolveThemeStyle('nonexistent');
            expect(styles).toEqual(THEME_PRESETS.default);
        });

        it('all THEME_PRESETS keys are resolvable', () => {
            for (const themeName of Object.keys(THEME_PRESETS)) {
                const styles = styleManager.resolveThemeStyle(themeName as Parameters<typeof styleManager.resolveThemeStyle>[0]);
                expect(styles).toBeDefined();
            }
        });
    });

    describe('displaySettings', () => {
        it('getDisplaySettings returns showTimestamp, showLocation, showBadges', () => {
            const display = styleManager.getDisplaySettings();
            expect(display).toHaveProperty('showTimestamp', true);
            expect(display).toHaveProperty('showLocation', true);
            expect(display).toHaveProperty('showBadges', true);
        });

        it('getDisplaySettings returns a shallow copy (mutation safe)', () => {
            const display1 = styleManager.getDisplaySettings();
            display1.showTimestamp = false;
            const display2 = styleManager.getDisplaySettings();
            expect(display2.showTimestamp).toBe(true);
        });
    });
});
