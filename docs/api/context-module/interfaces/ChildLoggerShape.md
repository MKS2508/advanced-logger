---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [context-module](../README.md) / ChildLoggerShape

# Interface: ChildLoggerShape

Defined in: [context/LogContext.ts:45](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L45)

Shape mínima de una instancia de Logger que LogContext necesita ver.

Evita dependencias circulares entre LogContext y Logger. El campo
`_parentContextRecord` lo setea el Logger padre después de que
`LogContext.child()` retorna, estableciendo la cadena de contextos.

## Properties

### \_parentContextRecord?

> `optional` **\_parentContextRecord?**: `Record`\<`string`, `unknown`\>

Defined in: [context/LogContext.ts:46](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L46)

***

### context?

> `optional` **context?**: `Record`\<`string`, `unknown`\>

Defined in: [context/LogContext.ts:48](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L48)

Campo legacy — ya no es la fuente canónica del contexto.
