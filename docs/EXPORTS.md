# 📤 Exports Module

**Data management with CSV/JSON/XML export and remote logging capabilities**

```typescript
import { ExportLogger, exportLogs } from '@mks2508/better-logger/exports'
```

**Bundle Size:** 12KB • **Gzipped:** 3KB

---

## ✨ Features

- 📄 **Multiple Export Formats** (CSV, JSON, XML)
- 📡 **Remote Logging** to external services
- 🗂️ **Buffer Management** with circular buffer
- 📊 **Log Statistics** and analytics
- 🔍 **Advanced Filtering** by level, date, content
- ⚡ **Batch Operations** for performance
- 🔒 **Secure Remote Transmission** with API keys

## 🚀 Quick Start

```typescript
import { ExportLogger } from '@mks2508/better-logger/exports'

// Create logger with export capabilities
const logger = new ExportLogger({ bufferSize: 1000 })

// Log some data
logger.info('User logged in', { userId: 123 })
logger.error('Payment failed', { orderId: 456, error: 'timeout' })
logger.success('Order completed', { orderId: 789, amount: 99.99 })

// Export logs
const csvData = await logger.exportLogs('csv')
const jsonData = await logger.exportLogs('json', {
  filter: { level: 'error' },
  limit: 50
})

// Setup remote logging
logger.addRemoteHandler('https://api.logs.company.com', 'api-key-here')

// Get statistics
const stats = logger.getLogStats()
console.log(`Total logs: ${stats.info + stats.error + stats.warn}`)
```

## 📄 Export Formats

### CSV Export

```typescript
const csvData = await logger.exportLogs('csv', {
  filter: { 
    level: 'error',
    from: new Date('2024-01-01'),
    to: new Date()
  },
  limit: 100
})

// CSV Output:
// timestamp,level,prefix,message,location
// 2024-01-15T10:30:00.123Z,error,API,"Payment timeout","api.js:45:12"
// 2024-01-15T10:31:15.456Z,error,DB,"Connection lost","database.js:23:8"
```

### JSON Export

```typescript
const jsonData = await logger.exportLogs('json', {
  filter: { level: 'error' },
  groupBy: 'level'
})

// JSON Output:
{
  "metadata": {
    "exportTime": "2024-01-15T10:30:00.000Z",
    "totalLogs": 15,
    "filters": { "level": "error" }
  },
  "logs": [
    {
      "id": "log_001",
      "timestamp": "2024-01-15T10:30:00.123Z",
      "level": "error",
      "prefix": "API",
      "message": "Payment timeout",
      "args": [{ "orderId": 456, "error": "timeout" }],
      "location": {
        "file": "api.js",
        "line": 45,
        "column": 12,
        "function": "processPayment"
      }
    }
  ]
}
```

### XML Export

```typescript
const xmlData = await logger.exportLogs('xml', {
  groupBy: 'level',
  minimal: false
})

// XML Output:
<?xml version="1.0" encoding="UTF-8"?>
<logs>
  <metadata>
    <exportTime>2024-01-15T10:30:00.000Z</exportTime>
    <totalLogs>15</totalLogs>
  </metadata>
  <entries>
    <log id="log_001" level="error">
      <timestamp>2024-01-15T10:30:00.123Z</timestamp>
      <prefix>API</prefix>
      <message>Payment timeout</message>
      <location file="api.js" line="45" column="12" function="processPayment"/>
    </log>
  </entries>
</logs>
```

## 📡 Remote Logging

### Adding Remote Endpoints

```typescript
import { ExportLogger } from '@mks2508/better-logger/exports'

const logger = new ExportLogger({ bufferSize: 1000 })

// Add remote endpoints
logger.addRemoteHandler('https://logs.company.com/api/logs', 'secret-api-key')
logger.addRemoteHandler('wss://realtime.company.com/logs')
logger.addRemoteHandler('https://analytics.company.com/events', 'analytics-key')

// All logs are automatically sent to remote endpoints
logger.error('This will be sent to all 3 endpoints')
logger.info('User action', { action: 'click', element: 'button' })
```

