# 📤 Transports, Hooks & Serializers

**Cómo enviar, transformar y enriquecer logs hacia destinos externos** (File, HTTP, OTLP→SigNoz, o custom).

```typescript
import logger, {
  FileTransport, HttpTransport, OtlpTransport, ConsoleTransport
} from '@mks2508/better-logger';
```

## Transports

Un transport recibe cada `TransportRecord` y lo envía a un destino. Se registran con `addTransport()`:

```typescript
const id = logger.addTransport({
  target: new OtlpTransport({ /* ... */ }),
  level: 'info'                    // opcional: filtra por nivel
});
logger.removeTransport(id);
```

`target` acepta una **instancia** (opciones tipadas) o un **string** del registry built-in (`'console' | 'file' | 'http' | 'otlp'`).

### ConsoleTransport

Salida a consola con styling. Sin opciones.

```typescript
logger.addTransport({ target: 'console' });
```

### FileTransport (Node + browser)

```typescript
logger.addTransport({
  target: new FileTransport({
    destination: '/var/log/app.log',   // path Node | key localStorage (browser)
    batchSize: 100,
    flushInterval: 5000,
    maxBufferSize: 10_000,             // hard cap, drop oldest on overflow
    onError: (entry) => console.warn('file transport:', entry.message)
  })
});
```

- **Node:** batches vía `fs.promises.appendFile` (async, non-blocking).
- **Browser:** batches a `localStorage` (fallback no-op si no disponible).
- Sanitización de `destination` (sin path traversal).

### HttpTransport

```typescript
logger.addTransport({
  target: new HttpTransport({
    url: 'https://logs.example.com/ingest',
    headers: { 'Authorization': `Bearer ${process.env.LOG_TOKEN}` },
    batchSize: 50,
    flushInterval: 5000,
    maxBufferSize: 10_000,
    maxRetries: 3,
    initialBackoffMs: 250,
    maxBackoffMs: 5_000,
    fetchTimeoutMs: 10_000
  }),
  level: 'warn'
});
```

- Batching + flush periódico.
- **Retry con backoff exponencial** (solo en errores recuperables: red, 5xx). 4xx = drop.
- **Bounded buffer** — si se llena, dropea el más viejo y avisa vía `onError` (sin OOM en outages largos).

### OtlpTransport (SigNoz / OTLP-HTTP)

```typescript
logger.addTransport({
  target: new OtlpTransport({
    endpoint: 'https://otelcollector.example.com:4318',
    serviceName: 'my-app',                 // requerido (service.name)
    serviceVersion: '1.2.3',
    environment: 'production',
    ingestKeyEnvVar: 'SIGNOZ_KEY',         // lee process.env.SIGNOZ_KEY
    batchSize: 50,
    flushInterval: 5000
  })
});

logger.info('Hola → SigNoz');
// → POST <endpoint>/v1/logs (body OTLP/HTTP JSON)
```

Extiende `HttpTransport` (hereda retry, bounded buffer, timeout). Construye el payload OTLP spec-compliant con los campos del `TransportRecord`:

- `service.name` / `service.version` / `deployment.environment` → `resource.attributes`
- `level` → `severityNumber` + `severityText`
- `time` → `timeUnixNano`
- `msg` → `body.stringValue`
- `attributes`, `location`, `traceId`, `spanId` → `logRecords[].attributes`

> 🔐 La ingestion key se resuelve desde `process.env[ingestKeyEnvVar]` al construir el transport. No se escribe en código, no se loguea, no va en el record.

### Custom transport

Implementa `ITransport`:

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

// O registrar por nombre en el registry
logger.getTransportManager()?.register('elastic', ElasticTransport);
logger.addTransport({ target: 'elastic', options: { /* ... */ } });
```

### Transform por transport

Cada transport acepta un `transform` para mutar/filtrar records antes de enviar:

```typescript
logger.addTransport({
  target: new HttpTransport({ url: '...' }),
  transform: (record) => {
    if (record.level === 'trace') return null;   // drop trace en este transport
    return { ...record, msg: record.msg.slice(0, 500) };  // truncar
  }
});
```

### Flush & shutdown

```typescript
await logger.flushTransports();   // fuerza envío del buffer
await logger.closeTransports();   // cierra todos (drain)
await logger.cleanup();           // drain transports + reset estado
```

Llama `cleanup()` en shutdown para no perder logs en buffer.

## Hooks & Middleware

### Hooks

```typescript
// beforeLog: AWAITED — las mutaciones se reflejan en el mensaje emitido
const unsub = logger.on('beforeLog', (entry) => {
  entry.message = entry.message.replace(/password=\S+/g, 'password=***');
  return entry;
});

logger.on('afterLog', (entry) => {           // fire-and-forget
  metrics.increment(`logs.${entry.level}`);
});

logger.once('beforeLog', (entry) => { /* runs once */ });
logger.off('beforeLog', cb);
unsub();   // alternativa para desuscribir
```

`HookEvent`: `'beforeLog' | 'afterLog' | 'onError'`.

### Middleware (pipeline)

```typescript
logger.use((entry, next) => {
  entry.correlationId = getCorrelationId();
  next();
});

logger.use((entry, next) => {
  // redactar campos sensibles
  if (entry.args) entry.args = entry.args.map(redactSecrets);
  next();
});
```

Los middleware corren en orden de prioridad (menor = antes).

## Serializers

Transforma un tipo antes de serializarlo al log:

```typescript
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 5)
}));

logger.addSerializer(User, (user) => ({
  id: user.id,
  email: user.email       // password omitido
}));

logger.error('Failed:', new Error('timeout'));   // → Error serializado custom
logger.info('user:', currentUser);                // → User serializado custom

logger.removeSerializer(Error);
```

Los serializers tienen `priority` (mayor = antes) y se encadenan por tipo.

## TransportRecord

El payload que recibe cada transport:

```typescript
interface TransportRecord {
  level: LogLevel;
  levelValue: number;
  severityNumber: number;           // OTel 1-24
  severityText: string;             // TRACE|DEBUG|INFO|WARN|ERROR|FATAL
  time: number;                     // epoch ms
  msg: string;                      // post-hook
  prefix?: string;
  location?: { file: string; line: number; column: number; function?: string };
  traceId?: string;
  spanId?: string;
  attributes?: ILogAttributes;      // incluye el log context (MDC)
  resource?: Partial<ILogResource>;
  tag?: LogTag;
}
```
