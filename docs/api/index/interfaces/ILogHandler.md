---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ILogHandler

# Interface: ILogHandler

Defined in: [types/handlers.ts:21](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/handlers.ts#L21)

Interface for custom log handlers (extensibility)

## Methods

### handle()

> **handle**(`level`, `message`, `args`, `metadata`): `void`

Defined in: [types/handlers.ts:22](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/handlers.ts#L22)

#### Parameters

##### level

`"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

##### message

`string`

##### args

`any`[]

##### metadata

[`LogMetadata`](LogMetadata.md)

#### Returns

`void`
