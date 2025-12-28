# 🚀 Better Logger

**Enterprise-grade console logger with custom serializers, hooks, transports, and beautiful styling**

[![NPM Version](https://img.shields.io/npm/v/@mks2508/better-logger)](https://www.npmjs.com/package/@mks2508/better-logger)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@mks2508/better-logger)](https://bundlephobia.com/package/@mks2508/better-logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@mks2508/better-logger)](https://github.com/MKS2508/advanced-logger/blob/main/LICENSE)

Transform your console logging experience with enterprise features like Pino/Winston: custom serializers, hooks/middleware, and transports - all with beautiful styling and professional themes.

## ✨ Features

### Core Features
- 🚀 **Simplified API** - 80% less code for basic use cases
- 🎨 **Smart Presets** - Apply beautiful themes in one line: `logger.preset('cyberpunk')`
- 🏷️ **Badges System** - Flexible tagging with `badges()` and `badge()`
- 🌗 **Adaptive Themes** - Automatic light/dark mode detection
- 🎯 **TypeScript First** - Complete type safety and IntelliSense

### Enterprise Features (v3.0.0)
- 🔄 **Custom Serializers** - Transform any object type for logging
- 🪝 **Hooks & Middleware** - Intercept and modify logs with `on()`, `use()`
- 📡 **Transports** - File, HTTP, and custom transport destinations
- ⚡ **High Performance** - ~50-100x less memory with delegation pattern
- 💾 **Style Cache** - LRU cache for computed styles

## 📦 Installation

### Full Package (Recommended)
```bash
npm install @mks2508/better-logger
```

### Modular Installation  
Choose only the functionality you need:

```bash
# Core logging only (~15KB)
npm install @mks2508/better-logger-core

# Add styling capabilities (~12KB)  
npm install @mks2508/better-logger-styling

# Add export handlers (~18KB)
npm install @mks2508/better-logger-exports
```

> 📋 **[View Complete Packages Guide →](https://mks2508.github.io/advanced-logger/packages/)**

## 🚀 Quick Start

### Basic Usage (Zero Configuration)
```javascript
import logger from '@mks2508/better-logger';

// Works perfectly out-of-the-box with adaptive themes
logger.info('Application started');
logger.success('Database connected');
logger.warn('High memory usage');
logger.error('Connection failed');
```

### One-Line Styling
```javascript
// Apply beautiful presets instantly
logger.preset('cyberpunk');     // Neon colors, glowing effects
logger.preset('glassmorphism'); // Modern blur effects
logger.preset('minimal');       // Clean and simple
logger.preset('debug');         // Detailed development mode
```

### Toggle Features
```javascript
// Control visibility with simple methods
logger.hideTimestamp();
logger.showLocation();
logger.hideBadges();
```

### Component & API Logging
```javascript
// Scoped loggers with auto-badges (sync, lightweight)
const auth = logger.component('UserAuth');
auth.info('Login attempt');     // [COMPONENT] [UserAuth] Login attempt
auth.success('User verified');  // [COMPONENT] [UserAuth] User verified

// API loggers with multiple badges
const api = logger.api('GraphQL');
api.badges(['SLOW', 'CACHE']).warn('Query timeout');
```

## 🔄 Enterprise Features (v3.0.0)

### Custom Serializers
Transform complex objects before logging:

```typescript
// Register serializers for custom types
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 5)
}));

logger.addSerializer(User, (user) => ({
  id: user.id,
  email: user.email  // password automatically omitted
}));

// Now errors and users are serialized automatically
logger.error('Failed:', new Error('Connection timeout'));
logger.info('User login:', currentUser);
```

### Hooks & Middleware
Intercept and modify logs:

```typescript
// Add correlation ID to all logs
logger.on('beforeLog', (entry) => {
  entry.correlationId = getCorrelationId();
  return entry;
});

// Track metrics after logging
logger.on('afterLog', (entry) => {
  metrics.increment(`logs.${entry.level}`);
});

// Middleware pipeline
logger.use((entry, next) => {
  entry.requestId = asyncLocalStorage.getStore()?.requestId;
  next();
});

// Redact sensitive data
logger.use((entry, next) => {
  entry.message = entry.message.replace(/password=\S+/g, 'password=***');
  next();
});
```

### Transports
Send logs to multiple destinations:

```typescript
// File transport (Node.js)
logger.addTransport({
  target: 'file',
  options: { destination: '/var/log/app.log' }
});

// HTTP transport with batching
logger.addTransport({
  target: 'http',
  options: {
    url: 'https://logs.example.com/ingest',
    batchSize: 100,
    flushInterval: 5000
  },
  level: 'warn'  // Only warn and above
});

// Custom transport
logger.addTransport({
  target: {
    name: 'elasticsearch',
    write: async (record) => {
      await esClient.index({ index: 'logs', body: record });
    }
  }
});

// Flush and close when shutting down
await logger.flushTransports();
await logger.closeTransports();
```

### Badges System
Flexible tagging for logs:

```typescript
// Multiple badges
logger.badges(['v3', 'stable']).info('Release published');

// Chain badges
logger.badge('DEBUG').badge('AUTH').info('Token validated');

// Clear badges
logger.clearBadges().info('Clean log');
```

### Simple Customization
```javascript
// Minimal configuration for specific needs
logger.customize({
  message: { color: '#007bff', size: '15px' },
  timestamp: { show: false },
  spacing: 'compact'
});
```

### Advanced Styling (Power Users)
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

## 🔧 Enhanced CLI Interface

New in v0.1.0-rc.1! Interactive CLI with plugin support and command history:

```typescript
import { Logger } from '@mks2508/better-logger';

const logger = new Logger();

// Enter interactive mode
logger.executeCommand('/interactive');

// Use enhanced CLI in browser console:
cli('help');             // Show all commands
cli('theme cyberpunk');  // Change theme
cli('history 5');        // View command history  
cli('plugins');          // List loaded plugins

// Create custom plugins
const myPlugin = {
  name: 'analytics',
  commands: [{ 
    name: 'track', 
    execute: (args, logger) => logger.info(`Tracking: ${args}`) 
  }]
};
logger.cliProcessor.registerPlugin(myPlugin);
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

## 📚 Documentation & Learning

### 📖 Complete Documentation
- **[📋 API Reference](docs/API.md)** - Complete method documentation
- **[🚀 Core Module](docs/CORE.md)** - Essential logging features
- **[🎨 Styling Module](docs/STYLING.md)** - Themes and visual customization  
- **[📤 Exports Module](docs/EXPORTS.md)** - Data export and remote logging

### 🎮 Interactive Learning
- **[🌟 Live Demo](https://mks2508.github.io/advanced-logger/)** - Try all features in your browser
- **[📁 Examples](examples/)** - 4 comprehensive tutorials with runnable code

### 🏃 Quick Examples
```bash
cd examples && npm install
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
- 🎮 **[Interactive Demo](https://mks2508.github.io/advanced-logger/)**
- 📚 **[Documentation](docs/)**
- 🧩 **[Examples](examples/)**
- 🐛 **[Issues & Support](https://github.com/MKS2508/advanced-logger/issues)**

## 🤝 Contributing

Contributions welcome! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ by [MKS2508](https://github.com/MKS2508)**