---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [core](../README.md) / CoreLogger

# Class: CoreLogger

Defined in: [core.ts:57](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L57)

Logger minimal con solo la funcionalidad core.

## Example

```typescript
import { CoreLogger } from '@mks2508/better-logger/core';

const logger = new CoreLogger();
logger.info('Hello world');
logger.error('Something went wrong', error);
```

## Constructors

### Constructor

> **new CoreLogger**(`config?`): `CoreLogger`

Defined in: [core.ts:68](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L68)

Crea una nueva instancia de CoreLogger.

#### Parameters

##### config?

`Partial`\<[`LoggerConfig`](../../index/interfaces/LoggerConfig.md)\> = `{}`

Configuración opcional.

#### Returns

`CoreLogger`

## Methods

### getConfig()

> **getConfig**(): [`LoggerConfig`](../../index/interfaces/LoggerConfig.md)

Defined in: [core.ts:86](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L86)

Obtiene la configuración actual.

#### Returns

[`LoggerConfig`](../../index/interfaces/LoggerConfig.md)

***

### setGlobalPrefix()

> **setGlobalPrefix**(`prefix`): `void`

Defined in: [core.ts:94](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L94)

Define el prefijo global para todos los mensajes de log.

#### Parameters

##### prefix

`string`

Prefijo a aplicar a todos los mensajes.

#### Returns

`void`

***

### setVerbosity()

> **setVerbosity**(`level`): `void`

Defined in: [core.ts:102](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L102)

Define el nivel de verbosity para filtrar la salida de log.

#### Parameters

##### level

[`Verbosity`](../../index/type-aliases/Verbosity.md)

Nivel de verbosity.

#### Returns

`void`

***

### scope()

> **scope**(`prefix`): `CoreLogger`

Defined in: [core.ts:111](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L111)

Crea un logger con scope y un prefijo específico.

#### Parameters

##### prefix

`string`

Prefijo del scope.

#### Returns

`CoreLogger`

Nueva instancia de CoreLogger con el prefijo asignado.

***

### addHandler()

> **addHandler**(`handler`): `void`

Defined in: [core.ts:122](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L122)

Añade un handler personalizado para extensibilidad.

#### Parameters

##### handler

[`ILogHandler`](../../index/interfaces/ILogHandler.md)

Handler que implementa la interfaz ILogHandler.

#### Returns

`void`

***

### debug()

> **debug**(...`args`): `void`

Defined in: [core.ts:208](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L208)

Emite mensajes de debug (prioridad más baja).

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### info()

> **info**(...`args`): `void`

Defined in: [core.ts:216](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L216)

Emite mensajes informativos.

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### warn()

> **warn**(...`args`): `void`

Defined in: [core.ts:224](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L224)

Emite mensajes de advertencia.

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### error()

> **error**(...`args`): `void`

Defined in: [core.ts:232](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L232)

Emite mensajes de error.

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### critical()

> **critical**(...`args`): `void`

Defined in: [core.ts:240](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L240)

Emite errores críticos (prioridad más alta).

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### trace()

> **trace**(...`args`): `void`

Defined in: [core.ts:248](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L248)

Emite información de trace (debugging detallado).

#### Parameters

##### args

...`unknown`[]

Argumentos del mensaje.

#### Returns

`void`

***

### table()

> **table**(`data`, `columns?`): `void`

Defined in: [core.ts:262](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L262)

Muestra datos en formato tabla.

#### Parameters

##### data

`any`

Datos a mostrar.

##### columns?

`string`[]

Columnas opcionales a incluir.

#### Returns

`void`

***

### group()

> **group**(`label`, `collapsed?`): `void`

Defined in: [core.ts:289](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L289)

Inicia un grupo colapsable en la console.

#### Parameters

##### label

`string`

Etiqueta del grupo.

##### collapsed?

`boolean` = `false`

Si el grupo inicia colapsado.

#### Returns

`void`

***

### groupEnd()

> **groupEnd**(): `void`

Defined in: [core.ts:312](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L312)

Cierra el grupo actual de la console.

#### Returns

`void`

***

### time()

> **time**(`label`): `void`

Defined in: [core.ts:329](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L329)

Inicia un timer con el label indicado.

#### Parameters

##### label

`string`

Identificador del timer.

#### Returns

`void`

***

### timeEnd()

> **timeEnd**(`label`): `void`

Defined in: [core.ts:347](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/core.ts#L347)

Detiene un timer y emite el tiempo transcurrido.

#### Parameters

##### label

`string`

Identificador del timer previamente iniciado.

#### Returns

`void`
