---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [context-module](../README.md) / ContextSnapshot

# Type Alias: ContextSnapshot

> **ContextSnapshot** = `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [context/LogContext.ts:25](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L25)

Snapshot del contexto bound. Lo retorna [LogContext.getContext](../interfaces/LogContext.md#getcontext).

Es `Readonly` para marcar contractually que el objeto devuelto es una shallow
copy: mutarlo no afecta a los records que emitan futuras llamadas de log.
