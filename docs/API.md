---
layout: default
title: API Reference
permalink: /API/
---

# 🔧 API Reference

Referencia completa de la API pública de `@mks2508/better-logger`.

```typescript
import logger, { Logger } from '@mks2508/better-logger';
```

- `logger` — instancia singleton (lazy proxy, se inicializa al primer uso)
- `Logger` — clase para instancias custom

## Log levels

```text
trace(-1) < debug(0) < info(1) < warn(2) < error(3) < critical(4)
```

```typescript
export const LOG_LEVELS = { trace: -1, debug: 0, info: 1, warn: 2, error: 3, critical: 4 } as const;
export type LogLevel = keyof typeof LOG_LEVELS;            // 'trace' | 'debug' | ... | 'critical'
export type Verbosity = LogLevel | 'silent';
export type LogTag = LogLevel | 'success';                 // success emite a INFO severity
```

Cada `TransportRecord` incluye `severityNumber` y `severityText` OTel automáticamente:

| LogLevel   | severityNumber | severityText |
|------------|----------------|--------------|
| `trace`    | 1              | TRACE        |
| `debug`    | 5              | DEBUG        |
| `info`     | 9              | INFO         |
| `warn`     | 13             | WARN         |
| `error`    | 17             | ERROR        |
| `critical` | 21             | FATAL        |

## Logger

### Constructor

```typescript
const logger = new Logger(config?: Partial<LoggerConfig>);
```

`LoggerConfig` (todos opcionales): `verbosity`, `theme`, `globalPrefix`, `enableStackTrace`, `timestampFormat`, `cliLevel`, `resource`, ...

### Core logging

Todos retornan `Promise<void>` (resuelve tras dispatch a transports). Fire-and-forget funciona sin `await`.

```typescript
logger.trace(...args): Promise<void>      // nivel más bajo (OTel TRACE)
logger.debug(...args): Promise<void>
logger.info(...args): Promise<void>
logger.warn(...args): Promise<void>
logger.error(...args): Promise<void>
logger.critical(...args): Promise<void>   // OTel FATAL
logger.success(...args): Promise<void>    // INFO severity + tag 'success'

logger.log(level: LogLevel, ...args): Promise<void>
logger.logWithBindings(bindings: Bindings, level: LogLevel, ...args): Promise<void>
```

> `await` es recomendable cuando un hook `beforeLog` muta el mensaje (redacción PII, correlation IDs).

### Configuración

```typescript
logger.setVerbosity(level: Verbosity): void
logger.setTheme(theme: ThemeVariant): void          // 'default'|'dark'|'light'|'neon'|'minimal'|'cyberpunk'
logger.setGlobalPrefix(prefix: string): void
logger.setBannerType(type: BannerType): void

logger.getConfig(): LoggerConfig
logger.updateConfig(updates: Partial<LoggerConfig>): void
logger.resetConfig(): void
logger.setResource(resource: Partial<ILogResource>): this   // service.name, version, env (OTel)
```

### Log context (MDC)

```typescript
logger.withContext(extra: Record<string, unknown>): this       // muta + chaining
logger.child(extra: Record<string, unknown>): Logger            // copia inmutable con contexto merged
logger.clearContext(): this
logger.getContext(): Readonly<Record<string, unknown>>          // snapshot
```

El contexto se mergea en `TransportRecord.attributes` de cada log.

### Display / badges

```typescript
logger.hideTimestamp(): this / logger.showTimestamp(): this
logger.hideLocation(): this  / logger.showLocation(): this
logger.hideBadges(): this    / logger.showBadges(): this

logger.badges(list: string[]): this
logger.badge(name: string): this
logger.clearBadges(): this

logger.customize(overrides: { message?, timestamp?, spacing? }): void
```

### Styling

```typescript
logger.preset(name: string): void                  // aplica preset completo
logger.presets(): string[]                         // presets disponibles
logger.showBanner(type?: BannerType): void
logger.logWithSVG(message: string, svg?: string, options?: StyleOptions): void
logger.logAnimated(message: string, duration?: number): void
```

