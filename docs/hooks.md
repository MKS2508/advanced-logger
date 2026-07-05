---
layout: default
title: Hooks y Middleware
permalink: /hooks/
---

# 🪝 Hooks y Middleware

## Qué son

Los hooks son puntos de extensión que se disparan en el ciclo de vida de cada
log, **antes o después** de que el mensaje se despache a los transports.
Permiten reaccionar, mutar o descartar entradas sin tener que subclassar el
`Logger` ni envolver cada llamada a `info()`/`warn()`/...

Hay dos mecanismos complementarios:

- **Eventos** (`on` / `once` / `off`) — callbacks puntuales atados a fases
  concretas del pipeline (`beforeLog`, `afterLog`, `onError`).
- **Middleware** (`use`) — pipeline estilo Koa `(entry, next) => ...` que corre
  entre `beforeLog` y `afterLog`, ideal para cross-cutting concerns
  (correlación, redacción de PII, sampling).

## Cuándo usar

| Caso | Mecanismo |
|------|-----------|
| Redactar PII antes de emitir | `on('beforeLog', ...)` o `use()` |
| Métricas / telemetría post-log | `on('afterLog', ...)` |
| Capturar errores de transports o de otros hooks | `on('onError', ...)` |
| Atributos globales (correlationId, requestId) | `use()` middleware |
| Filtrado/sampling condicional | `use()` sin llamar `next()` |
| Setup one-shot (warm-up, captura del primer log) | `once('afterLog', ...)` |

## Eventos

### `beforeLog` — AWAITED, mutaciones se reflejan en el log

Se dispara **antes** de despachar el entry a transports. El manager `awaita`
cada callback en orden de prioridad y mergea cualquier `Partial<HookLogEntry>`
retornado al entry que verán los siguientes hooks y el log final.

```typescript
import logger from "@mks2508/better-logger";

// La mutación SÍ cambia el mensaje que llega a los transports
logger.on("beforeLog", (entry) => {
  entry.message = entry.message.replace(/password=\S+/g, "password=***");
  return entry; // o return { message: "..." } — partial también funciona
});
```

### `afterLog` — fire-and-forget

Se dispara **después** de que el log se escribió. Mutar el entry aquí **no
cambia** el output ya emitido; usar solo para side-effects: incrementar
contadores, flushar buffers externos, audit trail.

```typescript
logger.on("afterLog", (entry) => {
  metrics.increment(`logs.${entry.level}`);
});
```

### `onError` — errores de transports o hooks

Se dispara cuando un transport lanza, un hook de `beforeLog`/`afterLog` falla,
o un batch agota reintentos. El callback recibe `entry.error` (la excepción) y
`entry.extra` (payload estructurado: `dropped`, `status`, `retryCount`, ...).

```typescript
logger.on("onError", (entry) => {
  telemetry.capture(entry.error, {
    level: entry.level,
    extra: entry.extra,
  });
});
```

## API

Todos los métodos viven directamente en la instancia de `Logger`. No hace falta
importar nada extra para registrar hooks desde el logger default.

```typescript
import logger from "@mks2508/better-logger";

const off = logger.on("beforeLog", async (entry) => {
  return { correlationId: getCorrelationId() };
}, 80);

off();      // desregistro explícito vía unsubscribe handle
logger.off("beforeLog", cb); // alternativa por referencia de callback
```

| Método | Firma | Devuelve |
|--------|-------|----------|
| `on` | `(event, callback, priority=50)` | función `unsubscribe()` |
| `once` | `(event, callback, priority=50)` | función `unsubscribe()` (auto-remove tras 1er disparo exitoso) |
| `off` | `(event, callback)` | `boolean` (`true` si se eliminó) |
| `use` | `(middleware, priority=50)` | función `unsubscribe()` |

