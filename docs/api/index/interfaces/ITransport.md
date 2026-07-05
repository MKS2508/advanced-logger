---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ITransport

# Interface: ITransport

Defined in: [types/transports.ts:127](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L127)

Contrato mínimo que todo transport debe satisfacer.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [types/transports.ts:128](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L128)

## Methods

### write()

> **write**(`record`): `void` \| `Promise`\<`void`\>

Defined in: [types/transports.ts:129](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L129)

#### Parameters

##### record

[`TransportRecord`](TransportRecord.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### flush()?

> `optional` **flush**(): `void` \| `Promise`\<`void`\>

Defined in: [types/transports.ts:130](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L130)

#### Returns

`void` \| `Promise`\<`void`\>

***

### close()?

> `optional` **close**(): `void` \| `Promise`\<`void`\>

Defined in: [types/transports.ts:131](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L131)

#### Returns

`void` \| `Promise`\<`void`\>

***

### isReady()?

> `optional` **isReady**(): `boolean`

Defined in: [types/transports.ts:132](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L132)

#### Returns

`boolean`