### Remote Handler Configuration

```typescript
// HTTP endpoint with authentication
logger.addRemoteHandler('https://api.example.com/logs', {
  apiKey: 'your-secret-key',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'BetterLogger/1.0'
  },
  retries: 3,
  timeout: 5000
})

// WebSocket endpoint
logger.addRemoteHandler('wss://realtime.example.com/logs', {
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
})
```

### Batch Remote Logging

```typescript
// Configure batch settings
const logger = new ExportLogger({
  bufferSize: 1000,
  remoteBatch: {
    size: 10,        // Send in batches of 10 logs
    interval: 5000,  // Or every 5 seconds
    maxWait: 30000   // Force send after 30 seconds
  }
})

// Logs are automatically batched for efficiency
for (let i = 0; i < 100; i++) {
  logger.info(`Log entry ${i}`)
} // Sent as 10 batches of 10 logs each
```

### Flushing Remote Logs

```typescript
// Force send all pending logs
await logger.flushRemoteHandlers()

// Clear remote endpoints
logger.clearRemoteHandlers()

// Check remote status
const remoteStatus = logger.getRemoteStatus()
console.log('Active endpoints:', remoteStatus.active)
console.log('Failed endpoints:', remoteStatus.failed)
```

## 🗂️ Buffer Management

### Buffer Configuration

```typescript
const logger = new ExportLogger({
  bufferSize: 2000,        // Maximum 2000 log entries
  bufferMode: 'circular',  // Overwrite oldest when full
  persistBuffer: true,     // Save to localStorage
  bufferKey: 'app-logs'    // Storage key name
})

// Get buffer information
const bufferStats = logger.getBufferStats()
console.log('Buffer usage:', bufferStats.usage, '%')
console.log('Oldest log:', bufferStats.oldestLog)
console.log('Newest log:', bufferStats.newestLog)
```

### Buffer Operations

```typescript
// Get all buffered logs
const allLogs = logger.getLogs()
console.log('Total logs in buffer:', allLogs.length)

// Clear the buffer
logger.clearLogs()

// Get logs with filtering
const recentErrors = logger.getLogs({
  level: 'error',
  since: Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
})
```

## 📊 Analytics & Statistics

### Log Statistics

```typescript
const stats = logger.getLogStats()

console.log('Log Distribution:')
console.log('- Debug:', stats.debug)
console.log('- Info:', stats.info)
console.log('- Warnings:', stats.warn)
console.log('- Errors:', stats.error)
console.log('- Critical:', stats.critical)

// Performance metrics
console.log('Buffer efficiency:', stats.bufferEfficiency, '%')
console.log('Average log size:', stats.averageLogSize, 'bytes')
console.log('Logs per minute:', stats.logsPerMinute)
```

### Advanced Analytics

```typescript
// Get detailed analytics
const analytics = logger.getAnalytics({
  timeframe: '24h',      // Last 24 hours
  groupBy: 'hour',       // Group by hour
  includeMetrics: true   // Include performance metrics
})

// Analytics Output:
{
  timeframe: {
    start: '2024-01-14T10:30:00.000Z',
    end: '2024-01-15T10:30:00.000Z',
    duration: '24 hours'
  },
  summary: {
    totalLogs: 1547,
    errorRate: 0.023,     // 2.3% error rate
    averagePerHour: 64.4,
    peakHour: '14:00',
    peakCount: 142
  },
  breakdown: {
    '10:00': { debug: 45, info: 23, warn: 3, error: 1 },
    '11:00': { debug: 52, info: 31, warn: 5, error: 2 },
    // ... hourly breakdown
  }
}
```

## 🔍 Advanced Filtering

### Filter Options

