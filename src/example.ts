/**
 * @fileoverview Comprehensive examples and demonstrations of Better Logger
 */

import logger, {
    Logger,
    debug,
    info,
    warn,
    error,
    success,
    critical,
    createScopedLogger,
    setGlobalPrefix,
    setVerbosity,
    setTheme,
    setBannerType,
    showBanner,
    logWithSVG,
    logAnimated,
    cli,
    createStyle,
    stylePresets,
    FileLogHandler,
    AnalyticsLogHandler
} from './index.js';

// Visual features demonstrations
export function demonstrateBanners() {
    info('🎨 Banner System Demo');
    
    showBanner('simple');
    setTimeout(() => showBanner('ascii'), 1000);
    setTimeout(() => showBanner('unicode'), 2000);
    setTimeout(() => showBanner('svg'), 3000);
    setTimeout(() => showBanner('animated'), 4000);
}

export function demonstrateThemes() {
    info('🌈 Theme System Demo');
    
    const themes = ['default', 'dark', 'neon', 'cyberpunk', 'retro'];
    themes.forEach((theme, index) => {
        setTimeout(() => {
            setTheme(theme as any);
            info(`Theme switched to: ${theme}`);
        }, index * 1500);
    });
}

export function demonstrateSVG() {
    const logoSVG = `<svg width="100" height="50" viewBox="0 0 100 50">
        <rect width="100" height="50" fill="#667eea"/>
        <text x="50" y="30" font-family="Arial" font-size="12" fill="white" text-anchor="middle">LOGO</text>
    </svg>`;
    
    logWithSVG('🖼️ Custom SVG Background', logoSVG, {
        width: 300,
        height: 60,
        padding: '20px 100px'
    });
}

export function demonstrateAnimations() {
    logAnimated('✨ Loading animation...', 3);
    setTimeout(() => logAnimated('🚀 Animation complete!', 2), 3500);
}

export function demonstrateCLI() {
    info('💻 CLI Commands Demo');
    
    const commands = [
        '/config theme:neon',
        '/banner ascii',
        '/verbose debug',
        '/prefix DEMO'
    ];
    
    commands.forEach((cmd, index) => {
        setTimeout(() => {
            info(`Executing: ${cmd}`);
            cli(cmd);
        }, index * 1500);
    });
}

export function demonstrateExports() {
    info('📤 Export functionality would be demonstrated here');
    info('Note: Export features require ExportLogger from /exports module');
    
    const sampleData = [
        { timestamp: new Date().toISOString(), level: 'info', message: 'Sample log 1' },
        { timestamp: new Date().toISOString(), level: 'error', message: 'Sample log 2' },
        { timestamp: new Date().toISOString(), level: 'warn', message: 'Sample log 3' }
    ];
    
    logger.table(sampleData, ['timestamp', 'level', 'message']);
}

// Core features demonstrations
export function demonstrateBasicLogging() {
    setGlobalPrefix('DEMO');
    setVerbosity('debug');

    debug('🐞 Debug information', { config: { mode: 'development' } });
    info('ℹ️ Application started successfully');
    warn('⚠️ This is a warning message');
    error('❌ An error occurred', new Error('Sample error'));
    success('✅ User authentication successful');
    critical('🔥 Critical system failure detected');
}

export function demonstrateTable() {
    const userData = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' }
    ];
    
    logger.table(userData);
    logger.table(userData, ['name', 'email']);
}

export function demonstrateGrouping() {
    logger.group('🔍 User Analysis');
    info('Analyzing user data...');
    
    logger.group('📊 Statistics', false);
    info('Total users: 150');
    info('Active users: 120');
    info('New this month: 25');
    logger.groupEnd();
    
    logger.group('🎯 Top Users');
    success('Premium user: Alice Johnson');
    success('Most active: Bob Smith'); 
    logger.groupEnd();
    
    logger.groupEnd();
}

export function demonstrateTiming() {
    logger.time('api-request');
    
    info('🌐 Making API request...');
    
    setTimeout(() => {
        logger.timeEnd('api-request');
        success('✅ API request completed');
    }, Math.random() * 2000 + 500);
}

export function demonstrateScopedLogger() {
    const apiLogger = createScopedLogger('API');
    const dbLogger = createScopedLogger('DB');
    const authLogger = createScopedLogger('AUTH');
    
    apiLogger.info('🌐 Fetching user data', { endpoint: '/api/users' });
    dbLogger.debug('💾 Database query executed', { query: 'SELECT * FROM users LIMIT 10' });
    authLogger.success('🔐 User authentication successful', { userId: 12345 });
    
    apiLogger.warn('⚠️ Rate limit approaching', { remaining: 10 });
    dbLogger.error('❌ Connection timeout', { timeout: '5s' });
}

export function demonstrateTrace() {
    function deepFunction() {
        function deeperFunction() {
            logger.trace('🔍 Deep trace call with full stack');
        }
        deeperFunction();
    }
    deepFunction();
}

export function demonstrateCustomStyles() {
    const customStyle = createStyle()
        .bg('linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)')
        .color('white')
        .padding('12px 20px')
        .rounded('10px')
        .shadow('0 4px 15px rgba(0,0,0,0.3)')
        .bold()
        .build();
    
    console.log('%c🎨 Custom Styled Message', customStyle);
    console.log('%c✅ Success Style', stylePresets.success);
    console.log('%c❌ Error Style', stylePresets.error);
    console.log('%c⚠️ Warning Style', stylePresets.warning);
}

// Comprehensive demonstration
export function demonstrateAllFeatures() {
    info('🌟 Starting comprehensive Better Logger demonstration...');
    
    setTimeout(() => demonstrateBanners(), 500);
    setTimeout(() => demonstrateBasicLogging(), 6000);
    setTimeout(() => demonstrateCustomStyles(), 8000);
    setTimeout(() => demonstrateGrouping(), 10000);
    setTimeout(() => demonstrateTiming(), 13000);
    setTimeout(() => demonstrateScopedLogger(), 16000);
    setTimeout(() => demonstrateThemes(), 18000);
    
    setTimeout(() => {
        success('🎉 Demonstration complete! Check your console for all the styled outputs.');
    }, 25000);
}

// Auto-run basic demo on import
demonstrateBasicLogging();