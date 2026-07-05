---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / HookCallback

# Type Alias: HookCallback

> **HookCallback** = (`entry`) => `void` \| `Partial`\<[`HookLogEntry`](../interfaces/HookLogEntry.md)\> \| `Promise`\<`void` \| `Partial`\<[`HookLogEntry`](../interfaces/HookLogEntry.md)\>\>

Defined in: [types/hooks.ts:51](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L51)

Firma del callback de hook. Los hooks async se awaitan en orden de prioridad;
devolver un partial object sobreescribe los campos del entry para los hooks
siguientes y para la llamada final al log.

## Parameters

### entry

[`HookLogEntry`](../interfaces/HookLogEntry.md)

## Returns

`void` \| `Partial`\<[`HookLogEntry`](../interfaces/HookLogEntry.md)\> \| `Promise`\<`void` \| `Partial`\<[`HookLogEntry`](../interfaces/HookLogEntry.md)\>\>