### Scoped loggers

```typescript
logger.scope(name: string): ScopedLogger
logger.component(name: string): ComponentLogger     // auto-badge COMPONENT
logger.api(name: string): APILogger                 // auto-badge API
```

### Hooks & middleware

```typescript
logger.on(event: HookEvent, cb: HookCallback, priority?: number): () => void   // unsub fn
logger.once(event: HookEvent, cb: HookCallback, priority?: number): () => void
logger.off(event: HookEvent, cb: HookCallback): boolean
logger.use(middleware: MiddlewareFn, priority?: number): () => void
logger.getHookManager(): HookManager
```

`HookEvent`: `'beforeLog' | 'afterLog' | 'onError'`. `beforeLog` es **awaited**; `afterLog` es fire-and-forget.

### Serializers

```typescript
logger.addSerializer<T>(type: new (...args) => T, fn: SerializerFn<T>, priority?: number): void
logger.removeSerializer<T>(type: new (...args) => T): void
logger.getSerializerRegistry(): SerializerRegistry
```

### Transports

```typescript
logger.addTransport(target: TransportTarget): string   // returns id
logger.removeTransport(id: string): boolean
logger.flushTransports(): Promise<void>
logger.closeTransports(): Promise<void>
logger.getTransportManager(): TransportManager | undefined
```

### Performance / visualización

```typescript
logger.time(label: string): void
logger.timeEnd(label: string): number | undefined      // ms transcurridos

logger.table(data: unknown, columns?: string[]): void
logger.group(label: string, collapsed?: boolean): void
logger.groupEnd(): void
```

`time()`, `table()`, `group()` también dispatchean a transports (mismo pipeline que `log()`).

### CLI primitives

```typescript
logger.step(current: number, total: number, message: string): void
logger.spinner(message: string): ISpinnerHandle
logger.box(content: string, options?: IBoxOptions): void
logger.cliTable(rows: Record<string, unknown>[], options?: ITableOptions): void
logger.header(title: string, subtitle?: string): void
logger.divider(): void
logger.blank(): void
logger.setCLILevel(level: CLILogLevel): void            // 'silent'|'quiet'|'normal'|'verbose'|'debug'
```

### Handlers (legacy bridge)

```typescript
logger.addHandler(handler: ILogHandler): void
logger.getHandlers(): ILogHandler[]
```

> `ILogHandler` sigue disponible para compatibilidad. Para nuevos destinos usa **transports**.

### Lifecycle

```typescript
logger.cleanup(): Promise<void>   // drain transports + reset timers/group/context
```

## Scoped loggers

`ScopedLogger` delega al logger padre (no hereda) — ligero.

```typescript
class ScopedLogger {
  badges(list: string[]): this
  badge(name: string): this
  clearBadges(): this
  style(presetName: string): this
  context(name: string): ContextLogger
  time(label: string): void / timeEnd(label: string): number | undefined
  trace/debug/info/warn/error/success/critical(...args): void
}
```

`APILogger extends ScopedLogger`:

```typescript
api.slow(message: string, duration?: number): void        // badge SLOW
api.rateLimit(message: string): void                       // badge RATE_LIMIT
api.auth(message: string): void                            // badge AUTH
api.deprecated(message: string): void                      // badge DEPRECATED
```

`ComponentLogger extends ScopedLogger`:

```typescript
comp.lifecycle(event: string, message?: string): void     // badge LIFECYCLE
comp.stateChange(from: string, to: string, data?: unknown): void  // badge STATE
comp.propsChange(changes: Record<string, unknown>): void  // badge PROPS
```

`ContextLogger` — bloque con prefijo jerárquico (`Scope:context`):

```typescript
const c = logger.scope('Req').context('auth');
c.run(() => { /* prefix: Req:auth */ });
await c.runAsync(async () => { /* ... */ });
c.start(); /* ... */ c.end();
```

## Transports

### Registro

```typescript
type TransportTarget = {
  target: string | ITransport;     // 'console'|'file'|'http'|'otlp' | instancia
  options?: TransportOptions;
  level?: LogLevel;
};
```

