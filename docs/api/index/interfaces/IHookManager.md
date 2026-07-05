---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / IHookManager

# Interface: IHookManager

Defined in: [types/hooks.ts:140](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L140)

Contrato del manager de hooks.

Orquesta el pipeline de middleware + eventos que envuelve cada llamada a
`log()`. Permite suscribirse a puntos del ciclo de vida del log
(`beforeLog`, `afterLog`, `onError`), transformar el [HookLogEntry](HookLogEntry.md)
en vuelo, y registrar middleware estilo Koa para cross-cutting concerns
(sampling, redacción de PII, enriquecimiento con correlación).

Los métodos `on` / `once` / `use` devuelven una función de unsubscribe
(patrón `Disposable`) para limpieza explícita — llamarla remueve el
registro sin necesidad de pasar el callback original.

## Example

```ts
const hooks: IHookManager = createManager();
// Redacta campos sensibles antes de loguear
hooks.on('beforeLog', (entry) => {
  if (entry.context?.password) {
    return { context: { ...entry.context, password: '***' } };
  }
});
// Métricas de error de transport
hooks.on('onError', async (entry) => {
  metrics.increment('log.transport.error');
});
```

## Methods

### on()

> **on**(`event`, `callback`, `priority?`): () => `void`

Defined in: [types/hooks.ts:141](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L141)

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

##### priority?

`number`

#### Returns

() => `void`

***

### once()

> **once**(`event`, `callback`, `priority?`): () => `void`

Defined in: [types/hooks.ts:142](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L142)

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

##### priority?

`number`

#### Returns

() => `void`

***

### off()

> **off**(`event`, `callback`): `boolean`

Defined in: [types/hooks.ts:143](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L143)

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

#### Returns

`boolean`

***

### use()

> **use**(`middleware`, `priority?`): () => `void`

Defined in: [types/hooks.ts:144](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L144)

#### Parameters

##### middleware

[`MiddlewareFn`](../type-aliases/MiddlewareFn.md)

##### priority?

`number`

#### Returns

() => `void`

***

### emit()

> **emit**(`event`, `entry`): `Promise`\<[`HookLogEntry`](HookLogEntry.md)\>

Defined in: [types/hooks.ts:145](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L145)

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

##### entry

[`HookLogEntry`](HookLogEntry.md)

#### Returns

`Promise`\<[`HookLogEntry`](HookLogEntry.md)\>

***

### process()

> **process**(`entry`): `Promise`\<[`HookLogEntry`](HookLogEntry.md)\>

Defined in: [types/hooks.ts:146](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L146)

#### Parameters

##### entry

[`HookLogEntry`](HookLogEntry.md)

#### Returns

`Promise`\<[`HookLogEntry`](HookLogEntry.md)\>
