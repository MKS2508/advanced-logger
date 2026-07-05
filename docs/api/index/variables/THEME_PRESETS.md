---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / THEME\_PRESETS

# Variable: THEME\_PRESETS

> `const` **THEME\_PRESETS**: `Record`\<[`ThemeVariant`](../type-aliases/ThemeVariant.md), `Record`\<`string`, `LevelStyleConfig`\>\>

Defined in: [styling/themes.ts:50](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/themes.ts#L50)

Catálogo de themes visuales para los badges de cada log level.

Cada [ThemeVariant](../type-aliases/ThemeVariant.md) mapea a un record de LevelStyleConfig
indexado por nivel (`debug`, `info`, `warn`, `error`, `success`,
`critical`). El StyleManager consume este mappeo para resolver
los estilos CSS del badge que rodea al label del nivel en la consola
del navegador.

Un LevelStyleConfig por nivel define seis campos visuales:
 - `emoji`      — glyph que precede al label (vacío en themes minimal).
 - `label`      — texto en mayúsculas renderizado dentro del badge.
 - `background` — CSS background (típicamente un `linear-gradient`).
 - `color`      — color del texto interior del badge.
 - `border`     — CSS border completo (`<width> <style> <color>`).
 - `shadow`     — box-shadow alrededor del badge; `'none'` lo desactiva.

Themes disponibles: `default` (gradientes vivos), `dark` (paleta oscura
para DevTools oscuro), `neon` (glow neón sobre fondo oscuro), `minimal`
(badges planos sin sombras ni emojis), `light` (paleta pastel para
DevTools claro) y `cyberpunk` (cian/magenta con sombras extendidas).

## Examples

```ts
import { THEME_PRESETS } from '@mks2508/better-logger/styles';

// Inspeccionar el badge `error` del theme `neon`
const { emoji, label, background, color } = THEME_PRESETS.neon.error;
console.log(`${emoji} ${label} → ${background}`);
```

```ts
// Aplicar un theme al logger entero
import logger from '@mks2508/better-logger';
logger.configure({ theme: 'cyberpunk' });
logger.error('Algo se rompió'); // badge con glow magenta
```

## See

 - [ThemeVariant](../type-aliases/ThemeVariant.md) para la lista de claves válidas.
 - LevelStyleConfig para la shape exacta de cada entrada.
