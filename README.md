# 🚀 Better Logger

**Logger avanzado para consola con estilos CSS, log context tipo MDC, transports (File / HTTP / OTLP→SigNoz), hooks, serializers y CLI integrado. Soporte dual browser/terminal.**

[![NPM Version](https://img.shields.io/npm/v/@mks2508/better-logger)](https://www.npmjs.com/package/@mks2508/better-logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@mks2508/better-logger)](https://github.com/MKS2508/advanced-logger/blob/main/LICENSE)

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
- 🧩 **Contexto estructurado** — `withContext({ requestId, userId })` se mergea en cada `TransportRecord`
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

## 📊 Niveles de log

```text
trace(-1) < debug(0) < info(1) < warn(2) < error(3) < critical(4)
```

`trace` es el nivel más bajo, alineado con la banda TRACE de OpenTelemetry (severity 1-4). Cada `TransportRecord` incluye `severityNumber` y `severityText` OTel automáticamente.

```typescript
import { LOG_LEVELS } from '@mks2508/better-logger';

logger.setVerbosity('debug');   // muestra trace + debug + ...
logger.setVerbosity('warn');    // solo warn, error, critical
logger.setVerbosity('silent');  // nada
```

`success()` emite a **INFO severity** (con styling de success y `tag: 'success'` en el record, para que transports distingan success de info genérico).

## 🧩 Log Context (MDC)

Contexto estructurado que se adjunta a **cada** log emitido y se mergea en `TransportRecord.attributes`:

```typescript
// Mutar el logger (chaining)
logger.withContext({ requestId: 'req_123', userId: 'u_42' });
logger.info('processing');  // → attributes: { requestId, userId }

// Limpiar
logger.clearContext();

// Snapshot read-only
const ctx = logger.getContext();
```

### Loggers hijuelos (inmutables)

`child()` devuelve un logger nuevo con contexto merged, **sin tocar al padre** — ideal para request-scoped logging:

```typescript
const requestLogger = logger.child({ requestId: getRequestId() });
requestLogger.info('auth ok');     // lleva requestId
logger.info('unrelated');          // NO lleva requestId (padre intacto)
```

### Resource OTel

```typescript
logger.setResource({
  'service.name': 'my-app',
  'service.version': '1.2.3',
  'deployment.environment': 'production'
});
```

## 📡 Transports

Los transports reciben cada `TransportRecord` y lo mandan a un destino. Se registran con `addTransport()`:

```typescript
import logger, { FileTransport, HttpTransport, OtlpTransport } from '@mks2508/better-logger';
```

### File (Node.js)

```typescript
logger.addTransport({
  target: new FileTransport({
    destination: '/var/log/app.log',
    batchSize: 100,
    flushInterval: 5000,
    maxBufferSize: 10_000  // hard cap, drop oldest on overflow
  }),
  level: 'info'
});
```

- Escritura **async** con `fs.promises` (no bloquea el event loop)
- **Bounded buffer** — si se llena, dropea el record más viejo (avisa vía `onError`)
- Sanitización de `destination` (sin path traversal)
- En **browser**: fallback silencioso a `localStorage`

### HTTP

```typescript
logger.addTransport({
  target: new HttpTransport({
    url: 'https://logs.example.com/ingest',
    batchSize: 50,
    flushInterval: 5000,
    maxBufferSize: 10_000,
    maxRetries: 3,
    headers: { 'Authorization': `Bearer ${process.env.LOG_TOKEN}` }
  }),
  level: 'warn'
});
```

- Batching + flush periódico
- **Retry con backoff exponencial** (bounded)
- **Status check** — solo re-bufferea en errores recuperables (5xx, red), descarta en 4xx
- Bounded buffer (sin OOM en outages largos)

### OTLP → SigNoz (o cualquier backend OTLP/HTTP)

```typescript
logger.addTransport({
  target: new OtlpTransport({
    endpoint: 'https://otelcollector.example.com:4318',
    serviceName: 'my-app',           // requerido (service.name)
    serviceVersion: '1.2.3',
    environment: 'production',
    ingestKeyEnvVar: 'SIGNOZ_KEY',   // lee process.env.SIGNOZ_KEY — NUNCA hardcodear
    batchSize: 50,
    flushInterval: 5000
  })
});

logger.info('Hola desde better-logger → SigNoz');
// → POST <endpoint>/v1/logs con payload OTLP/HTTP JSON
// → visible en SigNoz Logs UI
```

El transport POSTea a `<endpoint>/v1/logs` con el body `LogsData` spec-compliant (`resourceLogs` → `scopeLogs` → `logRecords`). La ingestion key se lee de la **env var** indicada en `ingestKeyEnvVar` al construir el transport — no se escribe en código ni en el record.

> 🔐 **Seguridad:** la key vive en tu gestor de secrets (Bitwarden / Coolify env) y se inyecta vía `process.env`. El transport no la loguea ni la serializa.

### Registry de strings

Para los 4 built-ins puedes usar el nombre en vez de la instancia:

```typescript
logger.addTransport({ target: 'file', options: { destination: '/var/log/app.log' } });
logger.addTransport({ target: 'console' });
```

Para Otlp conviene la **instancia directa** (opciones tipadas: `endpoint`, `serviceName`, `ingestKeyEnvVar`).

### Custom transport

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
  async flush() { /* ... */ },
  async close() { /* ... */ }
};

logger.addTransport({ target: elastic });
```

### Flush y shutdown

```typescript
await logger.flushTransports();   // fuerza el envío del buffer
await logger.closeTransports();   // cierra todos (drain)
```

En shutdown limpio: `await logger.cleanup()` hace drain de transports + reset de estado.

## 🪝 Hooks & Middleware

```typescript
// beforeLog es AWAITED — las mutaciones se reflejan en el mensaje emitido
logger.on('beforeLog', (entry) => {
  entry.message = entry.message.replace(/password=\S+/g, 'password=***');
  return entry;
});

// afterLog es fire-and-forget (no cambia el mensaje ya en pantalla)
logger.on('afterLog', (entry) => {
  metrics.increment(`logs.${entry.level}`);
});

// Correlation ID en cada log
logger.use((entry, next) => {
  entry.correlationId = getCorrelationId();
  next();
});
```

`on()` / `once()` / `off()` / `use()` devuelven una función de unsub.

## 🧬 Serializers

Transforma tipos antes de serializarlos al log:

```typescript
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 5)
}));

