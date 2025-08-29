# 📦 Core Module

**Lightweight logging without visual features • Perfect for libraries**

```typescript
import { debug, info, warn, error } from '@mks2508/better-logger/core'
```

**Bundle Size:** 6KB • **Gzipped:** 2KB

---

## ✨ Features

- ✅ **Essential logging levels** (debug, info, warn, error, critical, trace)
- ✅ **Performance timing** with `time()` and `timeEnd()`
- ✅ **Scoped loggers** for modular applications  
- ✅ **Table display** for structured data
- ✅ **Console grouping** with collapsible sections
- ✅ **Custom handlers** for extensibility
- ✅ **Zero visual dependencies** - pure functionality

## 🚀 Quick Start

```typescript
import { 
  debug, info, warn, error, critical,
  createScopedLogger, time, timeEnd,
  table, group, groupEnd
} from '@mks2508/better-logger/core'

// Basic logging
debug('Debug information', { config: { mode: 'development' } })
info('Application started')
warn('Configuration missing')
error('Connection failed', error)
critical('System failure')

// Performance timing
time('database-query')
// ... database operation
timeEnd('database-query') // Logs: database-query: 45.32ms

// Scoped logging
const apiLogger = createScopedLogger('API')
apiLogger.info('Request received', { endpoint: '/users' })

// Structured data
table([
  { name: 'Alice', role: 'Admin', active: true },
  { name: 'Bob', role: 'User', active: false }
])

// Grouped logging
group('Authentication Flow')
info('Validating credentials')
warn('Password expires in 3 days')
groupEnd()
```

## 📖 API Reference

### Logging Methods

```typescript
debug(...args: any[]): void          // Lowest priority, detailed info
info(...args: any[]): void           // General information  
warn(...args: any[]): void           // Warning messages
error(...args: any[]): void          // Error conditions
critical(...args: any[]): void       // Highest priority, system failures
trace(...args: any[]): void          // Debug with stack trace
```

### Performance Timing

```typescript
time(label: string): void            // Start timer
timeEnd(label: string): void         // End timer and log duration
```

### Data Display

```typescript
table(data: any, columns?: string[]): void    // Display data as table
group(label: string, collapsed?: boolean): void  // Start collapsible group
groupEnd(): void                              // End current group
```

### Logger Management

```typescript
createScopedLogger(prefix: string): CoreLogger    // Create prefixed logger
setGlobalPrefix(prefix: string): void             // Set global prefix
setVerbosity(level: Verbosity): void              // Filter log levels
addHandler(handler: ILogHandler): void            // Add custom handler
```

## 🎯 Configuration

### Verbosity Levels

```typescript
type Verbosity = 'debug' | 'info' | 'warn' | 'error' | 'critical' | 'silent'

setVerbosity('warn')  // Only show warnings and above
setVerbosity('silent') // Disable all logging
```

### Custom Handlers

```typescript
import { ILogHandler, LogLevel, LogMetadata } from '@mks2508/better-logger/core'

class FileHandler implements ILogHandler {
  handle(level: LogLevel, message: string, args: any[], metadata: LogMetadata) {
    // Custom logging logic
    fs.appendFileSync('app.log', `${metadata.timestamp} [${level}] ${message}\n`)
  }
}

addHandler(new FileHandler())
```

## 🏗️ Usage Patterns

### Library Development

```typescript
// logger.ts - internal logger for your library
import { createScopedLogger } from '@mks2508/better-logger/core'

export const logger = createScopedLogger('MyLibrary')

// usage.ts
import { logger } from './logger'

export function initialize() {
  logger.info('Library initialized')
}

export function processData(data: any) {
  logger.time('process-data')
  logger.debug('Processing data', { size: data.length })
  
  try {
    // ... processing logic
    logger.info('Data processed successfully')
  } catch (error) {
    logger.error('Processing failed', error)
  } finally {
    logger.timeEnd('process-data')
  }
}
```

### Microservices

```typescript
import { createScopedLogger, setGlobalPrefix } from '@mks2508/better-logger/core'

// Configure service-wide prefix
setGlobalPrefix('UserService')

// Create domain-specific loggers
const dbLogger = createScopedLogger('DB')
const authLogger = createScopedLogger('AUTH')  
const apiLogger = createScopedLogger('API')

// Usage across service
dbLogger.time('user-query')
dbLogger.debug('Executing query', { userId: 123 })
dbLogger.timeEnd('user-query')

authLogger.info('Token validated', { userId: 123, role: 'user' })

apiLogger.warn('Rate limit approaching', { 
  userId: 123, 
  requests: 95, 
  limit: 100 
})
```

### Testing Integration

```typescript
import { setVerbosity, addHandler } from '@mks2508/better-logger/core'

// Test environment setup
beforeAll(() => {
  if (process.env.NODE_ENV === 'test') {
    setVerbosity('error') // Only show errors during testing
  }
})

// Capture logs for testing
class TestLogHandler {
  logs: Array<{level: string, message: string}> = []
  
  handle(level: LogLevel, message: string) {
    this.logs.push({ level, message })
  }
}

const testHandler = new TestLogHandler()
addHandler(testHandler)

// Assert on logs
test('should log error on failure', () => {
  processFailingOperation()
  
  expect(testHandler.logs).toContainEqual({
    level: 'error',
    message: 'Operation failed'
  })
})
```

## ⚡ Performance

**Core module is optimized for minimal overhead:**

- **Bundle Size:** 6KB minified
- **Runtime Memory:** <2MB additional
- **Log Call Overhead:** ~0.1ms per call
- **Zero Dependencies:** No external packages

## 🔧 TypeScript Integration

Full TypeScript support with detailed type definitions:

```typescript
import type { 
  CoreLogger, 
  LogLevel, 
  Verbosity, 
  ILogHandler,
  LogMetadata 
} from '@mks2508/better-logger/core'

// Strongly typed logger instance
const logger: CoreLogger = createScopedLogger('TypedLogger')

// Type-safe verbosity setting
const level: Verbosity = 'debug'
setVerbosity(level)

// Custom handler with full type safety
class TypedHandler implements ILogHandler {
  handle(
    level: LogLevel,           // 'debug' | 'info' | 'warn' | 'error' | 'critical'
    message: string,
    args: any[],
    metadata: LogMetadata      // timestamp, prefix, stackInfo
  ): void {
    // Implementation with full IntelliSense
  }
}
```

---

**Perfect for:** Libraries • Microservices • Node.js applications • Testing environments

[← Back to main documentation](../README.md)