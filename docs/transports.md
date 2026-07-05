---
layout: default
title: Transports
permalink: /transports/
---

# Transports

Los **transports** reciben cada `TransportRecord` que produce el Logger y lo envían a un destino externo: `console`, fichero, endpoint HTTP, collector OTLP, o cualquier destino custom. Se registran con `logger.addTransport()` y devuelven un **id opaco** que puedes usar con `removeTransport()`.

Cada transport filtra por `level` de forma independiente, así que puedes tener un `FileTransport` a `info` y un `HttpTransport` a `warn` sobre el mismo Logger.

> 🔑 **Distinción clave — `addHandler()` vs `addTransport()`**
>
> No son la misma cosa. **No los mezcles.**
>
> | | `addHandler(handler)` | `addTransport(target)` |
> |---|---|---|
> | Contrato | `ILogHandler` | `ITransport` |
> | Firma | `handle(level, msg, args, metadata): void` | `write(record)`, `flush?()`, `close?()` |
> | Estilo | Callback **síncrono** legacy | Pipeline **async**, buffered |
> | Buffer / retry / batch | ❌ | ✅ |
> | Retorna | `void` | `id: string` |
> | Para qué | Side-effects simples ( métrica, fire-and-forget) | File / HTTP / OTLP / custom con lifecycle |
>
> `addHandler` queda como compatibilidad legacy para un callback síncrono; para cualquier destino con buffer, flush o shutdown, implementa `ITransport` y úsalo con `addTransport`.
>
> Referencia: [`ILogHandler`](../api/index/interfaces/ILogHandler.md) · [`ITransport`](../api/index/interfaces/ITransport.md)

## 📥 Imports

Las clases de transport viven en el subpath `@mks2508/better-logger/transports`:

```typescript
import {
  ConsoleTransport,
  FileTransport,
  HttpTransport,
  OtlpTransport,
  TransportManager
} from '@mks2508/better-logger/transports';

// tipos y registro desde el main
import type { ITransport, TransportRecord, TransportTarget } from '@mks2508/better-logger';
import logger from '@mks2508/better-logger';
```

## 🖥️ ConsoleTransport

Transport por defecto. El Logger registra uno automáticamente si no configuras ninguno. Mapea cada nivel al método de `console` más cercano para que el filtrado nativo de DevTools / `NODE_DEBUG` siga funcionando.

**Mapeo level → método**: `debug → console.log`, `info → console.info`, `warn → console.warn`, `error/critical → console.error`.

**Formato**: `[LEVEL] [prefix] msg (file:line)` (prefix y localización se omiten si el registro no las trae).

```typescript
import { ConsoleTransport } from '@mks2508/better-logger/transports';

logger.addTransport({ target: new ConsoleTransport() });
logger.addTransport({ target: new ConsoleTransport({ level: 'warn' }) });
// → console.warn("[WARN] [db] pool exhausted (pool.ts:87)")
```

Raramente necesitas instanciarlo a mano — el Logger ya tiene uno. Úsalo solo si quieres reemplazar el default o forzar un `level` distinto del global.

**Referencia**: [`ConsoleTransport`](../api/transports-module/classes/ConsoleTransport.md)

## 📁 FileTransport

Escritura a fichero en Node, fallback a `localStorage` en browser.

- **Node**: `fs.promises.appendFile` vía dynamic import (no bloquea el event loop, no envía código Node-only al bundle del browser).
- **Browser**: acumula en `localStorage` con prefijo `better-logger:`; no-op silencioso si el storage no está disponible (modo privado, iframes sandbox, quota agotada).
- **Bounded buffer**: al llegar a `maxBufferSize` suelta el registro más viejo (drop-oldest) y emite `onError` con el payload descartado.
- **Sanitización de `destination`**: en Node rechaza segmentos `..`, `~` y rutas absolutas (path traversal); en browser colapsa a `[a-zA-Z0-9_-]`.

```typescript
import { FileTransport } from '@mks2508/better-logger/transports';

logger.addTransport({
  target: new FileTransport({
    destination: 'logs/app.log',   // relativa a process.cwd()
    batchSize: 100,
    flushInterval: 5000,
    maxBufferSize: 10_000,         // hard cap → drop oldest on overflow
    onError: (entry) => metrics.increment('log_drop', { reason: entry.message })
  }),
  level: 'info'
});

// Browser: persiste en localStorage bajo 'better-logger:audit'
logger.addTransport({ target: new FileTransport({ destination: 'audit' }) });
```

