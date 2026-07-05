---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [styles-module](../README.md) / createStyleManager

# Function: createStyleManager()

> **createStyleManager**(`options?`): [`StyleManager`](../interfaces/StyleManager.md)

Defined in: [styles/StyleManager.ts:183](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L183)

Crea una instancia de [StyleManager](../interfaces/StyleManager.md) con display settings por defecto
(o los overrides que se pasen en `options`).

Cada instancia mantiene su propio estado de preset/customization/display,
pero la backing store de estilos activos (LEVEL\_STYLES) es
module-scoped: dos StyleManagers comparten la misma vista de LEVEL_STYLES.

## Parameters

### options?

`IStyleManagerOptions` = `{}`

Overrides opcionales para los display settings iniciales.

## Returns

[`StyleManager`](../interfaces/StyleManager.md)

## Example

```ts
const sm = createStyleManager({
  initialDisplaySettings: { showTimestamp: false, showBadges: true }
});

sm.applyPreset('cyberpunk'); // aplica preset + ajusta toggles
sm.setTheme('dark');         // muta LEVEL_STYLES (global al módulo)
console.log(sm.getStyles()); // lee el LEVEL_STYLES vigente
```

## See

[StyleManager](../interfaces/StyleManager.md) para el contrato completo del bridge.
