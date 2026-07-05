---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / SerializerFn

# Type Alias: SerializerFn\<T\>

> **SerializerFn**\<`T`\> = (`value`, `context`) => `any`

Defined in: [types/serializers.ts:25](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/serializers.ts#L25)

Función de serialización registrada para un tipo específico de valor.

Recibe el valor a serializar y un [SerializerContext](../interfaces/SerializerContext.md) con el estado
del recorrido (profundidad, camino de claves, set de objetos ya vistos para
detectar ciclos). Devuelve una representación segura para logs / JSON —
normalmente un plain object o un primitivo que `JSON.stringify` pueda emitir
sin perder información ni lanzar sobre estructuras profundas.

## Type Parameters

### T

`T` = `any`

Tipo del valor que este serializer sabe manejar.

## Parameters

### value

`T`

Instancia a serializar.

### context

[`SerializerContext`](../interfaces/SerializerContext.md)

Estado del recorrido (depth, path, seen).

## Returns

`any`

Representación serializable del valor de entrada.

## Example

```ts
// Serializer para `Error` que aplana los campos relevantes
const errorSerializer: SerializerFn<Error> = (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack
});
```
