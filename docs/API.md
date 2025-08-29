---
layout: default
title: API Reference
permalink: /API/
---

# 🔧 API Reference

Complete API documentation for Better Logger with detailed method signatures, parameters, and examples.

## Table of Contents

- [Core Logger](#core-logger)
- [Style Builder](#style-builder)
- [CLI Interface](#cli-interface)
- [Export & Remote](#export--remote)
- [Types & Interfaces](#types--interfaces)

---

## 🚀 Core Logger

### Logger Class

The main Logger class provides all essential logging functionality.

```typescript
import { Logger } from '@mks2508/better-logger';

const logger = new Logger();
```

#### Constructor Options

```typescript
interface LoggerOptions {
  prefix?: string;           // Default prefix for all log messages
  level?: LogLevel;          // Minimum log level to display
  enableStackTrace?: boolean; // Include stack traces in logs
  enablePerformance?: boolean; // Include performance timings
  theme?: ThemeName;         // Visual theme for styling
}
```

#### Log Levels

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Log level hierarchy (higher numbers = higher priority)
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
} as const;
```

### Basic Logging Methods

#### `logger.debug(message, ...args)`
Low-priority debugging information.
```typescript
logger.debug('Variable value:', { userId: 123 });
// Output: [DEBUG] Variable value: { userId: 123 }
```

#### `logger.info(message, ...args)`
General informational messages.
```typescript
logger.info('User logged in', { username: 'john_doe' });
// Output: [INFO] User logged in { username: 'john_doe' }
```

#### `logger.warn(message, ...args)`
Warning messages for potential issues.
```typescript
logger.warn('API rate limit approaching', { remaining: 10 });
// Output: [WARN] API rate limit approaching { remaining: 10 }
```

#### `logger.error(message, ...args)`
Error messages for failures.
```typescript
logger.error('Database connection failed', { error: 'ECONNREFUSED' });
// Output: [ERROR] Database connection failed { error: 'ECONNREFUSED' }
```

#### `logger.critical(message, ...args)`
Critical system failures requiring immediate attention.
```typescript
logger.critical('System memory exhausted', { usage: '95%' });
// Output: [CRITICAL] System memory exhausted { usage: '95%' }
```

### Advanced Logging Methods

#### `logger.success(message, ...args)`
Success notifications with green styling.
```typescript
logger.success('Payment processed successfully', { orderId: 'ORD-123' });
// Output: [SUCCESS] Payment processed successfully { orderId: 'ORD-123' }
```

#### `logger.table(data, options?)`
Display data in formatted table.
```typescript
const users = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
];

logger.table(users);
// Displays formatted table in console
```

#### `logger.group(label, callback?)`
Group related log messages.
```typescript
logger.group('User Authentication', () => {
  logger.info('Checking credentials...');
  logger.info('Validating token...');
  logger.success('Authentication successful');
});

// Or manual grouping
logger.group('Database Operations');
logger.info('Connecting to database...');
logger.info('Running migration...');
logger.groupEnd();
```

### Performance Timing

#### `logger.time(label)`
Start timing operation.
```typescript
logger.time('api-call');
await fetchUserData();
logger.timeEnd('api-call');
// Output: [TIMING] api-call: 245.67ms
```

#### `logger.timeEnd(label)`
End timing and display duration.

#### `logger.timeLog(label, ...args)`
Log intermediate timing without ending timer.
```typescript
logger.time('long-operation');
await step1();
logger.timeLog('long-operation', 'Step 1 complete');
await step2();
logger.timeEnd('long-operation');
```

### Scoped Loggers

Create loggers with persistent prefixes for different modules.

```typescript
const apiLogger = logger.scope('API');
const dbLogger = logger.scope('DATABASE');

apiLogger.info('Making HTTP request');    // [API] [INFO] Making HTTP request
dbLogger.error('Connection timeout');     // [DATABASE] [ERROR] Connection timeout
```

### Log Handlers

Add custom handlers for log processing.

```typescript
import { FileLogHandler, RemoteLogHandler } from '@mks2508/better-logger';

// File logging
logger.addHandler(new FileLogHandler('/path/to/logs.txt'));

// Remote logging
logger.addHandler(new RemoteLogHandler('https://api.logging-service.com'));

// Custom handler
logger.addHandler({
  handle(entry) {
    // Process log entry
    console.log('Custom handler:', entry);
  }
});
```

---

## 🎨 Style Builder

Create custom console styles programmatically.

```typescript
import { createStyle, StyleBuilder } from '@mks2508/better-logger/styling';
```

### Creating Styles

#### `createStyle()`
Returns new StyleBuilder instance.

```typescript
const customStyle = createStyle()
  .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
  .color('white')
  .padding('10px 20px')
  .rounded('8px')
  .bold()
  .build();

console.log('%cCustom Message', customStyle);
```

### StyleBuilder Methods

#### Background Methods
```typescript
.bg(gradient: string)                    // Background gradient
.backgroundColor(color: string)          // Solid background color
```

#### Typography Methods
```typescript
.color(color: string)                    // Text color
.font(family: string)                    // Font family
.fontSize(size: string)                  // Font size
.bold()                                  // Bold text
.italic()                                // Italic text
```

#### Layout Methods
```typescript
.padding(padding: string)                // CSS padding
.margin(margin: string)                  // CSS margin
.display(display: string)                // CSS display property
```

#### Visual Effects
```typescript
.border(border: string)                  // CSS border
.rounded(radius: string)                 // Border radius
.shadow(shadow: string)                  // Box shadow
```

#### Animations
```typescript
.animation(animation: string)            // CSS animation
.transition(transition: string)          // CSS transition
```

#### Custom Properties
```typescript
.css(property: string, value: string)    // Custom CSS property
```

### Style Presets

Pre-built styles for common use cases.

```typescript
import { stylePresets } from '@mks2508/better-logger/styling';

console.log('%c✅ Success!', stylePresets.success);
console.log('%c❌ Error!', stylePresets.error);
console.log('%c⚠️ Warning!', stylePresets.warning);
console.log('%cℹ️ Info', stylePresets.info);
console.log('%c🎯 Accent', stylePresets.accent);
```

---

## 💻 CLI Interface

Interactive command-line interface for logger configuration.

### Available Commands

#### `/help`
Display help information and available commands.

#### `/config`
Show current logger configuration.
```typescript
/config
// Displays: Theme: default, Level: info, Stack traces: enabled
```

#### `/theme [name]`
Change visual theme.
```typescript
/theme cyberpunk
// Switches to cyberpunk theme with purple/pink colors
```

Available themes: `default`, `dark`, `neon`, `cyberpunk`, `retro`

#### `/banner [type]`
Set banner display type.
```typescript
/banner animated
// Shows animated gradient banner
```

Banner types: `simple`, `ascii`, `unicode`, `svg`, `animated`

#### `/clear`
Clear console and reset log buffer.

#### `/export [format]`
Export logs in specified format.
```typescript
/export json
// Exports current logs as JSON
```

#### `/status`
Show logger status and statistics.

#### `/enumerate`
List all available features and capabilities.

### CLI Integration

```typescript
import { initializeCLI } from '@mks2508/better-logger/cli';

// Initialize CLI with logger instance
initializeCLI(logger);

// CLI commands are now available in console
// Type /help to see available commands
```

---

## 📤 Export & Remote

Data export and remote logging capabilities.

```typescript
import { ExportLogger } from '@mks2508/better-logger/exports';
```

### ExportLogger Class

Extended logger with export and remote capabilities.

```typescript
const logger = new ExportLogger({
  bufferSize: 1000,
  remoteBatch: {
    size: 10,
    interval: 5000
  }
});
```

#### Constructor Options
```typescript
interface ExportLoggerConfig {
  bufferSize?: number;           // Log buffer size
  bufferMode?: 'circular' | 'grow'; // Buffer behavior
  persistBuffer?: boolean;       // Save to localStorage
  remoteBatch?: {               // Remote batching config
    size: number;
    interval: number;
    maxWait: number;
  };
  autoExport?: {               // Auto-export settings
    format: ExportFormat;
    trigger: 'size' | 'time' | 'level';
    threshold: number;
  };
}
```

### Export Methods

#### `exportLogs(format, options?)`
Export logs in specified format.

```typescript
// Export as CSV
const csvData = await logger.exportLogs('csv', {
  filter: { level: 'error' },
  limit: 100
});

// Export as JSON with grouping
const jsonData = await logger.exportLogs('json', {
  groupBy: 'level',
  includeStackTrace: true
});

// Export as XML
const xmlData = await logger.exportLogs('xml');
```

#### Export Options
```typescript
interface ExportOptions {
  filter?: {
    level?: LogLevel | LogLevel[];
    from?: Date | string;
    to?: Date | string;
    prefix?: string | string[];
    content?: string;
  };
  limit?: number;
  groupBy?: 'level' | 'prefix' | 'date';
  includeStackTrace?: boolean;
  minimal?: boolean;
}
```

### Remote Logging

#### `addRemoteHandler(url, options?)`
Add remote logging endpoint.

```typescript
// HTTP endpoint
logger.addRemoteHandler('https://api.logs.com/collect', {
  apiKey: 'secret-key',
  headers: { 'Content-Type': 'application/json' },
  retries: 3
});

// WebSocket endpoint
logger.addRemoteHandler('wss://realtime.logs.com', {
  reconnect: true,
  maxReconnectAttempts: 5
});
```

#### Remote Handler Options
```typescript
interface RemoteHandlerOptions {
  apiKey?: string;
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  filter?: (entry: LogEntry) => boolean;
  immediate?: boolean;
}
```

---

## 📋 Types & Interfaces

### Core Types

```typescript
// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// Theme names
type ThemeName = 'default' | 'dark' | 'neon' | 'cyberpunk' | 'retro';

// Banner types
type BannerType = 'simple' | 'ascii' | 'unicode' | 'svg' | 'animated';

// Export formats
type ExportFormat = 'csv' | 'json' | 'xml';
```

### Interfaces

```typescript
// Log entry structure
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  prefix: string;
  message: string;
  args: any[];
  location?: {
    file: string;
    line: number;
    column: number;
    function: string;
  };
  performance?: {
    duration: number;
    memory: NodeJS.MemoryUsage;
  };
}

// Log handler interface
interface ILogHandler {
  handle(entry: LogEntry): void | Promise<void>;
}

// Style configuration
interface StyleConfig {
  emoji?: string;
  colors?: {
    primary: string;
    secondary: string;
    text: string;
  };
  effects?: {
    shadow: string;
    border: string;
  };
}
```

---

## 🔄 Lifecycle Events

### Event Handlers

```typescript
// Log events
logger.on('log', (entry: LogEntry) => {
  // Handle each log entry
});

logger.on('error', (error: Error) => {
  // Handle logging errors
});

logger.on('export', (data: string, format: ExportFormat) => {
  // Handle export completion
});

// Remote events
logger.on('remote:success', (endpoint: string, count: number) => {
  // Handle successful remote transmission
});

logger.on('remote:error', (endpoint: string, error: Error) => {
  // Handle remote logging errors
});
```

### Buffer Events

```typescript
logger.on('buffer:full', (size: number) => {
  // Handle buffer capacity reached
});

logger.on('buffer:cleared', () => {
  // Handle buffer cleared
});
```

---

## 📚 Advanced Usage

### Performance Monitoring

```typescript
// Automatic performance tracking
logger.time('operation');
await performOperation();
const metrics = logger.timeEnd('operation'); // Returns timing data

// Memory usage tracking
logger.logMemory('checkpoint-1');
await heavyOperation();
logger.logMemory('checkpoint-2');
```

### Conditional Logging

```typescript
// Environment-based logging
logger.setLevel(process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// Conditional handlers
if (process.env.ENABLE_FILE_LOGGING === 'true') {
  logger.addHandler(new FileLogHandler('./app.log'));
}
```

### Custom Formatters

```typescript
// Custom message formatting
logger.setFormatter((entry: LogEntry) => {
  return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
});

// Custom data serialization
logger.setSerializer((data: any) => {
  return JSON.stringify(data, null, 2);
});
```

---

For more examples and use cases, see the [examples folder](../examples/) and [live demo](https://mks2508.github.io/advanced-logger/).