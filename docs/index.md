---
layout: default
title: Better Logger Documentation
---

# 🚀 Better Logger

**State-of-the-art console logger with advanced CSS styling, SVG support, animations, and CLI interface**

[![NPM Version](https://img.shields.io/npm/v/@mks2508/better-logger)](https://www.npmjs.com/package/@mks2508/better-logger)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@mks2508/better-logger)](https://bundlephobia.com/package/@mks2508/better-logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@mks2508/better-logger)](https://github.com/MKS2508/advanced-logger/blob/main/LICENSE)

Transform your console logging experience with beautiful styling, professional themes, and advanced features that make debugging and monitoring a visual delight.

## ✨ Features

- 🎨 **Advanced CSS Styling** - Beautiful gradients, shadows, and animations
- 🌈 **5 Professional Themes** - Default, Dark, Neon, Cyberpunk, Retro  
- 🖼️ **SVG Background Support** - Custom graphics in console output
- ⚡ **Performance Monitoring** - Built-in timing and benchmarking
- 📊 **Data Export** - CSV, JSON, XML export with filtering
- 📡 **Remote Logging** - Send logs to external services
- 💻 **Interactive CLI** - Built-in command interface
- 🔧 **Modular Architecture** - Import only what you need
- 📱 **Universal Compatibility** - Browser & Node.js with graceful fallbacks
- 🎯 **TypeScript First** - Complete type safety and IntelliSense

## 📦 Installation

```bash
npm install @mks2508/better-logger
```

## 🚀 Quick Start

```typescript
import { Logger } from '@mks2508/better-logger';

const logger = new Logger({ prefix: 'APP' });

// Beautiful styled logging
logger.info('Application started', { version: '1.0.0' });
logger.success('Database connected successfully');
logger.warn('Memory usage high', { usage: '85%' });
logger.error('API request failed', { status: 500 });

// Performance timing
logger.time('operation');
await performOperation();
logger.timeEnd('operation'); // Shows duration with beautiful styling
```

## 🔧 Modular Usage

Import only what you need for optimal bundle sizes:

```typescript
// Core logging only (6KB) - Essential features
import { Logger } from '@mks2508/better-logger/core';

// Styling features (26KB) - Themes, SVG, animations
import { setTheme, logAnimated } from '@mks2508/better-logger/styling';

// Export capabilities (12KB) - Data export, remote logging
import { ExportLogger } from '@mks2508/better-logger/exports';
```

## 📊 Bundle Analysis

| Module | Size | Gzipped | Best For |
|--------|------|---------|----------|
| **Core** | 6KB | 2KB | Essential logging, Node.js apps |
| **Styling** | 26KB | 5KB | Frontend apps, visual debugging |
| **Exports** | 12KB | 3KB | Production logging, analytics |
| **Full** | 64KB | 13KB | Complete feature set |

## 📚 Documentation

### 🎮 Interactive Demo
- **[🌟 Live Demo](https://mks2508.github.io/advanced-logger/demo.html)** - Try all features in your browser

### 📖 Complete Documentation
- **[📋 API Reference](API)** - Complete method documentation
- **[🛠️ Development Guide](DEVELOPMENT)** - Use cases and development workflow

### 🏃 Examples
```bash
# Clone and try examples
git clone https://github.com/MKS2508/advanced-logger.git
cd advanced-logger/examples && npm install

npm run basic        # Learn fundamentals
npm run performance  # Master timing operations
npm run styling      # Explore visual features
npm run export       # Data management
```

## 🎨 Visual Showcase

### Professional Themes
```typescript
import { setTheme } from '@mks2508/better-logger/styling';

setTheme('cyberpunk');  // Purple/pink futuristic
setTheme('neon');       // Bright electric colors
setTheme('dark');       // Dark mode optimized
```

### Custom Styling
```typescript
import { createStyle } from '@mks2508/better-logger/styling';

const customStyle = createStyle()
  .bg('linear-gradient(45deg, #667eea, #764ba2)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .shadow('0 4px 15px rgba(102, 126, 234, 0.4)')
  .build();

console.log('%c🚀 Beautiful Custom Style!', customStyle);
```

## ⚡ Advanced Features

### CLI Interface
```typescript
import { initializeCLI } from '@mks2508/better-logger/cli';
initializeCLI(logger);

// Available in browser console:
// /help /theme /export /clear /status
```

### Performance Monitoring
```typescript
logger.time('api-request');
const result = await fetch('/api/data');
logger.timeEnd('api-request'); // Automatic duration display
```

### Data Export
```typescript
import { ExportLogger } from '@mks2508/better-logger/exports';

const logger = new ExportLogger();
const csvData = await logger.exportLogs('csv', {
  filter: { level: 'error' },
  limit: 100
});
```

## 🌐 Compatibility

- ✅ **All Modern Browsers** - Full feature support
- ✅ **Node.js** - Core features with graceful fallbacks  
- ✅ **TypeScript** - Complete type definitions
- ✅ **ESM & CommonJS** - Both module systems supported

## 🔗 Resources

- 📦 **[NPM Package](https://www.npmjs.com/package/@mks2508/better-logger)**
- 📚 **[GitHub Repository](https://github.com/MKS2508/advanced-logger)**
- 🧩 **[Examples](https://github.com/MKS2508/advanced-logger/tree/main/examples)**
- 🐛 **[Issues & Support](https://github.com/MKS2508/advanced-logger/issues)**

## 🤝 Contributing

Contributions welcome! See our [Contributing Guide](https://github.com/MKS2508/advanced-logger/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/MKS2508/advanced-logger/blob/main/LICENSE) for details.

---

**Made with ❤️ by [MKS2508](https://github.com/MKS2508)**