---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ISpinnerHandle

# Interface: ISpinnerHandle

Defined in: [types/core.ts:503](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L503)

Handle retornado por `logger.spinner()` para controlar el ciclo de vida
del spinner.

## Methods

### start()

> **start**(): `void`

Defined in: [types/core.ts:505](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L505)

Arranca la animación del spinner.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [types/core.ts:507](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L507)

Detiene el spinner sin mensaje de status.

#### Returns

`void`

***

### succeed()

> **succeed**(`msg?`): `void`

Defined in: [types/core.ts:509](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L509)

Detiene el spinner con un mensaje de success.

#### Parameters

##### msg?

`string`

#### Returns

`void`

***

### fail()

> **fail**(`msg?`): `void`

Defined in: [types/core.ts:511](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L511)

Detiene el spinner con un mensaje de failure.

#### Parameters

##### msg?

`string`

#### Returns

`void`

***

### text()

> **text**(`msg`): `void`

Defined in: [types/core.ts:513](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L513)

Actualiza el texto del spinner mientras corre.

#### Parameters

##### msg

`string`

#### Returns

`void`
