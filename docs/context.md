---
layout: default
title: Log Context (MDC)
permalink: /context/
---

# Log Context (MDC)

El **contexto** (MDC — Mapped Diagnostic Context) es el bag de pares key-value que el logger adjunta a **cada** record emitido y se mergea en `TransportRecord.attributes`. Permite correlacionar logs por `requestId`, `userId`, `traceId`, etc., sin tener que pasar esos valores a mano en cada llamada.

Hay **dos formas** de attachar contexto, y no son intercambiables: una es persistente (sin `AsyncLocalStorage`) y la otra es transitoria (scoped vía ALS). Esta página documenta ambas y corrige la forma legacy del setter (`logger.withContext({ bindings })` sin callback), que post-refactor es **no-op**.

## ¿Qué es MDC? 🧩

El MDC son bindings estructurados que viajan con cada log:

```typescript
import logger from '@mks2508/better-logger';

// Cualquier log emitido desde este logger lleva estos attributes:
//   TransportRecord.attributes = { requestId: 'r-42', userId: 'u-7' }
logger.info('processing'); // el record lleva ambos bindings automáticamente
```

Esos `attributes` se propagan a todos los transports registrados (`FileTransport`, `HttpTransport`, `OtlpTransport`) y quedan disponibles para queries, traces y alertas.

El contexto se construye a partir de tres fuentes, mergueadas en orden de prioridad:

1. **Base inmutable** — snapshot del logger padre capturado al crear un `child()`.
2. **Scope transitorio** — overlay de `AsyncLocalStorage` activo durante `withContext(fn)`.
3. **Resource OTel** — metadatos estables del proceso (`service.name`, `service.version`, `deployment.environment`), mergeados en `TransportRecord.resource` (no en `attributes`).

## Las dos formas de attachar contexto

| | `child(extra)` | `withContext(bindings, fn)` |
|---|---|---|
| **Mutabilidad** | Inmutable — devuelve un logger nuevo | Transitorio — bindings solo existen dentro de `fn` |
| **AsyncLocalStorage** | No requiere | Requiere ALS (Node 14+) |
| **Browser** | Funciona (no usa ALS) | `fn` se ejecuta sin scoping (no-op) |
| **Persistencia** | Persistente mientras viva el child | Solo durante la ejecución de `fn` |
| **Patrón** | Request-scoped logger, bindings por componente | Scope temporal async, chain de llamadas |
| **Análogo** | `pino.child()`, `consola.withTag()` | `cls-hooked`, Java MDC |

### Forma 1: `child()` — bindings persistentes (canónica)

Devuelve una **copia inmutable** del logger con `extra` bound. El logger padre **no se muta**. Es el patrón canónico para request-scoped logging.

```typescript
import logger from '@mks2508/better-logger';

const requestLogger = logger.child({ requestId: 'r-42', userId: 'u-7' });

requestLogger.info('auth ok');     // attributes: { requestId: 'r-42', userId: 'u-7' }
requestLogger.warn('rate limit');  // mismo attributes
logger.info('unrelated');          // NO lleva requestId — el padre quedó intacto
```

Los children se pueden encadenar (cada uno captura el snapshot del padre):

```typescript
const authLog = logger.child({ component: 'auth' });
const reqLog = authLog.child({ requestId: 'r-42' });
reqLog.info('login'); // attributes: { component: 'auth', requestId: 'r-42' }
```

### Forma 2: `withContext(bindings, fn)` — scope transitorio (ALS)

Ejecuta `fn` dentro de un scope de `AsyncLocalStorage` donde `bindings` se mergean al contexto. Fuera de `fn` los bindings desaparecen.

```typescript
import logger from '@mks2508/better-logger';

logger.withContext({ traceId: 't-9' }, () => {
  logger.info('start');   // attributes incluye traceId
  doWork();
  logger.info('end');     // attributes incluye traceId
});

logger.info('after');     // NO lleva traceId — el scope terminó
```

Para callbacks `async`, usa `withContextAsync()` — el scope ALS sobrevive a los `await`:

```typescript
await logger.withContextAsync({ traceId: 't-9' }, async () => {
  const user = await fetchUser();   // logs internos con await ven traceId
  logger.info('user loaded', { id: user.id });
});
```

> ⚠️ **Corrección importante**: el README previo al refactor mostraba `logger.withContext({ requestId })` **sin callback**. Esa forma es **no-op** por backwards-compatibility (shim del viejo shape de setter). Los bindings **no se aplican**. Usa `withContext({ ... }, fn)` con callback, o `child({ ... })` para bindings persistentes.

## Snapshot y limpieza

### `getContext()` — snapshot read-only

Devuelve una shallow copy del contexto actual (parent chain + bindings propios). **No** incluye el overlay ALS transitorio, que es lo que se aplica al dispatch pero no es parte del contexto base.

