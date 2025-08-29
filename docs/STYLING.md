# 🎨 Styling Module

**Advanced visual features with themes, SVG support, and CSS animations**

```typescript
import { setTheme, logAnimated, logWithSVG } from '@mks2508/better-logger/styling'
```

**Bundle Size:** 26KB • **Gzipped:** 5KB

---

## ✨ Features

- 🌈 **5 Built-in Themes** (default, dark, neon, cyberpunk, retro)
- 🎭 **5 Banner Types** (simple, ascii, unicode, svg, animated)
- 🖼️ **SVG Background Support** with custom graphics
- ✨ **CSS Animations** with keyframe injection
- 🎨 **Style Builder API** for custom console styles
- 🎯 **Theme-aware Components** with automatic styling
- 🔄 **Live Theme Switching** with visual feedback

## 🚀 Quick Start

```typescript
import { 
  setTheme, showBanner, 
  logAnimated, logWithSVG,
  createStyle, stylePresets
} from '@mks2508/better-logger/styling'

// Apply theme with visual banner
setTheme('cyberpunk')
showBanner('animated')

// Animated logging
logAnimated('🚀 Application starting...', 3)

// SVG backgrounds
const logoSVG = `<svg>...</svg>`
logWithSVG('Company Logo', logoSVG, {
  width: 400,
  height: 80
})

// Custom styles
const customStyle = createStyle()
  .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
  .color('white')
  .padding('15px')
  .rounded('10px')
  .build()

console.log('%cCustom Message', customStyle)
```

## 🌈 Theme System

### Available Themes

| Theme | Primary Colors | Best For |
|-------|---------------|----------|
| `default` | Blue gradients | Professional apps |
| `dark` | Dark theme | Night mode |
| `neon` | Bright neon colors | Gaming/Creative |
| `cyberpunk` | Purple/Pink | Futuristic UIs |
| `retro` | Warm vintage | Nostalgic designs |

### Theme Usage

```typescript
import { setTheme, getAvailableThemes } from '@mks2508/better-logger/styling'

// Apply theme
setTheme('neon') // Shows themed banner automatically

// List available themes
console.log(getAvailableThemes())
// ['default', 'dark', 'neon', 'cyberpunk', 'retro']

// Theme switching
const themes = ['default', 'dark', 'neon']
themes.forEach((theme, index) => {
  setTimeout(() => setTheme(theme), index * 2000)
})
```

## 🎭 Banner System

### Banner Types

```typescript
import { showBanner, setBannerType } from '@mks2508/better-logger/styling'

// Show specific banner
showBanner('simple')    // Text-only
showBanner('ascii')     // ASCII art  
showBanner('unicode')   // Unicode box drawing
showBanner('svg')       // SVG graphics
showBanner('animated')  // CSS animations

// Set default banner type
setBannerType('svg')
```

### Banner Examples

**ASCII Banner:**
```
╔══════════════════════════════════╗
║         BETTER LOGGER            ║
║    Advanced Console Logging      ║
╚══════════════════════════════════╝
```

**SVG Banner:**
- Custom graphics with gradients
- Logo integration
- Responsive sizing

**Animated Banner:**
- Gradient animations
- Fade transitions
- Loading effects

## 🖼️ SVG Support

### Basic SVG Logging

```typescript
import { logWithSVG } from '@mks2508/better-logger/styling'

// Default branded SVG
logWithSVG('Welcome to Better Logger!')

// Custom SVG content
const customSVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'>
  <defs>
    <linearGradient id='brand' x1='0%' y1='0%' x2='100%' y2='0%'>
      <stop offset='0%' style='stop-color:#667eea'/>
      <stop offset='100%' style='stop-color:#764ba2'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#brand)' rx='8'/>
  <text x='200' y='45' text-anchor='middle' fill='white' 
        font-family='Arial' font-size='18' font-weight='bold'>
    My Application
  </text>
</svg>`

logWithSVG('Custom Branding', customSVG, {
  width: 400,
  height: 80,
  padding: '40px 200px'
})
```

### Advanced SVG Options

```typescript
interface StyleOptions {
  width?: number      // SVG width in pixels
  height?: number     // SVG height in pixels  
  padding?: string    // CSS padding around SVG
}

// Logo with specific dimensions
logWithSVG('Product Launch', logoSVG, {
  width: 600,
  height: 120,
  padding: '60px 300px'
})

// Compact notification
logWithSVG('Alert', alertSVG, {
  width: 200,
  height: 40,
  padding: '20px 100px'
})
```

## ✨ CSS Animations

### Animated Logging

```typescript
import { logAnimated } from '@mks2508/better-logger/styling'

// Basic animation (3 seconds)
logAnimated('Loading...')

// Custom duration
logAnimated('🌟 Feature launched!', 5) // 5 seconds

// Multiple animations
logAnimated('Phase 1 complete', 2)
setTimeout(() => {
  logAnimated('Phase 2 starting', 2)
}, 2500)
```

### Animation Effects

**Gradient Animation:**
- Moving background gradients
- Smooth color transitions
- Infinite loop animation

**Technical Implementation:**
```css
@keyframes loggerGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

## 🎨 Style Builder API

### Building Custom Styles

