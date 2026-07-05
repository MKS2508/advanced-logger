---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [hooks-module](../README.md) / HookManager

# Class: HookManager

Defined in: [hooks/HookManager.ts:83](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L83)

Implementación por defecto de [IHookManager](../../index/interfaces/IHookManager.md) que orquesta el ciclo de
vida de los hooks del logger: `beforeLog`, `afterLog` y `onError`.

Permite:
- Registrar callbacks por evento con **prioridad** (mayor número = se
  ejecuta primero; las registraciones se ordenan descendentemente).
- Encadenar middlewares sobre el entry previo al dispatch.
- Propagar mutaciones: cada hook puede retornar un partial de
  [HookLogEntry](../../index/interfaces/HookLogEntry.md) que se mergea al entry actual antes del siguiente hook.
- Acotar la recursión de `onError` con un guard de profundidad
  (MAX\_ONERROR\_DEPTH) para que un hook que lanza no loopée para
  siempre.

El flujo típico lo orquesta el logger vía [process](#process) (emite `beforeLog`
+ ejecuta middlewares) y [afterProcess](#afterprocess) (emite `afterLog`).

## Examples

```ts
const hooks = new HookManager();

// Mayor prioridad => corre primero
hooks.on('beforeLog', (entry) => {
  return { ...entry, attributes: { ...entry.attributes, traced: true } };
}, 90);

hooks.on('afterLog', (entry) => {
  metrics.increment('log_emitted', { level: entry.level });
});

hooks.on('onError', (entry) => {
  telemetry.capture(entry.error);
});
```

```ts
// Middleware que añade timestamp si falta y delega al siguiente
hooks.use(async (entry, next) => {
  if (!entry.time) entry.time = Date.now();
  await next();
});
```

## See

 - [IHookManager](../../index/interfaces/IHookManager.md)
 - [HookEvent](../../index/type-aliases/HookEvent.md)

## Implements

- [`IHookManager`](../../index/interfaces/IHookManager.md)

## Constructors

### Constructor

> **new HookManager**(): `HookManager`

Defined in: [hooks/HookManager.ts:93](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L93)

#### Returns

`HookManager`

## Methods

### on()

> **on**(`event`, `callback`, `priority?`): () => `void`

Defined in: [hooks/HookManager.ts:126](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L126)

Registra un callback persistente para un evento. Se ejecuta en cada
emisión hasta que se cancele con la función devuelta o con [off](#off).

Los hooks se ordenan por `priority` **descendente**: mayor número =
se ejecuta primero. Misma prioridad respeta el orden de registro.

#### Parameters

##### event

[`HookEvent`](../../index/type-aliases/HookEvent.md)

Uno de `'beforeLog' | 'afterLog' | 'onError'`.

##### callback

[`HookCallback`](../../index/type-aliases/HookCallback.md)

Función asíncrona que recibe el [HookLogEntry](../../index/interfaces/HookLogEntry.md)
  actual y puede retornar un partial para mutar el entry que verán los
  hooks siguientes.

##### priority?

`number` = `50`

Peso de ordenamiento. Default `50`. Mayor = primero.

#### Returns

Función de cancelación; llamarla desregistra el hook.

() => `void`

#### Example

```ts
const off = hooks.on('beforeLog', async (entry) => {
  return { attributes: { ...entry.attributes, requestId: getReqId() } };
}, 80);

// ...en shutdown:
off();
```

#### See

 - [once](#once) para hooks de un solo disparo.
 - [off](#off) para desregistro por referencia de callback.

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`on`](../../index/interfaces/IHookManager.md#on)

***

### once()

> **once**(`event`, `callback`, `priority?`): () => `void`

Defined in: [hooks/HookManager.ts:165](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L165)

Igual que [on](#on), pero el hook se auto-desregistra después del primer
disparo exitoso. Útil para setup one-shot (warm-up de caché, captura del
primer log, ...).

Si el callback lanza, el hook NO se elimina (la excepción se deriva a
`onError`); la limpieza solo ocurre cuando el callback retorna sin Throw.

#### Parameters

##### event

[`HookEvent`](../../index/type-aliases/HookEvent.md)

Evento a escuchar.

##### callback

[`HookCallback`](../../index/type-aliases/HookCallback.md)

Handler que se ejecutará una sola vez.

##### priority?

`number` = `50`

Peso de ordenamiento (mayor = primero). Default `50`.

#### Returns

Cancelación manual por si se quiere retirar antes
  del primer disparo.

() => `void`

#### Example

```ts
hooks.once('afterLog', async (entry) => {
  console.log('Primer log emitido:', entry.msg);
});
```

#### See

[on](#on)

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`once`](../../index/interfaces/IHookManager.md#once)

***

### off()

> **off**(`event`, `callback`): `boolean`

Defined in: [hooks/HookManager.ts:203](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L203)

Desregistra un hook por referencia de callback. Solo elimina la primera
coincidencia encontrada para el evento.

Para hooks registrados con [on](#on) o [once](#once) es preferible usar
la función de cancelación devuelta (que usa el id interno y es O(n) más
directa). `off` es útil cuando se perdió la referencia al cancelador o
cuando se integra con APIs que piden un método `removeListener(cb)`.

#### Parameters

##### event

[`HookEvent`](../../index/type-aliases/HookEvent.md)

Evento del que se quiere desregistrar.

##### callback

[`HookCallback`](../../index/type-aliases/HookCallback.md)

Misma referencia de función pasada a [on](#on)/[once](#once).

#### Returns

`boolean`

`true` si se eliminó un hook, `false` si no había match.

#### Example

```ts
const handler = async (entry) => { /* ... */ };
hooks.on('afterLog', handler);
hooks.off('afterLog', handler); // true
```

#### See

[on](#on)

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`off`](../../index/interfaces/IHookManager.md#off)

***

### use()

> **use**(`middleware`, `priority?`): () => `void`

Defined in: [hooks/HookManager.ts:261](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L261)

Registra un middleware que se encadena sobre el [HookLogEntry](../../index/interfaces/HookLogEntry.md)
**antes** de que se emita el log al resto del pipeline. Los middlewares
corren después del evento `beforeLog` y se ejecutan en cascada vía `next()`.

Cada middleware recibe `(entry, next)` y debe llamar a `next()` para
ceder el control al siguiente. Si NO llama a `next()`, corta la cadena
(patrón short-circuit).

Ordenamiento: `priority` descendente (mayor = primero), igual que los
hooks. La secuencia respetada es la del sort, no la del orden de
llamada a `use`.

#### Parameters

##### middleware

[`MiddlewareFn`](../../index/type-aliases/MiddlewareFn.md)

Función `(entry, next) => Promise<void>`.

##### priority?

`number` = `50`

Peso de ordenamiento. Default `50`.

#### Returns

Función de cancelación para retirar el middleware.

() => `void`

#### Example

```ts
// PII redaction: enmascara passwords antes de loguear
hooks.use(async (entry, next) => {
  if (entry.attributes?.password) {
    entry.attributes.password = '***';
  }
  await next();
}, 90);

// Short-circuit: si es level=debug y env=prod, no baja
const stop = hooks.use(async (entry, next) => {
  if (entry.level === 'debug' && ENV === 'production') return;
  await next();
}, 100);
```

#### See

[process](#process) para el orquestador que ejecuta la cadena.

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`use`](../../index/interfaces/IHookManager.md#use)

***

### emit()

> **emit**(`event`, `entry`): `Promise`\<[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)\>

Defined in: [hooks/HookManager.ts:312](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L312)

Emite un evento a todos sus hooks registrados, en orden de prioridad, y
retorna el entry resultante tras aplicar todos los mutations.

Cada hook puede retornar un partial de [HookLogEntry](../../index/interfaces/HookLogEntry.md); ese partial
se mergea sobre el entry actual antes de invocar al siguiente hook, así
los hooks se encadenan como una pipeline de transformaciones.

Manejo de errores:
- Si un hook de `beforeLog`/`afterLog` lanza, la excepción se captura y
  se re-emite como evento `onError` con el campo `error` poblado.
- Si un hook de `onError` lanza, **NO** se re-emite (rompería el ciclo);
  se loguea a `console.error` y se traga.
- Guard de reentrancia: si `onError` se re-entra más de
  MAX\_ONERROR\_DEPTH veces, se corta y se loguea el entry al
  console. Previene loops infinitos por errores en cascada.

Los hooks marcados como `once` se eliminan tras un disparo exitoso.

#### Parameters

##### event

[`HookEvent`](../../index/type-aliases/HookEvent.md)

Evento a emitir.

##### entry

[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)

Entry inicial; no se muta in-place (se clona por nivel).

#### Returns

`Promise`\<[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)\>

Entry transformado tras todos los hooks.

#### Example

```ts
const enriched = await hooks.emit('beforeLog', rawEntry);
// enriched.attributes puede traer merges de varios hooks
```

#### See

 - [on](#on)
 - [once](#once)
 - MAX\_ONERROR\_DEPTH

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`emit`](../../index/interfaces/IHookManager.md#emit)

***

### process()

> **process**(`entry`): `Promise`\<[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)\>

Defined in: [hooks/HookManager.ts:390](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L390)

Orquesta el pipeline pre-emit de un log. Orden de ejecución:

1. Emite `beforeLog` (todos sus hooks corren en orden de prioridad y
   pueden mutar el entry vía return partial).
2. Si hay middlewares registrados ([use](#use)), los ejecuta en cascada
   sobre el entry ya enriquecido por los hooks de `beforeLog`.

Es el punto de entrada que el logger invoca **antes** de despachar el
record a los transports. El entry devuelto es el que finalmente se loguea.

No emite `afterLog`; para eso usar [afterProcess](#afterprocess) una vez que el
dispatch al transport haya terminado.

#### Parameters

##### entry

[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)

Entry crudo entrante al pipeline.

#### Returns

`Promise`\<[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)\>

Entry final listo para mandar a transports.

#### Example

```ts
const processed = await hooks.process(rawEntry);
await transport.write(processed);
await hooks.afterProcess(processed);
```

#### See

 - [afterProcess](#afterprocess)
 - [use](#use)

#### Implementation of

[`IHookManager`](../../index/interfaces/IHookManager.md).[`process`](../../index/interfaces/IHookManager.md#process)

***

### afterProcess()

> **afterProcess**(`entry`): `Promise`\<`void`\>

Defined in: [hooks/HookManager.ts:438](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L438)

Emite el evento `afterLog` con el entry ya procesado y dispatcheado a
los transports. Pensado para side-effects post-log: métricas, audit
trail, flush de buffers externos, etc.

Los hooks de `afterLog` pueden retornar un partial pero el entry ya se
ha publicado, así que la mutación no tiene efecto sobre el log emitido;
solo queda disponible en el return de [emit](#emit), que aquí se descarta.

#### Parameters

##### entry

[`HookLogEntry`](../../index/interfaces/HookLogEntry.md)

Entry final (mismo objeto devuelto por [process](#process)).

#### Returns

`Promise`\<`void`\>

Resuelve cuando todos los hooks terminaron.

#### Example

```ts
hooks.on('afterLog', async (entry) => {
  metrics.increment('logs_total', { level: entry.level });
});

const processed = await hooks.process(rawEntry);
await transport.write(processed);
await hooks.afterProcess(processed); // dispara métricas
```

#### See

[process](#process)

***

### clear()

> **clear**(): `void`

Defined in: [hooks/HookManager.ts:456](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L456)

Vacía todos los hooks y middlewares registrados. Útil para resetear el
estado entre tests o en hot-reload.

Afecta a los tres eventos (`beforeLog`, `afterLog`, `onError`) y a la
pila de middlewares. Las funciones de cancelación devueltas por
[on](#on)/[once](#once)/[use](#use) se vuelven no-ops pero pueden
llamarse sin error.

#### Returns

`void`

#### Example

```ts
afterEach(() => hooks.clear());
```

***

### getStats()

> **getStats**(): `object`

Defined in: [hooks/HookManager.ts:478](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L478)

Snapshot del estado interno para observabilidad y debugging.

#### Returns

`object`

stats

##### hooks

> **hooks**: `Record`\<[`HookEvent`](../../index/type-aliases/HookEvent.md), `number`\>

##### middlewares

> **middlewares**: `number`

#### Example

```ts
const stats = hooks.getStats();
// { hooks: { beforeLog: 2, afterLog: 1, onError: 3 }, middlewares: 1 }
if (stats.hooks.onError === 0) {
  console.warn('Sin handlers onError registrados');
}
```
