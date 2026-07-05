---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ContextLogger

# Class: ContextLogger

Defined in: [ScopedLogger.ts:630](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L630)

Handler de contexto apilable sobre un [ScopedLogger](ScopedLogger.md).

Permite agrupar bloques de logs bajo un sub-prefijo separado por `:`,
manteniendo la correlación visual sin necesidad de `console.group`. El
prefijo compuesto se forma como `<scopeName>:<contextName>`.

Se crea con `scopedLogger.context(name)`. El patrón idiomático es
[run](#run)/[runAsync](#runasync) (auto push/pop con try/finally); [start](#start)
y [end](#end) permiten control manual cuando el bloque no cierra
léxicamente (event handlers distribuidos, promesas de larga duración).

## Example

```ts
import logger from '@mks2508/better-logger';

const http = logger.scope('HTTP');

// Bloque síncrono auto-cerrado
http.context('retry').run(() => {
  http.warn('Reintentando petición');
});
// salida: [HTTP:retry] Reintentando petición

// Bloque async auto-cerrado
await http.context('refresh').runAsync(async () => {
  await refreshToken();
  http.info('Token refrescado');
});
```

## See

[ScopedLogger.context](ScopedLogger.md#context)

## Constructors

### Constructor

> **new ContextLogger**(`parentLogger`, `contextName`): `ContextLogger`

Defined in: [ScopedLogger.ts:638](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L638)

#### Parameters

##### parentLogger

[`ScopedLogger`](ScopedLogger.md)

Scope sobre el que se apila el contexto.

##### contextName

`string`

Sub-prefijo a apilar en el scope padre.

#### Returns

`ContextLogger`

## Methods

### run()

> **run**\<`T`\>(`fn`): `T`

Defined in: [ScopedLogger.ts:658](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L658)

Ejecuta `fn` síncrona dentro del contexto, garantizando el pop del
prefijo incluso si `fn` lanza. El contexto solo está activo durante la
ejecución de `fn`.

#### Type Parameters

##### T

`T`

Tipo de retorno de `fn`.

#### Parameters

##### fn

() => `T`

Función a ejecutar bajo el contexto.

#### Returns

`T`

Lo que devuelva `fn`.

#### Throws

Relanza cualquier excepción de `fn` tras desapilar.

#### Example

```ts
logger.scope('HTTP').context('warmup').run(() => {
  logger.info('Pre-cargando caché');
});
```

***

### runAsync()

> **runAsync**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: [ScopedLogger.ts:682](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L682)

Variante async de [run](#run): mantiene el contexto activo mientras se
awaiting la promesa de `fn`, incluyendo awaits internos.

#### Type Parameters

##### T

`T`

Tipo resuelto por la promesa de `fn`.

#### Parameters

##### fn

() => `Promise`\<`T`\>

Función async a ejecutar bajo el contexto.

#### Returns

`Promise`\<`T`\>

Promesa que resuelve al valor de `fn`.

#### Throws

Relanza cualquier rechazo de `fn` tras desapilar.

#### Example

```ts
await logger.scope('HTTP').context('fetch').runAsync(async () => {
  const r = await fetch(url);
  logger.info('Recibido', { status: r.status });
});
```

***

### start()

> **start**(): `void`

Defined in: [ScopedLogger.ts:703](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L703)

Apila el contexto manualmente. Útil cuando el bloque que lo consume no
cierra léxicamente (event handlers, timeouts, streams). Debe emparejarse
con un [end](#end) posterior; olvidarlo deja el prefijo contaminado para
los logs siguientes del scope.

#### Returns

`void`

#### Example

```ts
const ctx = logger.scope('WS').context('subscribe');
socket.onopen  = () => { ctx.start(); ctx.info('connected'); };
socket.onclose = () => { ctx.info('disconnected'); ctx.end(); };
```

#### See

[end](#end)

***

### end()

> **end**(): `void`

Defined in: [ScopedLogger.ts:712](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L712)

Desapila el último contexto abierto con [start](#start).

#### Returns

`void`

#### See

[start](#start)

***

### debug()

> **debug**(...`args`): `void`

Defined in: [ScopedLogger.ts:722](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L722)

Atajo a `scopedLogger.debug(...)`. El contexto se aplica al prefijo del
scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

***

### info()

> **info**(...`args`): `void`

Defined in: [ScopedLogger.ts:730](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L730)

Atajo a `scopedLogger.info(...)`. El contexto se aplica al prefijo del
scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

***

### warn()

> **warn**(...`args`): `void`

Defined in: [ScopedLogger.ts:738](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L738)

Atajo a `scopedLogger.warn(...)`. El contexto se aplica al prefijo del
scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

***

### error()

> **error**(...`args`): `void`

Defined in: [ScopedLogger.ts:746](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L746)

Atajo a `scopedLogger.error(...)`. El contexto se aplica al prefijo del
scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

***

### success()

> **success**(...`args`): `void`

Defined in: [ScopedLogger.ts:754](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L754)

Atajo a `scopedLogger.success(...)`. El contexto se aplica al prefijo del
scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

***

### critical()

> **critical**(...`args`): `void`

Defined in: [ScopedLogger.ts:762](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L762)

Atajo a `scopedLogger.critical(...)`. El contexto se aplica al prefijo
del scope padre solo si se invoca dentro de un bloque [run](#run)/[start](#start).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`
