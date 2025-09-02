/**
 * @fileoverview Examples of the new Simplified API for Advanced Logger
 */

import logger, { 
    preset, 
    hideTimestamp, 
    showLocation, 
    component, 
    api, 
    scope,
    customize,
    styles 
} from '../dist/index.js';

console.log('=== Advanced Logger - Simplified API Examples ===\n');

// ===== BASIC USAGE - OUT-OF-THE-BOX =====
console.log('1. Basic usage (no configuration needed):');
logger.info('Application started');
logger.success('Database connected');
logger.warn('High memory usage detected');
logger.error('Failed to load configuration');

console.log('\n2. Available presets:');
console.log('Available presets:', logger.presets());

// ===== PRESET EXAMPLES =====
console.log('\n3. Using presets:');

console.log('\n   → Cyberpunk preset:');
preset('cyberpunk');
logger.info('System online');
logger.critical('Security breach detected!');

console.log('\n   → Minimal preset:');  
preset('minimal');
logger.info('Clean and simple logging');
logger.success('Task completed successfully');

console.log('\n   → Debug preset:');
preset('debug');
logger.debug('Detailed debugging info');
logger.info('Processing data...');

// Reset to default
preset('default');

// ===== TOGGLE EXAMPLES =====
console.log('\n4. Toggle features:');

console.log('\n   → Hide timestamp:');
hideTimestamp();
logger.info('No timestamp shown');

console.log('\n   → Show location (with timestamp hidden):');
showLocation();
logger.info('Location info visible');

// Reset for next examples
logger.showTimestamp();

// ===== SCOPED LOGGERS =====
console.log('\n5. Scoped loggers:');

console.log('\n   → Component logger:');
const auth = component('UserAuth');
auth.info('Login attempt');
auth.success('User authenticated');
auth.lifecycle('mount', 'Component mounted');
auth.stateChange('idle', 'loading');

console.log('\n   → API logger with badges:');
const graphql = api('GraphQL').badges(['SLOW', 'CACHE']);
graphql.info('Query executed');
graphql.slow('Complex query', 2500);
graphql.auth('Invalid token');

console.log('\n   → Custom scoped logger:');
const payment = scope('Payment').badges(['CRITICAL', 'AUDIT']);
payment.info('Processing payment');
payment.success('Payment completed');

// ===== CONTEXT EXAMPLES =====
console.log('\n6. Context logging:');
const dbLogger = component('Database');

dbLogger.context('Migration').run(() => {
    dbLogger.info('Starting migration');
    dbLogger.success('Tables created');
    dbLogger.info('Migration completed');
});
// Context automatically removed after run()

// ===== SIMPLE CUSTOMIZATION =====
console.log('\n7. Simple customization:');
customize({
    message: { color: '#007bff', size: '15px' },
    timestamp: { show: true },
    location: { show: false }
});

logger.info('Customized message styling');
logger.success('Custom color and size applied');

// ===== ADVANCED STYLING (For power users) =====
console.log('\n8. Advanced styling (power users):');

styles()
    .timestamp().muted().mono().compact()
    .level().neon().uppercase()
    .message().large().system()
    .spacing('compact')
    .apply();

logger.info('Advanced custom styling applied');
logger.warn('Neon level badges with large system font');

console.log('\n=== Examples completed! ===');

// Reset to clean state for any other examples
preset('default');
logger.showTimestamp();
logger.showLocation();