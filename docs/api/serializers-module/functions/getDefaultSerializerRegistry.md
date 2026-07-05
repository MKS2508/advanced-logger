---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [serializers-module](../README.md) / getDefaultSerializerRegistry

# Function: getDefaultSerializerRegistry()

> **getDefaultSerializerRegistry**(): [`SerializerRegistry`](../classes/SerializerRegistry.md)

Defined in: [serializers/SerializerRegistry.ts:415](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L415)

Devuelve el singleton de [SerializerRegistry](../classes/SerializerRegistry.md) (lo crea con config
default en la primera llamada). Es la vía canónica de obtener el registry
compartido que usa el Logger internamente.

## Returns

[`SerializerRegistry`](../classes/SerializerRegistry.md)

Instancia singleton.

## Example

```ts
import { getDefaultSerializerRegistry } from '@mks2508/better-logger/serializers';

const registry = getDefaultSerializerRegistry();
if (!registry.has(CustomError)) {
  registry.add(CustomError, (e) => ({ code: e.code, message: e.message }), 95);
}
```
