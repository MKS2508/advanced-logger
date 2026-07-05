---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / TimerResult

# Interface: TimerResult

Defined in: [types/core.ts:341](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L341)

Resultado de un timer completado. Lo retorna internamente `Logger.timeEnd`
y lo pasan los hooks en `extra` para mediciones de rendimiento.

## Properties

### label

> **label**: `string`

Defined in: [types/core.ts:342](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L342)

Etiqueta con la que se registró el timer vía `time(label)`.

***

### duration

> **duration**: `number`

Defined in: [types/core.ts:343](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L343)

Milisegundos transcurridos entre `startTime` y `endTime`.

***

### startTime

> **startTime**: `number`

Defined in: [types/core.ts:344](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L344)

Marca temporal de inicio (`performance.now()` o `Date.now()`).

***

### endTime

> **endTime**: `number`

Defined in: [types/core.ts:345](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L345)

Marca temporal de fin.
