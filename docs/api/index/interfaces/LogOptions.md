---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / LogOptions

# Interface: LogOptions

Defined in: [types/core.ts:483](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L483)

Opciones de presentación aplicables a un log individual. Controlan layout
multi-columna, ancho máximo, modo clave-valor, estilo de badge y formato
de timestamp — todo sin alterar el `LoggerConfig` global del logger.

## Properties

### rightAlign?

> `optional` **rightAlign?**: `string`

Defined in: [types/core.ts:484](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L484)

Texto alineado a la derecha del mensaje principal (p.ej. duración).

***

### columns?

> `optional` **columns?**: [`ColumnConfig`](ColumnConfig.md)[]

Defined in: [types/core.ts:485](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L485)

Definición de columnas para modo tabla.

***

### maxWidth?

> `optional` **maxWidth?**: `number`

Defined in: [types/core.ts:486](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L486)

Ancho máximo del mensaje antes de truncar/wrap.

***

### keyValue?

> `optional` **keyValue?**: `boolean`

Defined in: [types/core.ts:487](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L487)

Si `true`, renderiza los argumentos como `clave: valor`.

***

### badgeStyle?

> `optional` **badgeStyle?**: `BadgeStyle`

Defined in: [types/core.ts:488](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L488)

Override del estilo de badge para esta entrada.

***

### timestampFormat?

> `optional` **timestampFormat?**: [`TimestampFormat`](../type-aliases/TimestampFormat.md)

Defined in: [types/core.ts:489](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L489)

Override del formato de timestamp para esta entrada.
