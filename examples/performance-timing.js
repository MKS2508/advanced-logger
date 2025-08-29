/**
 * Performance Timing Example
 * 
 * Demonstrates performance monitoring capabilities including:
 * - Basic timing operations with time() and timeEnd()
 * - Intermediate timing with timeLog()
 * - Nested timing operations
 * - Performance comparison between operations
 * 
 * Run: node examples/performance-timing.js
 */

import { Logger } from '@mks2508/better-logger';

console.log('⏱️ Better Logger - Performance Timing Example\n');

// Create logger with performance tracking enabled
const logger = new Logger({
  prefix: 'PERF',
  enablePerformance: true
});

// Simulate async operations
const simulateWork = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const simulateHeavyWork = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // CPU intensive work
    Math.random();
  }
};

// Basic timing example
console.log('🔄 Basic timing operations:');

logger.time('basic-operation');
await simulateWork(100);
logger.timeEnd('basic-operation');

// Multiple timers running simultaneously
console.log('\n⚡ Concurrent operations:');

logger.time('operation-1');
logger.time('operation-2');
logger.time('operation-3');

await simulateWork(80);
logger.timeEnd('operation-1');

await simulateWork(50);
logger.timeEnd('operation-2');

await simulateWork(120);
logger.timeEnd('operation-3');

// Intermediate timing with timeLog
console.log('\n📊 Step-by-step timing:');

logger.time('multi-step-process');

logger.info('Starting data processing...');
await simulateWork(50);
logger.timeLog('multi-step-process', 'Step 1: Data validation complete');

logger.info('Processing records...');
await simulateWork(80);
logger.timeLog('multi-step-process', 'Step 2: Record processing complete');

logger.info('Generating reports...');
await simulateWork(60);
logger.timeLog('multi-step-process', 'Step 3: Report generation complete');

logger.info('Sending notifications...');
await simulateWork(30);
logger.timeEnd('multi-step-process');

// Nested timing operations
console.log('\n🔗 Nested timing operations:');

logger.time('parent-operation');

logger.info('Starting parent operation');

  logger.time('child-operation-1');
  await simulateWork(40);
  logger.timeEnd('child-operation-1');

  logger.time('child-operation-2');
  await simulateWork(60);
  logger.timeEnd('child-operation-2');

  logger.time('child-operation-3');
  await simulateWork(35);
  logger.timeEnd('child-operation-3');

logger.timeEnd('parent-operation');

// Performance comparison
console.log('\n🏃 Performance comparison:');

// Method A: Array.push in loop
logger.time('method-a-push');
const arrayA = [];
for (let i = 0; i < 10000; i++) {
  arrayA.push(i);
}
logger.timeEnd('method-a-push');

// Method B: Array.from
logger.time('method-b-from');
const arrayB = Array.from({ length: 10000 }, (_, i) => i);
logger.timeEnd('method-b-from');

// Method C: Spread operator
logger.time('method-c-spread');
const arrayC = [...Array(10000).keys()];
logger.timeEnd('method-c-spread');

// CPU vs I/O comparison
console.log('\n🖥️ CPU vs I/O operations:');

logger.time('cpu-intensive');
simulateHeavyWork(50);  // Synchronous CPU work
logger.timeEnd('cpu-intensive');

logger.time('io-simulation');
await simulateWork(50);  // Asynchronous I/O simulation
logger.timeEnd('io-simulation');

// Real-world scenario: Database simulation
console.log('\n🗄️ Database operation simulation:');

const simulateDatabaseQuery = async (query, delay) => {
  const timerId = `db-query-${Math.random().toString(36).substr(2, 9)}`;
  
  logger.time(timerId);
  logger.info(`Executing query: ${query}`);
  
  // Simulate network delay
  await simulateWork(delay);
  
  logger.timeEnd(timerId);
  
  return { query, rows: Math.floor(Math.random() * 1000) };
};

// Simulate multiple database operations
const queries = [
  { query: 'SELECT * FROM users WHERE active = true', delay: 45 },
  { query: 'SELECT COUNT(*) FROM orders WHERE date > NOW() - INTERVAL 30 DAY', delay: 120 },
  { query: 'UPDATE users SET last_login = NOW() WHERE id = ?', delay: 25 },
  { query: 'INSERT INTO audit_log (action, user_id, timestamp) VALUES (?, ?, ?)', delay: 15 }
];

logger.time('batch-database-operations');

for (const { query, delay } of queries) {
  const result = await simulateDatabaseQuery(query, delay);
  logger.info(`Query result: ${result.rows} rows affected`);
}

logger.timeEnd('batch-database-operations');

console.log('\n✅ Performance timing examples completed!');

// Final timing statistics
console.log('\n📈 Timing Statistics Summary:');
logger.info('All timing operations have been logged above');
logger.info('Each timer shows the exact duration in milliseconds');
logger.info('Use these techniques to identify performance bottlenecks in your applications');