---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / FileTransportOptions

# Interface: FileTransportOptions

Defined in: [transports/FileTransport.ts:32](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L32)

Opciones para [FileTransport](../classes/FileTransport.md). El campo `destination` se interpreta
como ruta de fichero en Node y como clave de `localStorage` en el browser
(componente saneado a `[a-zA-Z0-9_-]`).

Hereda los defaults de [TransportOptions](../../index/interfaces/TransportOptions.md): `batchSize=100`,
`maxBufferSize=10000`.

## Example

```ts
const transport = new FileTransport({
  destination: 'logs/app.log',
  batchSize: 200,
  flushInterval: 2000,
  maxBufferSize: 5000,
  onError: (entry) => captureFailure(entry)
});
```

## Extends

- [`TransportOptions`](../../index/interfaces/TransportOptions.md)

## Properties

### destination?

> `optional` **destination?**: `string`

Defined in: [transports/FileTransport.ts:39](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L39)

Destino de escritura. En Node es una ruta de fichero (resuelta relativa
a `process.cwd()` y saneada contra path traversal). En el browser es una
clave de `localStorage` (saneada a alfanumérico + `-_`).

#### Default

```ts
'app.log' (Node) | 'better-logger:default' (browser)
```

***

### onError?

> `optional` **onError?**: (`entry`) => `void` \| `Promise`\<`void`\>

Defined in: [transports/FileTransport.ts:45](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L45)

Hook opcional que se dispara cuando el transport no puede escribir
(error de FS, quota agotada, tab del browser en modo privado, ...).
Recibe un [HookLogEntry](../../index/interfaces/HookLogEntry.md) sintético.

#### Parameters

##### entry

[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)

#### Returns

`void` \| `Promise`\<`void`\>

***

### level?

> `optional` **level?**: `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Defined in: [types/transports.ts:101](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L101)

#### Inherited from

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`level`](../../index/interfaces/TransportOptions.md#level)

***

### transform?

> `optional` **transform?**: (`record`) => [`TransportRecord`](../../index/interfaces/TransportRecord.md) \| `null`

Defined in: [types/transports.ts:103](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L103)

Transforma el record antes de serializarlo. Devolver null descarta el record.

#### Parameters

##### record

[`TransportRecord`](../../index/interfaces/TransportRecord.md)

#### Returns

[`TransportRecord`](../../index/interfaces/TransportRecord.md) \| `null`

#### Inherited from

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`transform`](../../index/interfaces/TransportOptions.md#transform)

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [types/transports.ts:105](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L105)

Flush cuando el buffer alcanza esta cantidad de records.

#### Inherited from

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`batchSize`](../../index/interfaces/TransportOptions.md#batchsize)

***

### flushInterval?

> `optional` **flushInterval?**: `number`

Defined in: [types/transports.ts:107](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L107)

Flush periódico a este intervalo (ms).

#### Inherited from

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`flushInterval`](../../index/interfaces/TransportOptions.md#flushinterval)

***

### maxBufferSize?

> `optional` **maxBufferSize?**: `number`

Defined in: [types/transports.ts:109](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L109)

Tope duro de records en buffer. Los más antiguos se descartan al desbordar.

#### Inherited from

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`maxBufferSize`](../../index/interfaces/TransportOptions.md#maxbuffersize)
