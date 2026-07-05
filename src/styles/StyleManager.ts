/**
 * @fileoverview StyleManager — gestión de presets de estilo y display settings.
 *
 * Encapsula el tracking del preset activo, los toggles de visibilidad del
 * output (timestamp, location, badges) y la variable de módulo
 * {@link LEVEL_STYLES}. El Logger delega en este bridge la resolución de
 * estilos y los cambios de theme para mantener sincronizado el estado
 * compartido a nivel módulo.
 */

import {
    THEME_PRESETS,
    type StylePresets,
    type StyleBuilder
} from '../styling/index.js';
import { getSmartPreset, getAvailablePresets, hasPreset } from '../styling/SmartPresets.js';
import type { ThemeVariant, LogStyles } from '../types/index.js';

/**
 * Re-export de `StyleBuilder` para consumo interno del Logger dentro de este
 * paquete. La API pública de styling vive en `../styling/index.ts`; este
 * re-export existe únicamente para evitar un segundo import cruzado desde
 * Logger.ts. No considerar parte del surface público de este módulo.
 *
 * @internal
 */
export { StyleBuilder } from '../styling/index.js';

/**
 * Toggles de visibilidad que controlan qué metadatos acompañan a cada línea
 * de log en la salida formateada. Cada preset inteligente
 * (via {@link StyleManager.applyPreset}) puede imponer sus propios defaults
 * sobreescribiendo estos valores.
 */
export interface DisplaySettings {
    /** Muestra (o no) el timestamp ISO al inicio de cada línea. */
    showTimestamp: boolean;
    /** Muestra (o no) la ubicación del caller (file:line) parseada del stack. */
    showLocation: boolean;
    /** Muestra (o no) los badges de scope/nivel junto al mensaje. */
    showBadges: boolean;
}

/**
 * Snapshot del estado interno que el StyleManager trackea en closure:
 * preset activo, overrides de `customize()` y display settings vigentes.
 * Útil para serializar/inspeccionar el estado de styling sin exponer la
 * implementación del bridge.
 */
export interface PresetState {
    /** Config de estilos resuelta (referencia a {@link LEVEL_STYLES}). */
    styles: typeof THEME_PRESETS.default;
    /** Config del smart-preset activo (si lo hay). */
    activePreset: unknown;
    /** Nombre del smart-preset activo (si lo hay). */
    activePresetName: string | undefined;
    /** Últimos overrides aplicados via `customize()`. */
    customization: unknown;
    /** Toggles de visibilidad del output. */
    displaySettings: DisplaySettings;
}

/**
 * Opciones de construcción para {@link createStyleManager}.
 */
export interface IStyleManagerOptions {
    /** Display settings iniciales (parciales: se merguean sobre los defaults). */
    initialDisplaySettings?: Partial<DisplaySettings>;
}

/**
 * Bridge que gestiona presets de estilo, display settings y el ciclo de
 * theme switching para un Logger.
 *
 * Encapsula el estado de styling en una closure para que el Logger no
 * tenga que mantener boilerplate propio. La implementación por defecto
 * (ver {@link createStyleManager}) opera sobre la variable de módulo
 * compartida {@link LEVEL_STYLES}: esto significa que `setTheme()` y
 * `resetStyles()` mutan estado global visible para TODAS las instancias
 * de Logger que comparten el módulo. Cada Logger construye su propio
 * StyleManager, pero la backing store de estilos activos es module-scoped
 * — está pensado así para que cambiar de theme una vez afecte a toda la
 * app, pero conviene saberlo al instanciar múltiples loggers con intents
 * distintos.
 */