```typescript
import { createStyle, StyleBuilder } from '@mks2508/better-logger/styling'

// Fluent interface
const alertStyle = createStyle()
  .bg('linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)')
  .color('#ffffff')
  .padding('12px 20px')
  .rounded('8px')
  .border('2px solid #ff5252')
  .shadow('0 4px 15px rgba(255, 107, 107, 0.4)')
  .bold()
  .font('Monaco, Consolas, monospace')
  .animation('pulse 1s ease-in-out infinite')
  .build()

console.log('%c🚨 Critical Alert', alertStyle)

// Chaining methods
const successStyle = new StyleBuilder()
  .bg('#4caf50')
  .color('white')
  .padding('8px 16px')
  .rounded('4px')
  .build()
```

### Available Style Methods

```typescript
interface StyleBuilder {
  // Background
  bg(gradient: string): StyleBuilder
  backgroundColor(color: string): StyleBuilder
  
  // Typography
  color(color: string): StyleBuilder
  font(family: string): StyleBuilder
  fontSize(size: string): StyleBuilder
  bold(): StyleBuilder
  italic(): StyleBuilder
  
  // Layout
  padding(padding: string): StyleBuilder
  margin(margin: string): StyleBuilder
  display(display: string): StyleBuilder
  
  // Visual effects
  border(border: string): StyleBuilder
  rounded(radius: string): StyleBuilder
  shadow(shadow: string): StyleBuilder
  
  // Animations
  animation(animation: string): StyleBuilder
  transition(transition: string): StyleBuilder
  
  // Custom CSS
  css(property: string, value: string): StyleBuilder
  
  // Build final style
  build(): string
}
```

## 🎯 Pre-built Style Presets

### Using Style Presets

```typescript
import { stylePresets } from '@mks2508/better-logger/styling'

// Available presets
console.log('%c✅ Success!', stylePresets.success)
console.log('%c❌ Error!', stylePresets.error)
console.log('%c⚠️ Warning!', stylePresets.warning)
console.log('%cℹ️ Info', stylePresets.info)
console.log('%c🎯 Accent', stylePresets.accent)
```

### Preset Definitions

```typescript
const stylePresets = {
  success: 'background: linear-gradient(135deg, #4caf50, #45a049); color: white; ...',
  error: 'background: linear-gradient(135deg, #f44336, #d32f2f); color: white; ...',
  warning: 'background: linear-gradient(135deg, #ff9800, #f57c00); color: white; ...',
  info: 'background: linear-gradient(135deg, #2196f3, #1976d2); color: white; ...',
  accent: 'background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white; ...'
}
```

## 🔧 Advanced Usage

### Theme-aware Logging

```typescript
import { setTheme } from '@mks2508/better-logger/styling'
import { info, success, error } from '@mks2508/better-logger'

// Apply theme
setTheme('cyberpunk')

// All subsequent logs use theme colors
info('System initialized')     // Uses cyberpunk info colors
success('Connection established') // Uses cyberpunk success colors
error('Authentication failed')  // Uses cyberpunk error colors
```

### Dynamic Style Generation

```typescript
import { createStyle } from '@mks2508/better-logger/styling'

// Generate styles based on log level
function getLogStyle(level: string) {
  const colors = {
    error: ['#f44336', '#d32f2f'],
    warn: ['#ff9800', '#f57c00'],
    info: ['#2196f3', '#1976d2'],
    success: ['#4caf50', '#45a049']
  }
  
  const [primary, secondary] = colors[level] || colors.info
  
  return createStyle()
    .bg(`linear-gradient(135deg, ${primary}, ${secondary})`)
    .color('white')
    .padding('8px 16px')
    .rounded('6px')
    .bold()
    .build()
}

console.log('%cDynamic Error', getLogStyle('error'))
console.log('%cDynamic Success', getLogStyle('success'))
```

### Performance Optimization

```typescript
// Pre-build styles for better performance
const CACHED_STYLES = {
  header: createStyle().bg('#1976d2').color('white').padding('15px').build(),
  footer: createStyle().bg('#424242').color('#ccc').padding('10px').build(),
  highlight: createStyle().bg('#ffeb3b').color('#333').padding('5px').build()
}

// Use cached styles
console.log('%cApplication Header', CACHED_STYLES.header)
console.log('%cHighlighted text', CACHED_STYLES.highlight)
console.log('%cFooter info', CACHED_STYLES.footer)
```

## 📱 Browser Compatibility

### Feature Detection

```typescript
// Automatic fallbacks for unsupported features
if (typeof document !== 'undefined') {
  // Browser environment - full styling support
  logWithSVG('Rich graphics available')
  logAnimated('Animations supported')
} else {
  // Node.js environment - graceful degradation
  console.log('Text-only fallback')
}
```

### Support Matrix

| Feature | Chrome | Firefox | Safari | Node.js |
|---------|--------|---------|--------|---------|
| CSS Styling | ✅ | ✅ | ✅ | ❌ |
| SVG Backgrounds | ✅ | ✅ | ✅ | ❌ |
| Animations | ✅ | ✅ | ✅ | ❌ |
| Unicode Banners | ✅ | ✅ | ✅ | ✅ |

---

**Perfect for:** Frontend applications • Interactive demos • Creative projects • Brand-aware logging

[← Back to main documentation](../README.md)