| Opción | Default | Descripción |
|---|---|---|
| `destination` | `'app.log'` / `'default'` | Ruta Node o clave localStorage |
| `batchSize` | `100` | Flush al alcanzar este nº de records |
| `flushInterval` | — | Flush periódico (ms) |
| `maxBufferSize` | `10_000` | Techo del buffer (drop-oldest) |
| `onError` | — | Hook de overflow / fallo de escritura |

**Referencia**: [`FileTransport`](../api/transports-module/classes/FileTransport.md)

## 🌐 HttpTransport

POSTea batches a un endpoint HTTP. Pensado para ingestion services propios.

- **Batching** por tamaño (`batchSize`) o intervalo (`flushInterval`).
- **Retry con backoff exponencial** (bounded): arranca en `initialBackoffMs`, duplica por intento, techo `maxBackoffMs`, hasta `maxRetries`.
- **Status check**: `2xx` → entregado; `4xx` → dropeado sin retry (cliente no se recupera); `5xx` o fallo de red → retry.
- **Timeout** por intento con `AbortController` (`fetchTimeoutMs`).
- **Bounded buffer**: en outage largo, drop-oldest con `onError` observable.
- **Body default**: `{ logs: TransportRecord[] }`. Cambia el wire format sobrescribiendo los hooks `protected serializeBody()` / `buildHeaders()` (ver `OtlpTransport` como referencia).

```typescript
import { HttpTransport } from '@mks2508/better-logger/transports';

logger.addTransport({
  target: new HttpTransport({
    url: 'https://logs.example.com/ingest',
    headers: { Authorization: `Bearer ${process.env.LOG_TOKEN}` },
    batchSize: 50,
    flushInterval: 5000,
    maxBufferSize: 10_000,
    maxRetries: 3,
    initialBackoffMs: 250,
    maxBackoffMs: 5_000,
    fetchTimeoutMs: 10_000,
    onError: (entry) => console.error('[log-drop]', entry.message)
  }),
  level: 'warn'
});
```

| Opción | Default | Descripción |
|---|---|---|
| `url` | — | Endpoint POST |
| `headers` | — | Headers extra (auth, custom) |
| `batchSize` | `50` | Records por POST |
| `flushInterval` | — | Flush periódico (ms) |
| `maxBufferSize` | `10_000` | Techo del buffer |
| `maxRetries` | `3` | Reintentos antes de drop |
| `initialBackoffMs` | `250` | Backoff inicial |
| `maxBackoffMs` | `5_000` | Techo de backoff |
| `fetchTimeoutMs` | `10_000` | Timeout por intento |
| `onError` | — | Hook de overflow / 4xx / retry exhausto |

**Referencia**: [`HttpTransport`](../api/transports-module/classes/HttpTransport.md)

## 🔭 OtlpTransport → SigNoz

Extiende `HttpTransport` y produce un payload **OTLP/HTTP JSON** spec-compliant (`LogsData` → `resourceLogs` → `scopeLogs` → `logRecords`). Compatible con SigNoz o cualquier collector OTLP/HTTP.

POSTea a `<endpoint>/v1/logs` e inyecta el header `signoz-ingestion-key` con la key resuelta al construir.

```typescript
import { OtlpTransport } from '@mks2508/better-logger/transports';

logger.addTransport({
  target: new OtlpTransport({
    endpoint: 'https://otelcollector.example.com:4318',  // requerido
    serviceName: 'my-app',                               // requerido (service.name)
    serviceVersion: '1.2.3',
    environment: 'production',
    ingestKeyEnvVar: 'SIGNOZ_KEY',   // ← lee process.env.SIGNOZ_KEY
    batchSize: 50,
    flushInterval: 5000
  })
});

logger.info('Hola desde better-logger → SigNoz');
// → POST https://otelcollector.example.com:4318/v1/logs
// → LogsData con resourceLogs/scopeLogs/logRecords OTLP
```

> 🔐 **Seguridad — ingestion key**
>
> La key vive en tu gestor de secrets (Bitwarden / Coolify env) y se inyecta vía `process.env`. El transport lee `process.env[ingestKeyEnvVar]` al construirse y **nunca** la loguea, serializa ni escribe a source. Si la env var no está seteada, el header se omite silenciosamente (el collector OTLP usa el path default sin auth).
>
> **Nunca** hardcodees la key en código, ni la pases como string literal en `headers`.

**Referencia**: [`OtlpTransport`](../api/transports-module/classes/OtlpTransport.md)

