---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / BANNER\_VARIANTS

# Variable: BANNER\_VARIANTS

> `const` **BANNER\_VARIANTS**: `object`

Defined in: [styling/banners.ts:33](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/banners.ts#L33)

Catálogo de variantes del banner de inicialización del logger.

Cada variante es un par `{ text, style }` listo para pasar a
`console.log(\`%c${text}\`, style)`. Las variantes escalan en complejidad
visual según las capacidades del navegador:
 - `simple`   — una sola línea con gradiente.
 - `ascii`    — ASCII art multiníveles (Safari, sin SVG).
 - `unicode`  — caja Unicode con gradiente de fondo.
 - `svg`      — `background-image` SVG con texto vectorial.
 - `animated` — gradiente animado vía `@keyframes gradientShift`.

La función detectBannerCapabilities elige automáticamente la
variante más rica soportada por el entorno actual.

## Type Declaration

### simple

> **simple**: `object`

#### simple.text

> **text**: `string` = `'🚀 ADVANCED LOGGER v2.0.0 - State-of-the-art Console Styling 🚀'`

#### simple.style

> **style**: `string` = `'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;'`

### ascii

> **ascii**: `object`

#### ascii.text

> **text**: `string`

#### ascii.style

> **style**: `string` = `'font-family: "Courier New", Consolas, Monaco, monospace; color: #667eea; font-size: 11px; line-height: 1.2;'`

### unicode

> **unicode**: `object`

#### unicode.text

> **text**: `string`

#### unicode.style

> **style**: `string` = `'font-family: "Courier New", Consolas, Monaco, monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.3;'`

### svg

> **svg**: `object`

#### svg.text

> **text**: `string` = `'                    '`

#### svg.style

> **style**: `string`

### animated

> **animated**: `object`

#### animated.text

> **text**: `string` = `'         🚀 ADVANCED LOGGER v2.0.0         '`

#### animated.style

> **style**: `string`

## Example

```ts
import { BANNER_VARIANTS } from '@mks2508/better-logger/styles';

const { text, style } = BANNER_VARIANTS.unicode;
console.log(`%c${text}`, style);
```

## See

 - [BannerType](../type-aliases/BannerType.md) para la unión de claves válidas.
 - displayInitBanner para pintar el banner auto-detectado.
