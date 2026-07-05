---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [styles-module](../README.md) / PresetState

# Interface: PresetState

Defined in: [styles/StyleManager.ts:50](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L50)

Snapshot del estado interno que el StyleManager trackea en closure:
preset activo, overrides de `customize()` y display settings vigentes.
Útil para serializar/inspeccionar el estado de styling sin exponer la
implementación del bridge.

## Properties

### styles

> **styles**: `Record`\<`string`, `LevelStyleConfig`\>

Defined in: [styles/StyleManager.ts:52](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L52)

Config de estilos resuelta (referencia a LEVEL\_STYLES).

***

### activePreset

> **activePreset**: `unknown`

Defined in: [styles/StyleManager.ts:54](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L54)

Config del smart-preset activo (si lo hay).

***

### activePresetName

> **activePresetName**: `string` \| `undefined`

Defined in: [styles/StyleManager.ts:56](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L56)

Nombre del smart-preset activo (si lo hay).

***

### customization

> **customization**: `unknown`

Defined in: [styles/StyleManager.ts:58](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L58)

Últimos overrides aplicados via `customize()`.

***

### displaySettings

> **displaySettings**: [`DisplaySettings`](DisplaySettings.md)

Defined in: [styles/StyleManager.ts:60](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L60)

Toggles de visibilidad del output.
