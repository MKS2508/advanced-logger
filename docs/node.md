---
layout: default
title: Node (reserved)
permalink: /node/
---

# Node (reserved)

El subpath `@mks2508/better-logger/node` es un **namespace reservado** sin exports. Existe como plaza de aterrizaje para futuras features Node-only sin contaminar el bundle default (cross-runtime).

## Estado actual

`./node` no expone nada exportable: el archivo `src/node-module.ts` es un placeholder con solo docstring.

```typescript
// src/node-module.ts
/**
 * Reserved namespace for Node-only utilities. Use the main entry
 * (`@mks2508/better-logger`) for cross-runtime APIs.
 */
```

Cualquier intento de importar desde `./node` resuelve a un módulo vacío: TypeScript no marca error, runtime no expone símbolos. Esto es deliberado — el subpath está preparado pero todavía sin contenido.

## Por que existe

F6.2 (consolidación de bridges y dead-surface trim) eliminó los exports Node-específicos anteriores que no justificaban quedarse: helpers de `BufferWriter`, variantes de file capture que duplicaban `FileTransport`, etc. Lo que quedó se fusionó en `./transports` (`File`, `Http`, `Otlp`).

`./node` queda como punto de entrada para lo que **venga después** y tenga sentido Node-only:

- File-based log capture con rotación `fs`-backed (`logrotate`-style streams).
- Integración con `process.stdout`/`stderr` crudos para escenarios donde `console` está monkey-patched.
- Pipes a `net.Socket` o `dgram` para log shipping sin HTTP.
- Workers / `worker_threads` log routing.

Mantener `./node` vacío es preferible a filtrar código Node en el bundle default — preserva el dual runtime (browser + Node) sin pagar peso extra en builds browser.

## Alternativas actuales

Hoy toda la funcionalidad Node-compatible vive en el entry default o en `./transports`:

| Necesidad | Usar |
|-----------|------|
| Logger cross-runtime (browser + Node) | [`@mks2508/better-logger`](./index.md) (entry default) |
| File logging con rotation / buffer | [`./transports`](./transports/) → `FileTransport` |
| Ingestion HTTP con retry y backoff | [`./transports`](./transports/) → `HttpTransport` |
| OTLP → SigNoz / collector OTLP/HTTP | [`./transports`](./transports/) → `OtlpTransport` |
| Spinners, boxes, tables para scripts CLI | [`./playground`](./playground/) |

```typescript
// El entry default funciona en Node sin configuración extra
import logger from '@mks2508/better-logger';
logger.info('Node process started');

// Transports Node-specific sí requieren subpath
import { FileTransport, OtlpTransport } from '@mks2508/better-logger/transports';

logger.addTransport({
  target: new FileTransport({ destination: 'logs/app.log' })
});
```

El entry default detecta el runtime y adapta el rendering automáticamente: ANSI para terminales Node, CSS `%c` para DevTools del browser. No hace falta subpath separado para "modo Node".

## Si necesitas algo Node-only

Si tienes un caso de uso Node-específico que no encaje en `./transports` (rotación custom, pipes a `net`, integración con `worker_threads`, lo que sea), abre un [issue](https://github.com/MKS2508/advanced-logger/issues) describiendo el caso. Las features que aterricen en `./node` necesitan justificación por **separación clara** de los subpaths ya existentes — duplicar lo que ya hace `./transports` no es razón suficiente.

## Referencia API

- [`Logger`](../api/index/classes/Logger.md) — entry default cross-runtime
- [`FileTransport`](../api/transports-module/classes/FileTransport.md) · [`HttpTransport`](../api/transports-module/classes/HttpTransport.md) · [`OtlpTransport`](../api/transports-module/classes/OtlpTransport.md) — transports Node-specific en `./transports`
- [Volver al inicio](./index.md)
