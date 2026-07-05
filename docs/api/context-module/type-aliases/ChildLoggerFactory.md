---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [context-module](../README.md) / ChildLoggerFactory

# Type Alias: ChildLoggerFactory

> **ChildLoggerFactory** = (`config`) => `unknown`

Defined in: [context/LogContext.ts:36](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L36)

Tipo de la factory function para crear instancias child de Logger.

Se inyecta en LogContext para que `child()` pueda instanciar nuevos loggers
sin introducir un import circular entre `Logger.ts` y `LogContext.ts`.
Retorna `unknown` — la clase Logger concreta la maneja el caller, y la
instancia devuelta tiene su campo `context` escrito por LogContext tras la
creación.

## Parameters

### config

`Partial`\<[`LoggerConfig`](../../index/interfaces/LoggerConfig.md)\>

## Returns

`unknown`
