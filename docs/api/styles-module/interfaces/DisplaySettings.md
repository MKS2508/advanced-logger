---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [styles-module](../README.md) / DisplaySettings

# Interface: DisplaySettings

Defined in: [styles/StyleManager.ts:35](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L35)

Toggles de visibilidad que controlan qué metadatos acompañan a cada línea
de log en la salida formateada. Cada preset inteligente
(via [StyleManager.applyPreset](StyleManager.md#applypreset)) puede imponer sus propios defaults
sobreescribiendo estos valores.

## Properties

### showTimestamp

> **showTimestamp**: `boolean`

Defined in: [styles/StyleManager.ts:37](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L37)

Muestra (o no) el timestamp ISO al inicio de cada línea.

***

### showLocation

> **showLocation**: `boolean`

Defined in: [styles/StyleManager.ts:39](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L39)

Muestra (o no) la ubicación del caller (file:line) parseada del stack.

***

### showBadges

> **showBadges**: `boolean`

Defined in: [styles/StyleManager.ts:41](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styles/StyleManager.ts#L41)

Muestra (o no) los badges de scope/nivel junto al mensaje.
