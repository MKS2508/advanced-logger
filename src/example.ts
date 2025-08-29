/**
 * @fileoverview Example usage of the advanced Logger system
 */

import Logger, {
    debug,
    info,
    warn,
    error,
    success,
    createScopedLogger,
    setGlobalPrefix,
    setVerbosity,
    Styles,
    FileLogHandler,
    AnalyticsLogHandler
} from './Logger';

// Example usage demonstration
function demonstrateLogger() {
    // Set up global configuration
    setGlobalPrefix('APP');
    setVerbosity('debug');

    // Add custom handlers
    Logger.addHandler(new FileLogHandler('app.log'));
    Logger.addHandler(new AnalyticsLogHandler());

    // Create scoped loggers
    const apiLogger = createScopedLogger('API');
    const dbLogger = createScopedLogger('DATABASE');

    // Basic logging
    info('🚀 Application started successfully');
    debug('Debug information', { config: { mode: 'development' } });
    warn('⚠️ This is a warning message');
    error('❌ An error occurred', new Error('Sample error'));
    success('✅ User authentication successful');

    // Scoped logging
    apiLogger.info('Fetching user data', { endpoint: '/api/users' });
    dbLogger.debug('Database query executed', { query: 'SELECT * FROM users' });

    // Advanced features
    Logger.group('User Session Details');
    apiLogger.table([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
    Logger.groupEnd();

    // Performance timing
    Logger.time('data-processing');
    // Simulate some processing
    setTimeout(() => {
        Logger.timeEnd('data-processing');
    }, 100);

    // Critical error with stack trace
    Logger.critical('🔥 Critical system failure detected');

    // Custom styled logging
    console.log(
        '%cCustom Styled Message',
        Styles.create()
            .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
            .color('#ffffff')
            .padding('10px 15px')
            .rounded('8px')
            .shadow('0 4px 8px rgba(0,0,0,0.2)')
            .bold()
            .build()
    );

    // Grouped logging with data
    const users = [
        { name: 'Alice', role: 'admin' },
        { name: 'Bob', role: 'user' },
        { name: 'Charlie', role: 'admin' }
    ];

    Logger.logGrouped(users, (user) => user.role);
}

// Run the demonstration
demonstrateLogger();

export { demonstrateLogger };