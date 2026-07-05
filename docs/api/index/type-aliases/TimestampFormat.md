---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / TimestampFormat

# Type Alias: TimestampFormat

> **TimestampFormat** = `"iso"` \| `"time"` \| `"timeMs"` \| `"relative"` \| `"elapsed"` \| `"date"` \| `"custom"`

Defined in: [types/core.ts:446](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L446)

Formato de renderizado del timestamp en la línea de log.

- `'iso'` — `2026-07-05T12:34:56.789Z` (default, sortable)
- `'time'` — `12:34:56`
- `'timeMs'` — `12:34:56.789`
- `'relative'` — tiempo relativo al momento de carga del logger
- `'elapsed'` — `+1.2s` transcurrido desde el primer log de la sesión
- `'date'` — `2026-07-05 12:34:56` (local)
- `'custom'` — delega al formateador custom registrado en el logger
