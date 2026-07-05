---
layout: default
title: Styling
permalink: /styles/
---

# 🎨 Styling

## Qué es

La capa de styling de `@mks2508/better-logger` controla **cómo se ve** cada log en el DevTools del browser o en la terminal. Funciona en runtime dual:

- **Browser** — emite `console.log('%c…', style)` con CSS completo: `linear-gradient`, `box-shadow`, `border-radius`, `backdrop-filter`. El DevTools aplica el estilo al badge del nivel.
- **Terminal Node** — degrada a colores ANSI y formato plano (sin sombras, sin gradients) preservando la legibilidad en `stdout`.

La detección es automática vía `environment-detector`: el logger inspecciona `typeof window`, `navigator.userAgent` y el binding de `console.log` para decidir el render path. No hace falta configurar nada — el log sale estilizado donde se puede y plano donde no.

Encima de ese render dual hay tres sistemas componibles:

| Sistema | Qué controla | API |
|---------|--------------|-----|
| **Theme** | Colores por nivel (badge del severity) | `setTheme(name)` |
| **Smart Preset** | Layout completo (timestamp / level / prefix / message / location) | `preset(name)` |
| **StyleBuilder** | Estilos CSS ad-hoc para banners y badges custom | `new StyleBuilder()` / `StylePresets.*()` |

## ⚠️ Distinción clave: Themes vs Smart Presets

Son **distintos** y combinan orthogonalmente. La confusión entre ambos es la pregunta más frecuente sobre styling.

| | **Themes** | **Smart Presets** |
|---|---|---|
| **Cantidad** | 6 (`default`, `dark`, `light`, `neon`, `minimal`, `cyberpunk`) | 6 (`default`, `cyberpunk`, `glassmorphism`, `minimal`, `debug`, `production`) |
| **Controla** | Badge del severity (colores, sombra, border, emoji, label) | Layout completo del log (qué partes se ven, fuente, padding, spacing) |
| **Aplica a** | Solo el chip que rodea el `[INFO] / [WARN] / ...` | Cada componente del log: timestamp, prefix, mensaje, location |
| **Método** | `logger.setTheme('dark')` | `logger.preset('cyberpunk')` |
| **Ortogonales** | Se pueden combinar: `setTheme('dark') + preset('debug')` aplica la paleta `dark` sobre el layout `debug` |

> **Regla práctica**: theme = "qué colores", preset = "qué se muestra y cómo se acomoda". Si solo cambias color → theme. Si ocultas timestamp o pasas a monoespaciado → preset.

```typescript
import logger from '@mks2508/better-logger';

// Solo colores del badge → theme
logger.setTheme('cyberpunk');   // paleta cian/magenta con glow

// Solo layout → preset
logger.preset('debug');        // monospace, todo visible, compacto para dev

// Combinados → theme + preset
logger.setTheme('dark');
logger.preset('minimal');      // paleta oscura + layout sin timestamp/location
```

## 🖼️ `setTheme(name)` — colores por nivel

Aplica una paleta visual a los badges de cada nivel (`debug`, `info`, `warn`, `error`, `success`, `critical`). El theme solo cambia `emoji + label + background + color + border + shadow` del badge — el resto del log (mensaje, timestamp, location) no se toca.

```typescript
import logger from '@mks2508/better-logger';

logger.setTheme('dark');        // paleta para DevTools oscuro
logger.setTheme('light');       // paleta pastel para DevTools claro
logger.setTheme('neon');        // glow neón cyan/magenta
logger.setTheme('minimal');     // badges planos sin sombras
logger.setTheme('cyberpunk');   // cian/magenta con sombras extendidas
logger.setTheme('default');     // gradientes vivos, balanceado
```

### Themes disponibles

| Theme | Vibe | Casos típicos |
|---|---|---|
| `default` | Gradientes vivos, sombras suaves | Uso general, primera opción |
| `dark` | Paleta oscura con bordes sutiles | DevTools en tema oscuro |
| `light` | Pastel, contraste alto | DevTools en tema claro |
| `neon` | Glow neón cyan/verde/amarillo | Highlights visuales, demos |
| `minimal` | Badges planos sin sombra ni emoji | Logs densos, máxima legibilidad |
| `cyberpunk` | Cian/magenta con glow extendido | Theme "estético", brand-driven |

