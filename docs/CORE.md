---
layout: default
title: Core Logger
permalink: /core/
---

# 🧱 Core Logger

## Qué es

`CoreLogger` es la versión minimal del Logger (~360 líneas): solo emisión a `console` + handlers custom. Sin transports, hooks, serializers, themes, badges, banners, SVG, CLI primitives ni scoped loggers avanzados.

Pensado para **server-side**, CLIs ligeros y bundles donde no necesitas el arsenal visual ni de pipelining del `Logger` default. Auto-detecta entorno (browser con CSS / Node con formato plano) y ya está.

Se importa desde el **subpath `./core`** del package:

```typescript
import { CoreLogger } from '@mks2508/better-logger/core';
```

El módulo exporta además un **singleton** `coreLogger` (default export) y métodos sueltos (`info`, `warn`, `error`, ...) para uso drop-in.

## Cuándo usar CoreLogger vs Logger default

| Caso de uso                                           | Recomendación        |
| ----------------------------------------------------- | -------------------- |
| Script Node puro, CLI ligera, worker sin I/O externo  | `CoreLogger`         |
| Server-side sin necesidad de OTel / File / HTTP       | `CoreLogger`         |
| Lambda / edge function con bundle size crítico         | `CoreLogger`         |
| App con transports (File, HTTP, OTLP→SigNoz)          | `Logger` (default)   |
| Necesitas hooks (`beforeLog` para PII redaction)      | `Logger` (default)   |
| Serializers por tipo (`Error`, clases de dominio)     | `Logger` (default)   |
| Badges, banners, presets, themes, SVG, CLI primitives | `Logger` (default)   |
| Log context MDC (`withContext` / `child`)             | `Logger` (default)   |

Regla práctica: si solo quieres "loggear a consola con buen formato y algún handler custom", `CoreLogger` basta. En cuanto necesites enviar records a otro destino o transformarlos en pipeline, salta al `Logger` default.

## Diferencia clave

| Feature                              | `Logger` (default) | `CoreLogger` |
| ------------------------------------ | :----------------: | :----------: |
| Emisión a `console` con formato      | ✅                 | ✅           |
| `addHandler(ILogHandler)`            | ✅                 | ✅           |
| `scope(prefix)`                      | ✅                 | ✅           |
| `table` / `group` / `groupEnd`       | ✅                 | ✅           |
| `time` / `timeEnd`                   | ✅                 | ✅           |
| Niveles `debug`/`info`/`warn`/`error`/`critical`/`trace` | ✅     | ✅           |
| **Transports** (File / HTTP / OTLP)  | ✅                 | ❌           |
| **Hooks** (`on`/`once`/`off`/`use`)  | ✅                 | ❌           |
| **Serializers** por tipo             | ✅                 | ❌           |
| **Log context MDC** (`withContext` / `child`) | ✅        | ❌           |
| **Resource OTel** (`setResource`)    | ✅                 | ❌           |
| **Themes / presets / banners / SVG** | ✅                 | ❌           |
| **Badges** (`badges()` / `badge()`)  | ✅                 | ❌           |
| **Scoped loggers** (`component`/`api`/`lifecycle`) | ✅     | ❌           |
| **CLI primitives** (`spinner`/`box`/`step`/`header`/`cliTable`) | ✅ | ❌   |
| **StyleBuilder** (`$` proxy)         | ✅                 | ❌           |

> Nota: `CoreLogger` no expone `withContext` ni `child`. Para contexto estructurado (MDC) usa el `Logger` default. Recordatorio: en el `Logger` default, `withContext({ bindings })` **sin callback** es NO-OP post-refactor — la forma correcta es `logger.withContext({ requestId }, () => { ... })` (callback, scoped AsyncLocalStorage) o `logger.child({ requestId })` (inmutable, persistente).

## Uso

### Instancia propia

```typescript
import { CoreLogger } from '@mks2508/better-logger/core';

const core = new CoreLogger({
  verbosity: 'info',          // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical' | 'silent'
  enableColors: false,        // default: true en browser, false en Node
  enableTimestamps: true,
  enableStackTrace: false,
  globalPrefix: 'auth-svc',
  outputFormat: 'auto'        // 'auto' | 'plain' | 'ansi' | 'build' | 'ci'
});

core.info('usuario autenticado');
core.error('falló la conexión', new Error('ETIMEDOUT'));
```

### Singleton y métodos sueltos

El módulo exporta un singleton (`coreLogger`) y funciones con binding correcto, listas para uso drop-in:

```typescript
import core, { info, warn, setVerbosity } from '@mks2508/better-logger/core';

setVerbosity('warn');   // filtra trace/debug/info
info('no se verá');
warn('este sí');

core.table([{ k: 'a', v: 1 }, { k: 'b', v: 2 }]);
```

### Scope

