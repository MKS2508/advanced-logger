---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / TransportTarget

# Interface: TransportTarget

Defined in: [types/transports.ts:118](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L118)

Registro de un transport. `target` puede ser:
  - Una instancia de `ITransport` (legacy / inline).
  - Un string registrado en el registry built-in de `TransportManager`
    (`'console' | 'file' | 'http' | 'otlp'`).

## Properties

### target

> **target**: `string` \| [`ITransport`](ITransport.md)

Defined in: [types/transports.ts:119](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L119)

***

### options?

> `optional` **options?**: [`TransportOptions`](TransportOptions.md)

Defined in: [types/transports.ts:120](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L120)

***

### level?

> `optional` **level?**: `"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Defined in: [types/transports.ts:121](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/transports.ts#L121)
