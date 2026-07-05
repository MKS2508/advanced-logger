---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / createLogEntry

# Function: createLogEntry()

> **createLogEntry**(`level`, `message`, `args`, `prefix?`, `stackInfo?`): `object`

Defined in: [utils/formatting.ts:62](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/utils/formatting.ts#L62)

Crea un objeto simple de log entry para los handlers

## Parameters

### level

`"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

### message

`string`

### args

`any`[]

### prefix?

`string`

### stackInfo?

[`StackInfo`](../interfaces/StackInfo.md) \| `null`

## Returns

`object`

### timestamp

> **timestamp**: `string`

### level

> **level**: `string`

### prefix

> **prefix**: `string` \| `undefined`

### message

> **message**: `string`

### args

> **args**: `any`[]

### location

> **location**: \{ `file`: `string`; `line`: `number`; `column`: `number`; `function`: `string` \| `undefined`; \} \| `undefined`

### raw

> **raw**: `any`[] = `args`