El theme activo se persiste en `StyleManager.LEVEL_STYLES` y se aplica a cada `console.log('%c…', css)` que produce el logger. Inspeccionar la paleta actual:

```typescript
import { THEME_PRESETS } from '@mks2508/better-logger';

const errorBadge = THEME_PRESETS.cyberpunk.error;
// {
//   emoji: '💀', label: 'ERROR',
//   background: 'linear-gradient(135deg, #7209b7 0%, #480ca8 100%)',
//   color: '#ff006e', border: '1px solid #ff006e',
//   shadow: '0 0 15px rgba(255, 0, 110, 0.6)'
// }
```

## 📐 `preset(name)` — layout completo

Aplica un **smart preset** que configura la composición entera del log: visibilidad de timestamp/level/prefix/message/location, fuentes, padding, spacing, e incluso efectos avanzados (`backdrop-filter`, `transparency`).

```typescript
import logger from '@mks2508/better-logger';

logger.preset('glassmorphism');  // blur moderno + transparencia
logger.preset('minimal');        // sin timestamp, badges flat
logger.preset('debug');          // monospace, todo visible, compacto
logger.preset('production');     // solo timestamp + level + mensaje
logger.preset('cyberpunk');      // neón, glow, sin location
logger.preset('default');        // adaptativo, legible, balanceado
```

```typescript
logger.presets();   // → ['default', 'cyberpunk', 'glassmorphism', 'minimal', 'debug', 'production']
```

### Presets disponibles

| Preset | Layout | Caso típico |
|---|---|---|
| `default` | Todo visible, adaptativo claro/oscuro | Uso general |
| `cyberpunk` | Compacto, neon glow, sin location | Demos, brand-driven |
| `glassmorphism` | Spacious, blur + transparencia 0.8 | Overlays, dashboards |
| `minimal` | Sin timestamp ni location, flat | Producción, CI logs |
| `debug` | Monospace, todo visible, compacto | Desarrollo local |
| `production` | Solo timestamp + level + mensaje, sin prefix ni location | Server-side prod |

> ⚠️ El método `setTheme(name)` chequea primero si `name` es un preset conocido — si lo es, delega a `preset(name)`. Esto significa que `setTheme('minimal')` y `preset('minimal')` son equivalentes cuando `minimal` está en el catálogo de presets.

## 🏷️ Badges

Los **badges** son etiquetas adyacentes al mensaje que categorizan el log (`[v3]`, `[stable]`, `[DEBUG]`, `[AUTH]`...). Persisten en el logger hasta que se limpien.

```typescript
import logger from '@mks2508/better-logger';

// Set completo (reemplaza la lista actual)
logger.badges(['v3', 'stable']);
logger.info('Release publicado');  // → [v3] [stable] Release publicado

// Append (idempotente — no duplica si ya existe)
logger.badge('DEBUG').badge('AUTH');
logger.info('Token validado');     // → [v3] [stable] [DEBUG] [AUTH] Token validado

// Limpiar
logger.clearBadges();
logger.info('Sin badges');         // → Sin badges
```

El estilo del badge (`brackets`, `rounded`, `plain`, `unicode`, `pill`) se controla vía `badgeStyle` en `LoggerConfig`:

```typescript
logger.configure({ badgeStyle: 'pill' });
```

> **Scoped loggers** (`api()`, `component()`, `scope()`) heredan los badges del padre y añaden los suyos automáticamente (`logger.api('GraphQL').info(...)` lleva `[API] [GraphQL]`).

## 🎚️ Toggles de visibilidad

Los toggles ocultan/muestran partes del log en runtime. Todos devuelven `this` para encadenar.

```typescript
import logger from '@mks2508/better-logger';

logger.hideTimestamp();
logger.hideLocation();
logger.hideBadges();
logger.info('Stripped down');   // → sin timestamp / location / badges

logger.showTimestamp();
logger.showLocation();
logger.showBadges();
logger.info('Full again');      // → todo visible

// Encadenado
logger.hideTimestamp().showLocation().hideBadges();
```

