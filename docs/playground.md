---
layout: default
title: Playground
permalink: /playground/
---

# 🖥️ Playground (CLI primitives)

## Qué es

El subpath `./playground` expone los **renderers visuales** que usa internamente `TerminalBridge` para dar a los scripts Node.js la misma sensación que un CLI moderno: boxes con borde Unicode, tablas ASCII alineadas, headers con subtítulo dimmed, divisores horizontales, contadores de step `[n/total]` y spinners braille animados.

Estos primitives son **terminal-only** (Node, TTY real). En browser o entornos non-TTY el `TerminalBridge` los degrada automáticamente a llamadas `logger.info` vía `ServerFallback` — ver [ServerFallback](../api/cli-module/classes/ServerFallback.md).

> 🔑 **API pública recomendada**: usa los wrappers del logger (`logger.box()`, `logger.cliTable()`, `logger.header()`, `logger.divider()`, `logger.step()`, `logger.spinner()`). Resuelven el color capability del terminal, enrutan a `ServerFallback` cuando hace falta, y respetan `cliLevel` / `showPrimitives`.
>
> Los **renderers raw** (`renderBox`, `renderTable`, `renderStep`, ...) viven en el subpath para casos avanzados donde quieres componer tu propio output sin pasar por el Logger.

## 📥 Imports

```typescript
// Wrappers (recomendados)
import logger from '@mks2508/better-logger';
logger.box(...);
logger.cliTable(...);

// Renderers raw (avanzado — para componer output custom)
import {
  renderBox,
  renderTable,
  renderStep,
  renderHeader,
  renderDivider,
  SpinnerManager,
  NoopSpinner
} from '@mks2508/better-logger/playground';

// Tipos
import type { IBoxOptions, ITableOptions, ISpinnerHandle } from '@mks2508/better-logger';
```

## 📦 Renderers raw vs wrappers

| | Renderers raw (`renderX`) | Logger wrappers (`logger.x`) |
|---|---|---|
| Devuelven | `string` (líneas formateadas) | `void` (escriben a `stderr` o degradan) |
| Color capability | Manual (param `colorCap`) | Auto-detect |
| Enrutamiento non-TTY | No (emiten ANSI igual) | Sí (vía `ServerFallback`) |
| Respeta `cliLevel` | No | Sí (`silent`/`quiet` suprimen) |
| Cuándo usar | Tests, composición custom, output controlado | Scripts, CLIs, pipelines de deploy |

## 🧱 `renderBox` / `logger.box()`

Caja ASCII con borde Unicode configurable. Soporta 4 estilos de borde (`single`, `rounded`, `double`, `bold`), título embebido en el borde superior, color del borde (hex o ANSI), y padding interior. El ancho se acota a `min(terminalWidth - 4, 80)`.

```typescript
import logger from '@mks2508/better-logger';

logger.box('Service: auth-svc\nStatus: healthy', {
  title: 'Health Check',
  borderColor: '#00bcd4',
  borderStyle: 'double',
  padding: 1
});
```

Output (TTI real):

```
  ╔═ Health Check ═══════════════════════════════╗
  ║                                               ║
  ║   Service: auth-svc                            ║
  ║   Status: healthy                              ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
```

| Opción (`IBoxOptions`) | Default | Descripción |
|---|---|---|
| `title` | — | Texto embebido en el borde superior |
| `borderColor` | — | Hex (`#00bcd4`) o nombre ANSI |
| `borderStyle` | `'rounded'` | `'single'` \| `'rounded'` \| `'double'` \| `'bold'` |
| `padding` | `0` | Líneas vacías simétricas arriba/abajo |

Forma raw (componer output custom):

```typescript
import { renderBox } from '@mks2508/better-logger/playground';

process.stdout.write(renderBox('Build complete', { borderStyle: 'bold' }) + '\n');
```

