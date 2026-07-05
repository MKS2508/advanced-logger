---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / IAPILogger

# Interface: IAPILogger

Defined in: [types/core.ts:387](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L387)

Logger especializado para servicios API. Extiende [IScopedLogger](IScopedLogger.md) con
verbosidades específicas de backend: latencia (`slow`), rate limiting
(`rateLimit`), fallos de credenciales (`auth`) y endpoints legacy
(`deprecated`).

## Extends

- [`IScopedLogger`](IScopedLogger.md)

## Methods

### debug()

> **debug**(...`args`): `void`

Defined in: [types/core.ts:363](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L363)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`debug`](IScopedLogger.md#debug)

***

### info()

> **info**(...`args`): `void`

Defined in: [types/core.ts:364](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L364)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`info`](IScopedLogger.md#info)

***

### warn()

> **warn**(...`args`): `void`

Defined in: [types/core.ts:365](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L365)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`warn`](IScopedLogger.md#warn)

***

### error()

> **error**(...`args`): `void`

Defined in: [types/core.ts:366](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L366)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`error`](IScopedLogger.md#error)

***

### success()

> **success**(...`args`): `void`

Defined in: [types/core.ts:367](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L367)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`success`](IScopedLogger.md#success)

***

### critical()

> **critical**(...`args`): `void`

Defined in: [types/core.ts:368](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L368)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`critical`](IScopedLogger.md#critical)

***

### trace()

> **trace**(...`args`): `void`

Defined in: [types/core.ts:369](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L369)

#### Parameters

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`trace`](IScopedLogger.md#trace)

***

### badges()

> **badges**(`badges`): `this`

Defined in: [types/core.ts:371](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L371)

#### Parameters

##### badges

`string`[]

#### Returns

`this`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`badges`](IScopedLogger.md#badges)

***

### badge()

> **badge**(`badge`): `this`

Defined in: [types/core.ts:372](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L372)

#### Parameters

##### badge

`string`

#### Returns

`this`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`badge`](IScopedLogger.md#badge)

***

### clearBadges()

> **clearBadges**(): `this`

Defined in: [types/core.ts:373](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L373)

#### Returns

`this`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`clearBadges`](IScopedLogger.md#clearbadges)

***

### time()

> **time**(`label`): `void`

Defined in: [types/core.ts:375](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L375)

#### Parameters

##### label

`string`

#### Returns

`void`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`time`](IScopedLogger.md#time)

***

### timeEnd()

> **timeEnd**(`label`): `number` \| `undefined`

Defined in: [types/core.ts:376](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L376)

#### Parameters

##### label

`string`

#### Returns

`number` \| `undefined`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`timeEnd`](IScopedLogger.md#timeend)

***

### style()

> **style**(`presetName`): `this`

Defined in: [types/core.ts:378](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L378)

#### Parameters

##### presetName

`string`

#### Returns

`this`

#### Inherited from

[`IScopedLogger`](IScopedLogger.md).[`style`](IScopedLogger.md#style)

***

### slow()

> **slow**(`message`, `duration?`): `void`

Defined in: [types/core.ts:388](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L388)

#### Parameters

##### message

`string`

##### duration?

`number`

#### Returns

`void`

***

### rateLimit()

> **rateLimit**(`message`): `void`

Defined in: [types/core.ts:389](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L389)

#### Parameters

##### message

`string`

#### Returns

`void`

***

### auth()

> **auth**(`message`): `void`

Defined in: [types/core.ts:390](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L390)

#### Parameters

##### message

`string`

#### Returns

`void`

***

### deprecated()

> **deprecated**(`message`): `void`

Defined in: [types/core.ts:391](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L391)

#### Parameters

##### message

`string`

#### Returns

`void`
