---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / HookLogEntry

# Interface: HookLogEntry

Defined in: [types/hooks.ts:8](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L8)

Payload que recibe cada callback de hook. Los hooks pueden devolver un
partial de este objeto para sobreescribir campos individuales; el manager
mergea el resultado de vuelta a la cadena del entry.

## Properties

### level

> **level**: `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Defined in: [types/hooks.ts:9](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L9)

***

### message

> **message**: `string`

Defined in: [types/hooks.ts:10](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L10)

***

### args

> **args**: `unknown`[]

Defined in: [types/hooks.ts:11](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L11)

***

### timestamp

> **timestamp**: `string`

Defined in: [types/hooks.ts:12](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L12)

***

### prefix?

> `optional` **prefix?**: `string`

Defined in: [types/hooks.ts:13](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L13)

***

### stackInfo?

> `optional` **stackInfo?**: [`StackInfo`](StackInfo.md)

Defined in: [types/hooks.ts:14](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L14)

***

### correlationId?

> `optional` **correlationId?**: `string`

Defined in: [types/hooks.ts:15](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L15)

***

### context?

> `optional` **context?**: `Record`\<`string`, `unknown`\>

Defined in: [types/hooks.ts:16](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L16)

***

### hookEvent?

> `optional` **hookEvent?**: [`HookEvent`](../type-aliases/HookEvent.md)

Defined in: [types/hooks.ts:21](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L21)

Evento de hook de origen cuando se emite desde un path de fallo interno
(p.ej. error de flush en transport → dispara `onError` con `hookEvent: 'beforeLog'`).

***

### error?

> `optional` **error?**: `Error`

Defined in: [types/hooks.ts:23](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L23)

Excepción capturada, si el hook se disparó por un error lanzado.

***

### extra?

> `optional` **extra?**: `Record`\<`string`, `unknown`\>

Defined in: [types/hooks.ts:28](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L28)

Payload estructurado específico del hook. Lo usan los transports para
exponer records dropeados, response codes, retry counts, etc.