**Referencia**: [`renderBox`](../api/cli-module/functions/renderBox.md) · [`IBoxOptions`](../api/index/interfaces/IBoxOptions.md)

## 📊 `renderTable` / `logger.cliTable()`

Tabla ASCII alineada con headers en cyan bold, separador `─` bajo la cabecera, y padding horizontal por columna. Las columnas se autodetectan de las keys del primer row; opcionalmente se imponen vía `options.columns` y se renombran vía `options.head`.

```typescript
import logger from '@mks2508/better-logger';

logger.cliTable([
  { service: 'auth',   status: 'healthy', latency: 12  },
  { service: 'api',    status: 'degraded', latency: 245 },
  { service: 'worker', status: 'healthy', latency: 8   }
]);
```

Output:

```
   service   status     latency
   ───────────────────────────────────────
   auth      healthy    12
   api       degraded   245
   worker    healthy    8
```

Con columnas forzadas y headers custom:

```typescript
logger.cliTable(rows, {
  columns: ['service', 'latency'],
  head: ['Service', 'Latency (ms)']
});
```

Un array `rows` vacío devuelve string vacío (no se imprime nada).

**Referencia**: [`renderTable`](../api/cli-module/functions/renderTable.md) · [`ITableOptions`](../api/index/interfaces/ITableOptions.md)

## 🔢 `renderStep` / `logger.step()`

Indicador de progreso secuencial `[n/total]` con el contador en cyan bold. Pensado para output tipo steps de un build, fases de deploy, o tareas de un script.

```typescript
import logger from '@mks2508/better-logger';

const steps = ['Resolving deps', 'Bundling', 'Writing dist'];
steps.forEach((step, i) => {
  logger.step(i + 1, steps.length, step);
});
```

Output:

```
   [1/3] Resolving deps
   [2/3] Bundling
   [3/3] Writing dist
```

`renderStep` no chequea el rango de `current`/`total` — el caller es responsable de pasar valores coherentes.

**Referencia**: [`renderStep`](../api/cli-module/functions/renderStep.md)

## 🏷️ `renderHeader` / `logger.header()` y `renderDivider` / `logger.divider()`

`renderHeader` emite un header de sección: `title` en bold, `subtitle` opcional en dim. `renderDivider` emite una línea `─` dimmed del ancho del terminal (capped a 60).

```typescript
import logger from '@mks2508/better-logger';

logger.header('Deploy', 'production · us-east-1');
logger.divider();
logger.header('Build summary');
```

Output:

```
   **Deploy** production · us-east-1
     ────────────────────────────────────────────
   **Build summary**
```

| Wrapper | Renderer raw | Notas |
|---|---|---|
| `logger.header(t, s?)` | `renderHeader(t, s?)` | Subtitle dimmed, separado por espacio |
| `logger.divider()` | `renderDivider(width?)` | Auto-ancho capped a 60; override explícito |
| `logger.blank()` | (n/a) | Línea vacía a stderr |

**Referencia**: [`renderHeader`](../api/cli-module/functions/renderHeader.md) · [`renderDivider`](../api/cli-module/functions/renderDivider.md)

## 🔄 `SpinnerManager` / `logger.spinner()`

Spinner braille animado a ~12 FPS (frames a `U+2800-U+28FF`, interval de 80 ms). Cicla reescribiendo la línea actual con `\r\x1b[K` — **no** emite líneas nuevas hasta que se llama a `stop`/`succeed`/`fail`.

Devuelve un `ISpinnerHandle` con lifecycle explícito:

```typescript
import logger from '@mks2508/better-logger';

const s = logger.spinner('Compilando...');
s.start();
// ...trabajo async...
s.succeed('Build OK');      // → "  ✓ Build OK"
// o
s.fail(`Build failed: ${err.message}`);  // → "  ✗ Build failed: ..."
// o
s.stop();                   // desmonta sin mensaje final
```

Mutación in-place del texto sin reiniciar la animación:

