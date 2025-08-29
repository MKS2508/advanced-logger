/**
 * Data Export and Remote Logging Example
 * 
 * Demonstrates export and remote logging capabilities including:
 * - Log buffering and management
 * - Exporting logs in different formats (CSV, JSON, XML)
 * - Remote logging to external services
 * - Log filtering and analytics
 * - Buffer statistics and management
 * 
 * Run: node examples/data-export.js
 */

import { ExportLogger } from '@mks2508/better-logger/exports';
import fs from 'fs';
import path from 'path';

console.log('📤 Better Logger - Data Export Example\n');

// Create ExportLogger with buffering enabled
const logger = new ExportLogger({
  bufferSize: 100,
  bufferMode: 'circular',
  prefix: 'EXPORT'
});

// Generate sample log data
console.log('📝 Generating sample log data:');

const sampleData = [
  { level: 'info', message: 'User login successful', data: { userId: 'user_123', ip: '192.168.1.100' } },
  { level: 'warn', message: 'High memory usage detected', data: { usage: '85%', threshold: '80%' } },
  { level: 'error', message: 'Database connection timeout', data: { host: 'db.example.com', timeout: 5000 } },
  { level: 'info', message: 'API request processed', data: { endpoint: '/api/users', method: 'GET', duration: 245 } },
  { level: 'critical', message: 'Disk space critically low', data: { available: '100MB', required: '2GB' } },
  { level: 'success', message: 'Backup completed successfully', data: { size: '2.3GB', duration: '5 minutes' } },
  { level: 'debug', message: 'Debug trace for user session', data: { sessionId: 'sess_789', debug: true } },
  { level: 'error', message: 'Payment processing failed', data: { orderId: 'ORD-456', error: 'CARD_DECLINED' } },
  { level: 'info', message: 'Cache invalidation completed', data: { keys: ['user:123', 'session:789'], count: 2 } },
  { level: 'warn', message: 'Rate limit approaching', data: { current: 95, limit: 100, window: '1 minute' } }
];

// Log all sample data
sampleData.forEach((item, index) => {
  const logMethod = logger[item.level] || logger.info;
  logMethod.call(logger, `Sample ${index + 1}: ${item.message}`, item.data);
});

console.log(`\n📊 Generated ${sampleData.length} log entries`);

// Show buffer statistics
const bufferStats = logger.getBufferStats();
console.log('\n📈 Buffer Statistics:');
console.log(`- Total entries: ${bufferStats.totalEntries}`);
console.log(`- Buffer usage: ${bufferStats.usage}%`);
console.log(`- Oldest entry: ${bufferStats.oldestEntry?.timestamp || 'N/A'}`);
console.log(`- Newest entry: ${bufferStats.newestEntry?.timestamp || 'N/A'}`);

// Show log statistics by level
const logStats = logger.getLogStats();
console.log('\n📋 Log Level Statistics:');
Object.entries(logStats).forEach(([level, count]) => {
  if (typeof count === 'number' && count > 0) {
    console.log(`- ${level.toUpperCase()}: ${count} entries`);
  }
});

// Export logs in different formats
console.log('\n📄 Exporting logs in different formats:');

try {
  // Create exports directory if it doesn't exist
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // Export all logs as CSV
  console.log('🔄 Exporting as CSV...');
  const csvData = await logger.exportLogs('csv');
  fs.writeFileSync(path.join(exportsDir, 'logs-all.csv'), csvData);
  console.log('✅ CSV export saved to: exports/logs-all.csv');

  // Export error logs as JSON
  console.log('🔄 Exporting errors as JSON...');
  const jsonErrorData = await logger.exportLogs('json', {
    filter: { level: ['error', 'critical'] },
    includeStackTrace: true
  });
  fs.writeFileSync(path.join(exportsDir, 'logs-errors.json'), jsonErrorData);
  console.log('✅ JSON export (errors only) saved to: exports/logs-errors.json');

  // Export recent logs as XML
  console.log('🔄 Exporting recent logs as XML...');
  const xmlData = await logger.exportLogs('xml', {
    limit: 5,
    groupBy: 'level'
  });
  fs.writeFileSync(path.join(exportsDir, 'logs-recent.xml'), xmlData);
  console.log('✅ XML export (recent 5) saved to: exports/logs-recent.xml');

  // Export with date filtering
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  console.log('🔄 Exporting last 24 hours as JSON...');
  const recentJsonData = await logger.exportLogs('json', {
    filter: { from: oneDayAgo },
    groupBy: 'level'
  });
  fs.writeFileSync(path.join(exportsDir, 'logs-24h.json'), recentJsonData);
  console.log('✅ JSON export (24h) saved to: exports/logs-24h.json');

} catch (error) {
  console.error('❌ Export error:', error.message);
}

