---
layout: default
title: CLI
permalink: /cli/
---

# 🛠️ CLI

## Qué es

El subpath `./cli` agrupa dos cosas:

1. **Primitives visuales** — funciones puras que renderizan UI estilo terminal (`renderBox`, `renderTable`, `renderStep`, `renderHeader`, `renderDivider`) y los spinners (`SpinnerManager`, `NoopSpinner`).
2. **Sistema de comandos** — `CommandProcessor`, las 8 implementaciones de `ICommand` y el factory `createDefaultCLI`.

Todo se importa desde `@mks2508/better-logger/cli`. Las primitives se reexportan también desde `@mks2508/better-logger/playground` por compatibilidad.

> ⚠️ **No es un binario standalone.** `./cli` no expone un ejecutable de sistema: no hay un `better-logger` en el `PATH` ni un script `bin`. Los comandos se invocan desde código (`await logger.cli('/help')`) o desde la DevTools del navegador cuando se activa el modo interactivo (`window.cli('help')`).

## Cuándo usar cada cara

| Necesidad                                                    | Ruta                                                |
|--------------------------------------------------------------|-----------------------------------------------------|
| Inspección mutación de la config desde la DevTools           | `logger.cli('/config theme=neon')`                  |
| Demo del logger / showcase de features en pantalla           | `logger.cli('/demo')` o botón "demo" en playground |
| Primitives en scripts Node (builds, migradores, scrapers)    | `logger.box / .step / .header / .cliTable`         |
| Spinners deterministas en scripts CLI Node (TTY vs CI)       | `logger.spinner('...').start()`                     |
| Spinners + primitives accesibles desde tu código (`renderBox`) | `import { renderBox } from '@mks2508/better-logger/cli'` |

Regla: si trabajas contra la `Logger` directamente, los métodos `logger.cli / .box / .step / .spinner` ya están disponibles sin imports adicionales. Si quieres reusar las primitives en otro lado, importa desde el subpath.

## Distinción con un binario

```typescript
// ❌ Esto no existe — ./cli NO registra un bin
// $ better-logger themes

// ✅ En su lugar, vía código
await logger.cli('/themes');

// ✅ O desde la DevTools del browser (modo interactivo activado)
// > cli('themes')      // la barra "/" se añade automáticamente
```

Si necesitas una CLI de sistema separada (`<script> mks-logs ...`), es responsabilidad del consumidor levantar el entrypoint sobre este package; `./cli` solo aporta la maquinaria de dispatch.

## Comandos disponibles

`createDefaultCLI()` registra los 8 comandos estándar en el `CommandProcessor`. Todos empiezan con `/` y los nombres son case-sensitive.

| Comando               | Uso                              | Función                                              |
|-----------------------|----------------------------------|------------------------------------------------------|
| `/help [command]`     | Panel ASCII con todos los comandos | `HelpCommand`                                        |
| `/config`             | Vuelca config actual como tabla   | `ConfigCommand`                                      |
| `/config {json}`      | Aplica objeto de config completo  | `ConfigCommand`                                      |
| `/config key=val,...` | Aplica pares `key=value` atajo    | `ConfigCommand`                                      |
| `/themes`             | Preview coloreada de los temas    | `ThemesCommand`                                      |
| `/banners`            | Preview de tipos de banner        | `BannersCommand`                                     |
| `/banner [type]`      | Cambia / muestra el banner activo | `BannerCommand`                                      |
| `/status`             | Config + handlers + bufferSize    | `StatusCommand`                                      |
| `/reset`              | Restaura la config a defaults     | `ResetCommand`                                       |
| `/demo`               | Showcase completo de features     | `DemoCommand`                                        |

`/help` renderiza un panel ASCII con gradient (`StyleBuilder`) y un grupo `Quick Tips` con tips sobre export, formato de tiempo y combinación de filtros.

```typescript
// Ver configuración actual
await logger.cli('/config');
// → grupo "⚙️ Logger Configuration" + tabla con theme/verbosity/colors/...

// Mutación por pares key=value (atajo rápido)
await logger.cli('/config theme=neon,verbosity=debug,globalPrefix=MiApp');

// Mutación por JSON completo
await logger.cli('/config {"theme":"dark","enableStackTrace":true}');

// Preview de cada theme con su background/foreground/border
await logger.cli('/themes');

// Cambiar el banner activo (o sin args para re-renderizar el actual)
await logger.cli('/banner ascii');

// Inspeccionar config + handlers + bufferSize
await logger.cli('/status');

// Restaurar defaults (NO toca handlers registrados)
await logger.cli('/reset');

// Showcase completo: todos los niveles + tablas + timers + SVG + animación
await logger.cli('/demo');
```

> Las keys desconocidas en `/config key=val,...` se rechazan con `warn` y se ignoran (whitelist: `theme`, `verbosity`, `enableColors`, `enableTimestamps`, `enableStackTrace`, `globalPrefix`, `bannerType`).