```typescript
import logger from '@mks2508/better-logger';

const reqLog = logger.child({ requestId: 'r-42' });
const ctx = reqLog.getContext();
// ctx: { requestId: 'r-42' }

// Mutar el snapshot no afecta al logger:
(ctx as { requestId?: string }).requestId = 'tampered';
reqLog.info('still r-42'); // requestId sigue siendo 'r-42' en el record
```

### `clearContext()` — drop bindings

Vacía el contexto bound. Los records emitidos después dejan de llevar `attributes` hasta que un nuevo `withContext` o `child` los restablezca.

```typescript
logger.clearContext();
logger.info('clean'); // sin attributes
```

## Resource OTel 🏷️

`setResource()` define metadatos estables del proceso (service identity) que viajan en `TransportRecord.resource`, **no** en `attributes`. Es lo que OTel/SigNoz usan para agrupar logs por servicio.

```typescript
import logger from '@mks2508/better-logger';

logger.setResource({
  'service.name': 'orders-api',
  'service.version': '1.2.3',
  'deployment.environment': 'production',
});
```

El resource se setea **una vez por proceso** y se mergea en cada record. El shape canónico es `ILogResourceRef`:

```typescript
interface ILogResourceRef {
  'service.name': string;
  'service.version'?: string;
  'deployment.environment'?: string;
  [key: string]: string | undefined;
}
```

Cualquier `setResource()` posterior **mergea** (no replace) con el resource existente — es seguro llamarlo varias veces.

## Browser fallback

El soporte browser depende de qué forma uses:

- ✅ **`child()`** — funciona en browser sin configuración extra. No depende de `AsyncLocalStorage`.
- ⚠️ **`withContext(bindings, fn)` / `withContextAsync()`** — en browser **sin ALS** (Polyfill deshabilitado), `fn` se ejecuta directamente sin scoping: los bindings **no se mergean** al contexto. Si no se pasa `fn`, retorna `undefined`.

El feature-detect es interno (`typeof AsyncLocalStorage !== 'undefined'`), sin configuración del caller.

```typescript
// Browser-safe — usar child() para bindings por request/componente
const reqLog = logger.child({ requestId: getRequestId() });
reqLog.info('rendered'); // siempre lleva requestId, browser o Node
```

> Para SPAs y apps browser, **prefiere `child()`**. `withContext` solo aporta valor en Node, donde ALS propaga el contexto a través de la chain de llamadas async sin tener que pasar el logger a mano.

## ¿Cuándo usar cuál?

| Escenario | Usa |
|---|---|
| Bindings por HTTP request (Express, Fastify, Hono) | `logger.child({ requestId })` una vez al entrar el request |
| Bindings por componente / módulo | `logger.child({ component: 'auth' })` al instanciar |
| Scope temporal async (un handler con varios awaits) | `logger.withContextAsync({ traceId }, async () => …)` |
| Browser / SPA | `logger.child({ … })` (sin ALS, `withContext` es no-op) |
| Reset de contexto en tests o warm shutdown | `logger.clearContext()` |
| Service identity para OTel/SigNoz | `logger.setResource({ 'service.name': … })` al boot |

**Regla práctica**: si quieres bindings que vivan "mientras este logger exista" → `child()`. Si quieres bindings que vivan "mientras se ejecuta esta función" → `withContext(fn)`.

## Subpath `/context`

Los exports del subpath `./context` dan acceso directo a la factory de MDC para construir contextos sin un `Logger` concreto (útil en tests, mocks, o logger custom):

```typescript
import {
  createLogContext,
  type LogContext,
  type ContextSnapshot,
} from '@mks2508/better-logger/context';

const ctx = createLogContext({
  childLoggerFactory: (cfg) => myLoggerFactory(cfg),
  initialContext: { service: 'orders-api' },
  initialResource: { 'service.name': 'orders-api', 'deployment.environment': 'prod' },
});

ctx.child({ requestId: 'r-1' });          // crea un child vía factory inyectada
ctx.withContext({ traceId: 't-9' }, () => { /* … */ });
ctx.setResource({ 'service.version': '2.0' });
```

La factory inyectada evita el import circular entre `Logger` y `LogContext`.

## Referencia API

- [`Logger.child(extra)`](../api/index/classes/Logger.md) — child logger inmutable
- [`Logger.withContext(bindings, fn?)`](../api/index/classes/Logger.md) — scope ALS sincrónico
- [`Logger.withContextAsync(bindings, fn)`](../api/index/classes/Logger.md) — scope ALS async
- [`Logger.getContext()`](../api/index/classes/Logger.md) — snapshot read-only
- [`Logger.clearContext()`](../api/index/classes/Logger.md) — drop bindings
- [`Logger.setResource(resource)`](../api/index/classes/Logger.md) — OTel resource
- [`LogContext` interface](../api/context-module/interfaces/LogContext.md) — contrato de la fachada MDC
- [`createLogContext(options)`](../api/context-module/functions/createLogContext.md) — factory del subpath `/context`
- `ILogResourceRef` — shape del resource OTel (definido inline en `Logger.setResource`)
