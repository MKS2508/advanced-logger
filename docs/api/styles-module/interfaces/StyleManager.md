---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [styles-module](../README.md) / StyleManager

# Interface: StyleManager

Defined in: [styles/StyleManager.ts:86](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L86)

Bridge que gestiona presets de estilo, display settings y el ciclo de
theme switching para un Logger.

Encapsula el estado de styling en una closure para que el Logger no
tenga que mantener boilerplate propio. La implementación por defecto
(ver [createStyleManager](../functions/createStyleManager.md)) opera sobre la variable de módulo
compartida LEVEL\_STYLES: esto significa que `setTheme()` y
`resetStyles()` mutan estado global visible para TODAS las instancias
de Logger que comparten el módulo. Cada Logger construye su propio
StyleManager, pero la backing store de estilos activos es module-scoped
— está pensado así para que cambiar de theme una vez afecte a toda la
app, pero conviene saberlo al instanciar múltiples loggers con intents
distintos.

## Methods

### getDisplaySettings()

> **getDisplaySettings**(): [`DisplaySettings`](DisplaySettings.md)

Defined in: [styles/StyleManager.ts:91](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L91)

Devuelve un shallow clone de los display settings vigentes, de modo
que el caller pueda leerlos sin riesgo de mutar el estado interno.

#### Returns

[`DisplaySettings`](DisplaySettings.md)

***

### applyPreset()

> **applyPreset**(`name`): `boolean`

Defined in: [styles/StyleManager.ts:101](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L101)

Aplica un smart-preset por nombre. Si el preset existe, actualiza los
toggles de display (`showTimestamp`/`showLocation`) según la config
del preset y memoriza su nombre/config para que el renderer pueda
regenerar el output si cambia el theme.

#### Parameters

##### name

`string`

Identificador del preset (ver [getAvailablePresets](#getavailablepresets)).

#### Returns

`boolean`

`true` si el preset existe y se aplicó, `false` si no se encontró.

***

### getAvailablePresets()

> **getAvailablePresets**(): `string`[]

Defined in: [styles/StyleManager.ts:106](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L106)

Lista los identificadores de todos los smart-presets registrados.
Útil para alimentar un selector de UI o validar input de usuario.

#### Returns

`string`[]

***

### getStyles()

> **getStyles**(): `Record`\<`string`, `LevelStyleConfig`\>

Defined in: [styles/StyleManager.ts:112](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L112)

Devuelve la referencia actual a LEVEL\_STYLES. Como es
module-scoped, refleja el último `setTheme()`/`resetStyles()` aunque
provenga de otra instancia.

#### Returns

`Record`\<`string`, `LevelStyleConfig`\>

***

### getActivePreset()

> **getActivePreset**(): `unknown`

Defined in: [styles/StyleManager.ts:114](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L114)

Devuelve la config cruda del smart-preset activo (o `undefined`).

#### Returns

`unknown`

***

### getActivePresetName()

> **getActivePresetName**(): `string` \| `undefined`

Defined in: [styles/StyleManager.ts:116](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L116)

Nombre del smart-preset activo — útil para logging diagnóstico.

#### Returns

`string` \| `undefined`

***

### getCustomization()

> **getCustomization**(): `unknown`

Defined in: [styles/StyleManager.ts:118](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L118)

Último override aplicado via `Logger.customize()` (si lo hubo).

#### Returns

`unknown`

***

### setCustomization()

> **setCustomization**(`overrides`): `void`

Defined in: [styles/StyleManager.ts:123](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L123)

Persiste overrides de customización para que el renderer los consuma
en el próximo render. No muta LEVEL\_STYLES.

#### Parameters

##### overrides

`unknown`

#### Returns

`void`

***

### resolveThemeStyle()

> **resolveThemeStyle**(`theme`): `Record`\<`string`, `LevelStyleConfig`\>

Defined in: [styles/StyleManager.ts:131](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L131)

Resuelve (sin mutar nada) el set de estilos que correspondería a un
theme dado. Si el theme no existe en [THEME\_PRESETS](../../index/variables/THEME_PRESETS.md), cae al
preset `default`. Útil para previsualizar un theme sin aplicarlo.

#### Parameters

##### theme

[`ThemeVariant`](../../index/type-aliases/ThemeVariant.md)

Variante de theme soportada por [THEME\_PRESETS](../../index/variables/THEME_PRESETS.md).

#### Returns

`Record`\<`string`, `LevelStyleConfig`\>

***

### setTheme()

> **setTheme**(`theme`): `boolean`

Defined in: [styles/StyleManager.ts:143](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L143)

Aplica el theme mutando la variable de módulo LEVEL\_STYLES.

**Side-effect global**: como `LEVEL_STYLES` se comparte entre todas
las instancias de Logger del módulo, este cambio es visible para
cualquier Logger que haya en el proceso. No hay undo a nivel
instancia — llamar a [resetStyles](#resetstyles) para volver al default.

#### Parameters

##### theme

[`ThemeVariant`](../../index/type-aliases/ThemeVariant.md)

Variante de theme soportada por [THEME\_PRESETS](../../index/variables/THEME_PRESETS.md).

#### Returns

`boolean`

`true` si el theme existe y se aplicó, `false` si no se encontró.

***

### resetStyles()

> **resetStyles**(): `void`

Defined in: [styles/StyleManager.ts:149](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L149)

Restablece LEVEL\_STYLES al preset `default` de
[THEME\_PRESETS](../../index/variables/THEME_PRESETS.md). Al igual que [setTheme](#settheme), afecta a todas
las instancias de Logger del módulo.

#### Returns

`void`