| Método | Efecto |
|---|---|
| `hideTimestamp()` / `showTimestamp()` | Oculta/muestra la marca de tiempo |
| `hideLocation()` / `showLocation()` | Oculta/muestra `file:line` del caller |
| `hideBadges()` / `showBadges()` | Oculta/muestra los badges adyacentes |

## 🧱 `StyleBuilder` — estilos CSS chainable

`StyleBuilder` es el constructor fluido de estilos CSS orientado al `%c`-formatting del DevTools. Cada método empuja una declaración a un buffer interno y retorna `this` para encadenar. `build()` materializa el string final con `"; "` como separador (formato exacto que espera `console.log("%c…", style)`).

> ⚠️ **Corrección importante**: el README previo al refactor mostraba `import { createStyle } from '@mks2508/better-logger'`. **Esa función no existe** en la API pública — `createStyle` no se exporta desde ningún subpath del package. La forma correcta es **`new StyleBuilder()`** directamente (forma canónica y pública) o **`StylePresets.X()`** para presets pre-armados.

### Cadena básica

```typescript
import { StyleBuilder } from '@mks2508/better-logger';

const banner = new StyleBuilder()
  .bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .shadow('0 4px 15px rgba(102, 126, 234, 0.4)')
  .bold()
  .build();

console.log('%c🚀 Hello', banner);
```

### API encadenable

`StyleBuilder` expone setters para las propiedades CSS más usadas en badges de consola. Cada setter retorna `this` para encadenar.

| Categoría | Métodos |
|---|---|
| **Color / fondo** | `bg(value)`, `color(value)`, `border(value)`, `shadow(value)` |
| **Espaciado** | `padding(value)`, `margin(value)`, `rounded(radius='4px')` |
| **Tipografía** | `font(stack)`, `size(size)`, `lineHeight(height)`, `bold()`, `mono()`, `system()`, `underline()`, `uppercase()` |
| **Visuales** | `opacity(0-1)`, `display(value)`, `position(value)`, `transform(value)` |
| **Animación** | `animation(value)`, `transition(value)` |
| **Misc** | `cursor(value)`, `custom(prop, value)`, `css(prop, value)` |
| **Construcción** | `build(): string`, `clear()`, `clone()`, `merge(other)` |

```typescript
import { StyleBuilder } from '@mks2508/better-logger';

// Clone + variar — útil para variantes de badge desde una base común
const base = new StyleBuilder().padding('2px 6px').rounded('3px').bold();
const ok   = base.clone().bg('#00b894').color('#fff').build();
const warn = base.clone().bg('#fdcb6e').color('#2d3436').build();
const err  = base.clone().bg('#d63031').color('#fff').build();

// Escape hatch: cualquier prop CSS sin método dedicado
const glassmorphic = new StyleBuilder()
  .bg('rgba(255, 255, 255, 0.1)')
  .color('#fff')
  .padding('8px 16px')
  .rounded('12px')
  .custom('backdrop-filter', 'blur(10px)')
  .custom('border', '1px solid rgba(255, 255, 255, 0.2)')
  .build();
```

### `merge(other)` para capas

Componer estilos a partir de capas sin perder trazabilidad de quién aportó qué (no deduplica — si ambos setean `color`, gana el último):

```typescript
import { StyleBuilder } from '@mks2508/better-logger';

const base  = new StyleBuilder().padding('4px 8px').rounded('4px');
const theme = new StyleBuilder().bg('#222').color('#eee');
const css   = base.merge(theme).build();
// → "padding: 4px 8px; border-radius: 4px; background: #222; color: #eee"
```

## 🎯 `StylePresets` — factories pre-armadas

`StylePresets` expone factories zero-arg que devuelven un `StyleBuilder` nuevo por invocación. El patrón factory evita compartir estado entre llamadas — cada `StylePresets.success()` es independiente.

```typescript
import { StylePresets } from '@mks2508/better-logger';

console.log('%c LOGIN OK ', StylePresets.success().build());
console.log('%c DB DOWN ',  StylePresets.error().build());
console.log('%c WARN ',     StylePresets.warning().build());
console.log('%c INFO ',     StylePresets.info().build());
console.log('%c CACHE ',    StylePresets.debug().build());
console.log('%c 2026-01-01 ', StylePresets.muted().build());
console.log('%c svc:auth ', StylePresets.accent().build());
console.log('%c ★ BANNER ★ ', StylePresets.neon().build());
```

