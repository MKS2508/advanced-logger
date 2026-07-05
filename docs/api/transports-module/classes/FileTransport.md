---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [transports-module](../README.md) / FileTransport

# Class: FileTransport

Defined in: [transports/FileTransport.ts:87](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L87)

Transport que escribe registros a fichero (Node) o `localStorage` (browser).

En Node, hace `appendFile` asíncrono vía `fs.promises` cargado con dynamic
import (no bloquea el event loop, no envía código Node-only al bundle del
browser). En el browser, acumula en `localStorage` con prefijo `better-logger:`
y degrada a no-op silencioso si el storage no está disponible (modo privado,
sandbox de iframes, quota agotada).

El buffer es bounded: al llegar a `maxBufferSize` suelta el registro más
viejo (drop-oldest) e invoca `onError` con el payload descartado, de modo
que un pico de tráfico sostenido no agota memoria.

El `destination` se sanea antes de usarse:
- Node: se rechazan rutas con segmentos `..`, `~` o absolutas (path traversal).
- Browser: se colapsa a `[a-zA-Z0-9_-]` recortado a 64 caracteres.

## Implements

## Examples

```ts
// Node: append a fichero con flush cada segundo
logger.addTransport({
  target: new FileTransport({
    destination: 'logs/app.log',
    batchSize: 100,
    flushInterval: 1000,
    onError: (entry) => captureFailure(entry)
  })
});
```

```ts
// Browser: persiste en localStorage bajo 'better-logger:audit'
logger.addTransport({
  target: new FileTransport({ destination: 'audit' })
});
```

## See

 - [FileTransportOptions](../interfaces/FileTransportOptions.md)
 - IBufferedTransport

## Implements

- `IBufferedTransport`

## Constructors

### Constructor

> **new FileTransport**(`options?`): `FileTransport`

Defined in: [transports/FileTransport.ts:106](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L106)

Construye el transport. Si se pasa `flushInterval`, arranca un timer
periódico que vacía el buffer al vencimiento; si no, el flush se
dispara solo cuando el buffer alcanza `batchSize`.

#### Parameters

##### options?

[`FileTransportOptions`](../interfaces/FileTransportOptions.md)

Configuración. Defaults: `batchSize=100`, `maxBufferSize=10000`.

#### Returns

`FileTransport`

#### Example

```ts
const t = new FileTransport({ destination: 'app.log', flushInterval: 1000 });
```

## Properties

### name

> `readonly` **name**: `"file"` = `'file'`

Defined in: [transports/FileTransport.ts:89](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L89)

Identificador del transport dentro del pipeline (`'file'`).

#### Implementation of

`IBufferedTransport.name`

## Accessors

### bufferSize

#### Get Signature

> **get** **bufferSize**(): `number`

Defined in: [transports/FileTransport.ts:121](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L121)

Registros pendientes en el buffer (aún sin flush).

##### Returns

`number`

#### Implementation of

`IBufferedTransport.bufferSize`

***

### maxBufferSize

#### Get Signature

> **get** **maxBufferSize**(): `number`

Defined in: [transports/FileTransport.ts:126](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L126)

Capacidad máxima del buffer; al superarla se aplica drop-oldest.

##### Returns

`number`

#### Implementation of

`IBufferedTransport.maxBufferSize`

## Methods

### isReady()

> **isReady**(): `boolean`

Defined in: [transports/FileTransport.ts:136](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L136)

Indica si el transport acepta escrituras. Devuelve `false` después de
[FileTransport.close](#close) — cualquier `write` posterior se descarta.

#### Returns

`boolean`

`true` mientras el transport no esté cerrado.

#### Implementation of

`IBufferedTransport.isReady`

***

### write()

> **write**(`record`): `void`

Defined in: [transports/FileTransport.ts:150](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L150)

Encola un registro serializado (JSON + `\n`). Si el buffer está a tope,
suelta el registro más viejo (drop-oldest) y emite un evento `onError`
con el payload descartado para que la pérdida sea observable. Si al
encolar se alcanza `batchSize`, dispara un flush asíncrono.

No-op silencioso si el transport está cerrado.

#### Parameters

##### record

[`TransportRecord`](../../index/interfaces/TransportRecord.md)

Registro a escribir.

#### Returns

`void`

#### Implementation of

`IBufferedTransport.write`

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [transports/FileTransport.ts:188](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L188)

Vuelca el buffer al destino. En Node concatena el contenido y hace
un único `appendFile`; en browser hace un único `setItem` sobre
`localStorage`. El buffer se vacía antes del I/O para que los registros
entrantes no esperen al disco. Los errores de escritura se reportan
vía `onError` (nunca lanzan al caller).

#### Returns

`Promise`\<`void`\>

Resuelve cuando el I/O terminó o falló.

#### Implementation of

`IBufferedTransport.flush`

***

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [transports/FileTransport.ts:235](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/transports/FileTransport.ts#L235)

Cierra el transport: detiene el timer de flush y dispara un flush
final para no perder registros pendientes. Tras cerrar, `write` y
`flush` se vuelven no-op.

#### Returns

`Promise`\<`void`\>

Resuelve cuando el flush final termina.

#### Implementation of

`IBufferedTransport.close`
