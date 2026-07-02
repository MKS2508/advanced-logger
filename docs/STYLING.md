# 🎨 Styling Module

**Estilos CSS en consola, temas adaptativos, presets, SVG y animaciones.**

```typescript
import logger, {
  StyleBuilder, StylePresets, stylePresets, createStyle, THEME_PRESETS
} from '@mks2508/better-logger';
```

## Temas

```typescript
logger.setTheme('dark');
// ThemeVariant: 'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk'
```

- **`default`** — adaptativo (detecta light/dark del sistema).
- **`dark`** / **`light`** — fijo.
- **`neon`** — colores neón brillantes con glow.
- **`minimal`** — limpio y simple.
- **`cyberpunk`** — púrpura/rosa futurista.

`THEME_PRESETS` expone las definiciones de cada tema.

## Presets

Un preset aplica un conjunto completo de estilos de golpe:

```typescript
logger.preset('cyberpunk');       // neón, glow
logger.preset('glassmorphism');   // blur moderno
logger.preset('minimal');         // limpio
logger.preset('debug');           // verboso, con location

const available = logger.presets();   // lista de presets disponibles
```

## Display toggles

Control granular de qué se muestra:

```typescript
logger.hideTimestamp();
logger.showTimestamp();

logger.showLocation();    // muestra caller (file:line)
logger.hideLocation();

logger.showBadges();
logger.hideBadges();

logger.customize({
  message: { color: '#007bff', size: '15px' },
  timestamp: { show: false },
  spacing: 'compact'       // 'compact' | 'normal' | 'spacious'
});
```

## Badges

Etiquetas flexibles prefijadas al mensaje:

```typescript
logger.badges(['v2', 'stable']).info('Release published');
logger.badge('DEBUG').badge('AUTH').info('Token validated');
logger.clearBadges().info('Clean log');
```

## StyleBuilder (estilos custom)

Constructor encadenable para CSS de consola (`%c` formatting):

```typescript
const style = createStyle()
  .bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .bold()
  .shadow('0 4px 15px rgba(102, 126, 234, 0.4)')
  .build();

console.log('%c🚀 Beautiful!', style);
```

## Presets de estilo sueltos

Para casos comunes, sin builder:

```typescript
console.log('%cOK', stylePresets.success);
console.log('%cError', stylePresets.error);
console.log('%cWarn', stylePresets.warning);
console.log('%cInfo', stylePresets.info);
console.log('%cAccent', stylePresets.accent);
```

`StylePresets` expone los builders (`StylePresets.success()`, etc.) por si quieres encadenar más antes del `.build()`.

## SVG

Renderiza SVG inline como styling de consola:

```typescript
logger.logWithSVG('Deploy complete', svgContent, {
  /* StyleOptions */
});
```

## Animaciones

Efecto de "escritura" animada del mensaje:

```typescript
logger.logAnimated('Loading...', 1500);   // duration ms
```

## Banners

Cabeceras decorativas:

```typescript
logger.setBannerType('unicode');   // 'simple' | 'ascii' | 'unicode' | 'svg' | 'animated'
logger.showBanner('unicode');
```

## Output mode

La salida pasa por un `writeOutput()` centralizado — todos los métodos (`log`, `success`, `table`, `group`, `time`, `setTheme`, ...) respetan el `outputMode` configurado (`'console' | 'silent' | 'custom'`), sin bypasses.

```typescript
import type { OutputMode } from '@mks2508/better-logger';
```
