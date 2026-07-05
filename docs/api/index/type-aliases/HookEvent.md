---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / HookEvent

# Type Alias: HookEvent

> **HookEvent** = `"beforeLog"` \| `"afterLog"` \| `"onError"`

Defined in: [types/hooks.ts:44](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/hooks.ts#L44)

Eventos de hook que el [IHookManager](../interfaces/IHookManager.md) despacha en el pipeline de log.

- `'beforeLog'` — antes de despachar el log a transports/handlers. El
  callback puede mutar o reemplazar campos del [HookLogEntry](../interfaces/HookLogEntry.md) y el
  resultado se propaga a los siguientes hooks y al log final.
- `'afterLog'` — después de que el log se ha escrito. Solo efectivo para
  side-effects (métricas, telemetría); mutar el entry aquí no cambia el
  output ya emitido.
- `'onError'` — cuando un transport o un hook lanza, o cuando un batch
  agota reintentos. El callback recibe `entry.error` (la excepción) y
  `entry.extra` (payload estructurado: dropped, status, retryCount, ...).