```typescript
const s = logger.spinner('Procesando 0/100');
s.start();
for (let i = 1; i <= 100; i++) {
  s.text(`Procesando ${i}/100`);
  await processItem(i);
}
s.succeed('Done');
```

| Método | Efecto |
|---|---|
| `start()` | Arranca animación. **Mutea** el logger (`outputMode: 'silent'`) |
| `stop()` | Limpia línea, restaura output. Sin mensaje final |
| `succeed(msg?)` | Línea verde con `✓ msg` |
| `fail(msg?)` | Línea roja con `✗ msg` |
| `text(msg)` | Cambia el texto in-place (frame no se reinicia) |

> ⚠️ **Importante**: `start()` cambia el `outputMode` del logger a `'silent'` para que los logs del usuario no se impriman encima del frame animado. Cualquier `stop`/`succeed`/`fail` lo restaura a `'console'`. Por eso es **crítico** cerrar el spinner (succeed/fail/stop) — si no, el logger queda en silencio.
>
> El spinner escribe **siempre a `process.stderr`** (no polui `stdout` cuando va por pipe).

### `NoopSpinner` (entornos non-TTY)

El `TerminalBridge` entrega automáticamente un `NoopSpinner` en lugar de `SpinnerManager` cuando no detecta TTY (CI logs, pipes) o cuando `outputMode === 'silent'`. Mantiene la misma interfaz `ISpinnerHandle` para que el caller no ramifique:

| Método `NoopSpinner` | Efecto |
|---|---|
| `start()` | `logger.info(message)` |
| `succeed(msg?)` | `logger.success(msg ?? message)` |
| `fail(msg?)` | `logger.error(msg ?? message)` |
| `stop()` | No-op |
| `text(msg)` | Cambia el mensaje interno (sin output) |

```typescript
// En CI sin TTY: TerminalBridge entrega NoopSpinner transparentemente.
const s = logger.spinner('Running tests...');
s.start();                  // → logger.info('Running tests...')
await runTests();
s.succeed('All green');     // → logger.success('All green')
```

A diferencia de `SpinnerManager`, `NoopSpinner` **no** mutea el logger — no hay animación que proteger.

**Referencia**: [`SpinnerManager`](../api/cli-module/classes/SpinnerManager.md) · [`NoopSpinner`](../api/cli-module/classes/NoopSpinner.md) · [`ISpinnerHandle`](../api/index/interfaces/ISpinnerHandle.md)

## 🧩 Ejemplo conjunto

Pipeline de deploy con header, steps, box final y tabla resumen:

```typescript
import logger from '@mks2508/better-logger';

logger.header('Deploy', 'production · us-east-1');
logger.divider();

const phases = ['Compiling', 'Running tests', 'Building image', 'Pushing'];
for (let i = 0; i < phases.length; i++) {
  logger.step(i + 1, phases.length, phases[i]);
}

const spinner = logger.spinner('Pushing image to registry...');
spinner.start();
try {
  await pushImage('myapp:v1.2.3');
  spinner.succeed('Image pushed');
} catch (err) {
  spinner.fail(`Push failed: ${err.message}`);
  process.exit(1);
}

logger.divider();
logger.box('Deploy complete\nService: orders-api\nStatus: healthy', {
  title: 'Done',
  borderColor: '#00ff00',
  borderStyle: 'double',
  padding: 1
});

logger.cliTable([
  { service: 'auth',   status: 'healthy', latency: 12  },
  { service: 'api',    status: 'healthy', latency: 23  },
  { service: 'worker', status: 'healthy', latency: 8   }
]);
```

Output (TTY real, abreviado):

