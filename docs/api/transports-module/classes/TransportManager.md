---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / TransportManager

# Class: TransportManager

Defined in: [transports/TransportManager.ts:117](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L117)

Registry y dispatcher de transports. Mantiene el set activo de destinos
de log (console, file, http, otlp, o transports custom registrados vía
[TransportManager.register](#register)) y les dispatcha cada
[TransportRecord](../../index/interfaces/TransportRecord.md) producido por el Logger.

Cada transport added se identifica por un `id` opaco (generado por la
propia instancia) que devuelven [add](#add) y [list](#list), y que acepta
[remove](#remove). El registry arranca con los cuatro built-ins
(`console` / `file` / `http` / `otlp`) ya cargados; [register](#register)
añade customs sin poder sobreescribir los built-ins (lanza).

El dispatch ([write](#write)) aplica el filtro de `level` por transport y
el `transform` opcional de [TransportOptions](../../index/interfaces/TransportOptions.md), y captura toda
excepción / rechazo de cada transport para que un transport roto nunca
rompa el log call del caller. El propio Logger habla con el manager a
través del facade TransportBridge (ver
`Logger.addTransport` / `Logger.getTransportManager`).

Implementa ITransportManager.

## Examples

```ts
// Manager con nivel default y transports añadidos por nombre
const tm = new TransportManager('info');
tm.add({ target: 'console' });
tm.add({ target: 'file', options: { path: './app.log' } });
```

```ts
// Registrar un transport custom y usarlo por nombre
tm.register('datadog', DatadogTransport);
tm.add({ target: 'datadog', options: { apiKey: env('DD_KEY') } });
```

```ts
// Pasar una instancia de ITransport directamente (sin pasar por registry)
tm.add({ target: new MyTransport(), level: 'warn' });
```

```ts
// Dispatch + ciclo de vida
await tm.write(record);
await tm.flush();   // flusha todos los buffered
await tm.close();   // flush + close + clear
```

## See

 - ITransportManager
 - [TransportTarget](../../index/interfaces/TransportTarget.md)
 - TransportBridge

## Implements

- `ITransportManager`

## Constructors

### Constructor

> **new TransportManager**(`defaultLevel?`): `TransportManager`

Defined in: [transports/TransportManager.ts:133](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L133)

Crea un nuevo manager.

#### Parameters

##### defaultLevel?

`"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Nivel mínimo por defecto
  para transports añadidos sin `level` explícito en su
  [TransportTarget](../../index/interfaces/TransportTarget.md). Records con `levelValue` inferior al del
  transport se descartan en [write](#write).

#### Returns

`TransportManager`

#### Example

```ts
const tm = new TransportManager('debug'); // todo pasa salvo filter propio
```

## Accessors

### count

#### Get Signature

> **get** **count**(): `number`

Defined in: [transports/TransportManager.ts:440](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L440)

Número de transports actualmente en el set activo.

##### Example

```ts
if (tm.count === 0) console.warn('no transports configured');
```

##### Returns

`number`

## Methods

### register()

> **register**(`name`, `ctor`): `void`

Defined in: [transports/TransportManager.ts:161](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L161)

Registra un constructor de transport bajo un nombre string. Tras el
registro, `add({ target: name, options })` instancia ese transport con
las options pasadas.

No se puede sobreescribir un built-in (`console` / `file` / `http` /
`otlp`): lanza para evitar silenciar un transport crítico por un
accidente de naming. El registro es por-instancia (no comparte entre
managers).

#### Parameters

##### name

`string`

Nombre bajo el que registrar (usado luego como
  `target` en [TransportTarget](../../index/interfaces/TransportTarget.md)).

##### ctor

`TransportConstructor`

Constructor que acepta
  [TransportOptions](../../index/interfaces/TransportOptions.md) y devuelve un [ITransport](../../index/interfaces/ITransport.md).

#### Returns

`void`

#### Throws

Si `name` colisiona con un built-in del registry.

#### Example

```ts
tm.register('datadog', DatadogTransport);
tm.add({ target: 'datadog', options: { apiKey: env('DD_KEY') } });
```

#### See

[listRegistered](#listregistered)

***

### listRegistered()

> **listRegistered**(): `string`[]

Defined in: [transports/TransportManager.ts:179](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L179)

Lista los nombres de transports registrados en esta instancia
(built-ins + customs añadidos vía [register](#register)).

#### Returns

`string`[]

Nombres registrados. Incluye siempre los cuatro
  built-ins.

#### Example

```ts
tm.register('loki', LokiTransport);
tm.listRegistered(); // ['console', 'file', 'http', 'otlp', 'loki']
```

***

### add()

> **add**(`target`): `string`

Defined in: [transports/TransportManager.ts:220](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L220)

Añade un transport al set activo y devuelve su id opaco.

Acepta dos formas de `target`:
  - **string**: se resuelve contra el registry (built-ins + customs
    vía [register](#register)). Lanza si el nombre no existe, listando los
    registrados para facilitar el debug.
  - **ITransport instancia**: se registra tal cual, sin pasar por el
    registry. Útil para transports one-off o cuya configuración no
    encaja en un constructor reutilizable.

El `level` (explícito en el target o `defaultLevel` del manager) fija
el filtro por transport — los records con `levelValue` inferior se
descartan en [write](#write). El `transform` opcional de
[TransportOptions](../../index/interfaces/TransportOptions.md) se aplica por transport antes de delegar al
`write` concreto.

#### Parameters

##### target

[`TransportTarget`](../../index/interfaces/TransportTarget.md)

Especificación del transport a añadir.

#### Returns

`string`

Id opaco del transport añadido. Úsalo con
  [remove](#remove); aparece en [list](#list).

#### Throws

Si `target.target` es un string no presente en el
  registry.

#### Examples

```ts
// Por nombre (built-in o custom registrado)
const id = tm.add({ target: 'console' });
```

```ts
// Instancia directa con nivel y transform propios
const id = tm.add({
  target: new MyTransport(),
  level: 'warn',
  options: { transform: r => r.level === 'debug' ? null : r }
});
```

#### See

[TransportTarget](../../index/interfaces/TransportTarget.md)

#### Implementation of

`ITransportManager.add`

***

### remove()

> **remove**(`id`): `boolean`

Defined in: [transports/TransportManager.ts:266](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L266)

Elimina un transport del set por su id. Si el transport expone
`close()`, lo invoca para liberar recursos (timers, sockets, file
handles). Si `close()` devuelve una Promise, su eventual rechazo se
ignora de forma best-effort — los errores de close durante la
remoción no se propagan al caller.

#### Parameters

##### id

`string`

Id devuelto por [add](#add).

#### Returns

`boolean`

`true` si había un transport con ese id (y se
  eliminó), `false` si el id no existía.

#### Example

```ts
const id = tm.add({ target: 'file', options: { path: './app.log' } });
tm.remove(id); // true — FileTransport.close() se invoca
```

#### Implementation of

`ITransportManager.remove`

***

### write()

> **write**(`record`): `Promise`\<`void`\>

Defined in: [transports/TransportManager.ts:312](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L312)

Dispatcha un [TransportRecord](../../index/interfaces/TransportRecord.md) a todos los transports activos
que pasen el filtro de nivel.

Por cada transport, en orden:
  1. **Filtro de nivel**: si `record.levelValue < entry.levelValue`,
     se skipa (ese transport no recibe este record).
  2. **Transform**: si `entry.options.transform` está seteado, se
     aplica al record. Si devuelve `null`, el record se droppea para
     este transport (no para los demás).
  3. **Write**: se llama a `transport.write(transformedRecord)`. Si
     devuelve una Promise, se añade al batch await. Toda excepción
     sincrónica o rechazo de Promise se captura y se loguea por
     consola — el log call original del caller nunca rompe por un
     transport roto.

El método es async: retorna después de que todos los transports hayan
resuelto (o fallado) su write. Para fire-and-forget desde el Logger,
el caller puede ignorar la Promise.

#### Parameters

##### record

[`TransportRecord`](../../index/interfaces/TransportRecord.md)

Record a dispatchar.

#### Returns

`Promise`\<`void`\>

Resuelve cuando todos los writes terminaron
  (exitosos o fallidos). Nunca rechaza.

#### Example

```ts
await tm.write({
  level: 'info', levelValue: 1, severityNumber: 9, severityText: 'INFO',
  time: Date.now(), msg: 'boot ok'
});
```

#### See

[TransportRecord](../../index/interfaces/TransportRecord.md)

#### Implementation of

`ITransportManager.write`

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [transports/TransportManager.ts:364](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L364)

Flushea todos los transports que expongan `flush()` (buffered transports
como [HttpTransport](HttpTransport.md), [FileTransport](FileTransport.md), [OtlpTransport](OtlpTransport.md)).
Los transports sin `flush()` (p.ej. [ConsoleTransport](ConsoleTransport.md)) se
skipan sin error.

Errores de flush (sync throw o Promise rejection) se capturan y
loguean por consola — nunca propagan al caller. Útil para forzar el
envío del batch pendiente antes de un graceful shutdown.

#### Returns

`Promise`\<`void`\>

Resuelve cuando todos los flushes terminaron.

#### Example

```ts
await tm.flush();
```

#### Implementation of

`ITransportManager.flush`

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [transports/TransportManager.ts:406](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L406)

Shutdown ordenado: flushea todos los transports buffered, luego
invoca `close()` en cada uno, y finalmente limpia el set interno.
Tras esto la instancia queda sin transports — reusarla requiere
`add()` de nuevo.

Los errores de close (sync throw o Promise rejection) se capturan y
loguean — nunca propagan al caller.

#### Returns

`Promise`\<`void`\>

Resuelve cuando flush + close de todos los
  transports terminaron.

#### Example

```ts
// Shutdown limpio del proceso
process.on('SIGTERM', async () => {
  await logger.getTransportManager()?.close();
  process.exit(0);
});
```

#### Implementation of

`ITransportManager.close`

***

### list()

> **list**(): `string`[]

Defined in: [transports/TransportManager.ts:456](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/TransportManager.ts#L456)

Lista los ids opacos de los transports actualmente activos.

#### Returns

`string`[]

Array de ids (mismo formato opaco que devolvió
  [add](#add)).

#### Example

```ts
for (const id of tm.list()) {
  console.log('removing transport', id);
  tm.remove(id);
}
```