logger.addSerializer(User, (user) => ({
  id: user.id,
  email: user.email   // password omitido
}));

logger.error('Failed:', new Error('timeout'));  // Error serializado custom
```

## 🏷️ Scoped Loggers

```typescript
// Scope simple
const auth = logger.scope('Auth');
auth.info('validating token');

// Component (auto-badge COMPONENT)
const db = logger.component('Database');
db.lifecycle('connect', 'pool ready');

// API (auto-badge API, +métodos slow/rateLimit/auth/deprecated)
const api = logger.api('GraphQL');
api.slow('query timeout', 1200);
api.deprecated('use v2 endpoint');
```

### Context logger (bloques anidados)

```typescript
const request = logger.scope('Request');

await request.context('auth').runAsync(async () => {
  // prefix efectivo: "Request:auth"
  request.info('checking credentials');
  await request.context('db').runAsync(async () => {
    // prefix: "Request:auth:db"
    request.info('querying user');
  });
});
```

## 🎨 Styling

```typescript
// Presets
logger.preset('cyberpunk');     // neón, glow
logger.preset('glassmorphism'); // blur moderno
logger.preset('minimal');
logger.preset('debug');

// Toggles
logger.hideTimestamp().showLocation().hideBadges();

// Tema
logger.setTheme('dark');   // 'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk'
```

### Estilos custom (StyleBuilder)

```typescript
import { createStyle } from '@mks2508/better-logger';

const style = createStyle()
  .bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .shadow('0 4px 15px rgba(102, 126, 234, 0.4)')
  .build();

console.log('%c🚀 Hello', style);
```

## 🖥️ CLI Primitives

Spinners, boxes, tablas, steps y headers para CLIs Node.js:

```typescript
logger.header('Deploy', 'production');
logger.step(2, 5, 'building');
logger.spinner('uploading...');

logger.box('Build complete', { border: 'round' });
logger.cliTable([
  { service: 'api', status: 'ok' },
  { service: 'db', status: 'ok' }
]);
```

## 🔧 Configuración avanzada

```typescript
import { Logger } from '@mks2508/better-logger';

const logger = new Logger({
  prefix: 'APP',
  verbosity: 'debug',
  enableStackTrace: true,
  theme: 'dark',
  timestampFormat: 'iso'
});

logger.updateConfig({ verbosity: 'warn' });
logger.resetConfig();
```

## 🌐 Compatibilidad

- ✅ **Browsers modernos** — soporte completo (CSS, DevTools, localStorage fallback)
- ✅ **Node.js** — core + transports (File async, HTTP, OTLP)
- ✅ **TypeScript** — definiciones completas
- ✅ **ESM & CommonJS** — ambos exports

## 🔗 Recursos

- 📦 **[NPM](https://www.npmjs.com/package/@mks2508/better-logger)**
- 📚 **[Documentación](docs/)** — [API](docs/API.md) · [Core](docs/CORE.md) · [Exports](docs/EXPORTS.md) · [Styling](docs/STYLING.md)
- 🐛 **[Issues](https://github.com/MKS2508/advanced-logger/issues)**

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
