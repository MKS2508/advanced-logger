---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / THEME\_BANNERS

# Variable: THEME\_BANNERS

> `const` **THEME\_BANNERS**: `Record`\<[`ThemeVariant`](../type-aliases/ThemeVariant.md), \{ `simple`: `string`; `style`: `string`; \}\>

Defined in: [styling/banners.ts:106](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/banners.ts#L106)

Banners de inicialización específicos por [ThemeVariant](../type-aliases/ThemeVariant.md).

Cada theme trae su propio par `{ simple, style }` (banner de una línea
+ CSS) que combina con la paleta del theme. El texto del banner es
siempre una sola línea (sin ASCII art), por lo que es la variante
usada por defecto cuando el logger arranca con un theme concreto.

## Example

```ts
import { THEME_BANNERS } from '@mks2508/better-logger/styles';

const { simple, style } = THEME_BANNERS.cyberpunk;
console.log(`%c${simple}`, style);
```

## See

 - [THEME\_PRESETS](THEME_PRESETS.md) para los estilos de badge por nivel de cada theme.
 - [ThemeVariant](../type-aliases/ThemeVariant.md) para la lista de themes disponibles.
