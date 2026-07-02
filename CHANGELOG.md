# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Added

- **OTLP Transport (SigNoz / OpenTelemetry)** — `OtlpTransport` envía logs a cualquier backend OTLP/HTTP con payload spec-compliant (`resourceLogs` → `scopeLogs` → `logRecords`). POST a `<endpoint>/v1/logs`. La ingestion key se lee de la env var indicada en `ingestKeyEnvVar` — nunca hardcodeada ni serializada.
- **Log context (MDC)** — `withContext()`, `child()`, `clearContext()`, `getContext()`, `setResource()`. El contexto se mergea en `TransportRecord.attributes` de cada log.
- **Nivel `trace`** — nuevo nivel más bajo (`trace: -1`, OTel TRACE severity 1-4). `LogLevel` ahora es `'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical'`.
- **Campos OTel en `TransportRecord`** — `severityNumber`, `severityText`, `traceId`, `spanId`, `attributes`, `resource` (mapeo 1:1 a OTLP `logRecords`).
- **Registry de transports por string** — `target: 'console' | 'file' | 'http' | 'otlp'` resuelve vía built-in registry. Custom via `transportManager.register()`.
- **CLI primitives** — `step()`, `spinner()`, `box()`, `cliTable()`, `header()`, `divider()`, `blank()`, `setCLILevel()`.

### 💥 Changed

- **`log()` family retorna `Promise<void>`** — awaitea los hooks `beforeLog`. Fire-and-forget sigue funcionando; `await` recomendable cuando los hooks mutan el mensaje.
- **`beforeLog` hook awaited síncronamente** — redacción/enriquecimiento reflejados antes del emit.
- **`FileTransport`** — escritura async con `fs.promises.appendFile` (antes sync bloqueante), bounded buffer con drop-oldest, sanitización de path, fallback a `localStorage` en browser.
- **`HttpTransport`** — status-based retry (solo errores recuperables), bounded buffer (sin OOM), retry con backoff exponencial.
- **Default export lazy** — proxy que se inicializa al primer uso.
- **`ScopedLogger` por delegación** — no hereda de `Logger` (~50-100x menos memoria).

### 🐛 Fixed

- `ScopedLogger.trace()` emitía como `debug` + `console.trace()` suelto (level incorrecto, double-log, bypass de `outputMode`, filtrado roto) → ahora emite como `trace`.
- `HookManager` guard de re-entrancia en `onError` (`MAX_ONERROR_DEPTH = 5`).
- Unhandled rejection en `TransportManager.write()` → ahora surfaceado vía `console.error`.
- `cleanup()` ahora hace drain completo de transports + reset de estado interno.
- Mutaciones del hook `beforeLog` se respetaban (async fire-and-forget vs sync `log()`).

### 🗑️ Removed

- `FileLogHandler`, `RemoteLogHandler`, `AnalyticsLogHandler`, `ExportLogHandler` — reemplazados por el sistema de transports (`FileTransport` / `HttpTransport` / `OtlpTransport` + `addTransport()`).
