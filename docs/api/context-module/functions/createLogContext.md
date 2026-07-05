---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [context-module](../README.md) / createLogContext

# Function: createLogContext()

> **createLogContext**(`options`): [`LogContext`](../interfaces/LogContext.md)

Defined in: [context/LogContext.ts:263](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L263)

Factory que crea una instancia de [LogContext](../interfaces/LogContext.md).

## Parameters

### options

`ILogContextOptions`

Configuración (ver ILogContextOptions)

## Returns

[`LogContext`](../interfaces/LogContext.md)

Una instancia de LogContext lista para usar

## Example

```ts
const logContext = createLogContext({
  childLoggerFactory: (cfg) => new Logger(cfg),
  initialContext: { service: 'orders-api' },
  initialResource: { serviceName: 'orders-api', environment: 'prod' }
});

// Child inmutable con contexto persistente
const requestLog = logContext.child({ requestId: 'abc-123' });

// Scope transitorio vía ALS (Node; en browser sin ALS es no-op)
logContext.withContext({ traceId: 't-9' }, () => {
  requestLog.info('procesando orden');
});
```