## `logger.cli(command)`

```typescript
async cli(command: string): Promise<void>;
```

Método del `Logger` que delega en el `CommandProcessor` interno (creado lazily con `createDefaultCLI()` en la primera llamada).

```typescript
import logger from '@mks2508/better-logger';

await logger.cli('/themes');
await logger.cli('/config theme=neon');
```

**Parser**: `processCommand(commandString, logger)` parte la cadena por espacios, primer token = nombre del comando, resto (re-joined con espacios) = args que se entregan a `ICommand.execute(args, logger)`. Los comandos deben empezar con `/`; si no, se loguea error y se sigue.

**Historial**: las últimas 100 invocaciones (con `success: boolean`). Cualquier error de `execute()` se captura, se loguea, **no rechaza** la promesa, y se marca como `success: false`. Accesible vía `cliProcessor.getHistory() / clearHistory()`.

```typescript
const processor = logger['cliProcessor']; // acceso al CommandProcessor
const recent = processor?.getHistory();     // entradas más recientes primero
processor?.clearHistory();
```

**Plugin system**: registra un grupo de comandos + lifecycle hooks. Lanza si ya hay un plugin con el mismo `name`.

```typescript
import type { ICommand, ICLIPlugin } from '@mks2508/better-logger/cli';

const telemetryPlugin: ICLIPlugin = {
  name: 'telemetry',
  version: '1.0.0',
  description: 'Comandos de telemetría',
  commands: [/* ICommand[] */],
  initialize(processor, logger) {
    logger.info('telemetry plugin cargado');
  },
  cleanup() {
    // liberar suscripciones / timers / handles
  },
};

logger['cliProcessor']?.registerPlugin(telemetryPlugin, logger);
logger['cliProcessor']?.unregisterPlugin('telemetry');
```

**Sugerencias "Did you mean"**: si el comando no existe, `processCommand` calcula sugerencias por `startsWith()` y loguea hasta 3 candidatos:

```
[error] Unknown command: thmes. Type /help for available commands.
[info]  📋 Did you mean: themes?
```

## Modo interactivo (browser)

`CommandProcessor.enterInteractiveMode(logger)` activa el flag interno y, cuando hay `window` disponible, registra `window.cli(command)` como wrapper delgado que prefij `/` automáticamente.

```typescript
import { createDefaultCLI } from '@mks2508/better-logger/cli';

const cli = createDefaultCLI();
cli.enterInteractiveMode(logger);
// → console.info('🔧 Interactive CLI mode activated. Type /exit to quit, /help for commands.')
// → console.info('💡 Use cli("command") to execute CLI commands in browser console.')

// Desde la DevTools:
// > cli('help')              // ejecuta /help
// > cli('config theme=neon') // ejecuta /config theme=neon
```

`exitInteractiveMode()` desactiva el flag interno, pero **no elimina** el `window.cli` global — eso sobrevive hasta el reload.

> El `window.cli` solo se registra cuando hay `window`. En Node el método es no-op (no crashea): el mensaje de activación sí se emite siempre.

## Primitives visuales

Las primitives puras se importan directamente cuando quieres usarlas en un script Node propio (build, scraper, migración, etc.). Internamente el `Logger` ya las envuelve vía `terminalBridge` para routing TTY-vs-server.

```typescript
import {
  renderBox,
  renderTable,
  renderStep,
  renderHeader,
  renderDivider,
  SpinnerManager,
  NoopSpinner,
  ServerFallback,
} from '@mks2508/better-logger/cli';
```

### `renderBox(content, options?, colorCap?)`

Envuelve `content` en un box Unicode. Anchura interna calculada sobre la línea más larga, capada a `min(terminalWidth - 4, 80)`. Soporta 4 estilos (`single`, `rounded`, `double`, `bold`), padding simétrico, título embebido en el borde superior y color ANSI.

```typescript
process.stdout.write(renderBox('Deploy completado') + '\n');

process.stdout.write(renderBox(
  'Service: auth-svc\nStatus: healthy',
  { title: 'Health Check', borderColor: '#00bcd4', borderStyle: 'double', padding: 1 }
) + '\n');
```

### `renderTable(rows, options?, colorCap?)`

Convierte un array de objetos en una grilla ASCII con headers derivados de las keys. Opciones: `head: boolean`, `columns: string[]`.

### `renderStep(current, total, message)` / `renderHeader(title, subtitle?)` / `renderDivider()`

Renderers específicos para progreso, cabeceras con subtítulo y divisor horizontal.

```typescript
process.stderr.write(renderHeader('Build', 'v1.2.3') + '\n');
process.stderr.write(renderStep(2, 5, 'Compilando...') + '\n');
process.stderr.write(renderDivider() + '\n');
```

### Spinners