`on` / `once` / `use` devuelven un *unsubscribe handle* (patrón Disposable).
Llamarlo retira el registro sin necesidad de pasar el callback original. `off`
es la vía alternativa por referencia, útil cuando se integra con APIs que
piden un `removeListener(cb)`.

Referencia completa de la interfaz:
[docs/api/hooks-module/classes/HookManager.md](/advanced-logger/docs/api/hooks-module/classes/HookManager/).

## Ejemplo: redacción de PII con `beforeLog`

```typescript
import logger from "@mks2508/better-logger";

logger.on("beforeLog", (entry) => {
  entry.message = entry.message.replace(/password=\S+/g, "password=***");
  if (entry.context?.token) {
    return { context: { ...entry.context, token: "***" } };
  }
  return entry;
});

logger.info("login password=s3cr3t"); // → "login password=***"
```

El callback puede devolver un `Partial<HookLogEntry>`; el manager lo mergea
sobre el entry actual antes de invocar al siguiente hook, así la cadena se
comporta como una pipeline de transformaciones.

## Ejemplo: métricas con `afterLog`

```typescript
import logger from "@mks2508/better-logger";

logger.on("afterLog", (entry) => {
  metrics.increment(`logs.${entry.level}`);
  if (entry.level === "error" || entry.level === "critical") {
    alerts.notify(entry.message);
  }
});
```

## Middleware estilo Koa con `use`

Los middlewares corren **entre** `beforeLog` y `afterLog`, en cascada vía
`next()`. Si un middleware NO llama a `next()`, corta la cadena y el log se
descarta (short-circuit).

```typescript
import logger from "@mks2508/better-logger";

// Inyecta correlationId en cada entry
logger.use((entry, next) => {
  entry.correlationId = getCorrelationId();
  next();
});

// Short-circuit: descarta logs debug en producción
logger.use((entry, next) => {
  if (entry.level === "debug" && process.env.NODE_ENV === "production") return;
  next();
}, 100); // prioridad alta para que corra primero
```

## Prioridad

Tanto hooks como middlewares se ordenan por `priority` **descendente**:
mayor número = se ejecuta primero. Empates respetan el orden de registro.
Default `50`.

```typescript
// Redacción (90) corre antes que tracing (50)
logger.on("beforeLog", redactPII, 90);
logger.on("beforeLog", addTraceAttrs, 50);
```

## Robustez: guard de reentrancia `onError`

Si un hook registrado para `onError` lanza, el manager **no** re-emite otro
`onError` (rompería el ciclo); se loguea a `console.error` y se traga. Además,
un guard de profundidad (`MAX_ONERROR_DEPTH = 5`) corta cualquier burst
inesperado: si `onError` se re-entra más de 5 veces, el entry se dropea al
console en lugar de loopear para siempre.

Consecuencia práctica: un transport defectuoso que lanza en cada log **no**
puede colgar el proceso vía recursion de hooks.

## Subpath `./hooks` (uso avanzado)

Para escenarios que necesitan una instancia propia del manager (tests
aislados, múltiples loggers con pipelines distintos, instrumentación custom),
el subpath expone la implementación y los helpers:

```typescript
import {
  HookManager,
  getDefaultHookManager,
  createHookBridge,
} from "@mks2508/better-logger/hooks";

// Manager dedicado, no compartido con el logger default
const myHooks = new HookManager();
myHooks.on("beforeLog", (entry) => {
  /* ... */
});

// O el bridge equivalente al que usa el Logger internamente
const bridge = createHookBridge();
bridge.use((entry, next) => { next(); });

// Singleton compartido por todo el proceso (lazy)
getDefaultHookManager().on("onError", async (entry) => {
  telemetry.capture(entry.error);
});
```

`getDefaultHookManager()` es perezoso: instancia en la primera llamada y
devuelve siempre la misma. Para aislamiento, instancia tu propio
`new HookManager()`.

API detallada de la clase:
[HookManager](/advanced-logger/docs/api/hooks-module/classes/HookManager/).
