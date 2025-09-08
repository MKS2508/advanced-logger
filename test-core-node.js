#!/usr/bin/env node

/**
 * Test script for core logger in Node.js environment
 */
console.log('=== Testing Core Logger in Node.js ===\n');

// Test ES module import
import logger from './packages/core/dist/index.js';

console.log('Environment detection:');
console.log('- Runtime:', process.versions.node ? 'Node.js' : 'Unknown');
console.log('- Colors supported:', process.stdout.isTTY);
console.log('- File system available:', 'Yes (Node.js)');
console.log();

console.log('Testing basic logging:');
logger.info('Hello from Node.js!');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.critical('This should work in Node.js (critical level)');
console.log();

console.log('Testing scoped logger:');
const apiLogger = logger.scope('API');
apiLogger.info('API request started');
apiLogger.error('API request failed');
console.log();

console.log('Testing timers:');
logger.time('test-operation');
setTimeout(() => {
    logger.timeEnd('test-operation');
    console.log();
    
    console.log('Testing table (Node.js plain text):');
    const data = [
        { name: 'Alice', age: 25, role: 'Developer' },
        { name: 'Bob', age: 30, role: 'Designer' },
        { name: 'Carol', age: 28, role: 'Manager' }
    ];
    logger.table(data);
    console.log();
    
    console.log('Testing groups:');
    logger.group('Database Operations');
    logger.info('Connecting to database');
    logger.info('Executing query');
    logger.groupEnd();
    console.log();
    
    console.log('Testing custom handler (mock):');
    const mockHandler = {
        handle: (level, message, args, metadata) => {
            console.log(`Custom handler received: [${level.toUpperCase()}] ${message}`);
        }
    };
    logger.addHandler(mockHandler);
    logger.info('This should trigger custom handler');
    console.log();
    
    console.log('✅ Node.js tests completed successfully!');
}, 100);