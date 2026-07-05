---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / OtlpTransportOptions

# Interface: OtlpTransportOptions

Defined in: [transports/OtlpTransport.ts:13](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L13)

Opciones de configuración para [OtlpTransport](../classes/OtlpTransport.md).

## Properties

### endpoint

> **endpoint**: `string`

Defined in: [transports/OtlpTransport.ts:18](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L18)

URL base del collector OTLP/HTTP, p.ej. `https://collector.example.com:4318`.
El transport hace POST a `<endpoint>/v1/logs`.

***

### serviceName

> **serviceName**: `string`

Defined in: [transports/OtlpTransport.ts:20](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L20)

Atributo de resource `service.name`. Requerido por la spec OTel.

***

### serviceVersion?

> `optional` **serviceVersion?**: `string`

Defined in: [transports/OtlpTransport.ts:22](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L22)

Atributo de resource `service.version`. Recomendado.

***

### environment?

> `optional` **environment?**: `string`

Defined in: [transports/OtlpTransport.ts:24](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L24)

Atributo de resource `deployment.environment` (production/staging/dev).

***

### resourceAttributes?

> `optional` **resourceAttributes?**: `Record`\<`string`, `string`\>

Defined in: [transports/OtlpTransport.ts:26](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L26)

Atributos de resource adicionales que se merguean en el bloque `resource`.

***

### ingestKeyEnvVar?

> `optional` **ingestKeyEnvVar?**: `string`

Defined in: [transports/OtlpTransport.ts:34](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L34)

Nombre de la env var cuyo valor se envía como header
`signoz-ingestion-key`. El transport lee `process.env[ingestKeyEnvVar]`
al construirse — nunca desde un string literal. Si la env var no está
seteada, el header se omite silenciosamente (el collector OTLP usa el
path default sin auth).

***

### headers?

> `optional` **headers?**: `Record`\<`string`, `string`\>

Defined in: [transports/OtlpTransport.ts:36](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L36)

Headers extra que se merguean (Authorization, X-* custom).

***

### batchSize?

> `optional` **batchSize?**: `number`

Defined in: [transports/OtlpTransport.ts:38](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L38)

Tamaño del batch (records por POST). Default 50.

***

### flushInterval?

> `optional` **flushInterval?**: `number`

Defined in: [transports/OtlpTransport.ts:40](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L40)

Intervalo de flush en ms.

***

### maxBufferSize?

> `optional` **maxBufferSize?**: `number`

Defined in: [transports/OtlpTransport.ts:42](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L42)

Tope duro de records bufferizados. Default 10_000.

***

### maxRetries?

> `optional` **maxRetries?**: `number`

Defined in: [transports/OtlpTransport.ts:44](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L44)

Reintentos máximos por batch. Default 3.

***

### initialBackoffMs?

> `optional` **initialBackoffMs?**: `number`

Defined in: [transports/OtlpTransport.ts:46](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L46)

Backoff inicial en ms. Default 250.

***

### maxBackoffMs?

> `optional` **maxBackoffMs?**: `number`

Defined in: [transports/OtlpTransport.ts:48](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L48)

Techo de backoff en ms. Default 5_000.

***

### fetchTimeoutMs?

> `optional` **fetchTimeoutMs?**: `number`

Defined in: [transports/OtlpTransport.ts:50](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L50)

Timeout por fetch en ms. Default 10_000.

***

### onError?

> `optional` **onError?**: (`entry`) => `void` \| `Promise`\<`void`\>

Defined in: [transports/OtlpTransport.ts:52](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/OtlpTransport.ts#L52)

Hook que se dispara ante falla del transport (drop, agotamiento de reintentos, ...).

#### Parameters

##### entry

[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)

#### Returns

`void` \| `Promise`\<`void`\>
