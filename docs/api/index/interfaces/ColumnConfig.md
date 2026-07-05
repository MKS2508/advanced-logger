---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ColumnConfig

# Interface: ColumnConfig

Defined in: [types/core.ts:464](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L464)

Definición de una columna para `Logger.cliTable`. `content` es la fuente
del valor (clave del row o string fijo); los demás campos controlan layout
y color.

## Properties

### content

> **content**: `string`

Defined in: [types/core.ts:465](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L465)

Clave del row a renderizar, o string fijo para todas las filas.

***

### width?

> `optional` **width?**: `number`

Defined in: [types/core.ts:466](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L466)

Ancho fijo en caracteres; si se omite, se auto-detecta del contenido.

***

### align?

> `optional` **align?**: [`ColumnAlign`](../type-aliases/ColumnAlign.md)

Defined in: [types/core.ts:467](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L467)

Alineación del contenido dentro de la celda.

***

### color?

> `optional` **color?**: `string`

Defined in: [types/core.ts:468](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L468)

Color del texto (hex, nombre CSS o nombre ANSI).
