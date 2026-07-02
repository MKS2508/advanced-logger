# 📦 Core Module

**Logging esencial: niveles, verbosidad, log context (MDC) y scoped loggers.**

```typescript
import logger, { LOG_LEVELS, LogLevel, Verbosity } from '@mks2508/better-logger';
```

## Niveles de log

```text
trace(-1) < debug(0) < info(1) < warn(2) < error(3) < critical(4)
```

- **`trace`** — el nivel más bajo. Traza muy verbosa, alineado con OTel TRACE (severity 1-4). Filtrado por defecto (verbosity=`debug` no lo muestra; usa `setVerbosity('trace')`).
- **`debug`** — información de depuración detallada.
- **`info`** — mensajes informativos generales.
- **`warn`** — advertencias no bloqueantes.
- **`error`** — errores que afectan funcionalidad.
- **`critical`** — errores críticos (mapea a OTel FATAL).

```typescript
logger.trace('entering hot loop');
logger.debug('cache miss', { key });
logger.info('server started on :3000');
logger.warn('memory at 85%');
logger.error('request failed', err);
logger.critical('disk full, aborting');
```

`success()` emite a **INFO severity** con `tag: 'success'` (para que transports distingan success de info genérico) y styling propio.

## Verbosidad

Filtra qué niveles se muestran. Todo lo **< verbosity** se omite (incluido el dispatch a transports).

```typescript
logger.setVerbosity('trace');    // todo
logger.setVerbosity('debug');    // debug y superiores (NO trace)
logger.setVerbosity('info');     // info+ (por defecto)
logger.setVerbosity('warn');     // warn, error, critical
logger.setVerbosity('silent');   // nada
```

```typescript
import { LOG_LEVELS } from '@mks2508/better-logger';
if (LOG_LEVELS[level] >= LOG_LEVELS.warn) { /* ... */ }
```

## Log context (MDC)

Contexto estructurado adjunto a **cada** log emitido. Se mergea en `TransportRecord.attributes`, así que llega a todos los transports (incluido OTLP→SigNoz).

```typescript
// Mutar el logger con chaining
logger
  .withContext({ requestId: 'req_123' })
  .withContext({ userId: 'u_42' });

logger.info('processing');   // → attributes: { requestId: 'req_123', userId: 'u_42' }

logger.clearContext();
logger.getContext();         // snapshot read-only
```

### Loggers hijuelos (inmutables)

`child()` devuelve un logger nuevo con el contexto merged, **sin mutar al padre** — ideal para request-scoped logging sin fugas entre requests:

```typescript
function handleRequest(req) {
  const log = logger.child({ requestId: req.id });
  log.info('start');
  // ... log lleva requestId en cada línea
  // logger (padre) NO se ve afectado
}
```

### Resource OTel

```typescript
logger.setResource({
  'service.name': 'my-app',
  'service.version': '1.2.3',
  'deployment.environment': process.env.NODE_ENV
});
```

## Scoped loggers

Prefijo lógico + badges automáticos para namespacing limpio:

```typescript
const auth = logger.scope('Auth');
auth.info('validating token');      // [Auth] validating token
auth.success('token valid');

const db = logger.component('Database');
db.lifecycle('connect', 'pool ready');   // [COMPONENT] [Database] connect: pool ready

const api = logger.api('GraphQL');
api.slow('query timeout', 1200);         // [API] [GraphQL] [SLOW] query timeout (1200ms)
api.deprecated('use v2');                 // [API] [GraphQL] [DEPRECATED] use v2
```

### Context logger (bloques anidados)

Prefijo jerárquico acumulativo:

```typescript
const req = logger.scope('Request');

await req.context('auth').runAsync(async () => {
  req.info('checking credentials');        // [Request:auth]
  await req.context('db').runAsync(async () => {
    req.info('querying user');             // [Request:auth:db]
  });
});
```

## Performance / timing

```typescript
logger.time('api-request');
const data = await fetch('/api/data').then(r => r.json());
const ms = logger.timeEnd('api-request');  // muestra duración, retorna ms

logger.table([{ service: 'api', status: 'ok' }, { service: 'db', status: 'ok' }]);

logger.group('Checkout flow');
logger.info('step 1');
logger.info('step 2');
logger.groupEnd();
```

`time()`, `table()` y `group()` dispatchean al mismo pipeline de transports que `log()`.

## Configuración

```typescript
import { Logger } from '@mks2508/better-logger';

const log = new Logger({
  verbosity: 'debug',
  globalPrefix: 'APP',
  enableStackTrace: true,
  theme: 'dark',
  timestampFormat: 'iso'
});

log.updateConfig({ verbosity: 'warn' });
log.resetConfig();
```

## Lifecycle

```typescript
await logger.cleanup();   // drain transports + reset timers/group depth/context
```

Llamar en shutdown limpio para no perder logs en buffer.
