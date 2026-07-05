---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [hooks-module](../README.md) / getDefaultHookManager

# Function: getDefaultHookManager()

> **getDefaultHookManager**(): [`HookManager`](../classes/HookManager.md)

Defined in: [hooks/HookManager.ts:513](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/hooks/HookManager.ts#L513)

Devuelve la instancia singleton de [HookManager](../classes/HookManager.md) compartida por todo
el proceso. La crea perezosamente en la primera llamada.

Pensada como hook manager por defecto del logger; los consumidores que
necesiten aislamiento (tests, múltiples loggers con pipelines distintos)
deben instanciar su propio `new HookManager()` en lugar de usar este shared.

## Returns

[`HookManager`](../classes/HookManager.md)

La instancia singleton.

## Example

```ts
import { getDefaultHookManager } from '@mks2508/better-logger/hooks';

getDefaultHookManager().on('onError', async (entry) => {
  telemetry.capture(entry.error);
});
```

## See

[HookManager](../classes/HookManager.md)
