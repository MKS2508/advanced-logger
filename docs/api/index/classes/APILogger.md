---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / APILogger

# Class: APILogger

Defined in: [ScopedLogger.ts:434](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L434)

Logger especializado para llamadas a APIs y servicios externos.

Extiende [ScopedLogger](ScopedLogger.md) pre-seteando el badge `API` y exponiendo
atajos para eventos típicos de integración: llamadas lentas ([slow](#slow)),
rate limiting ([rateLimit](#ratelimit)), fallos de autenticación ([auth](#auth)) y
APIs deprecadas ([deprecated](#deprecated)).

Se obtiene con `logger.api(name)` y no se construye directamente.

## Example

```ts
import logger from '@mks2508/better-logger';

const stripe = logger.api('Stripe');
stripe.info('Consultando customer', { id });
// salida: [API:Stripe] [API] Consultando customer

stripe.slow('customer.retrieve', 1250);
// salida: [API:Stripe] [API] [SLOW] customer.retrieve (1250ms)
```

## See

 - [Logger.api](Logger.md#api)
 - [ScopedLogger](ScopedLogger.md)

## Extends

- [`ScopedLogger`](ScopedLogger.md)

## Constructors

### Constructor

> **new APILogger**(`parent`, `apiName`): `APILogger`

Defined in: [ScopedLogger.ts:443](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L443)

Construye un APILogger con scope `API:<apiName>` y badge `API` ya aplicado.

Los clientes deben usar `logger.api(name)`.

#### Parameters

##### parent

[`Logger`](Logger.md)

Logger raíz al que se delegan los mensajes.

##### apiName

`string`

Nombre del servicio/API (se prefija con `API:`).

#### Returns

`APILogger`

#### Overrides

[`ScopedLogger`](ScopedLogger.md).[`constructor`](ScopedLogger.md#constructor)

## Methods

### badges()

> **badges**(`badges`): `this`

Defined in: [ScopedLogger.ts:88](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L88)

Reemplaza la lista actual de badges por la pasada y la aplica a todos
los mensajes posteriores de este scope.

#### Parameters

##### badges

`string`[]

Etiquetas a mostrar como badges adyacentes
  al prefijo (p. ej. `['OUTBOUND', 'CACHED']`).

#### Returns

`this`

La misma instancia, para encadenar llamadas.

#### Example

```ts
logger.scope('HTTP').badges(['OUTBOUND', 'CACHED']).info('Cache hit');
// salida: [HTTP] [OUTBOUND] [CACHED] Cache hit
```

#### See

 - [badge](ScopedLogger.md#badge) para añadir sin reemplazar los existentes.
 - [clearBadges](ScopedLogger.md#clearbadges) para vaciar la lista.

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`badges`](ScopedLogger.md#badges)

***

### badge()

> **badge**(`badge`): `this`

Defined in: [ScopedLogger.ts:106](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L106)

Añade un badge al scope de forma idempotente (no lo duplica si ya existe).

#### Parameters

##### badge

`string`

Etiqueta a añadir a la lista de badges.

#### Returns

`this`

La misma instancia, para encadenar llamadas.

#### Example

```ts
logger.scope('API')
  .badge('OUTBOUND')
  .badge('RETRY')
  .warn('Reintentando');
// salida: [API] [OUTBOUND] [RETRY] Reintentando
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`badge`](ScopedLogger.md#badge)

***

### clearBadges()

> **clearBadges**(): `this`

Defined in: [ScopedLogger.ts:124](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L124)

Vacía la lista de badges del scope.

#### Returns

`this`

La misma instancia, para encadenar llamadas.

#### Example

```ts
const http = logger.scope('HTTP');
http.badge('OUTBOUND').info('uno');
http.clearBadges().info('dos');
// [HTTP] [OUTBOUND] uno   /   [HTTP] dos
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`clearBadges`](ScopedLogger.md#clearbadges)

***

### style()

> **style**(`presetName`): `this`

Defined in: [ScopedLogger.ts:140](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L140)

Aplica un theme preset al logger padre. El preset afecta a toda la
instancia raíz (no solo a este scope) porque el style es compartido.

#### Parameters

##### presetName

`string`

Nombre del preset registrado en el StyleManager.

#### Returns

`this`

La misma instancia, para encadenar llamadas.

#### Example

```ts
logger.scope('UI').style('cyberpunk').info('neon');
```

#### See

[Logger.setTheme](Logger.md#settheme)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`style`](ScopedLogger.md#style)

***

### context()

> **context**(`contextName`): [`ContextLogger`](ContextLogger.md)

Defined in: [ScopedLogger.ts:159](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L159)

Crea un [ContextLogger](ContextLogger.md) vinculado a este scope. Los contextos se
apilan en el prefijo separados por `:`, permitiendo agrupar bloques de
logs relacionados (reintentos, sub-etapas, etc.) sin `console.group`.

#### Parameters

##### contextName

`string`

Nombre del contexto a apilar.

#### Returns

[`ContextLogger`](ContextLogger.md)

Handler con `run`, `runAsync`, `start`/`end`.

#### Example

```ts
const retry = logger.scope('HTTP').context('retry');
retry.run(() => logger.warn('Reintentando'));
// salida: [HTTP:retry] Reintentando
```

#### See

[ContextLogger](ContextLogger.md)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`context`](ScopedLogger.md#context)

***

### time()

> **time**(`label`): `void`

Defined in: [ScopedLogger.ts:177](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L177)

Inicia un timer etiquetado bajo el namespace `<scopeName>:<label>`.
El label es local a este scope, así que dos scopes pueden reutilizar el
mismo nombre sin colisión.

#### Parameters

##### label

`string`

Identificador del timer.

#### Returns

`void`

#### Example

```ts
const http = logger.scope('HTTP');
http.time('request');
// ... trabajo ...
http.timeEnd('request'); // imprime "Timer: request - 12.34ms"
```

#### See

[timeEnd](ScopedLogger.md#timeend)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`time`](ScopedLogger.md#time)

***

### timeEnd()

> **timeEnd**(`label`): `number` \| `undefined`

Defined in: [ScopedLogger.ts:200](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L200)

Detiene un timer previamente iniciado con [time](ScopedLogger.md#time) y registra la
duración con nivel `success`. Si el label no existe, emite un `warn`
y devuelve `undefined`.

#### Parameters

##### label

`string`

Mismo label pasado a [time](ScopedLogger.md#time).

#### Returns

`number` \| `undefined`

Milisegundos transcurridos, o `undefined`
  si el timer no estaba registrado.

#### Example

```ts
const http = logger.scope('HTTP');
http.time('fetch');
await fetch(url);
const ms = http.timeEnd('fetch');
if (ms && ms > 1000) http.warn('Latencia alta');
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`timeEnd`](ScopedLogger.md#timeend)

***

### debug()

> **debug**(...`args`): `void`

Defined in: [ScopedLogger.ts:221](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L221)

Emite un mensaje a nivel `debug` con los bindings actuales del scope.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales (objetos,
  errores, etc.) serializados igual que en el logger raíz.

#### Returns

`void`

#### Example

```ts
logger.scope('DB').debug('query', { sql, params });
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`debug`](ScopedLogger.md#debug)

***

### info()

> **info**(...`args`): `void`

Defined in: [ScopedLogger.ts:233](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L233)

Emite un mensaje a nivel `info` con los bindings actuales del scope.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

#### Example

```ts
logger.scope('AUTH').info('Login exitoso', { userId });
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`info`](ScopedLogger.md#info)

***

### warn()

> **warn**(...`args`): `void`

Defined in: [ScopedLogger.ts:245](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L245)

Emite un mensaje a nivel `warn` con los bindings actuales del scope.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

#### Example

```ts
logger.scope('CACHE').warn('Cache miss', { key });
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`warn`](ScopedLogger.md#warn)

***

### error()

> **error**(...`args`): `void`

Defined in: [ScopedLogger.ts:258](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L258)

Emite un mensaje a nivel `error` con los bindings actuales del scope.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales (típicamente
  un `Error` o contexto del fallo).

#### Returns

`void`

#### Example

```ts
logger.scope('DB').error('Conexión rechazada', err);
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`error`](ScopedLogger.md#error)

***

### success()

> **success**(...`args`): `void`

Defined in: [ScopedLogger.ts:272](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L272)

Emite un mensaje con badge visual `SUCCESS` a nivel `info`. Úselo para
hitos positivos dentro del scope (conexión establecida, sync completo,
commit aplicado).

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

#### Example

```ts
logger.scope('SYNC').success('Sincronización completa', { count: 42 });
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`success`](ScopedLogger.md#success)

***

### critical()

> **critical**(...`args`): `void`

Defined in: [ScopedLogger.ts:286](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L286)

Emite un mensaje a nivel `critical` con los bindings actuales del scope.
Reservado para fallos que detienen el flujo de la aplicación.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

#### Example

```ts
logger.scope('PAY').critical('Pasarela inaccesible', err);
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`critical`](ScopedLogger.md#critical)

***

### trace()

> **trace**(...`args`): `void`

Defined in: [ScopedLogger.ts:299](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L299)

Emite un mensaje a nivel `trace` (verbosidad máxima) con los bindings
actuales del scope. Solo aparece si la verbosity global lo permite.

#### Parameters

##### args

...`unknown`[]

Mensaje y argumentos adicionales.

#### Returns

`void`

#### Example

```ts
logger.scope('NET').trace('packet', { bytes });
```

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`trace`](ScopedLogger.md#trace)

***

### step()

> **step**(`current`, `total`, `message`): `void`

Defined in: [ScopedLogger.ts:314](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L314)

Delegación a [Logger.step](Logger.md#step): dibuja una barra de progreso discreta
`current/total` para este scope.

#### Parameters

##### current

`number`

Paso actual (1-indexed).

##### total

`number`

Total de pasos.

##### message

`string`

Texto mostrado junto al contador.

#### Returns

`void`

#### See

[Logger.step](Logger.md#step)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`step`](ScopedLogger.md#step)

***

### header()

> **header**(`title`, `subtitle?`): `void`

Defined in: [ScopedLogger.ts:325](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L325)

Delegación a [Logger.header](Logger.md#header): imprime un título con separadores visuales.

#### Parameters

##### title

`string`

Texto del título.

##### subtitle?

`string`

Subtítulo opcional bajo el título.

#### Returns

`void`

#### See

[Logger.header](Logger.md#header)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`header`](ScopedLogger.md#header)

***

### divider()

> **divider**(): `void`

Defined in: [ScopedLogger.ts:333](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L333)

Delegación a [Logger.divider](Logger.md#divider): imprime una línea separadora horizontal.

#### Returns

`void`

#### See

[Logger.divider](Logger.md#divider)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`divider`](ScopedLogger.md#divider)

***

### blank()

> **blank**(): `void`

Defined in: [ScopedLogger.ts:341](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L341)

Delegación a [Logger.blank](Logger.md#blank): inserta una línea en blanco.

#### Returns

`void`

#### See

[Logger.blank](Logger.md#blank)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`blank`](ScopedLogger.md#blank)

***

### box()

> **box**(`content`, `options?`): `void`

Defined in: [ScopedLogger.ts:352](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L352)

Delegación a [Logger.box](Logger.md#box): dibuja un recuadro ANSI alrededor de `content`.

#### Parameters

##### content

`string`

Texto a enmarcar.

##### options?

[`IBoxOptions`](../interfaces/IBoxOptions.md)

Opciones de estilo del box.

#### Returns

`void`

#### See

[Logger.box](Logger.md#box)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`box`](ScopedLogger.md#box)

***

### cliTable()

> **cliTable**(`rows`, `options?`): `void`

Defined in: [ScopedLogger.ts:363](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L363)

Delegación a [Logger.cliTable](Logger.md#clitable): renderiza `rows` como tabla ASCII.

#### Parameters

##### rows

`Record`\<`string`, `unknown`\>[]

Filas a mostrar.

##### options?

[`ITableOptions`](../interfaces/ITableOptions.md)

Opciones de columnas y estilo.

#### Returns

`void`

#### See

[Logger.cliTable](Logger.md#clitable)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`cliTable`](ScopedLogger.md#clitable)

***

### spinner()

> **spinner**(`message`): [`ISpinnerHandle`](../interfaces/ISpinnerHandle.md)

Defined in: [ScopedLogger.ts:374](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L374)

Delegación a [Logger.spinner](Logger.md#spinner): arranca un spinner con `message`.

#### Parameters

##### message

`string`

Texto a mostrar al lado del spinner.

#### Returns

[`ISpinnerHandle`](../interfaces/ISpinnerHandle.md)

Handle para detener/actualizar el spinner.

#### See

[Logger.spinner](Logger.md#spinner)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`spinner`](ScopedLogger.md#spinner)

***

### setCLILevel()

> **setCLILevel**(`level`): `void`

Defined in: [ScopedLogger.ts:385](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L385)

Delegación a [Logger.setCLILevel](Logger.md#setclilevel): ajusta el nivel mínimo de las
primitivas CLI visibles.

#### Parameters

##### level

[`CLILogLevel`](../type-aliases/CLILogLevel.md)

Nivel CLI (`silent` … `verbose`).

#### Returns

`void`

#### See

[Logger.setCLILevel](Logger.md#setclilevel)

#### Inherited from

[`ScopedLogger`](ScopedLogger.md).[`setCLILevel`](ScopedLogger.md#setclilevel)

***

### slow()

> **slow**(`message`, `duration?`): `void`

Defined in: [ScopedLogger.ts:460](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L460)

Registra una llamada lenta con badge `SLOW` a nivel `warn`.

#### Parameters

##### message

`string`

Descripción de la operación lenta.

##### duration?

`number`

Duración medida en ms; si se pasa, se
  anexa al mensaje como `(Nms)`.

#### Returns

`void`

#### Example

```ts
const t0 = performance.now();
await stripe.customers.retrieve(id);
logger.api('Stripe').slow('retrieve', performance.now() - t0);
```

***

### rateLimit()

> **rateLimit**(`message`): `void`

Defined in: [ScopedLogger.ts:474](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L474)

Registra un evento de rate limiting (HTTP 429) con badge `RATE_LIMIT`.

#### Parameters

##### message

`string`

Detalle del límite golpeado.

#### Returns

`void`

#### Example

```ts
logger.api('GitHub').rateLimit('Secondary rate limit on /search');
```

***

### auth()

> **auth**(`message`): `void`

Defined in: [ScopedLogger.ts:488](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L488)

Registra un fallo de autenticación (401/403) con badge `AUTH` a nivel
`error`.

#### Parameters

##### message

`string`

Detalle del fallo de credenciales/token.

#### Returns

`void`

#### Example

```ts
logger.api('OAuth').auth('Token expirado');
```

***

### deprecated()

> **deprecated**(`message`): `void`

Defined in: [ScopedLogger.ts:502](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L502)

Marca una API como deprecada con badge `DEPRECATED` a nivel `warn`.

#### Parameters

##### message

`string`

Mensaje guiando a la migración (endpoint
  alternativo, versión retirada, etc.).

#### Returns

`void`

#### Example

```ts
logger.api('Legacy').deprecated('Usar v3; v2 se retira en Q4');
```