| Preset | Uso | Estilo |
|---|---|---|
| `success()` | Operación completada OK | Gradiente verde, blanco bold |
| `error()` | Fallo que requiere atención | Gradiente rosa→rojo, blanco bold |
| `warning()` | Situación recuperable | Gradiente ámbar→naranja, texto oscuro |
| `info()` | Mensaje informativo | Gradiente azul claro→medio |
| `debug()` | Diagnóstico (oculto en prod) | Gradiente índigo→púrpura |
| `muted()` | Texto secundario / timestamps | Gris monospace `12px`, sin fondo |
| `accent()` | Tags neutros con borde | Fondo claro, borde sutil |
| `neon()` | Decorativo neón | Gradiente azul→coral con glow cyan |

Como cada factory devuelve un `StyleBuilder` nuevo, puedes **extender** antes de `.build()`:

```typescript
import { StylePresets } from '@mks2508/better-logger';

const css = StylePresets.info()
  .custom('text-shadow', '0 1px 0 rgba(0,0,0,0.3)')
  .padding('6px 12px')
  .build();
```

## ✏️ `customize(overrides)` — override simple

Para ajustes rápidos sin pasar por todo el shape de `LogStyles`, `customize()` acepta overrides parciales por sección:

```typescript
import logger from '@mks2508/better-logger';

logger.customize({
  message:   { color: '#00ff00', size: '16px' },
  timestamp: { show: false },
  spacing:   'compact',
});
```

| Sección | Campos |
|---|---|
| `message` | `color`, `font`, `size` |
| `timestamp` | `show`, `color` |
| `location` | `show`, `color` |
| `level` | `uppercase`, `style` |
| `prefix` | `show`, `style` |
| `spacing` | `'compact'` \| `'normal'` \| `'spacious'` |

> Para control fino del layout completo, prefiere `preset(name)` o `configure({ preset: ... })` — `customize()` es un atajo para cambios puntuales.

## 📥 Imports

```typescript
// Logger singleton (con todo el sistema de themes/presets/badges/toggles ya integrado)
import logger from '@mks2508/better-logger';

// Primitivas de styling (StyleBuilder, StylePresets, THEME_PRESETS) desde main
import { StyleBuilder, StylePresets, THEME_PRESETS } from '@mks2508/better-logger';

// Subpath /styles (mismo surface + createStyleManager para bridges custom)
import {
  StyleBuilder,
  StylePresets,
  THEME_PRESETS,
  createStyleManager,
  type StyleManager,
  type DisplaySettings,
  type PresetState,
} from '@mks2508/better-logger/styles';
```

## 🔗 Referencia API

- Clase: [`StyleBuilder`](../api/index/classes/StyleBuilder.md)
- Variables: [`StylePresets`](../api/index/variables/StylePresets.md) · [`THEME_PRESETS`](../api/index/variables/THEME_PRESETS.md) · [`BANNER_VARIANTS`](../api/index/variables/BANNER_VARIANTS.md) · [`THEME_BANNERS`](../api/index/variables/THEME_BANNERS.md)
- Funciones: [`createStyleManager`](../api/styles-module/functions/createStyleManager.md)
- Interfaces: [`StyleManager`](../api/styles-module/interfaces/StyleManager.md) · [`DisplaySettings`](../api/styles-module/interfaces/DisplaySettings.md) · [`PresetState`](../api/styles-module/interfaces/PresetState.md)
- Tipos: [`ThemeVariant`](../api/index/type-aliases/ThemeVariant.md) · [`BannerType`](../api/index/type-aliases/BannerType.md) · [`StyleOptions`](../api/index/interfaces/StyleOptions.md)
- Métodos del Logger: `setTheme`, `preset`, `presets`, `badges`, `badge`, `clearBadges`, `hideTimestamp`, `showTimestamp`, `hideLocation`, `showLocation`, `hideBadges`, `showBadges`, `customize` en [`Logger`](../api/index/classes/Logger.md)