`scope()` devuelve una **nueva instancia** de `CoreLogger` con el prefijo combinado (hereda config y handlers del padre):

```typescript
const auth = core.scope('Auth');
const db = auth.scope('DB');   // prefijo efectivo: "auth-svc:Auth:DB"
db.error('pool exhausted');
// → [auth-svc:Auth:DB] pool exhausted
```

> `scope()` en `CoreLogger` es **prefix-only** (no adjunta contexto MDC). Si necesitas bindings estructurados en cada `TransportRecord`, usa `Logger` default con `child({ requestId })`.

### Timers y grouping

```typescript
core.time('query');
// ... trabajo ...
core.timeEnd('query');   // → Timer ended: query - 12.34ms

core.group('bootstrap', true);   // collapsed=true en browser
core.info('cargando config');
core.info('conectando a DB');
core.groupEnd();
```

## API

### Constructor

```typescript
new CoreLogger(config?: Partial<LoggerConfig>)
```

`LoggerConfig` es la misma interface que usa el `Logger` default; `CoreLogger` solo lee el subset que aplica (no hay tema ni banner aquí). Defaults razonables vía `DEFAULT_CONFIG`.

### Niveles

```typescript
core.trace(...args)     // mapping interno a debug + console.trace()
core.debug(...args)
core.info(...args)
core.warn(...args)
core.error(...args)
core.critical(...args)
```

Jerarquía: `trace < debug < info < warn < error < critical` (+ `silent`). `setVerbosity('warn')` filtra todo por debajo de `warn`.

### Utilidades de consola

| Método                                 | Descripción                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `table(data, columns?)`                | `console.table` en browser, ASCII table en Node      |
| `group(label, collapsed=false)`        | Abre grupo (nativo browser / `┌─` en Node)           |
| `groupEnd()`                           | Cierra el grupo actual                               |
| `time(label)`                          | Inicia timer con `performance.now()` / `hrtime`       |
| `timeEnd(label)`                       | Detiene timer y emite elapsed en ms                  |

### Configuración en runtime

| Método                              | Descripción                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `setGlobalPrefix(prefix)`           | Cambia el prefijo global                             |
| `setVerbosity(level)`               | Cambia el nivel de verbosity                         |
| `scope(prefix): CoreLogger`         | Devuelve logger con prefijo combinado                |
| `addHandler(handler: ILogHandler)`  | Registra handler custom                              |
| `getConfig(): LoggerConfig`         | Snapshot read-only de la config actual               |

### Singleton y exports del módulo `./core`

```typescript
// default export: instancia singleton
import coreLogger from '@mks2508/better-logger/core';

// métodos sueltos (binding al singleton)
import {
  debug, info, warn, error, critical, trace,
  table, group, groupEnd, time, timeEnd,
  setGlobalPrefix, scope, setVerbosity, addHandler
} from '@mks2508/better-logger/core';

// tipos
import type {
  LogLevel, Verbosity, LoggerConfig, ILogHandler, LogMetadata
} from '@mks2508/better-logger/core';
```

## Handler custom (legacy)

`CoreLogger` no implementa el sistema de `Transport` ni el pipeline de `Hook`/`Middleware`. Para extensibilidad expone el **handler legacy** basado en la interfaz `ILogHandler`:

```typescript
import type { ILogHandler } from '@mks2508/better-logger/core';

const metricsHandler: ILogHandler = {
  handle(level, message, args, metadata) {
    // level: LogLevel
    // message: string (primer arg stringificado)
    // args: unknown[] (args crudos del llamado original)
    // metadata: { timestamp, level, prefix?, stackInfo?, group? }
    statsd.increment(`logs.${level}`, { prefix: metadata.prefix });
  }
};

core.addHandler(metricsHandler);
```

Los handlers se invocan **siempre después** de la emisión a `console`, de forma sincrónica. Si un handler lanza, el error se captura y se loguea vía `console.error` — no rompe el flujo ni causa recursión.

> Para destinos asíncronos con batching, retry, backoff o flush controlado, usa el `Logger` default con `addTransport({ target: new FileTransport(...) | new HttpTransport(...) | new OtlpTransport(...) })`. `CoreLogger` no ofrece esos mecanismos.

## Referencia API

- Clase: [`CoreLogger` — docs/api/core/classes/CoreLogger.md](/docs/api/core/classes/CoreLogger.md/)
- Interfaces: [`LoggerConfig`](/docs/api/core/interfaces/LoggerConfig.md/), [`ILogHandler`](/docs/api/core/interfaces/ILogHandler.md/), [`LogMetadata`](/docs/api/core/interfaces/LogMetadata.md/)
- Tipos: [`LogLevel`](/docs/api/core/type-aliases/LogLevel.md/), [`Verbosity`](/docs/api/core/type-aliases/Verbosity.md/)
- Subpath package: `@mks2508/better-logger/core`
