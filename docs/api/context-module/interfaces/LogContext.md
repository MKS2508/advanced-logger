---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [context-module](../README.md) / LogContext

# Interface: LogContext

Defined in: [context/LogContext.ts:89](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L89)

Contrato que retorna [createLogContext](../functions/createLogContext.md).

Fachada de MDC (Mapped Diagnostic Context) por logger. Combina tres fuentes
de contexto:
- **base inmutable** vía `child()` (snapshot capturado al crear el child),
- **scope transitorio** vía `withContext()` / `withContextAsync()` sobre
  AsyncLocalStorage,
- **resource OTel** mergeado en cada record.

En entornos browser sin `AsyncLocalStorage`, las variantes `withContext*`
degradan a no-op: ejecutan `fn` sin scoping (o lo skipan si no hay `fn`).
`child()` sigue operativo en browser porque no depende de ALS.

## Methods

### getContext()

> **getContext**(): [`ContextSnapshot`](../type-aliases/ContextSnapshot.md)

Defined in: [context/LogContext.ts:100](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L100)

Snapshot actual del contexto bound.

#### Returns

[`ContextSnapshot`](../type-aliases/ContextSnapshot.md)

Copia inmutable (shallow) del contexto; mutarla no afecta a los
records que emitan futuras llamadas de log.

#### Example

```ts
const ctx = logContext.getContext();
console.log(ctx.requestId); // 'abc-123'
```

***

### withContext()

> **withContext**\<`R`\>(`bindings`, `fn?`): `R` \| `undefined`

Defined in: [context/LogContext.ts:126](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L126)

Ejecuta `fn` dentro de un scope de AsyncLocalStorage donde `bindings`
se mergean al contexto para todas las llamadas de log dentro de `fn`.

Si no se pasa `fn` (la vieja forma de setter), es no-op por backwards
compatibility. Para binding persistente prefiere `child()`; para
callbacks async usa `withContextAsync()`.

**Browser fallback**: sin ALS, ejecuta `fn` directamente sin scoping
(los bindings NO se mergean). Si tampoco hay `fn`, retorna `undefined`.

#### Type Parameters

##### R

`R`

#### Parameters

##### bindings

`Record`\<`string`, `unknown`\>

Pares key-value a attachar durante la ejecución de `fn`

##### fn?

() => `R`

Función sincrónica opcional a ejecutar bajo el scope ALS

#### Returns

`R` \| `undefined`

El valor de retorno de `fn`, o `undefined` si no se pasa `fn`

#### Example

```ts
logContext.withContext({ requestId: 'abc-123' }, () => {
  logger.info('procesando'); // el record lleva requestId=abc-123
});
// fuera de fn: requestId ya no está presente en próximos logs
```

#### See

 - [LogContext.withContextAsync](#withcontextasync) para callbacks async
 - [LogContext.child](#child) para binding persistente inmutable (sin ALS)

***

### withContextAsync()

> **withContextAsync**\<`R`\>(`bindings`, `fn`): `Promise`\<`R`\>

Defined in: [context/LogContext.ts:146](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L146)

Variante async de [withContext](#withcontext). Ejecuta `fn` dentro de un scope
de AsyncLocalStorage para que los bindings queden disponibles a todas las
llamadas de log async dentro de `fn` (incluso tras `await`).

**Browser fallback**: sin ALS, ejecuta `fn` directamente sin scoping.

#### Type Parameters

##### R

`R`

#### Parameters

##### bindings

`Record`\<`string`, `unknown`\>

Pares key-value a attachar durante la ejecución de `fn`

##### fn

() => `Promise`\<`R`\>

Función async a ejecutar bajo el scope ALS

#### Returns

`Promise`\<`R`\>

El Promise retornado por `fn`

#### Example

```ts
await logContext.withContextAsync({ traceId }, async () => {
  const user = await fetchUser();
  logger.info('user cargado', { id: user.id });
  // el record lleva el traceId aunque el log ocurra tras un await
});
```

***

### clearContext()

> **clearContext**(): `this`

Defined in: [context/LogContext.ts:159](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L159)

Droppea todas las keys del contexto bound. Tras esta llamada, los
records emitidos ya no llevan `attributes` hasta que
[withContext](#withcontext) o [child](#child) restablezcan uno.

#### Returns

`this`

La misma instancia de LogContext, ahora sin contexto

#### Example

```ts
logContext.clearContext();
logger.info('limpio'); // sin attributes
```

***

### setResource()

> **setResource**(`resource`): `this`

Defined in: [context/LogContext.ts:174](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L174)

Actualiza el resource OTel por defecto (service.name, version,
deployment.environment, ...).

Se persiste en el campo `resource` de cada record emitido, salvo que el
propio record lo overridee.

#### Parameters

##### resource

`Partial`\<`ILogResourceRef`\>

Resource OTel parcial a mergear con el actual

#### Returns

`this`

La misma instancia de LogContext, para encadenar calls

#### Example

```ts
logContext.setResource({ serviceName: 'api-gateway', environment: 'prod' });
```

***

### child()

> **child**(`extra`): [`ChildLoggerShape`](ChildLoggerShape.md)

Defined in: [context/LogContext.ts:201](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/context/LogContext.ts#L201)

Devuelve una copia inmutable de este logger con el contexto extra bound.

Las llamadas futuras sobre el child emiten con el contexto mergeado, sin
mutar al padre — patrón canónico de MDC.

A diferencia de [withContext](#withcontext), **no involucra AsyncLocalStorage**:
el binding es persistente y queda capturado en el snapshot del child al
crearse. Por eso `child()` es operativo también en browser sin ALS.

Los bindings transitorios de ALS activos en el momento de `child()` NO
se bakean en el child — solo se captura el contexto base. ALS se aplica
fresco en cada dispatch vía `_getContextRecord()`.

#### Parameters

##### extra

`Record`\<`string`, `unknown`\>

Pares key-value a attachar (requestId, userId, ...)

#### Returns

[`ChildLoggerShape`](ChildLoggerShape.md)

Un nuevo Logger con el contexto mergeado

#### Example

```ts
const requestLog = logContext.child({ requestId: 'abc-123' });
requestLog.info('inicio');   // siempre lleva requestId=abc-123
requestLog.info('fin');
// el logger padre no se ve afectado por estos bindings
```

#### See

[LogContext.withContext](#withcontext) para scoping transitorio (ALS)
