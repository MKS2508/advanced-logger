---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / getEnvironmentInfo

# Function: getEnvironmentInfo()

> **getEnvironmentInfo**(): `object`

Defined in: [utils/environment-detector.ts:170](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/utils/environment-detector.ts#L170)

Información del entorno para debugging

## Returns

`object`

### environment

> **environment**: [`Environment`](../type-aliases/Environment.md)

### supportsANSI

> **supportsANSI**: `boolean`

### colorCapability

> **colorCapability**: `"none"` \| `"full"` \| `"basic"`

### isTTY

> **isTTY**: `boolean`

### platform

> **platform**: `string`

### nodeVersion

> **nodeVersion**: `string` \| `null`

### term

> **term**: `string` \| `null` \| `undefined`

### colorTerm

> **colorTerm**: `string` \| `null` \| `undefined`

### terminalWidth

> **terminalWidth**: `number`

### terminalHeight

> **terminalHeight**: `number`
