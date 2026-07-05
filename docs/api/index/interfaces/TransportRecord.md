---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / TransportRecord

# Interface: TransportRecord

Defined in: [types/transports.ts:63](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L63)

Payload enviado a cada transport en cada llamada a `log()`. Los campos son
deliberadamente explícitos (sin escape hatch `[key: string]: any`) para que
implementaciones como `OtlpTransport` puedan mapear 1:1 a `logRecords` OTLP.

## Properties

### level

> **level**: `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Defined in: [types/transports.ts:65](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L65)

Nivel canónico (trace/debug/info/warn/error/critical).

***

### levelValue

> **levelValue**: `number`

Defined in: [types/transports.ts:67](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L67)

Severidad numérica, copiada de `LOG_LEVELS[level]`.

***

### severityNumber

> **severityNumber**: `number`

Defined in: [types/transports.ts:69](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L69)

Severidad numérica OTel (1-24). La asigna automáticamente el Logger.

***

### severityText

> **severityText**: `string`

Defined in: [types/transports.ts:71](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L71)

Nombre de severidad OTel (TRACE/DEBUG/INFO/WARN/ERROR/FATAL).

***

### time

> **time**: `number`

Defined in: [types/transports.ts:73](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L73)

Epoch milliseconds en el momento del log.

***

### msg

> **msg**: `string`

Defined in: [types/transports.ts:75](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L75)

Texto final del mensaje, ya procesado por los hooks.

***

### prefix?

> `optional` **prefix?**: `string`

Defined in: [types/transports.ts:77](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L77)

Scope lógico opcional (p.ej. "Auth", "API:Users").

***

### location?

> `optional` **location?**: `object`

Defined in: [types/transports.ts:79](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L79)

Ubicación del caller, solo cuando `enableStackTrace` es true.

#### file

> **file**: `string`

#### line

> **line**: `number`

#### column

> **column**: `number`

#### function?

> `optional` **function?**: `string`

***

### traceId?

> `optional` **traceId?**: `string`

Defined in: [types/transports.ts:86](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L86)

Trace id hex de 32 chars (OTel), cuando hay correlación con un span activo.

***

### spanId?

> `optional` **spanId?**: `string`

Defined in: [types/transports.ts:88](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L88)

Span id hex de 16 chars (OTel), cuando hay correlación con un span activo.

***

### attributes?

> `optional` **attributes?**: `ILogAttributes`

Defined in: [types/transports.ts:90](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L90)

Atributos estructurados (requestId, userId, tags custom).

***

### resource?

> `optional` **resource?**: `Partial`\<`ILogResource`\>

Defined in: [types/transports.ts:92](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L92)

Recurso a nivel de log (sobreescribe el resource del transport).

***

### tag?

> `optional` **tag?**: `LogTag`

Defined in: [types/transports.ts:94](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L94)

Tag especial "success" — lo setea `Logger.success()`.
