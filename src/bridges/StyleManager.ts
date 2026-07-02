/**
 * @fileoverview StyleManager — style preset and display settings management.
 * Encapsulates active preset tracking, display toggles, and the
 * module-level LEVEL_STYLES variable.
 */

import {
    THEME_PRESETS,
    type StylePresets,
    type StyleBuilder
} from '../styling/index.js';
import { getSmartPreset, getAvailablePresets, hasPreset } from '../styling/SmartPresets.js';
import type { ThemeVariant, LogStyles } from '../types/index.js';

// Re-export StyleBuilder for internal use by Logger
export { StyleBuilder } from '../styling/index.js';

/**
 * Display visibility settings.
 */
export interface DisplaySettings {
    showTimestamp: boolean;
    showLocation: boolean;
    showBadges: boolean;
}

/**
 * Active preset state tracked by StyleManager.
 */
export interface PresetState {
    /** The resolved style config (LEVEL_STYLES). */
    styles: typeof THEME_PRESETS.default;
    /** The active smart-preset config (if any). */
    activePreset: unknown;
    /** Name of the active smart-preset (if any). */
    activePresetName: string | undefined;
    /** Last-applied customize() overrides. */
    customization: unknown;
    /** Display visibility settings. */
    displaySettings: DisplaySettings;
}

/**
 * Options for creating StyleManager.
 */
export interface IStyleManagerOptions {
    /** Initial display settings. */
    initialDisplaySettings?: Partial<DisplaySettings>;
}

/**
 * StyleManager - manages style presets and display settings.
 */
export interface StyleManager {
    /** Returns current display settings. */
    getDisplaySettings(): DisplaySettings;
    /** Applies a smart preset by name. Returns true if applied. */
    applyPreset(name: string): boolean;
    /** Lists all available presets. */
    getAvailablePresets(): string[];
    /** Gets the current LEVEL_STYLES. */
    getStyles(): typeof THEME_PRESETS.default;
    /** Gets the active smart-preset config. */
    getActivePreset(): unknown;
    /** Gets the active smart-preset name. */
    getActivePresetName(): string | undefined;
    /** Gets the active customization overrides. */
    getCustomization(): unknown;
    /** Stores customization overrides. */
    setCustomization(overrides: unknown): void;
    /** Resolves the effective styles for a theme variant. */
    resolveThemeStyle(theme: ThemeVariant): typeof THEME_PRESETS.default;
}

function createDefaultDisplaySettings(): DisplaySettings {
    return {
        showTimestamp: true,
        showLocation: true,
        showBadges: true
    };
}

/**
 * Creates a StyleManager instance.
 */
export function createStyleManager(options: IStyleManagerOptions = {}): StyleManager {
    const displaySettings = createDefaultDisplaySettings();
    let activePreset: unknown;
    let activePresetName: string | undefined;
    let customization: unknown;

    return {
        getDisplaySettings(): DisplaySettings {
            return { ...displaySettings };
        },

        applyPreset(name: string): boolean {
            if (!hasPreset(name)) {
                return false;
            }

            const presetConfig = getSmartPreset(name);
            if (presetConfig) {
                displaySettings.showTimestamp = presetConfig.timestamp?.show ?? true;
                displaySettings.showLocation = presetConfig.location?.show ?? true;
                activePreset = presetConfig;
                activePresetName = name;
            }
            return true;
        },

        getAvailablePresets(): string[] {
            return getAvailablePresets();
        },

        getStyles(): typeof THEME_PRESETS.default {
            return LEVEL_STYLES;
        },

        getActivePreset(): unknown {
            return activePreset;
        },

        getActivePresetName(): string | undefined {
            return activePresetName;
        },

        getCustomization(): unknown {
            return customization;
        },

        setCustomization(overrides: unknown): void {
            customization = overrides;
        },

        resolveThemeStyle(theme: ThemeVariant): typeof THEME_PRESETS.default {
            if (theme in THEME_PRESETS) {
                const themeRecord = THEME_PRESETS as unknown as Record<string, typeof LEVEL_STYLES>;
                return themeRecord[theme] ?? THEME_PRESETS.default;
            }
            return THEME_PRESETS.default;
        }
    };
}

/**
 * Module-level active styles — shared across all Logger instances.
 * Exported so Logger can reference it directly.
 */
export let LEVEL_STYLES: typeof THEME_PRESETS.default = THEME_PRESETS.default;

/**
 * Resets LEVEL_STYLES to default.
 */
export function resetStyles(): void {
    LEVEL_STYLES = THEME_PRESETS.default;
}
