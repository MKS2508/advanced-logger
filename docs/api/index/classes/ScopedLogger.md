---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ScopedLogger

# Class: ScopedLogger

Defined in: [ScopedLogger.ts:34](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L34)

Logger prefijado por un scope nominal. Mantiene su propio stack de badges
y contextos y delega el envío de mensajes al [Logger](Logger.md) padre a través
de bindings (`{ scope, badges }`).

Es la base de la jerarquía temática: [APILogger](APILogger.md) y
[ComponentLogger](ComponentLogger.md) extienden de ella, y [ContextLogger](ContextLogger.md) la
consume para apilar/subdesapilar sub-prefijos en el scope.

No se construye directamente: se obtiene con `logger.scope('name')`.

## Examples

```ts
// El factory method del Logger raíz devuelve un ScopedLogger
import logger from '@mks2508/better-logger';

const http = logger.scope('HTTP');
http.badge('OUTBOUND').info('Request enviada');
// salida: [HTTP] [OUTBOUND] Request enviada
```

```ts
// Anidar contextos dentro de un scope (el prefijo se compone con ':')
const retry = http.context('retry');
retry.run(() => http.warn('Reintentando petición'));
// salida: [HTTP:retry] Reintentando petición
```

## See

 - [Logger.scope](Logger.md#scope)
 - [APILogger](APILogger.md)
 - [ComponentLogger](ComponentLogger.md)
 - [ContextLogger](ContextLogger.md)

## Extended by

- [`APILogger`](APILogger.md)
- [`ComponentLogger`](ComponentLogger.md)

## Constructors

### Constructor

> **new ScopedLogger**(`parent`, `scopeName`): `ScopedLogger`

Defined in: [ScopedLogger.ts:51](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L51)

Construye un ScopedLogger vinculado a un [Logger](Logger.md) padre.

Los clientes no deben llamar a este constructor directamente: usen
`logger.scope(name)`, que configura correctamente la instancia.

#### Parameters

##### parent

[`Logger`](Logger.md)

Logger raíz al que se delegan los mensajes.

##### scopeName

`string`

Etiqueta del scope; se renderiza como
  prefijo `[scopeName]` en cada línea.

#### Returns

`ScopedLogger`

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

 - [badge](#badge) para añadir sin reemplazar los existentes.
 - [clearBadges](#clearbadges) para vaciar la lista.

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

[timeEnd](#timeend)

***

### timeEnd()

> **timeEnd**(`label`): `number` \| `undefined`

Defined in: [ScopedLogger.ts:200](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L200)

Detiene un timer previamente iniciado con [time](#time) y registra la
duración con nivel `success`. Si el label no existe, emite un `warn`
y devuelve `undefined`.

#### Parameters

##### label

`string`

Mismo label pasado a [time](#time).

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

***

### divider()

> **divider**(): `void`

Defined in: [ScopedLogger.ts:333](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L333)

Delegación a [Logger.divider](Logger.md#divider): imprime una línea separadora horizontal.

#### Returns

`void`

#### See

[Logger.divider](Logger.md#divider)

***

### blank()

> **blank**(): `void`

Defined in: [ScopedLogger.ts:341](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/ScopedLogger.ts#L341)

Delegación a [Logger.blank](Logger.md#blank): inserta una línea en blanco.

#### Returns

`void`

#### See

[Logger.blank](Logger.md#blank)

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
