---
layout: default
title: Better Logger
permalink: /
---

# 🚀 Better Logger

**Logger avanzado para consola con estilos CSS, log context tipo MDC, transports (File / HTTP / OTLP→SigNoz), hooks, serializers y CLI integrado. Soporte dual browser/terminal.**

`@mks2508/better-logger` cubre los dos runtimes desde un solo package: en **browser** emite CSS `%c` formatting con gradientes, sombras y badges automáticos; en **terminal** renderiza con colores ANSI y expone primitivas CLI (spinner, box, table, step, header). Encima del styling hay un núcleo de **log context** (MDC vía `AsyncLocalStorage`), **transports** con buffer acotado y retry, **hooks** awaited para redacción PII, **serializers** por tipo, y emisión alineada con **OpenTelemetry** (`severityNumber` / `severityText` en cada `TransportRecord`).

La referencia completa de la clase está en [docs/api/index/classes/Logger.md](/advanced-logger/docs/api/index/classes/Logger.md).

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
logger.success('Database connected');
logger.warn('High memory usage');
logger.error('Connection failed');
logger.critical('Disk full');
logger.trace('verbose internals');  // filtrado por defecto (verbosity=debug)
```

### Importar métodos sueltos

```typescript
import { info, error, success, trace } from '@mks2508/better-logger';
info('Proceso iniciado');
success('✓ Completado');
```

## ✨ Features

### Core
- 🎨 **Estilos CSS en consola** — gradientes, sombras, `%c` formatting, presets listos
- 🏷️ **Badges** — etiquetado flexible con `badges()` / `badge()`
- 🌗 **Temas adaptativos** — detección automática light/dark
- 🎯 **TypeScript first** — tipado completo, cero `any` en la superficie pública

### Niveles y verbosidad
- 📊 **6 niveles jerárquicos** — `trace < debug < info < warn < error < critical` (+ `silent`)
- 🔭 **`trace` alineado con OpenTelemetry** — severity number OTel (1-24) listo para SigNoz
- 🔇 **Verbosidad filtrable** — `setVerbosity('warn')` filtra todo por debajo

### Log context (MDC)
- 🧩 **Contexto estructurado** — `withContext({ requestId }, () => { ... })` se mergea en cada `TransportRecord` dentro del scope del callback
- 🧬 **Loggers hijuelos** — `child({ ... })` hereda contexto sin mutar al padre
- 🏷️ **Resource OTel** — `setResource({ 'service.name': ... })` por logger

### Transports
- 📁 **File** — async (`fs.promises`), bounded buffer, sanitización de path, fallback a `localStorage` en browser
- 🌐 **HTTP** — batching, retry con backoff, bounded buffer (sin OOM), status check
- 🔭 **OTLP → SigNoz** — payload OTLP/HTTP JSON spec-compliant, ingestion key desde env var (nunca hardcodeada)
- 🧩 **Custom** — implementa `ITransport` y registra con `addTransport()`

### Hooks, serializers y más
- 🪝 **Hooks** — `on('beforeLog', ...)` (awaited, soporta redacción PII) / `on('afterLog', ...)`
- 🔄 **Middleware** — pipeline `use((entry, next) => ...)`
- 🧬 **Serializers** — transforma tipos antes de loggear (`addSerializer(Error, fn)`)
- 🖥️ **CLI integrado** — spinners, boxes, tablas, steps, headers

## 📊 Niveles de log

```text
trace(-1) < debug(0) < info(1) < warn(2) < error(3) < critical(4)
```

`trace` es el nivel más bajo, alineado con la banda TRACE de OpenTelemetry (severity 1-4). Cada `TransportRecord` incluye `severityNumber` y `severityText` OTel automáticamente.

| Nivel    | Valor | Severity OTel     | Uso típico                         |
|----------|-------|-------------------|------------------------------------|
| `trace`  | -1    | TRACE (1-4)       | Verbosidad máxima, internals       |
| `debug`  | 0     | DEBUG (5-8)       | Diagnóstico en desarrollo          |
| `info`   | 1     | INFO (9-12)       | Eventos informativos               |
| `warn`   | 2     | WARN (13-16)      | Condiciones inesperadas recuperables |
| `error`  | 3     | ERROR (17-20)     | Fallos de operación                |
| `critical` | 4   | FATAL (21-24)     | Errores fatales, shutdown          |

```typescript
import { LOG_LEVELS } from '@mks2508/better-logger';

logger.setVerbosity('debug');   // muestra trace + debug + ...
logger.setVerbosity('warn');    // solo warn, error, critical
logger.setVerbosity('silent');  // nada
```

`success()` emite a **INFO severity** (con styling de success y `tag: 'success'` en el record, para que transports distingan success de info genérico).

## 📚 Documentación

| Página | Contenido |
|--------|-----------|
| [Core](/advanced-logger/docs/core/) | Clase `Logger`, config, scoped loggers (`scope` / `component` / `api`), contexto anidado |
| [Context (MDC)](/advanced-logger/docs/context/) | `withContext` / `withContextAsync` / `child` / `setResource` con `AsyncLocalStorage` |
| [Transports](/advanced-logger/docs/transports/) | `FileTransport`, `HttpTransport`, `OtlpTransport`, custom `ITransport`, flush/shutdown |
| [Hooks & Middleware](/advanced-logger/docs/hooks/) | `on('beforeLog')` / `on('afterLog')` awaited, pipeline `use()` |
| [Serializers](/advanced-logger/docs/serializers/) | Transformación de tipos antes del log (`addSerializer`, prioridad, registry) |
| [Styles](/advanced-logger/docs/styles/) | `StyleBuilder`, presets (`cyberpunk`, `glassmorphism`, `minimal`, `debug`), temas, toggles |
| [CLI](/advanced-logger/docs/cli/) | Spinners, boxes, tablas, steps, headers para terminales Node.js |
| [Playground](/advanced-logger/docs/playground/) | Demos interactivas y ejemplos ejecutables |
| [Migración a v0.18](/advanced-logger/docs/migration-v0.18/) | Cambios breaking del refactor 0.18.x y guía de migración |
| [API Reference](/advanced-logger/docs/api/) | TypeDoc generado desde `src/` |

## 🌐 Compatibilidad

- ✅ **Browsers modernos** — soporte completo (CSS, DevTools, localStorage fallback)
- ✅ **Node.js** — core + transports (File async, HTTP, OTLP)
- ✅ **TypeScript** — definiciones completas
- ✅ **ESM & CommonJS** — ambos exports

## 🔗 Recursos

- 📦 **[NPM](https://www.npmjs.com/package/@mks2508/better-logger)**
- 🐛 **[Issues](https://github.com/MKS2508/advanced-logger/issues)**
- 📄 **Licencia** — MIT
