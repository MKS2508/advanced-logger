# @mks2508/better-logger-nodejs-opentui

Rich terminal logging with OpenTUI - Enhanced Tier 2 Package

## Overview

This package extends the Advanced Logger with [OpenTUI](https://github.com/sst/opentui) capabilities, providing beautiful, interactive terminal user interfaces for your logs. While OpenTUI is still experimental, it offers cutting-edge terminal UI features that transform console logging into rich visual experiences.

## Features

- 🎨 **Rich Visual Components**: Beautiful badges, styled text, and visual elements
- ⚡ **Performance**: Built on OpenTUI's high-performance rendering engine
- 🔧 **Easy Integration**: Drop-in enhancement for existing loggers
- 🎯 **Tier 2 Enhanced**: Focused on essential rich logging without complexity
- 📱 **Auto-fallback**: Gracefully falls back to standard logging if OpenTUI unavailable

## Installation

```bash
npm install @mks2508/better-logger-nodejs-opentui
```

**Dependencies:**
- `@opentui/core ^0.1.2`
- `@opentui/react ^0.1.2` (for future components)
- `@mks2508/better-logger-core ^0.12.0` (peer dependency)

## Quick Start

### Option 1: Quick Setup (Recommended)

```typescript
import { quickSetup } from '@mks2508/better-logger-nodejs-opentui';

// One line setup - enhances default logger
const logger = await quickSetup();

logger?.info('🚀 OpenTUI enhanced logging is ready!');
logger?.warn('⚠️ This will look amazing in terminal');
logger?.error('❌ Rich error display with badges');
logger?.critical('🚨 Critical alerts with animations');
```

### Option 2: Manual Integration

```typescript
import logger from '@mks2508/better-logger-core';
import { createOpenTUILogger } from '@mks2508/better-logger-nodejs-opentui';

// Create and add OpenTUI handler
const openTUIHandler = await createOpenTUILogger({
  renderer: {
    animated: true,
    theme: 'auto',
    components: {
      badges: true
    }
  }
});

if (openTUIHandler) {
  logger.addHandler(openTUIHandler);
  logger.info('Rich terminal logging enabled!');
} else {
  logger.info('Fallback to standard logging');
}
```

### Option 3: Enhance Existing Logger

```typescript
import { enhanceLoggerWithOpenTUI } from '@mks2508/better-logger-nodejs-opentui';
import myLogger from './my-logger';

// Enhance any logger that has addHandler method
const enhanced = await enhanceLoggerWithOpenTUI(myLogger, {
  renderer: { animated: true, theme: 'dark' }
});

if (enhanced) {
  myLogger.info('Now with OpenTUI superpowers! 💫');
}
```

## Configuration

### OpenTUIRendererOptions

```typescript
interface OpenTUIRendererOptions {
  interactive?: boolean;     // false (Tier 2 - basic for now)
  animated?: boolean;        // true - Enable animations
  theme?: 'light' | 'dark' | 'auto'; // 'auto' - Adapt to terminal
  dashboard?: boolean;       // false (reserved for Tier 3)
  maxHistory?: number;       // 100 - Max log entries to keep
  components?: {
    badges?: boolean;        // true - Show level badges
    progressBars?: boolean;  // false (Tier 2 - keeping simple)
    tables?: boolean;        // false (Tier 2)
    charts?: boolean;        // false (Tier 2)
  };
}
```

### Examples

**Animated Logging:**
```typescript
const handler = await createOpenTUILogger({
  renderer: {
    animated: true,
    theme: 'dark'
  }
});

logger.addHandler(handler);

logger.critical('🚨 This badge pulses with animation!');
logger.error('❌ Error badges shake to grab attention');
logger.warn('⚠️ Warning badges pulse subtly');
```

**Scoped Logging with Prefixes:**
```typescript
const apiLogger = logger.scope('API');
const dbLogger = logger.scope('DATABASE');

apiLogger.info('Request started');    // [ℹ️ INFO] [API] Request started
dbLogger.error('Connection failed');  // [❌ ERROR] [DATABASE] Connection failed
```

## Visual Features

### Log Level Badges

Each log level gets a distinctive badge with icon and styling:

- 🔍 **DEBUG** - Gray badge, subtle
- ℹ️ **INFO** - Blue badge, informative  
- ⚠️ **WARN** - Yellow badge, pulses
- ❌ **ERROR** - Red badge, shakes
- 🚨 **CRITICAL** - Dark red badge, strong pulse

### Animations (Tier 2)

- **Pulse**: Warning and critical levels
- **Shake**: Error level for attention
- **None**: Debug and info for clean output

### Auto-Fallback

If OpenTUI is not available, the handler automatically falls back to enhanced plain text:

```
[10:30:45] 🚨 [CRITICAL] [API] Database connection lost
[10:30:46] ❌ [ERROR] [AUTH] Login failed for user@example.com
    at AuthService.validateUser (auth.js:45:12)
```

## API Reference

### Classes

- **`OpenTUILogHandler`** - Main log handler implementing `ILogHandler`
- **`OpenTUILogRenderer`** - Core rendering engine using OpenTUI

### Functions

- **`createOpenTUILogger(config?)`** - Factory function for handlers
- **`enhanceLoggerWithOpenTUI(logger, config?)`** - Enhance existing logger
- **`quickSetup()`** - One-line setup for default logger
- **`isOpenTUIAvailable()`** - Check if OpenTUI is available

### Types

All TypeScript interfaces are exported for custom implementations:
- `OpenTUILogEntry`, `OpenTUIRendererOptions`, `LogComponentStyle`, etc.

## Performance

- **Graceful Degradation**: Zero impact if OpenTUI unavailable
- **Efficient Rendering**: Leverages OpenTUI's optimized terminal rendering
- **Memory Management**: Configurable log history limits
- **Fast Fallback**: Instant fallback to console logging if needed

## Troubleshooting

### OpenTUI Not Available

If you see "OpenTUI not available, falling back to standard logging":

1. **Check Installation**: Ensure `@opentui/core` is installed
2. **Node Version**: Requires Node.js ≥16.0.0
3. **Terminal Support**: Some terminals may not fully support OpenTUI features
4. **Permissions**: Ensure terminal has proper rendering permissions

### Debugging

```typescript
// Check handler status
const handler = await createOpenTUILogger();
console.log('Handler stats:', handler?.getStats());

// Enable debug logging
process.env.DEBUG = 'opentui:*';
```

## Roadmap

### Current: Tier 2 Enhanced ✅
- Rich badges with icons and animations
- Auto-fallback to plain text
- Basic OpenTUI integration

### Future: Tier 3 Interactive
- Live dashboard with filtering
- Real-time log statistics
- Interactive components (click, select)
- Progress bars and charts
- 3D log visualizations

## Contributing

This package is part of the Advanced Logger ecosystem. See the main repository for contributing guidelines.

## License

MIT - See LICENSE file for details

---

**Note**: OpenTUI is experimental and not production-ready. This package provides fallback mechanisms to ensure reliability in all environments.