## 🏷️ Registry de strings

Para los 4 built-ins puedes usar el nombre en vez de la instancia — el `TransportManager` los resuelve contra su registry interno:

```typescript
logger.addTransport({ target: 'file', options: { destination: 'logs/app.log' } });
logger.addTransport({ target: 'console', level: 'warn' });
logger.addTransport({ target: 'http', options: { url: 'https://logs.example.com/ingest' } });
```

Built-ins registrados: `'console'`, `'file'`, `'http'`, `'otlp'`.

Para `OtlpTransport` conviene la **instancia directa** — las options (`endpoint`, `serviceName`, `ingestKeyEnvVar`) están tipadas y el constructor valida los campos requeridos.

### Registrar un transport custom por nombre

Si tienes un transport reutilizable, lo registras una vez y luego lo referencias por string:

```typescript
import { TransportManager } from '@mks2508/better-logger/transports';

const tm = logger.getTransportManager();
if (tm) {
  tm.register('datadog', DatadogTransport);  // ahora usable por nombre
  logger.addTransport({ target: 'datadog', options: { apiKey: process.env.DD_KEY } });
  tm.listRegistered();  // ['console','file','http','otlp','datadog']
}
```

Los built-ins **no** se pueden sobrescribir: `register('file', ...)` lanza para evitar silenciar un transport crítico por accidente de naming. El registro es por-instancia (no comparte entre `Logger` distintos).

**Referencia**: [`TransportManager`](../api/transports-module/classes/TransportManager.md)

## 🧩 Custom transport

Implementa la interfaz [`ITransport`](../api/index/interfaces/ITransport.md):

```typescript
interface ITransport {
  readonly name: string;
  write(record: TransportRecord): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
  isReady?(): boolean;
}
```

Ejemplo mínimo — un transport que POSTea cada record a Elasticsearch:

```typescript
import type { ITransport, TransportRecord } from '@mks2508/better-logger';

const elastic: ITransport = {
  name: 'elasticsearch',
  async write(record: TransportRecord) {
    await fetch('https://es.example.com/logs/_doc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(record)
    });
  },
  async flush() { /* drain si tu transport bufferiza */ },
  async close() { /* cerrar sockets / timers */ }
};

logger.addTransport({ target: elastic, level: 'info' });
```

Para transports HTTP con buffer, retry y backoff ya resueltos, **extiende `HttpTransport`** y sobrescribe solo `serializeBody()` / `buildHeaders()` — es lo que hace `OtlpTransport`.

### Transform por transport

`TransportOptions.transform` muta o descarta el record **antes** de que llegue al `write` concreto. Devolver `null` dropea el record solo para ese transport:

```typescript
logger.addTransport({
  target: new FileTransport({ destination: 'logs/errorsonly.log' }),
  level: 'debug',
  options: { transform: (r) => (r.level === 'error' || r.level === 'critical' ? r : null) }
});
```

## 🔌 Flush y shutdown

Los transports buffered (`File`, `Http`, `Otlp`) acumulan records y los envían por batch. Para forzar el envío del buffer o cerrar todo de forma ordenada:

```typescript
await logger.flushTransports();   // fuerza el flush del buffer de todos
await logger.closeTransports();   // flush + close de todos (drain)

// Shutdown limpio del proceso:
process.on('SIGTERM', async () => {
  await logger.cleanup();         // drain de transports + reset de estado del Logger
  process.exit(0);
});
```

- `flushTransports()` — vacía buffers pendientes sin cerrar transports.
- `closeTransports()` — flush final + `close()` en cada transport (libera timers, sockets, file handles).
- `cleanup()` — drain de transports + reset completo del Logger (útil para tests o reinicio en caliente).

Los errores de `flush` / `close` (sync throw o Promise rejection) se capturan y se loguean por consola — nunca propagan al caller, para que un transport roto no rompa el shutdown.

## 🔗 Referencia API

- [`ConsoleTransport`](../api/transports-module/classes/ConsoleTransport.md)
- [`FileTransport`](../api/transports-module/classes/FileTransport.md)
- [`HttpTransport`](../api/transports-module/classes/HttpTransport.md)
- [`OtlpTransport`](../api/transports-module/classes/OtlpTransport.md)
- [`TransportManager`](../api/transports-module/classes/TransportManager.md)
- [`ITransport`](../api/index/interfaces/ITransport.md) · [`TransportRecord`](../api/index/interfaces/TransportRecord.md) · [`ILogHandler`](../api/index/interfaces/ILogHandler.md)
