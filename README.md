# 🚀 Better Logger

**Logger avanzado para consola con estilos CSS, log context tipo MDC, transports (File / HTTP / OTLP→SigNoz), hooks, serializers y CLI integrado. Soporte dual browser/terminal.**

[![NPM Version](https://img.shields.io/npm/v/@mks2508/better-logger)](https://www.npmjs.com/package/@mks2508/better-logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@mks2508/better-logger)](https://github.com/MKS2508/advanced-logger/blob/main/LICENSE)

## ✨ Features

- 🎨 **Styling dual** — CSS `%c` con gradientes y sombras en browser, ANSI en terminal. Themes (`default`/`dark`/`light`/`neon`/`minimal`/`cyberpunk`) y Smart Presets (`cyberpunk`/`glassmorphism`/`minimal`/`debug`/`production`).
- 📊 **6 niveles + verbosity** — `trace < debug < info < warn < error < critical` (+ `silent`). `trace` alineado con la banda TRACE de OpenTelemetry (severity 1-4).
- 🧩 **Log context (MDC)** — bindings persistentes con `child()` o scoped via `AsyncLocalStorage` con `withContext(bindings, fn)`. Se mergean en `TransportRecord.attributes`.
- 📡 **Transports** — `FileTransport` (async, bounded buffer), `HttpTransport` (batching + retry exponencial), `OtlpTransport` (OTLP/HTTP → SigNoz y otros backends). Custom via `ITransport`.
- 🪝 **Hooks awaited** — `beforeLog` (mutación reflejada en el mensaje), `afterLog` (métricas fire-and-forget), middleware Koa-style con `use()`. Ideales para redacción PII.
- 🧬 **Serializers por tipo** — `addSerializer(Error, fn)`, `addSerializer(User, fn)`. Defaults para `Error`/`Date`/`Map`/`Set`/`Buffer`/`RegExp`.
- 🏷️ **Scoped loggers** — `scope('Auth')`, `component('Database')`, `api('GraphQL')` con badges automáticos y métodos específicos (`slow`, `rateLimit`, `auth`, `deprecated`).
- 🖥️ **CLI primitives** — spinners braille 80ms, boxes ASCII, tablas, steps, headers, dividers. Fallback automático en non-TTY.
- 🔭 **OpenTelemetry ready** — `severityNumber` / `severityText` / `traceId` / `spanId` / `attributes` / `resource` en cada `TransportRecord`.

## 📦 Instalación

```bash
npm install @mks2508/better-logger
# o
bun add @mks2508/better-logger
```

## 🚀 Quick Start

```typescript
import logger from '@mks2508/better-logger';

logger.info('Application started');
logger.warn('High memory usage');
logger.error('Connection failed');

// Loggers hijuelos (request-scoped, persistentes)
const requestLog = logger.child({ requestId: getRequestId() });
requestLog.info('auth ok');   // lleva requestId automáticamente
```

Más métodos sueltos:

```typescript
import { info, success, error, trace } from '@mks2508/better-logger';
info('Proceso iniciado');
success('✓ Completado');
```

## 📚 Documentación

| Página | Cubre |
|---|---|
| [Inicio](docs/index.md) | Overview, features, instalación |
| [Transports](docs/transports.md) | `FileTransport`, `HttpTransport`, `OtlpTransport`, custom `ITransport` |
| [Log Context (MDC)](docs/context.md) | `child()` inmutable vs `withContext(bindings, fn)` scoped |
| [Hooks & Middleware](docs/hooks.md) | `on`/`once`/`off`/`use`, redacción PII, métricas |
| [Serializers](docs/serializers.md) | `addSerializer`, defaults, circular refs, depth |
| [Styling](docs/styles.md) | Themes, Smart Presets, `StyleBuilder` chainable, badges |
| [CLI](docs/cli.md) | 8 comandos `/help`/`/config`/`/themes`/... vía `logger.cli()` |
| [Playground](docs/playground.md) | Renderers raw y `Logger` wrappers para terminales |
| [Core Logger](docs/core.md) | `CoreLogger` minimal (~360 líneas) para Node/CLI ligeros |
| [Node (reserved)](docs/node.md) | Subpath reservado para futuras features Node-only |
| [Migración 0.18.x](docs/migration-v0.18.md) | Breaking changes desde 1.x–5.x |
| [API Reference](docs/api/) | TypeDoc generado, 164 archivos |

## 📊 Niveles de log

```text
trace(-1) < debug(0) < info(1) < warn(2) < error(3) < critical(4)
```

`success()` emite a nivel `info` con `tag: 'success'` para que transports distingan success de info genérico.

```typescript
logger.setVerbosity('debug');   // trace + debug + info + ...
logger.setVerbosity('warn');    // solo warn, error, critical
logger.setVerbosity('silent');  // nada
```

## 🌐 Compatibilidad

- ✅ **Browsers modernos** — soporte completo (CSS, DevTools, `localStorage` fallback)
- ✅ **Node.js** — core + transports (File async, HTTP, OTLP)
- ✅ **TypeScript** — definiciones completas, cero `any` en superficie pública
- ✅ **ESM & CommonJS** — ambos exports; subpath layout (`./transports`, `./context`, `./hooks`, `./serializers`, `./styles`, `./cli`, `./playground`, `./core`)

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).