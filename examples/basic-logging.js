/**
 * Basic Logging Example
 * 
 * Demonstrates fundamental logging capabilities including:
 * - Different log levels (debug, info, warn, error, critical)
 * - Message formatting with additional arguments
 * - Success logging for positive outcomes
 * 
 * Run: node examples/basic-logging.js
 */

import { Logger } from '@mks2508/better-logger';

console.log('🚀 Better Logger - Basic Logging Example\n');

// Create a new logger instance
const logger = new Logger({
  prefix: 'BASIC',
  level: 'debug'  // Show all log levels
});

// Basic logging methods demonstration
console.log('📝 Testing different log levels:');

logger.debug('This is a debug message with data:', { debugInfo: true, value: 42 });

logger.info('Application started successfully', { 
  version: '1.0.0', 
  environment: 'development' 
});

logger.warn('Memory usage is high', { 
  usage: '85%', 
  threshold: '80%',
  recommendation: 'Consider optimizing memory usage'
});

logger.error('Failed to connect to database', {
  host: 'localhost',
  port: 5432,
  error: 'ECONNREFUSED',
  retryAttempt: 3
});

logger.critical('System is out of disk space', {
  available: '100MB',
  required: '2GB',
  action: 'immediate_attention_required'
});

logger.success('User authentication completed', {
  userId: 'user_123',
  method: 'oauth2',
  timestamp: new Date().toISOString()
});

// Demonstrate logging with different data types
console.log('\n📊 Testing different data types:');

logger.info('String message');
logger.info('Number value:', 42);
logger.info('Boolean value:', true);
logger.info('Array data:', [1, 2, 3, 'hello']);
logger.info('Object data:', { name: 'John', age: 30, active: true });
logger.info('Multiple arguments:', 'user', 'action', { result: 'success' }, 123);

// Error object logging
console.log('\n❌ Testing error object logging:');
try {
  throw new Error('Something went wrong!');
} catch (error) {
  logger.error('Caught an error:', error);
}

console.log('\n✅ Basic logging examples completed!');