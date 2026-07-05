---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / ServerFallback

# Class: ServerFallback

Defined in: [playground/server-fallback.ts:35](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L35)

Degradación de CLI primitives para modo server/non-TTY.

Cada método espeja uno del TerminalBridge (`step`/`header`/`box`/...)
y decide cómo renderizarlo sin depender de caracteres de caja ni control
ANSI: texto plano al logger, o no-op cuando no hay nada útil que emitir.

## Example

```ts
// En CI (sin TTY), TerminalBridge enruta automáticamente aquí:
logger.step(2, 5, 'Compilando');      // logger.info('[2/5] Compilando')
logger.header('Build', 'v1.2.3');     // logger.info('Build v1.2.3')
logger.divider();                     // (no-op)
```

## See

TerminalBridge para el dispatcher TTY-vs-server.

## Constructors

### Constructor

> **new ServerFallback**(`logger`): `ServerFallback`

Defined in: [playground/server-fallback.ts:44](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L44)

#### Parameters

##### logger

[`Logger`](../../index/classes/Logger.md)

Logger sobre el que se emiten los mensajes
  degradados. Respeta el `outputMode` que tenga configurado (json,
  console, ...), por lo que funciona tanto para logs estructurados
  como para texto plano.

#### Returns

`ServerFallback`

## Methods

### step()

> **step**(`current`, `total`, `msg`): `void`

Defined in: [playground/server-fallback.ts:58](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L58)

Emite un step como `logger.info` con el contador `[current/total]`
prefijado al mensaje. Conserva el orden y el progreso sin depender
de caracteres de caja.

#### Parameters

##### current

`number`

Índice del step actual (1-based).

##### total

`number`

Total de steps del run.

##### msg

`string`

Descripción del step.

#### Returns

`void`

***

### header()

> **header**(`title`, `subtitle?`): `void`

Defined in: [playground/server-fallback.ts:71](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L71)

Emite el título (y subtítulo opcional) como `logger.info`. No pinta
bordes ni separadores — en modo server solo interesa el texto.

#### Parameters

##### title

`string`

Texto principal del header.

##### subtitle?

`string`

Subtítulo optativo; se concatena con
  espacio si viene.

#### Returns

`void`

***

### divider()

> **divider**(): `void`

Defined in: [playground/server-fallback.ts:82](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L82)

No-op: un divisor visual (`───`) no aporta nada a un log server/JSON
y solo ensuciaría el stream.

#### Returns

`void`

***

### blank()

> **blank**(): `void`

Defined in: [playground/server-fallback.ts:92](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L92)

No-op: las líneas en blanco rompen la consistencia de un log JSON
(cada línea debería ser un registro parseable).

#### Returns

`void`

***

### box()

> **box**(`content`, `_options?`): `void`

Defined in: [playground/server-fallback.ts:106](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L106)

Emite el contenido del box como `logger.info`, ignorando bordes y
opciones de estilo (`title`, `borderColor`, ...). En modo server lo
que importa es el payload, no el embalaje.

#### Parameters

##### content

`string`

Texto a registrar.

##### \_options?

[`IBoxOptions`](../../index/interfaces/IBoxOptions.md)

Opciones de box de la API TTY;
  ignoradas en este fallback.

#### Returns

`void`

***

### cliTable()

> **cliTable**(`rows`, `_options?`): `void`

Defined in: [playground/server-fallback.ts:134](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/server-fallback.ts#L134)

Emite cada fila de la tabla como un `logger.info` con la fila
serializada a JSON, en lugar de pintar una grilla ASCII.

Cada fila queda como su propio registro JSON — útil para filtrar por
columna en tools como `jq` o Loki. Las opciones de columnas/headers
(`ITableOptions.columns` / `ITableOptions.head`) se ignoran: en modo
server los keys del objeto son la fuente de verdad.

#### Parameters

##### rows

`Record`\<`string`, `unknown`\>[]

Filas a emitir.

##### \_options?

[`ITableOptions`](../../index/interfaces/ITableOptions.md)

Opciones de tabla de la API TTY;
  ignoradas en este fallback.

#### Returns

`void`

#### Example

```ts
serverFallback.cliTable([
  { user: 'alice', age: 30 },
  { user: 'bob',   age: 25 }
]);
// logger.info('{"user":"alice","age":30}')
// logger.info('{"user":"bob","age":25}')
```