export interface StyleManager {
    /**
     * Devuelve un shallow clone de los display settings vigentes, de modo
     * que el caller pueda leerlos sin riesgo de mutar el estado interno.
     */
    getDisplaySettings(): DisplaySettings;
    /**
     * Aplica un smart-preset por nombre. Si el preset existe, actualiza los
     * toggles de display (`showTimestamp`/`showLocation`) según la config
     * del preset y memoriza su nombre/config para que el renderer pueda
     * regenerar el output si cambia el theme.
     *
     * @param name - Identificador del preset (ver {@link getAvailablePresets}).
     * @returns `true` si el preset existe y se aplicó, `false` si no se encontró.
     */
    applyPreset(name: string): boolean;
    /**
     * Lista los identificadores de todos los smart-presets registrados.
     * Útil para alimentar un selector de UI o validar input de usuario.
     */
    getAvailablePresets(): string[];
    /**
     * Devuelve la referencia actual a {@link LEVEL_STYLES}. Como es
     * module-scoped, refleja el último `setTheme()`/`resetStyles()` aunque
     * provenga de otra instancia.
     */
    getStyles(): typeof THEME_PRESETS.default;
    /** Devuelve la config cruda del smart-preset activo (o `undefined`). */
    getActivePreset(): unknown;
    /** Nombre del smart-preset activo — útil para logging diagnóstico. */
    getActivePresetName(): string | undefined;
    /** Último override aplicado via `Logger.customize()` (si lo hubo). */
    getCustomization(): unknown;
    /**
     * Persiste overrides de customización para que el renderer los consuma
     * en el próximo render. No muta {@link LEVEL_STYLES}.
     */
    setCustomization(overrides: unknown): void;
    /**
     * Resuelve (sin mutar nada) el set de estilos que correspondería a un
     * theme dado. Si el theme no existe en {@link THEME_PRESETS}, cae al
     * preset `default`. Útil para previsualizar un theme sin aplicarlo.
     *
     * @param theme - Variante de theme soportada por {@link THEME_PRESETS}.
     */
    resolveThemeStyle(theme: ThemeVariant): typeof THEME_PRESETS.default;
    /**
     * Aplica el theme mutando la variable de módulo {@link LEVEL_STYLES}.
     *
     * **Side-effect global**: como `LEVEL_STYLES` se comparte entre todas
     * las instancias de Logger del módulo, este cambio es visible para
     * cualquier Logger que haya en el proceso. No hay undo a nivel
     * instancia — llamar a {@link resetStyles} para volver al default.
     *
     * @param theme - Variante de theme soportada por {@link THEME_PRESETS}.
     * @returns `true` si el theme existe y se aplicó, `false` si no se encontró.
     */
    setTheme(theme: ThemeVariant): boolean;
    /**
     * Restablece {@link LEVEL_STYLES} al preset `default` de
     * {@link THEME_PRESETS}. Al igual que {@link setTheme}, afecta a todas
     * las instancias de Logger del módulo.
     */
    resetStyles(): void;
}

function createDefaultDisplaySettings(): DisplaySettings {
    return {
        showTimestamp: true,
        showLocation: true,
        showBadges: true
    };
}

/**
 * Crea una instancia de {@link StyleManager} con display settings por defecto
 * (o los overrides que se pasen en `options`).
 *
 * Cada instancia mantiene su propio estado de preset/customization/display,
 * pero la backing store de estilos activos ({@link LEVEL_STYLES}) es
 * module-scoped: dos StyleManagers comparten la misma vista de LEVEL_STYLES.
 *
 * @param options - Overrides opcionales para los display settings iniciales.
 *
 * @example
 * ```ts
 * const sm = createStyleManager({
 *   initialDisplaySettings: { showTimestamp: false, showBadges: true }
 * });
 *
 * sm.applyPreset('cyberpunk'); // aplica preset + ajusta toggles
 * sm.setTheme('dark');         // muta LEVEL_STYLES (global al módulo)
 * console.log(sm.getStyles()); // lee el LEVEL_STYLES vigente
 * ```
 *
 * @see {@link StyleManager} para el contrato completo del bridge.
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
        },

        setTheme(theme: ThemeVariant): boolean {
            if (theme in THEME_PRESETS) {
                const themeRecord = THEME_PRESETS as unknown as Record<string, typeof LEVEL_STYLES>;
                const newStyles = themeRecord[theme];
                if (newStyles) {
                    LEVEL_STYLES = newStyles;
                    return true;
                }
            }
            return false;
        },

        resetStyles(): void {
            LEVEL_STYLES = THEME_PRESETS.default;
        }
    };
}

/**
 * Variable de módulo con el set de estilos activo, compartida por todas las
 * instancias de Logger/StyleManager que importan este módulo. Se exporta
 * `let` para que el Logger la pueda leer directamente sin pasar por el bridge.
 *
 * **Mutadores**: {@link StyleManager.setTheme} y {@link StyleManager.resetStyles}
 * (o el {@link resetStyles} exportado de este módulo) reasignan esta variable.
 * Cualquier referencia capturada con anterioridad queda stale — siempre leer
 * vía `LEVEL_STYLES` en punto de uso, no cacheandola.
 */
export let LEVEL_STYLES: typeof THEME_PRESETS.default = THEME_PRESETS.default;

/**
 * Restablece {@link LEVEL_STYLES} al preset `default` de {@link THEME_PRESETS}.
 *
 * Equivalente a invocar {@link StyleManager.resetStyles} sobre cualquier
 * instancia, expuesto como función libre para que código externo al Logger
 * (CLIs, tooling, tests) pueda resetear el módulo sin tener que sostener una
 * referencia al StyleManager. Mismo side-effect global que `setTheme`.
 *
 * @example
 * ```ts
 * import { resetStyles } from '@mks2508/better-logger/styles';
 * resetStyles(); // vuelve al theme default para todos los loggers del módulo
 * ```
 */
export function resetStyles(): void {
    LEVEL_STYLES = THEME_PRESETS.default;
}
