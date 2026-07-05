---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / MiddlewareFn

# Type Alias: MiddlewareFn

> **MiddlewareFn** = (`entry`, `next`) => `void` \| `Promise`\<`void`\>

Defined in: [types/hooks.ts:73](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L73)

Middleware estilo Koa para el pipeline de hooks.

Recibe el [HookLogEntry](../interfaces/HookLogEntry.md) y una función `next()` que invoca al
siguiente middleware en la cadena de prioridad. Si el middleware NO llama
`next()`, corta la cadena y el log se descarta (útil para filtrado
avanzado, sampling o redacción que decide no emitir).

Se registra vía [IHookManager.use](../interfaces/IHookManager.md#use) y corre antes que cualquier
callback de evento [HookEvent](HookEvent.md), lo que lo hace ideal para
cross-cutting concerns: correlación de trazas, redacción de PII,
enriquecimiento con atributos globales, etc.

## Parameters

### entry

[`HookLogEntry`](../interfaces/HookLogEntry.md)

### next

() => `void` \| `Promise`\<`void`\>

## Returns

`void` \| `Promise`\<`void`\>

## Example

```ts
// Descarta logs marcados como privados
const privacyFilter: MiddlewareFn = (entry, next) => {
  if (entry.context?.private === true) return; // no llama next() → se descarta
  return next();
};
```
