/**
 * @fileoverview Styling system exports for Advanced Logger.
 *
 * Implementation-level primitives consumed by `src/styles/` (the public
 * StyleManager bridge). End users should prefer:
 *
 * ```ts
 * import { StyleBuilder, THEME_PRESETS } from '@mks2508/better-logger/styles';
 * ```
 */

export { StyleBuilder, $, StylePresets } from './StyleBuilder.js';
export { THEME_PRESETS } from './themes.js';
export {
    BANNER_VARIANTS,
    THEME_BANNERS,
    detectBannerCapabilities,
    displayInitBanner
} from './banners.js';
export {
    SMART_PRESETS,
    getSmartPreset,
    getAvailablePresets,
    hasPreset,
    PRESET_DESCRIPTIONS
} from './SmartPresets.js';