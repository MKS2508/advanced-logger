---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / OtlpTransport

# Class: OtlpTransport

Defined in: [transports/OtlpTransport.ts:125](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L125)

Transport OTLP/HTTP para SigNoz (o cualquier backend compatible con OTLP).

Extiende [HttpTransport](HttpTransport.md) — hereda retry, buffer acotado, status check,
close asincrónico y el hook on-error. Overridea únicamente la shape del
payload y los headers del request.

## Example

```ts
logger.addTransport({
  target: new OtlpTransport({
    endpoint: 'https://otelcollector.example.com:4318',
    serviceName: 'my-app',
    serviceVersion: '1.2.3',
    environment: 'production',
    ingestKeyEnvVar: 'SIGNOZ_KEY'
  })
});
```

## Extends

- [`HttpTransport`](HttpTransport.md)

## Constructors

### Constructor

> **new OtlpTransport**(`options`): `OtlpTransport`

Defined in: [transports/OtlpTransport.ts:132](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L132)

#### Parameters

##### options

[`OtlpTransportOptions`](../interfaces/OtlpTransportOptions.md)

#### Returns

`OtlpTransport`

#### Overrides

[`HttpTransport`](HttpTransport.md).[`constructor`](HttpTransport.md#constructor)

## Properties

### options

> `protected` **options**: [`HttpTransportOptions`](../interfaces/HttpTransportOptions.md)

Defined in: [transports/HttpTransport.ts:114](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L114)

Bag de options — `protected` para que subclasses (ej. OtlpTransport) puedan leerlo o extenderlo.

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`options`](HttpTransport.md#options)

***

### name

> `readonly` **name**: `"otlp"` = `'otlp'`

Defined in: [transports/OtlpTransport.ts:126](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L126)

Identificador del transport. Los loggers lo usan para lookup, dedup y logs de diagnóstico.

#### Overrides

[`HttpTransport`](HttpTransport.md).[`name`](HttpTransport.md#name)

## Accessors

### bufferSize

#### Get Signature

> **get** **bufferSize**(): `number`

Defined in: [transports/HttpTransport.ts:152](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L152)

Records actualmente encolados esperando el próximo flush.

##### Returns

`number`

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`bufferSize`](HttpTransport.md#buffersize)

***

### maxBufferSize

#### Get Signature

> **get** **maxBufferSize**(): `number`

Defined in: [transports/HttpTransport.ts:157](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L157)

Capacidad máxima del buffer. Al superarla, el registro más viejo se dropea y se notifica vía `onError`.

##### Returns

`number`

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`maxBufferSize`](HttpTransport.md#maxbuffersize)

## Methods

### isReady()

> **isReady**(): `boolean`

Defined in: [transports/HttpTransport.ts:167](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L167)

Indica si el transport está listo para aceptar y entregar records.
Devuelve `false` tras [close](#close) o si no se configuró `url`.

#### Returns

`boolean`

`true` si el transport puede enviar.

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`isReady`](HttpTransport.md#isready)

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

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`write`](HttpTransport.md#write)

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

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`flush`](HttpTransport.md#flush)

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [transports/HttpTransport.ts:368](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/HttpTransport.ts#L368)

Cierra el transport: marca el flag `closed`, detiene el timer de
`flushInterval` si estaba corriendo, y ejecuta un flush final para
entregar lo pendiente.

Tras `close()`, todo [write](HttpTransport.md#write) posterior es no-op y
[isReady](HttpTransport.md#isready) devuelve `false`.

#### Returns

`Promise`\<`void`\>

Resuelve cuando el flush final termina.

#### See

[flush](HttpTransport.md#flush)

#### Inherited from

[`HttpTransport`](HttpTransport.md).[`close`](HttpTransport.md#close)

***

### buildPayload()

> **buildPayload**(`records`): `OtlpLogsPayload`

Defined in: [transports/OtlpTransport.ts:178](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L178)

Construye el payload JSON OTLP/HTTP a partir de los records bufferizados.
Un bloque `resourceLogs` por batch (sigue la guía de batching del
collector OTel). Expuesto para tests y para subclasses custom de transport.

#### Parameters

##### records

[`TransportRecord`](../../index/interfaces/TransportRecord.md)[]

Records de log a serializar dentro del payload.

#### Returns

`OtlpLogsPayload`

Objeto `LogsData` listo para `JSON.stringify`.

#### See

OtlpLogsPayload

***

### serializeBody()

> `protected` **serializeBody**(`records`): `string`

Defined in: [transports/OtlpTransport.ts:208](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L208)

Serializa un batch al body JSON del request OTLP/HTTP. Override de
[HttpTransport.serializeBody](HttpTransport.md#serializebody).

#### Parameters

##### records

[`TransportRecord`](../../index/interfaces/TransportRecord.md)[]

Records del batch a serializar.

#### Returns

`string`

String JSON listo para usar como `body` del fetch POST.

#### Overrides

[`HttpTransport`](HttpTransport.md).[`serializeBody`](HttpTransport.md#serializebody)

***

### buildHeaders()

> `protected` **buildHeaders**(): `Record`\<`string`, `string`\>

Defined in: [transports/OtlpTransport.ts:218](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L218)

Construye los headers del request. Agrega `signoz-ingestion-key` con el
valor resuelto al construir (nunca se loguea, nunca se escribe a source).

#### Returns

`Record`\<`string`, `string`\>

Record de headers a merguear en el fetch.

#### Overrides

[`HttpTransport`](HttpTransport.md).[`buildHeaders`](HttpTransport.md#buildheaders)
