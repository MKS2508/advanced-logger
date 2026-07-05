---
layout: default
title: Core Logger
permalink: /core/
---

# 🧱 Core Logger

`CoreLogger` es la versión minimal del `Logger` (~360 líneas): solo emisión a `console` + handlers custom. Sin transports, hooks, serializers, themes, badges, banners, SVG, CLI primitives ni scoped loggers avanzados.

Úsalo cuando quieras el subpath `@mks2508/better-logger/core` sin las primitivas visuales del entry-point principal. Importación:

```ts
import { CoreLogger } from '@mks2508/better-logger/core';
```

## 📥 API mínima

| Método | Firma | Notas |
|---|---|---|
| `debug` | `(message, ...args)` | Verbose, low-priority |
| `info` | `(message, ...args)` | Default level |
| `warn` | `(message, ...args)` | Atención, no fatal |
| `error` | `(message, ...args)` | Fallo recuperable |
| `log` | `(level, message, ...args)` | Emisión cruda |
| `group` / `groupEnd` | `(label?)` | Agrupar líneas en consola |
| `table` | `(data)` | Render tabular |
| `time` / `timeEnd` | `(label)` | Medición con `performance.now()` |

Sin levels extendidos (`success`, `critical`, etc.), sin badges automáticos, sin preset de styling, sin attachments MDC. La salida es 1-a-1 con `console.*`.

## 🪝 Custom handlers

Igual que `Logger` clásico, `CoreLogger` acepta `addHandler(handler)` para side-effects externos. La diferencia contractual con `addTransport()` está documentada en [Transports](transports.md) (sección *Distinción clave*).

```ts
import { CoreLogger } from '@mks2508/better-logger/core';

const log = new CoreLogger();

log.addHandler((level, message, args, metadata) => {
    fetch('/log', {
        method: 'POST',
        body: JSON.stringify({ level, message, metadata }),
    });
});
```

## 🎯 Cuándo usarlo

- Tests unitarios donde quieres evitar side-effects visuales del `Logger` full.
- Workers (Web o Node) donde no necesitas la caja de herramientas CLI.
- Embedding en librerías donde el logger es plumbing interno y no UX.
- Tamaño crítico de bundle: el subpath `./core` tree-shakes mejor que el entry-point.

Para todo lo demás (transports, MDC, badges, themes, hooks), usa el [Logger principal](index.md).
