---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / ISerializerRegistry

# Interface: ISerializerRegistry

Defined in: [types/serializers.ts:96](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L96)

Contrato del registry de serializers por tipo.

Mantiene una tabla de constructors → [SerializerFn](../type-aliases/SerializerFn.md) con prioridades,
y expone `serialize()` para transformar valores arbitrarios (`Error`,
`Date`, `Map`, `Set`, tipos custom del dominio) en representaciones
seguras para logs y para `JSON.stringify`.

La resolución recorre la cadena de prototipos del valor y aplica el
serializer más específico registrado; si nadie matchea, cae al serializer
por defecto (JSON-safe).

## Example

```ts
const registry: ISerializerRegistry = createRegistry();
registry.add(Error, (e: Error) => ({ name: e.name, message: e.message }), 10);
registry.serialize(new TypeError('boom'));
// → { name: 'TypeError', message: 'boom' }  (TypeError hereda de Error)
```

## Methods

### add()

> **add**\<`T`\>(`type`, `serializer`, `priority?`): `void`

Defined in: [types/serializers.ts:97](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L97)

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

##### serializer

[`SerializerFn`](../type-aliases/SerializerFn.md)\<`T`\>

##### priority?

`number`

#### Returns

`void`

***

### remove()

> **remove**\<`T`\>(`type`): `boolean`

Defined in: [types/serializers.ts:98](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L98)

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

#### Returns

`boolean`

***

### has()

> **has**\<`T`\>(`type`): `boolean`

Defined in: [types/serializers.ts:99](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L99)

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

#### Returns

`boolean`

***

### serialize()

> **serialize**(`value`, `config?`): `any`

Defined in: [types/serializers.ts:100](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L100)

#### Parameters

##### value

`any`

##### config?

[`SerializerConfig`](SerializerConfig.md)

#### Returns

`any`

***

### getAll()

> **getAll**(): `SerializerEntry`\<`any`\>[]

Defined in: [types/serializers.ts:101](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L101)

#### Returns

`SerializerEntry`\<`any`\>[]