```
  **Deploy** production · us-east-1
    ────────────────────────────────────────────
  [1/4] Compiling
  [2/4] Running tests
  [3/4] Building image
  [4/4] Pushing
  ⠋ Pushing image to registry...
  ✓ Image pushed
  ╔═ Done ═════════════════════════════════════╗
  ║   Deploy complete                            ║
  ║   Service: orders-api                        ║
  ║   Status: healthy                            ║
  ╚═════════════════════════════════════════════╝
   service   status    latency
   ───────────────────────────────────
   auth      healthy   12
   api       healthy   23
   worker    healthy   8
```

## ⚠️ Fallback automático non-TTY

El `TerminalBridge` enruta los primitives a `ServerFallback` cuando `isRunningInTerminal()` retorna `false` o cuando `outputMode === 'json'`. Cada renderer se degrada a una llamada `logger.info`:

| Wrapper TTY | `ServerFallback` (CI / json) |
|---|---|
| `logger.step(2, 5, 'Compilando')` | `logger.info('[2/5] Compilando')` |
| `logger.header('Build', 'v1.2.3')` | `logger.info('Build v1.2.3')` |
| `logger.divider()` | (no-op) |
| `logger.box(...)` | `logger.info(...)` (texto plano) |
| `logger.cliTable([...])` | `logger.info(...)` (texto plano) |
| `logger.spinner(msg)` | `NoopSpinner` (start/succeed/fail → info/success/error) |

El caller mantiene una sola API — el routing es interno.

## 🛠️ Control de visibilidad

`cliLevel` controla a la vez la verbosidad de los logs y la visibilidad de los primitives. Útil para `silent` (sólo errors) o `quiet` (CLI primitivo suprimido):

```typescript
logger.setCLILevel('silent');   // nada de primitives, suprime la mayoría de logs
logger.setCLILevel('quiet');    // sin primitives, sólo logs importantes
logger.setCLILevel('normal');   // default — primitives visibles
logger.setCLILevel('verbose');  // primitives + debug logs
```

Puntualmente, `setShowPrimitives(false)` apaga solo el output de primitives sin tocar la verbosidad del logger.

## 🌐 Compatibilidad

| Entorno | Comportamiento |
|---|---|
| Node + TTY | Renderers TTY activos, spinner animado |
| Node + pipe / redirect (`> file`) | `ServerFallback` automáticamente |
| Node + `outputMode: 'json'` | `ServerFallback` (cada primitive → `logger.info` con texto plano) |
| CI (sin TTY) | `ServerFallback` automáticamente |
| Browser | No hay equivalentes (los primitives son terminal-only) |

Los renderers raw no hacen fallback — emiten su output sea cual sea el entorno. Usa los wrappers `logger.x()` si quieres routing automático.

## 🔗 Referencia API

- Renderers: [`renderBox`](../api/cli-module/functions/renderBox.md) · [`renderTable`](../api/cli-module/functions/renderTable.md) · [`renderStep`](../api/cli-module/functions/renderStep.md) · [`renderHeader`](../api/cli-module/functions/renderHeader.md) · [`renderDivider`](../api/cli-module/functions/renderDivider.md)
- Spinners: [`SpinnerManager`](../api/cli-module/classes/SpinnerManager.md) · [`NoopSpinner`](../api/cli-module/classes/NoopSpinner.md) · [`ISpinnerHandle`](../api/index/interfaces/ISpinnerHandle.md)
- Fallback: [`ServerFallback`](../api/cli-module/classes/ServerFallback.md)
- Interfaces: [`IBoxOptions`](../api/index/interfaces/IBoxOptions.md) · [`ITableOptions`](../api/index/interfaces/ITableOptions.md)
- Wrappers del Logger: [`Logger.box`](../api/index/classes/Logger.md) · [`Logger.cliTable`](../api/index/classes/Logger.md) · [`Logger.step`](../api/index/classes/Logger.md) · [`Logger.spinner`](../api/index/classes/Logger.md) · [`Logger.setCLILevel`](../api/index/classes/Logger.md)
- Subpath: [`@mks2508/better-logger/playground`](../api/playground-module/README.md)