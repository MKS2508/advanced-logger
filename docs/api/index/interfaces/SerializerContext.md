---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / SerializerContext

# Interface: SerializerContext

Defined in: [types/serializers.ts:40](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L40)

Estado de recorrido que el [ISerializerRegistry](ISerializerRegistry.md) pasa a cada
[SerializerFn](../type-aliases/SerializerFn.md) durante la serialización de un valor.

Permite que los serializers personalizados respeten `maxDepth`, reconozcan
su posición dentro del grafo de objetos y participen de la detección de
referencias circulares.

## Properties

### depth

> **depth**: `number`

Defined in: [types/serializers.ts:41](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L41)

Profundidad actual dentro del grafo (raíz = 0).

***

### maxDepth

> **maxDepth**: `number`

Defined in: [types/serializers.ts:42](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L42)

Profundidad máxima permitida antes de truncar.

***

### path

> **path**: `string`[]

Defined in: [types/serializers.ts:43](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L43)

Camino de claves desde la raíz hasta el nodo actual.

***

### seen

> **seen**: `WeakSet`\<`object`\>

Defined in: [types/serializers.ts:44](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L44)

`WeakSet` de objetos ya visitados, para detectar ciclos.
