---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / HttpTransport

# Class: HttpTransport

Defined in: [transports/HttpTransport.ts:105](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L105)

Transport basado en HTTP. Bufferea records, los batcha por tamaño o
intervalo, POSTea el batch como JSON, y reporta fallos vía retry, buffer
acotado y un hook `onError` — nunca un `.catch(() => {})` silencioso.

Lifecycle de cada batch (driveado internamente por `sendWithRetry`):
 1. `fetch(url, { method: 'POST', body, signal })` con un `AbortController`
    que aborta tras `fetchTimeoutMs`.
 2. Si `response.ok` → batch considerado entregado.
 3. Si `4xx` → dropeado sin reintento: el cliente nunca se recupera de un
    error de URL/auth/payload mal formado. Se dispara `onError`.
 4. Si `5xx` o `fetch` lanza (red caída / abort por timeout) → reintento con
    backoff exponencial: arranca en `initialBackoffMs`, duplica por intento,
    techo `maxBackoffMs`, hasta `maxRetries` intentos. Tras el agotamiento
    el batch se re-bufferiza (o se trimea contra `maxBufferSize`) y se
    dispara `onError` con `droppedCount`.

El body por defecto es el envelope JSON `{ logs: TransportRecord[] }`.
Para cambiar el wire format, sobrescribe los hooks `protected`
[HttpTransport.serializeBody](#serializebody) y [HttpTransport.buildHeaders](#buildheaders)
(referencia: [OtlpTransport](OtlpTransport.md)).

Extender esta clase es la vía recomendada para shippear un transport
nuevo orientado a HTTP.

## Example

```ts
// Registro en un logger
import logger from '@mks2508/better-logger';
import { HttpTransport } from '@mks2508/better-logger/transports';

logger.addTransport({
  target: new HttpTransport({
    url: 'https://logs.example.com/ingest',
    flushInterval: 5_000,
    batchSize: 100,
    onError: (entry) => console.error('[log-drop]', entry.message)
  })
});
```

## See

 - [HttpTransportOptions](../interfaces/HttpTransportOptions.md)
 - [OtlpTransport](OtlpTransport.md)

## Extended by

- [`OtlpTransport`](OtlpTransport.md)

## Implements

- `IBufferedTransport`

## Constructors

### Constructor

> **new HttpTransport**(`options?`): `HttpTransport`

Defined in: [transports/HttpTransport.ts:133](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L133)

Crea una instancia de HttpTransport.

Los campos omitidos en `options` se rellenan con defaults sensatos
(`batchSize=50`, `maxBufferSize=10_000`, `maxRetries=3`,
`initialBackoffMs=250`, `maxBackoffMs=5_000`, `fetchTimeoutMs=10_000`).
Si se pasa `flushInterval`, arranca un `setInterval` que flushea cada
N ms; si se omite, el flush solo dispara por llenado de `batchSize`.

#### Parameters

##### options?

[`HttpTransportOptions`](../interfaces/HttpTransportOptions.md)

Configuración opcional. Si se omite por completo, el transport queda inactivo hasta que se setee `options.url` por otra vía (subclasses).

#### Returns

`HttpTransport`

#### Example

```ts
const t = new HttpTransport({
  url: 'https://logs.example.com/ingest',
  flushInterval: 5_000
});
```

## Properties

### name

> `readonly` **name**: `string` = `'http'`

Defined in: [transports/HttpTransport.ts:107](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L107)

Identificador del transport. Los loggers lo usan para lookup, dedup y logs de diagnóstico.

#### Implementation of

`IBufferedTransport.name`

***

### options

> `protected` **options**: [`HttpTransportOptions`](../interfaces/HttpTransportOptions.md)

Defined in: [transports/HttpTransport.ts:114](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L114)

Bag de options — `protected` para que subclasses (ej. [OtlpTransport](OtlpTransport.md)) puedan leerlo o extenderlo.

## Accessors

### bufferSize

#### Get Signature

> **get** **bufferSize**(): `number`

Defined in: [transports/HttpTransport.ts:152](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L152)

Records actualmente encolados esperando el próximo flush.

##### Returns

`number`

#### Implementation of

`IBufferedTransport.bufferSize`

***

### maxBufferSize

#### Get Signature

> **get** **maxBufferSize**(): `number`

Defined in: [transports/HttpTransport.ts:157](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L157)

Capacidad máxima del buffer. Al superarla, el registro más viejo se dropea y se notifica vía `onError`.

##### Returns

`number`

#### Implementation of

`IBufferedTransport.maxBufferSize`

## Methods

### isReady()

> **isReady**(): `boolean`

Defined in: [transports/HttpTransport.ts:167](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L167)

Indica si el transport está listo para aceptar y entregar records.
Devuelve `false` tras [close](#close) o si no se configuró `url`.

#### Returns

`boolean`

`true` si el transport puede enviar.

#### Implementation of

`IBufferedTransport.isReady`

***

### write()

> **write**(`record`): `void`

Defined in: [transports/HttpTransport.ts:180](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L180)

Encola un record en el buffer. Si el buffer está lleno, aplica la
política de overflow (dropea el más viejo + dispara `onError`). Si tras
el push se alcanza `batchSize`, dispara un flush asíncrono (sin await).

No-op si el transport ya fue cerrado ([close](#close)).

#### Parameters

##### record

[`TransportRecord`](../../index/interfaces/TransportRecord.md)

Registro a encolar.

#### Returns

`void`

#### Implementation of

`IBufferedTransport.write`

***

### serializeBody()

> `protected` **serializeBody**(`records`): `string`

Defined in: [transports/HttpTransport.ts:201](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L201)

Serializa un batch al body de la request. Las subclasses sobrescriben
para cambiar la codificación (ej. [OtlpTransport](OtlpTransport.md) produce OTLP/HTTP
JSON en vez del envelope default `{ logs: [...] }`).

#### Parameters

##### records

[`TransportRecord`](../../index/interfaces/TransportRecord.md)[]

#### Returns

`string`

***

### buildHeaders()

> `protected` **buildHeaders**(): `Record`\<`string`, `string`\>

Defined in: [transports/HttpTransport.ts:210](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L210)

Construye los headers de la request. Las subclasses pueden prependear
headers transport-specific (ej. `signoz-ingestion-key`).

#### Returns

`Record`\<`string`, `string`\>

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [transports/HttpTransport.ts:247](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L247)

Flushea el buffer actual: toma un snapshot de los records pendientes,
los envía con retry/backoff vía `sendWithRetry`, y ante fallo los
re-bufferiza preservando el orden. Si la re-bufferización excede
`maxBufferSize`, trimea los más viejos y dispara `onError` con
`droppedCount`.

No-op si el transport está cerrado, el buffer está vacío o no hay
`url` configurada.

#### Returns

`Promise`\<`void`\>

Resuelve cuando el intento de entrega del batch actual terminó (success, drop definitivo o no-op).

#### See

[HttpTransportOptions.onError](../interfaces/HttpTransportOptions.md#onerror)

#### Implementation of

`IBufferedTransport.flush`

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [transports/HttpTransport.ts:368](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L368)

Cierra el transport: marca el flag `closed`, detiene el timer de
`flushInterval` si estaba corriendo, y ejecuta un flush final para
entregar lo pendiente.

Tras `close()`, todo [write](#write) posterior es no-op y
[isReady](#isready) devuelve `false`.

#### Returns

`Promise`\<`void`\>

Resuelve cuando el flush final termina.

#### See

[flush](#flush)

#### Implementation of

`IBufferedTransport.close`