```typescript
interface ExportFilters {
  level?: LogLevel | LogLevel[]        // Filter by log level(s)
  from?: Date | string                 // Start date/time
  to?: Date | string                   // End date/time
  prefix?: string | string[]           // Filter by prefix(es)
  content?: string                     // Search message content
  hasArgs?: boolean                    // Only logs with additional arguments
  function?: string                    // Filter by calling function
}

// Complex filtering example
const filteredData = await logger.exportLogs('json', {
  filter: {
    level: ['error', 'critical'],
    from: '2024-01-01',
    to: new Date(),
    prefix: ['API', 'DATABASE'],
    content: 'timeout'
  },
  limit: 200,
  groupBy: 'prefix'
})
```

### Real-time Filtering

```typescript
// Stream filtered logs in real-time
logger.onLog((entry) => {
  if (entry.level === 'error' && entry.prefix === 'PAYMENT') {
    // Send immediate alert for payment errors
    sendSlackAlert(entry)
  }
})

// Conditional remote logging
logger.addRemoteHandler('https://critical-alerts.com/api', {
  filter: (entry) => entry.level === 'critical',
  immediate: true  // Skip batching for critical logs
})
```

## 🎯 Use Cases

### Error Tracking & Monitoring

```typescript
const errorLogger = new ExportLogger({ 
  bufferSize: 5000,
  autoExport: {
    format: 'json',
    trigger: 'error',     // Auto-export on errors
    destination: 'https://error-tracking.com/api'
  }
})

// Production error handling
try {
  await riskyOperation()
} catch (error) {
  errorLogger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    context: getCurrentContext()
  })
  
  // Automatically exports and sends to error tracking service
}
```

### Audit Logging

```typescript
const auditLogger = new ExportLogger({
  bufferSize: 10000,
  encryption: true,         // Encrypt sensitive data
  immutable: true,          // Prevent log modification
  digitalSigning: true      // Sign logs for integrity
})

// Audit trail
auditLogger.info('User login', { 
  userId: 123, 
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
})

auditLogger.info('Data access', {
  userId: 123,
  resource: '/api/sensitive-data',
  action: 'read'
})

// Export signed audit logs
const auditTrail = await auditLogger.exportLogs('xml', {
  signed: true,
  encrypted: true
})
```

### Performance Monitoring

```typescript
const perfLogger = new ExportLogger({
  bufferSize: 2000,
  includePerformanceMetrics: true
})

// Performance tracking
perfLogger.time('api-request')
const result = await apiCall()
perfLogger.timeEnd('api-request')

perfLogger.info('Request completed', {
  duration: performance.now() - startTime,
  memory: process.memoryUsage(),
  cpu: process.cpuUsage()
})

// Export performance data
const perfData = await perfLogger.exportLogs('csv', {
  filter: { hasMetrics: true },
  format: 'performance'  // Special performance format
})
```

## 🔧 Configuration Options

### Logger Configuration

```typescript
interface ExportLoggerConfig {
  bufferSize?: number              // Buffer size (default: 1000)
  bufferMode?: 'circular' | 'grow' // Buffer behavior
  autoExport?: {                   // Automatic export settings
    format: ExportFormat
    trigger: 'size' | 'time' | 'level'
    threshold: number
    destination?: string
  }
  remote?: {                       // Remote logging settings
    batchSize: number
    batchInterval: number
    retries: number
    timeout: number
  }
  encryption?: boolean             // Encrypt log data
  compression?: boolean            // Compress exports
  includeStackTrace?: boolean      // Include stack traces
  includePerformance?: boolean     // Include perf metrics
}
```

### Environment Variables

```bash
# .env configuration
BETTER_LOGGER_BUFFER_SIZE=5000
BETTER_LOGGER_REMOTE_ENDPOINT=https://logs.company.com/api
BETTER_LOGGER_API_KEY=your-secret-key
BETTER_LOGGER_ENCRYPTION=true
BETTER_LOGGER_AUTO_EXPORT=true
```

---

**Perfect for:** Production applications • Error tracking • Audit logging • Performance monitoring • Data analytics

[← Back to main documentation](../README.md)