`SpinnerManager` anima frames braille (~12 FPS) reescribiendo la línea actual en `stderr`. Como efecto lateral **mutea el logger** (`outputMode: 'silent'`) en `start()` y lo restaura a `'console'` en `stop / succeed / fail`. Sin esto, los logs del usuario se imprimirían encima del frame.

```typescript
import { SpinnerManager } from '@mks2508/better-logger/cli';

const spinner = new SpinnerManager('Compilando...', logger.config, logger);
spinner.start();

try {
  await build();
  spinner.succeed('Build OK');   // → "  ✓ Build OK"
} catch (e) {
  spinner.fail(`Build fallido: ${(e as Error).message}`);
}
```

`NoopSpinner` es la versión no-op para entornos non-TTY / silent mode: traduce `start → logger.info`, `succeed → logger.success`, `fail → logger.error`. La factoría que decide cuál instanciar vive en `TerminalBridge.spinner()`, no a mano — el `logger.spinner(...)` ya enruta correctamente.

```typescript
// En CI (no TTY) el bridge entrega NoopSpinner automáticamente
const s = logger.spinner('Running tests...');
s.start();                  // logger.info('Running tests...')
s.succeed('All green');     // logger.success('All green')
```

`NoopSpinner` **no** toca el `outputMode` del logger — no hay animación que proteger.

### Server fallback

Cuando `outputMode: 'json'` o fuera de TTY, los primitives visuales (arte ASCII, animaciones) no tienen sentido. `ServerFallback` los degrada a `logger.info(JSON.stringify(...))` o no-ops, según el método:

| Primitive                  | Server fallback                                  |
|----------------------------|--------------------------------------------------|
| `step(current, total, msg)` | `logger.info('[current/total] msg')`             |
| `header(title, subtitle?)` | `logger.info('title subtitle')`                  |
| `divider()`                | no-op (arte sin valor semántico)                 |
| `blank()`                  | no-op (rompe consistencia JSON)                  |
| `box(content, opts?)`      | `logger.info(content)`                           |
| `cliTable(rows, opts?)`    | `logger.info(JSON.stringify(row))` por cada fila |

`TerminalBridge.getServerFallback()` devuelve la instancia lazy; no se construye a mano.

## Subpath `./cli`

El subpath exporta todo lo necesario para construir un processor propio o reutilizar primitives sin el `Logger`:

```typescript
import {
  // Factory
  createDefaultCLI,

  // Processor
  CommandProcessor,
  type ICommand,
  type ICLIPlugin,

  // Comandos estándar (por si quieres registrar solo algunos)
  HelpCommand,
  ConfigCommand,
  ThemesCommand,
  BannersCommand,
  BannerCommand,
  StatusCommand,
  ResetCommand,
  DemoCommand,

  // Primitives
  renderBox,
  renderTable,
  renderStep,
  renderHeader,
  renderDivider,

  // Spinners
  SpinnerManager,
  NoopSpinner,

  // Server fallback
  ServerFallback,
} from '@mks2508/better-logger/cli';
```

Uso típico: instanciar `CommandProcessor` vacío y registrar solo los comandos que te interesan.

```typescript
import { CommandProcessor, ConfigCommand, StatusCommand } from '@mks2508/better-logger/cli';

const custom = new CommandProcessor();
custom.registerCommand(new ConfigCommand());
custom.registerCommand(new StatusCommand());

await custom.processCommand('/status', logger);
```

## Referencia API

- Processor: [`CommandProcessor`](../docs/api/cli-module/README.md) — interfaz pública del dispatch
- Comandos: [`HelpCommand`](../docs/api/cli-module/README.md), [`ConfigCommand`](../docs/api/cli-module/README.md), `ThemesCommand`, `BannersCommand`, `BannerCommand`, `StatusCommand`, `ResetCommand`, `DemoCommand`
- Interfaces: `ICommand`, `ICLIPlugin` (exportadas desde `@mks2508/better-logger/cli`)
- Primitives:
  - [`renderBox`](../docs/api/cli-module/functions/renderBox.md) — box Unicode con borde configurable
  - [`renderTable`](../docs/api/cli-module/functions/renderTable.md) — grilla ASCII desde array de objetos
  - [`renderStep`](../docs/api/cli-module/functions/renderStep.md), [`renderHeader`](../docs/api/cli-module/functions/renderHeader.md), [`renderDivider`](../docs/api/cli-module/functions/renderDivider.md)
- Spinners: [`SpinnerManager`](../docs/api/cli-module/classes/SpinnerManager.md) (TTY), [`NoopSpinner`](../docs/api/cli-module/classes/NoopSpinner.md) (non-TTY)
- Fallback: [`ServerFallback`](../docs/api/cli-module/classes/ServerFallback.md) — degradación a `logger.info`/no-op
- Método del Logger: [`Logger.cli(command)`](../docs/api/index/classes/Logger.md) — entrypoint via singleton
