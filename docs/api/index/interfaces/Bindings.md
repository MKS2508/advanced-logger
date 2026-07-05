---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / Bindings

# Interface: Bindings

Defined in: [types/core.ts:417](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L417)

Bindings inmutables que viajan con un logger scoped/child. Definen la
"identidad" del logger para filtrado, agrupación y atribución en
transports. Se propagan a través de `child()` y se merguean al construir
el [TransportRecord](TransportRecord.md) que reciben los transports.

## Properties

### scope?

> `optional` **scope?**: `string`

Defined in: [types/core.ts:418](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L418)

Etiqueta lógica del scope (p.ej. `"Auth"`, `"API:Users"`).

***

### badges?

> `optional` **badges?**: `string`[]

Defined in: [types/core.ts:419](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L419)

Lista de badges a renderizar junto al mensaje.

***

### type?

> `optional` **type?**: `"scope"` \| `"api"` \| `"component"`

Defined in: [types/core.ts:420](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L420)

Categoría del logger: `'scope'` (genérico), `'api'` (verbosidades HTTP), `'component'` (UI lifecycle).

***

### context?

> `optional` **context?**: `string`[]

Defined in: [types/core.ts:421](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L421)

Cadena jerárquica de contexto (parent → child) para traces anidados.
