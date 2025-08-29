---
layout: default
title: Sub-Packages Guide  
permalink: /packages/
---

# 📦 Sub-Packages Guide

Better Logger provides modular architecture with independent packages for specific functionality.

## Package Overview

| Package | Description | Size | Dependencies |
|---------|-------------|------|--------------|
| `@mks2508/better-logger` | **Main package** - Full functionality | ~45KB | None |
| `@mks2508/better-logger-core` | **Core logging** - Essential features only | ~15KB | None |
| `@mks2508/better-logger-styling` | **Styling system** - CSS themes & visuals | ~12KB | core |
| `@mks2508/better-logger-exports` | **Export handlers** - File, remote, analytics | ~18KB | core |

---

## 🚀 Installation Options

### Full Package (Recommended)
```bash
npm install @mks2508/better-logger
```

### Modular Installation
```bash
# Core functionality only
npm install @mks2508/better-logger-core

# Add styling capabilities  
npm install @mks2508/better-logger-styling

# Add export functionality
npm install @mks2508/better-logger-exports
```

---

## 📋 Package Details

### Core Package (`@mks2508/better-logger-core`)

**What it includes:**
- ✅ Basic logging methods (debug, info, warn, error, critical)
- ✅ Log level filtering and verbosity
- ✅ Performance timing (time/timeEnd)
- ✅ Stack trace capture
- ✅ Scoped loggers with prefixes
- ✅ Basic console grouping

**What it excludes:**
- ❌ Advanced CSS styling and themes
- ❌ Export handlers (file, remote, analytics)
- ❌ CLI interface
- ❌ SVG banners and animations

```typescript
// Core-only usage
import { Logger } from '@mks2508/better-logger-core';

const logger = new Logger();
logger.info('Basic logging works!');
logger.time('operation');
// ... do work
logger.timeEnd('operation');
```

### Styling Package (`@mks2508/better-logger-styling`)

**What it adds:**
- ✅ Advanced CSS gradients and themes
- ✅ Pre-built theme variants (matrix, cyberpunk, etc.)
- ✅ Custom style builder with fluent API
- ✅ SVG banner support
- ✅ Animation effects for console output

```typescript
// With styling capabilities
import { Logger } from '@mks2508/better-logger-core';
import { applyTheme, StyleBuilder } from '@mks2508/better-logger-styling';

const logger = new Logger();
applyTheme(logger, 'matrix');

// Custom styling
const style = new StyleBuilder()
    .backgroundColor('#1a1a2e')
    .color('#eee')
    .fontSize('14px')
    .build();

logger.info('Styled message', { style });
```

### Exports Package (`@mks2508/better-logger-exports`)

**What it adds:**
- ✅ File export handlers (CSV, JSON, XML)
- ✅ Remote logging to external services
- ✅ Analytics integration handlers
- ✅ Custom export format support
- ✅ Batch processing and buffering

```typescript
// With export capabilities
import { Logger } from '@mks2508/better-logger-core';
import { FileLogHandler, RemoteLogHandler } from '@mks2508/better-logger-exports';

const logger = new Logger();

// Add file export
logger.addHandler(new FileLogHandler({
    filename: 'app.log',
    format: 'json',
    maxSize: '10MB'
}));

// Add remote logging
logger.addHandler(new RemoteLogHandler({
    endpoint: 'https://api.example.com/logs',
    apiKey: 'your-key',
    batchSize: 100
}));
```

---

## 🔧 Build Your Own Stack

### Minimal Setup (Core Only)
Perfect for lightweight applications or libraries.

```typescript
import { Logger } from '@mks2508/better-logger-core';

const logger = new Logger({ 
    prefix: '[MyApp]',
    level: 'info'
});

export default logger;
```
**Bundle size:** ~15KB

### Visual Setup (Core + Styling)
For applications that need visual appeal in dev tools.

```typescript
import { Logger } from '@mks2508/better-logger-core';
import { applyTheme } from '@mks2508/better-logger-styling';

const logger = new Logger();
applyTheme(logger, 'cyberpunk');

export default logger;
```
**Bundle size:** ~27KB

### Full-Featured Setup (All Packages)
Complete logging solution with all capabilities.

```typescript
import { Logger } from '@mks2508/better-logger-core';
import { applyTheme } from '@mks2508/better-logger-styling';
import { FileLogHandler } from '@mks2508/better-logger-exports';

const logger = new Logger();
applyTheme(logger, 'matrix');
logger.addHandler(new FileLogHandler({ filename: 'app.log' }));

export default logger;
```
**Bundle size:** ~45KB

---

## 📊 Performance Comparison

| Setup | Bundle Size | Load Time | Memory Usage | Features |
|-------|-------------|-----------|--------------|----------|
| Core Only | 15KB | <10ms | <2MB | Basic logging |
| Core + Styling | 27KB | <15ms | <3MB | Styled output |
| Core + Exports | 33KB | <20ms | <4MB | With file/remote |
| Full Package | 45KB | <25ms | <5MB | All features |

---

## 🔄 Migration Guide

### From Full to Modular
If you want to reduce bundle size:

```typescript
// Before: Full package
import { Logger } from '@mks2508/better-logger';

// After: Modular approach
import { Logger } from '@mks2508/better-logger-core';
import { applyTheme } from '@mks2508/better-logger-styling'; // Only if needed
```

### From v0.8.x to v0.1.0-rc.1
The package structure changed in v0.1.0-rc.1:

```bash
# Update all packages
npm update @mks2508/better-logger@0.1.0-rc.1
npm update @mks2508/better-logger-core@0.1.0-rc.1  
npm update @mks2508/better-logger-styling@0.1.0-rc.1
npm update @mks2508/better-logger-exports@0.1.0-rc.1
```

---

## 🎯 Recommendations

### For Libraries
Use **core-only** to minimize dependencies:
```bash
npm install @mks2508/better-logger-core
```

### For Applications  
Use **full package** for complete features:
```bash
npm install @mks2508/better-logger
```

### For Production APIs
Use **core + exports** for logging + file/remote:
```bash
npm install @mks2508/better-logger-core @mks2508/better-logger-exports
```

### For Development
Use **full package** with enhanced CLI:
```bash  
npm install @mks2508/better-logger
# Includes interactive CLI, history, plugins, etc.
```