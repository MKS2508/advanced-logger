---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / ConsoleTransport

# Class: ConsoleTransport

Defined in: [transports/ConsoleTransport.ts:46](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/ConsoleTransport.ts#L46)

Transport por defecto que escribe cada [TransportRecord](../../index/interfaces/TransportRecord.md) al `console`
global del runtime (navegador o Node.js).

Es el transport que el Logger registra automáticamente cuando no se configura
ninguno explícito, garantizando que los registros siempre lleguen a un
destino visible sin configuración adicional.

**Mapeo level → console method**: traduce cada nivel de log al método más
cercano de la API `console`, de forma que el filtrado nativo del DevTools /
`NODE_DEBUG` siga funcionando:

| LogLevel     | console method |
|--------------|----------------|
| `debug`      | `console.log`  |
| `info`       | `console.info` |
| `warn`       | `console.warn` |
| `error`      | `console.error`|
| `critical`   | `console.error`|

**Formato de output**: cada línea se compone como
`[LEVEL] [prefix] message (file:line)`, donde `prefix` y la localización
se omiten si el registro no las trae.

## Examples

```ts
// Uso directo como ITransport
import { ConsoleTransport } from '@mks2508/better-logger/transports';
const transport = new ConsoleTransport();
transport.write({
  level: 'info',
  msg: 'Arrancando worker',
  prefix: 'worker',
  // ... resto del TransportRecord
});
// → console.info("[INFO] [worker] Arrancando worker (worker.ts:12)")
```

```ts
// Registro a través del Logger (típico — el logger lo añade por defecto)
logger.addTransport({ target: new ConsoleTransport() });
```

## See

 - [ITransport](../../index/interfaces/ITransport.md)
 - [TransportRecord](../../index/interfaces/TransportRecord.md)

## Implements

- [`ITransport`](../../index/interfaces/ITransport.md)

## Constructors

### Constructor

> **new ConsoleTransport**(`options?`): `ConsoleTransport`

Defined in: [transports/ConsoleTransport.ts:64](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/ConsoleTransport.ts#L64)

Crea una instancia de ConsoleTransport.

El parámetro `options` se acepta para cumplir con la firma canónica de
[TransportOptions](../../index/interfaces/TransportOptions.md) (filtros de nivel, formateadores, etc.), aunque
la implementación actual escribe el registro tal cual llega sin
transformaciones adicionales.

#### Parameters

##### options?

[`TransportOptions`](../../index/interfaces/TransportOptions.md)

Configuración opcional del transport
(nivel mínimo, formatter, etc.).

#### Returns

`ConsoleTransport`

#### Example

```ts
const transport = new ConsoleTransport({ level: 'warn' });
```

## Properties

### name

> `readonly` **name**: `"console"` = `'console'`

Defined in: [transports/ConsoleTransport.ts:48](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/ConsoleTransport.ts#L48)

Identificador del transport usado por el Logger para deduplicar y exponer metadatos.

#### Implementation of

[`ITransport`](../../index/interfaces/ITransport.md).[`name`](../../index/interfaces/ITransport.md#name)

## Methods

### write()

> **write**(`record`): `void`

Defined in: [transports/ConsoleTransport.ts:87](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/ConsoleTransport.ts#L87)

Escribe un [TransportRecord](../../index/interfaces/TransportRecord.md) al `console` global.

Selecciona el método de console según el nivel del registro, compone el
prefijo `[LEVEL] [prefix]` y, si la localización está disponible, añade
el sufijo `(file:line)`. No lanza ni retorna errores: si `console[method]`
fallara (raro), la excepción propagaría al caller.

#### Parameters

##### record

[`TransportRecord`](../../index/interfaces/TransportRecord.md)

Registro normalizado producido por el Logger.

#### Returns

`void`

#### Example

```ts
transport.write({
  level: 'error',
  msg: 'DB connection lost',
  prefix: 'db',
  location: { file: 'pool.ts', line: 87, function: 'acquire' },
  // ... resto del TransportRecord
});
// → console.error("[ERROR] [db] DB connection lost (pool.ts:87)")
```

#### Implementation of

[`ITransport`](../../index/interfaces/ITransport.md).[`write`](../../index/interfaces/ITransport.md#write)
