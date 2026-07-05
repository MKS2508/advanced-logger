---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / HttpTransportOptions

# Interface: HttpTransportOptions

Defined in: [transports/HttpTransport.ts:33](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L33)

Configuración para [HttpTransport](../classes/HttpTransport.md). Extiende [TransportOptions](../../index/interfaces/TransportOptions.md)
con parámetros HTTP: URL destino, headers custom, buffer acotado,
retry con backoff para fallos transitorios, timeout de fetch por intento, y
un hook `onError` que reporta drops (overflow / 4xx / retry exhausto)
sin escalar excepciones al caller.

## Examples

```ts
// Mínimo: solo URL
new HttpTransport({ url: 'https://logs.example.com/ingest' });
```

```ts
// Con retry/backoff ajustado y hook de errores
new HttpTransport({
  url: 'https://logs.example.com/ingest',
  headers: { Authorization: 'Bearer <REDACTED>' },
  maxRetries: 5,
  initialBackoffMs: 500,
  maxBackoffMs: 30_000,
  fetchTimeoutMs: 5_000,
  onError: (entry) => metrics.increment('log_drop', { reason: entry.message })
});
```

## Extends

- [`TransportOptions`](../../index/interfaces/TransportOptions.md)

## Properties

### url?

> `optional` **url?**: `string`

Defined in: [transports/HttpTransport.ts:35](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L35)

URL destino. Se usa POST con body JSON.

***

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [transports/HttpTransport.ts:37](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L37)

Headers extra de la request (ej. `Authorization: Bearer ...`).

***

### maxBufferSize?

> `optional` **maxBufferSize?**: `number`

Defined in: [transports/HttpTransport.ts:39](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L39)

Tope máximo de records en buffer. En overflow se dropea el más viejo.

#### Overrides

[`TransportOptions`](../../index/interfaces/TransportOptions.md).[`maxBufferSize`](../../index/interfaces/TransportOptions.md#maxbuffersize)

***

### maxRetries?

> `optional` **maxRetries?**: `number`

Defined in: [transports/HttpTransport.ts:41](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L41)

Reintentos consecutivos por batch antes de dropear los records.

***

### initialBackoffMs?

> `optional` **initialBackoffMs?**: `number`

Defined in: [transports/HttpTransport.ts:43](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L43)

Backoff inicial en ms. Duplica por intento hasta `maxBackoffMs`.

***

### maxBackoffMs?

> `optional` **maxBackoffMs?**: `number`

Defined in: [transports/HttpTransport.ts:45](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L45)

Techo de backoff en ms.

***

### fetchTimeoutMs?

> `optional` **fetchTimeoutMs?**: `number`

Defined in: [transports/HttpTransport.ts:47](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L47)

Timeout del fetch en ms (por intento). Default 10_000.

***

### onError?

> `optional` **onError?**: (`entry`) => `void` \| `Promise`\<`void`\>

Defined in: [transports/HttpTransport.ts:53](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L53)

Hook opcional que se dispara cuando el buffer hace overflow o un batch
se dropea tras `maxRetries`. Recibe una entrada [HookLogEntry](../../index/interfaces/HookLogEntry.md)
sintética.

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
