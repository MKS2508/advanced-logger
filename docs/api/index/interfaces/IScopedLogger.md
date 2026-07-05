---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / IScopedLogger

# Interface: IScopedLogger

Defined in: [types/core.ts:362](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L362)

Contrato del logger retornado por los factory de scope (`Logger.component`,
`Logger.scope`). Expone los métodos de log por nivel más una API fluida
para badges, timers y estilos.

Los métodos de log (`debug`, `info`, ...) devuelven `void`; los métodos de
configuración (`badges`, `badge`, `clearBadges`, `style`) devuelven `this`
para permitir encadenamiento.

## Example

```ts
const auth = logger.component('Auth');
auth.badge('JWT').info('Token validado');
auth.style('cyberpunk').success('Login OK');
```

## Extended by

- [`IAPILogger`](IAPILogger.md)
- [`IComponentLogger`](IComponentLogger.md)

## Methods

### debug()

> **debug**(...`args`): `void`

Defined in: [types/core.ts:363](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L363)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### info()

> **info**(...`args`): `void`

Defined in: [types/core.ts:364](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L364)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### warn()

> **warn**(...`args`): `void`

Defined in: [types/core.ts:365](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L365)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### error()

> **error**(...`args`): `void`

Defined in: [types/core.ts:366](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L366)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### success()

> **success**(...`args`): `void`

Defined in: [types/core.ts:367](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L367)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### critical()

> **critical**(...`args`): `void`

Defined in: [types/core.ts:368](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L368)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### trace()

> **trace**(...`args`): `void`

Defined in: [types/core.ts:369](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L369)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

***

### badges()

> **badges**(`badges`): `this`

Defined in: [types/core.ts:371](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L371)

#### Parameters

##### badges

`string`[]

#### Returns

`this`

***

### badge()

> **badge**(`badge`): `this`

Defined in: [types/core.ts:372](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L372)

#### Parameters

##### badge

`string`

#### Returns

`this`

***

### clearBadges()

> **clearBadges**(): `this`

Defined in: [types/core.ts:373](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L373)

#### Returns

`this`

***

### time()

> **time**(`label`): `void`

Defined in: [types/core.ts:375](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L375)

#### Parameters

##### label

`string`

#### Returns

`void`

***

### timeEnd()

> **timeEnd**(`label`): `number` \| `undefined`

Defined in: [types/core.ts:376](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L376)

#### Parameters

##### label

`string`

#### Returns

`number` \| `undefined`

***

### style()

> **style**(`presetName`): `this`

Defined in: [types/core.ts:378](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L378)

#### Parameters

##### presetName

`string`

#### Returns

`this`