```typescript
// Instancia directa (opciones tipadas)
logger.addTransport({ target: new OtlpTransport({ endpoint, serviceName, ... }) });

// String (registry built-in)
logger.addTransport({ target: 'file', options: { destination: '/var/log/app.log' } });
```

### TransportOptions

```typescript
interface TransportOptions {
  level?: LogLevel;
  transform?: (record: TransportRecord) => TransportRecord | null;  // null = drop
  batchSize?: number;
  flushInterval?: number;
  maxBufferSize?: number;        // hard cap, drop oldest on overflow
  dropOldest?: boolean;
  resource?: Partial<ILogResource>;
}
```

### FileTransport (Node + browser)

```typescript
interface FileTransportOptions {
  destination: string;              // path (Node) o key localStorage (browser)
  batchSize?: number;
  flushInterval?: number;
  maxBufferSize?: number;
  onError?: (entry: HookLogEntry) => void | Promise<void>;
}
```

Node: batches vía `fs.promises.appendFile` (async). Browser: batches a `localStorage` (fallback no-op).

### HttpTransport

```typescript
interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  maxBufferSize?: number;
  maxRetries?: number;              // default 3
  initialBackoffMs?: number;        // default 250, dobla por intento
  maxBackoffMs?: number;            // default 5_000
  fetchTimeoutMs?: number;          // default 10_000
  onError?: (entry: HookLogEntry) => void | Promise<void>;
}
```

Retry solo en errores recuperables (red, 5xx). 4xx = drop.

### OtlpTransport (SigNoz / OTLP-HTTP)

```typescript
interface OtlpTransportOptions {
  endpoint: string;                 // base URL, POST a <endpoint>/v1/logs
  serviceName: string;              // requerido
  serviceVersion?: string;
  environment?: string;
  resourceAttributes?: Record<string, string>;
  ingestKeyEnvVar?: string;         // process.env[ingestKeyEnvVar] → header signoz-ingestion-key
  headers?: Record<string, string>;
  batchSize?: number;               // default 50
  flushInterval?: number;
  maxBufferSize?: number;           // default 10_000
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  fetchTimeoutMs?: number;
  onError?: (entry: HookLogEntry) => void | Promise<void>;
}
```

Extiende `HttpTransport`. La ingestion key **nunca** se escribe en código ni en el record.

### Custom transport

```typescript
interface ITransport {
  readonly name: string;
  write(record: TransportRecord): void | Promise<void>;
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
  isReady?(): boolean;
}

logger.getTransportManager()?.register('mine', MyTransport);
```

### TransportRecord

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
  traceId?: string;                 // 32-char hex
  spanId?: string;                  // 16-char hex
  attributes?: ILogAttributes;      // structured (incl. log context)
  resource?: Partial<ILogResource>;
  tag?: LogTag;
}
```

## Styling

```typescript
import { StyleBuilder, StylePresets, stylePresets, createStyle } from '@mks2508/better-logger';

const css = createStyle()
  .bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .shadow('0 4px 15px rgba(0,0,0,0.2)')
  .build();

stylePresets.success / .error / .warning / .info / .accent
```

`ThemeVariant`: `'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk'`.

## Types exportados

```typescript
LogLevel, Verbosity, LogTag, SUCCESS_LEVEL, LOG_LEVELS
LoggerConfig, LogMetadata, StackInfo, TimerEntry, TimerResult
HookEvent, HookCallback, HookLogEntry, MiddlewareFn, IHookManager
SerializerFn, SerializerConfig, ISerializerRegistry
TransportRecord, TransportOptions, TransportTarget, ITransport, IBufferedTransport, ITransportManager
ILogResource, ILogAttributes, LogAttributeValue
ILogHandler, IScopedLogger, IAPILogger, IComponentLogger, Bindings
ThemeVariant, BannerType, StyleOptions, OutputFormat, OutputMode
CLILogLevel, ISpinnerHandle, IBoxOptions, ITableOptions
```
