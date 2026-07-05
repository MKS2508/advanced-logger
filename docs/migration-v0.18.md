---
layout: default
title: Migración a 0.18.x
permalink: /migration/
---

# Migración a 0.18.x

0.18.x es un **reset completo** del package: el refactor F1–F6 (rolldown subpath layout, ScopedLogger por delegación, sistema de transports, hooks awaited, log context MDC, OTel en `TransportRecord`) reemplaza el núcleo legacy. Las versiones 1.x–5.x publicadas en npm están **deprecated** y muestran `Legacy — superseded by 0.18.x refactor` al cargarse. La línea `0.18.x` (último: `0.18.2-alpha.1`) es el **nuevo latest**.

Esta página lista los breaking changes que necesitas migrar. Para el detalle exhaustivo por fase, ver [CHANGELOG.md](https://github.com/MKS2508/advanced-logger/blob/main/CHANGELOG.md) y los commits bajo el topic `F1..F6`.

## Por qué el reset

El antiguo `Logger` monolítico (~970 líneas, single file) acumulaba deuda: handlers síncronos sin buffer, sin scopes ALS, sin OTel, MDC frágil con race conditions en scoped loggers. El refactor 0.18.x reorganiza el código en **subpaths** (`./core`, `./transports`, `./context`, `./hooks`, `./serializers`, `./styles`, `./cli`, `./playground`, `./node`) y reemplaza cada superficie legacy por una equivalente moderna.

Beneficios prácticos:

- **Transports async** con bounded buffer, retry con backoff, status check (sin OOM en outages largos).
- **MDC correcto** vía `AsyncLocalStorage` (Node) y `child()` inmutable (universal).
- **OTel-native**: cada `TransportRecord` lleva `severityNumber`, `severityText`, `traceId`, `spanId`, `attributes`, `resource`.
- **Hooks awaited** — el redact PII se aplica antes del emit, no después.
- **ScopedLogger por delegación** (~50-100x menos memoria por scope).

## Breaking changes principales

### 1. `withContext()` requiere callback

`logger.withContext({ bindings })` **sin callback** es **no-op** post-refactor. Era el setter global que mutaba el contexto del singleton; rompía scoped loggers con race conditions y se eliminó. Las dos formas correctas:

| Forma | Firma | Cuándo |
|---|---|---|
| Scoped (transitorio) | `logger.withContext({ ... }, fn)` o `logger.withContextAsync({ ... }, async () => ...)` | Bindings vivos solo dentro del callback |
| Persistente (inmutable) | `logger.child({ ... })` | Bindings atados al child logger, sin tocar al padre |

```typescript
// ❌ Ya no funciona (no-op, sin error, sin bindings aplicados)
logger.withContext({ requestId: 'r-42' });
logger.info('processing');  // attributes vacío

// ✅ Forma scoped (ALS — Node 14+)
logger.withContext({ requestId: 'r-42' }, () => {
  logger.info('processing');  // attributes: { requestId: 'r-42' }
});

// ✅ Forma persistente (inmutable, browser-safe)
const reqLog = logger.child({ requestId: 'r-42' });
reqLog.info('processing');   // attributes: { requestId: 'r-42' }
logger.info('unrelated');    // sin requestId (padre intacto)
```

Si necesitas bindings por request (Express/Hono/Fastify handler), el patrón canónico es:

```typescript
app.use((req, _res, next) => {
  req.log = logger.child({ requestId: req.headers['x-request-id'] });
  next();
});
```

Más detalle en [docs/context.md](../context/) (MDC, ALS, browser fallback) y la [referencia API](../api/index/classes/Logger.md).

### 2. Handlers → Transports

El sistema legacy basado en `ILogHandler` se reemplaza por el sistema de **transports** (`ITransport` con `write` / `flush` / `close` async).

| Legacy (eliminado) | Reemplazo |
|---|---|
| `FileLogHandler` | `FileTransport` (`./transports`) |
| `RemoteLogHandler` / `HttpLogHandler` | `HttpTransport` (`./transports`) |
| `AnalyticsLogHandler` | custom `ITransport` |
| `ExportLogHandler` | custom `ITransport` |
| `addHandler(handler)` | `addTransport({ target })` (vía registry) |

```typescript
// ❌ 5.x
logger.addHandler(new FileLogHandler({ destination: '/var/log/app.log' }));

// ✅ 0.18.x
import { FileTransport } from '@mks2508/better-logger/transports';
logger.addTransport({
  target: new FileTransport({
    destination: 'logs/app.log',     // relativa a process.cwd()
    batchSize: 100,
    flushInterval: 5000,
    maxBufferSize: 10_000            // bounded buffer
  }),
  level: 'info'
});
```

`addHandler(ILogHandler)` **se conserva** como shim legacy para callbacks síncronos simples (métricas, fire-and-forget). Para cualquier destino con buffer, retry, backoff o shutdown ordenado, implementa `ITransport`. Detalle completo en [docs/transports.md](../transports/).

### 3. Nivel `trace` añadido

`LogLevel` ahora es `'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical'` (+ `'silent'`). `trace` se alinea con la banda TRACE de OpenTelemetry (severity 1-4), pensado para verbosidad máxima / debug profundo:

```typescript
logger.trace('payload crudo', { bytes: 4096 });
logger.setVerbosity('debug');  // muestra trace + debug + info + ...
```

`severityNumber` y `severityText` se adjuntan a cada `TransportRecord` automáticamente — el `OtlpTransport` los usa para producir el payload OTLP `logRecords` spec-compliant.

Más sobre la jerarquía en [docs/core.md](../core/#niveles).

### 4. `log()` family retorna `Promise<void>`

Las llamadas `info()`, `warn()`, `error()`, etc. ahora **retornan** `Promise<void>` porque internamente awaitean los hooks `beforeLog`. Fire-and-forget sigue funcionando (la promesa queda flotando), pero se recomienda `await` cuando registras hooks que mutan el mensaje (redacción PII, enriquecimiento):

```typescript
// Antes: mutation async se perdía en el emit
logger.on('beforeLog', async (entry) => {
  entry.message = await redactPII(entry.message);
});

// Ahora: awaita la mutación antes de despachar a transports
await logger.info('login password=s3cr3t');
// → "login password=***" (redacción aplicada)
```

Si el caller no puede `await` (sync required), los hooks deben ser síncronos o aceptar que la mutación se pierda en ese caso.

### 5. Default export lazy (Proxy)

`import logger from '@mks2508/better-logger'` devuelve un **Proxy** que se inicializa al primer uso. Esto permite top-level imports sin side-effects y simplifica hot-reload. Si necesitas la clase directa:

```typescript
import { Logger } from '@mks2508/better-logger';
const appLogger = new Logger({ prefix: 'APP', verbosity: 'info' });
```

### 6. `ScopedLogger` por delegación

`scope()`, `component()`, `api()` ya **no devuelven subclases** de `Logger`. Internamente son `ScopedLogger` que delega al `Logger` raíz vía árbol interno — sin duplicar estado, sin capturar `this`. Beneficio: ~50-100x menos memoria por scope en aplicaciones con cientos de módulos.

```typescript
const auth = logger.scope('Auth');           // ScopedLogger
const db = auth.scope('DB');                 // ScopedLogger anidado
db.error('pool exhausted');
// → prefix efectivo: "Auth:DB" en el record
```

API pública no cambia. Si tu código dependía de `instanceof Logger` sobre scopes, ahora es `instanceof ScopedLogger`.

### 7. Campos OTel en `TransportRecord`

`TransportRecord` ahora incluye los campos del spec OTLP `LogRecord` además de los legacy:

```typescript
interface TransportRecord {
  // legacy
  level: LogLevel;
  message: string;
  prefix?: string;
  timestamp: number;
  attrs?: Record<string, unknown>;

  // OTel (nuevo)
  severityNumber?: number;      // 1-24 (TRACE=1-4, DEBUG=5-8, ...)
  severityText?: string;        // 'TRACE' | 'DEBUG' | 'INFO' | ...
  traceId?: string;             // 128-bit hex
  spanId?: string;              // 64-bit hex
  attributes?: Record<string, ...>;     // merged con MDC bindings
  resource?: ILogResourceRef;          // service.name / version / env
}
```

Si tu transport custom lee `record.attrs`, migrar a `record.attributes` (los transports built-in conservan `attrs` como alias deprecado por una versión; el custom deberías migrarlo).

### 8. Dead surface eliminada

El refactor F6 borró exports sin callers o con替代n Superior:

| Eliminado | Reemplazo |
|---|---|
| `CSS2ANSIAdapter` | Interno — no usar |
| `LogStyleBuilder` | `StyleBuilder` (subpath `./styles`) vía proxy `$` |
| `SemanticStyles` | `THEME_PRESETS` (`./styles`) o presets del Logger (`logger.preset('cyberpunk')`) |
| `HistoryCommand` (CLI) | Sin reemplazo — usar `logger.scope()` o un subpath CLI explícito |

```typescript
// ❌ createStyle() no existe
import { createStyle } from '@mks2508/better-logger';

// ✅ $
import { $ } from '@mks2508/better-logger/styles';
const style = $.bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white').padding('12px 24px').rounded('8px').build();
console.log('%c🚀 Hello', style);

// ✅ o instancia directa
import { StyleBuilder } from '@mks2508/better-logger/styles';
const style = new StyleBuilder().bg(...).color(...).build();
```

## Tabla de migración rápida

| 5.x (legacy) | 0.18.x | Notas |
|---|---|---|
| `logger.withContext({ k: v })` | `logger.withContext({ k: v }, fn)` o `logger.child({ k: v })` | Sin callback = no-op |
| `new FileLogHandler({ ... })` + `addHandler` | `new FileTransport({ ... })` + `addTransport` | Async, bounded buffer |
| `new RemoteLogHandler({ ... })` | `new HttpTransport({ ... })` | Retry + backoff |
| `new ExportLogHandler({ ... })` | `new OtlpTransport({ ... })` | OTLP/HTTP spec-compliant |
| `logger.success('ok')` | `logger.success('ok')` | Sin cambio (sigue emitiendo a INFO con `tag: 'success'`) |
| `addHandler(h)` con callback custom | `addTransport({ target })` con `ITransport` | Para side-effects simples, `addHandler` legacy sigue |
| Sin nivel `trace` | `logger.trace(...)` (+ `setVerbosity('debug')` por defecto) | OTel TRACE severity 1-4 |
| `log()` síncrono | `log()` retorna `Promise<void>` | `await` cuando hay hooks `beforeLog` que mutan |
| `TransportRecord.attrs` | `TransportRecord.attributes` (con `attrs` alias deprecado) | OTel mapping 1:1 |
| `setVerbosity('info')` | igual | Sin cambio |
| `clearContext()` | igual | Sin cambio |
| `setResource({ 'service.name': ... })` | igual | Sin cambio |
| `getContext()` | igual (snapshot read-only) | Sin cambio, pero NO incluye overlay ALS transitorio |

## Antes y después: ejemplo completo

```typescript
// ─────── 5.x (legacy) ───────
import logger, { FileLogHandler, RemoteLogHandler } from '@mks2508/better-logger';

logger.withContext({ requestId: getReqId() });   // setter global
logger.addHandler(new FileLogHandler({ destination: '/var/log/app.log' }));
logger.addHandler(new RemoteLogHandler({ url: 'https://logs/x', level: 'warn' }));
logger.info('login ok');                          // síncrono

// ─────── 0.18.x ───────
import logger from '@mks2508/better-logger';
import { FileTransport, HttpTransport, OtlpTransport } from '@mks2508/better-logger/transports';

const reqLog = logger.child({ requestId: getReqId() });            // inmutable

logger.addTransport({
  target: new FileTransport({ destination: 'logs/app.log', maxBufferSize: 10_000 }),
  level: 'info'
});
logger.addTransport({
  target: new HttpTransport({
    url: 'https://logs.example.com/ingest',
    maxRetries: 3,
    initialBackoffMs: 250,
    maxBufferSize: 10_000
  }),
  level: 'warn'
});
logger.addTransport({
  target: new OtlpTransport({
    endpoint: 'https://otelcollector.example.com:4318',
    serviceName: 'my-app',
    ingestKeyEnvVar: 'SIGNOZ_KEY'
  })
});

logger.setResource({ 'service.name': 'my-app', 'service.version': '1.2.3' });
await reqLog.info('login ok');                                    // awaited
```

## Verificación post-migración

Checklist rápido:

1. **Type-check** limpio: `bunx tsc --noEmit` (o `bun run typecheck`).
2. **No quedan imports** de `FileLogHandler`, `RemoteLogHandler`, `AnalyticsLogHandler`, `ExportLogHandler`, `CSS2ANSIAdapter`, `LogStyleBuilder`, `SemanticStyles`, `HistoryCommand`, `createStyle`.
3. **No quedan `withContext({ ... })`** sin segundo argumento callback. Usar `grep -rn "withContext(" src/`.
4. **`await logger.info(...)`** (o equivalente) en call sites donde tienes hooks `beforeLog` que mutan el mensaje.
5. **Transports async**: `await logger.closeTransports()` (o `await logger.cleanup()`) en handlers de `SIGTERM` para drenar buffers pendientes antes de exit.

## Recursos

- [CHANGELOG.md](https://github.com/MKS2508/advanced-logger/blob/main/CHANGELOG.md) — detalle por fase (F1–F6) con commits
- [docs/context.md](../context/) — MDC, `withContext(fn)`, `child()`, `setResource()`, ALS, browser fallback
- [docs/transports.md](../transports/) — `FileTransport` / `HttpTransport` / `OtlpTransport`, custom `ITransport`, flush/shutdown
- [docs/hooks.md](../hooks/) — `beforeLog` awaited, middleware `use()`
- [docs/styles.md](../styles/) — `StyleBuilder`, `$`, presets, temas
- [API Reference](../api/) — TypeDoc autogenerado desde `src/`