// Demonstrate remote logging (simulation)
console.log('\n📡 Remote Logging Simulation:');

// Simulate HTTP endpoint
const simulateHttpEndpoint = (data) => {
  console.log('📤 HTTP POST to https://api.logs.example.com/collect');
  console.log(`📊 Payload size: ${JSON.stringify(data).length} bytes`);
  console.log(`📋 Entries: ${data.length}`);
  return Promise.resolve({ status: 200, message: 'Logs received' });
};

// Simulate WebSocket endpoint
const simulateWebSocketEndpoint = (data) => {
  console.log('🔗 WebSocket send to wss://realtime.logs.example.com');
  console.log(`📊 Message size: ${JSON.stringify(data).length} bytes`);
  return Promise.resolve({ connected: true, delivered: true });
};

// Add remote handlers (simulation)
logger.addRemoteHandler('https://api.logs.example.com/collect', {
  apiKey: 'demo-key-123',
  handler: simulateHttpEndpoint,
  retries: 3,
  batchSize: 5
});

logger.addRemoteHandler('wss://realtime.logs.example.com', {
  handler: simulateWebSocketEndpoint,
  immediate: true,
  filter: (entry) => ['error', 'critical'].includes(entry.level)
});

// Simulate sending logs to remote endpoints
console.log('🚀 Sending logs to remote endpoints...');

// Get logs for remote transmission
const logsForRemote = logger.getLogs({
  limit: 3,
  level: ['error', 'warn', 'critical']
});

console.log(`📨 Preparing to send ${logsForRemote.length} priority logs`);

// Simulate batch sending
for (let i = 0; i < logsForRemote.length; i += 2) {
  const batch = logsForRemote.slice(i, i + 2);
  
  console.log(`\n📦 Batch ${Math.floor(i/2) + 1}:`);
  await simulateHttpEndpoint(batch);
  
  // Simulate delay between batches
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Simulate real-time critical alerts
console.log('\n🚨 Simulating critical alert...');
logger.critical('System failure detected', {
  service: 'payment-processor',
  error: 'CONNECTION_LOST',
  impact: 'high',
  requiresImmediate: true
});

// Advanced analytics demonstration
console.log('\n📈 Advanced Analytics:');

const analytics = logger.getAnalytics({
  timeframe: '1h',
  groupBy: 'level',
  includeMetrics: true
});

console.log('🔍 Analytics Summary:');
console.log(`- Total logs analyzed: ${analytics.summary.totalLogs}`);
console.log(`- Error rate: ${(analytics.summary.errorRate * 100).toFixed(2)}%`);
console.log(`- Average per hour: ${analytics.summary.averagePerHour}`);

console.log('\n📊 Level Distribution:');
Object.entries(analytics.distribution).forEach(([level, count]) => {
  const percentage = ((count / analytics.summary.totalLogs) * 100).toFixed(1);
  console.log(`- ${level.toUpperCase()}: ${count} (${percentage}%)`);
});

// Log search and filtering
console.log('\n🔍 Log Search and Filtering:');

// Search by content
const paymentLogs = logger.getLogs({
  content: 'payment',
  limit: 10
});
console.log(`Found ${paymentLogs.length} logs containing 'payment'`);

// Filter by level and prefix
const errorLogs = logger.getLogs({
  level: ['error', 'critical'],
  prefix: 'EXPORT'
});
console.log(`Found ${errorLogs.length} error/critical logs with EXPORT prefix`);

// Memory management
console.log('\n🧹 Buffer Management:');
console.log(`Current buffer size: ${logger.getBufferStats().totalEntries} entries`);

// Clear old logs (simulate retention policy)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const clearedCount = logger.clearLogs({
  before: oneHourAgo,
  level: 'debug'  // Clear only debug logs older than 1 hour
});
console.log(`Cleared ${clearedCount} old debug logs`);

// Final buffer stats
const finalStats = logger.getBufferStats();
console.log(`Buffer after cleanup: ${finalStats.totalEntries} entries`);

console.log('\n✅ Data export and remote logging examples completed!');
console.log('📁 Check the exports/ directory for generated files');
console.log('🔍 Examine the exported files to see different format outputs');