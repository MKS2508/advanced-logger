---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / TransportOptions

# Interface: TransportOptions

Defined in: [types/transports.ts:100](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L100)

Opciones aceptadas por cualquier transport al registrarse.

## Extended by

- [`FileTransportOptions`](../../transports-module/interfaces/FileTransportOptions.md)
- [`HttpTransportOptions`](../../transports-module/interfaces/HttpTransportOptions.md)

## Properties

### level?

> `optional` **level?**: `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Defined in: [types/transports.ts:101](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L101)

***

### transform?

> `optional` **transform?**: (`record`) => [`TransportRecord`](TransportRecord.md) \| `null`

Defined in: [types/transports.ts:103](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L103)

Transforma el record antes de serializarlo. Devolver null descarta el record.

#### Parameters

##### record

[`TransportRecord`](TransportRecord.md)

#### Returns

[`TransportRecord`](TransportRecord.md) \| `null`

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [types/transports.ts:105](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L105)

Flush cuando el buffer alcanza esta cantidad de records.

***

### flushInterval?

> `optional` **flushInterval?**: `number`

Defined in: [types/transports.ts:107](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L107)

Flush periódico a este intervalo (ms).

***

### maxBufferSize?

> `optional` **maxBufferSize?**: `number`

Defined in: [types/transports.ts:109](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L109)

Tope duro de records en buffer. Los más antiguos se descartan al desbordar.
