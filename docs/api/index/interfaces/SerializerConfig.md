---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / SerializerConfig

# Interface: SerializerConfig

Defined in: [types/serializers.ts:72](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L72)

Opciones de serialización pasadas a [ISerializerRegistry.serialize](ISerializerRegistry.md#serialize).

## Properties

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: [types/serializers.ts:73](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L73)

Profundidad máxima antes de truncar el subárbol con un placeholder. Toma el default del registry si se omite.

***

### circular?

> `optional` **circular?**: `"error"` \| `"skip"` \| `"placeholder"`

Defined in: [types/serializers.ts:74](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L74)

Estrategia ante referencias circulares:
  - `'error'` — lanza al detectar un ciclo.
  - `'skip'` — omite el campo circular del output.
  - `'placeholder'` — reemplaza el ciclo por `'[Circular]'` (default).

***

### preserveUndefined?

> `optional` **preserveUndefined?**: `boolean`

Defined in: [types/serializers.ts:75](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L75)

Si mantener `undefined` (en lugar de omitirlo). Por compatibilidad con JSON, default `false`.
