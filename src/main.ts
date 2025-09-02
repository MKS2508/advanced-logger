import {
  debug,
  info,
  warn,
  error,
  success,
  critical,
  table,
  group,
  groupEnd,
  time,
  timeEnd,
  trace,
  scope,
  cli,
  setTheme,
  setBannerType,
  showBanner,
  logWithSVG,
  logAnimated,
  createStyle,
  stylePresets
} from './index.js';

import {
  demonstrateBanners,
  demonstrateThemes,
  demonstrateSVG,
  demonstrateAnimations,
  demonstrateCLI,
  demonstrateExports,
  demonstrateAllFeatures as demoAllFeatures
} from './example.js';

console.log('%cBetter Logger Demo Ready! 🚀', 
  'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;');
  
console.log('📋 Available test functions: testDebug(), testBanners(), testThemes(), and more!');
console.log('💻 CLI Available: cli("/help") for commands');

function testDebug() {
  debug("This is a debug message.", { user: "test", id: 123 });
}

function testInfo() {
  info("This is an info message with an object.", { data: "payload" });
}

function testWarn() {
  warn("This is a warning message about a deprecated API.");
}

function testError() {
  error("This is an error message.", new Error("Failed to fetch resource."));
}

function testSuccess() {
  success("Operation completed successfully.");
}

function testCritical() {
  critical("This is a CRITICAL message. System integrity compromised!");
}

function testTable() {
  table([
    { feature: "Debug Log", status: "Implemented", priority: "Low" },
    { feature: "Info Log", status: "Implemented", priority: "Medium" },
    { feature: "Warning Log", status: "Implemented", priority: "High" },
  ]);
}

function testGrouping() {
  group("User Authentication Flow", true); // Start collapsed
  info("User 'testuser' attempting to log in...");
  warn("Password nearing expiration.");
  success("Login successful.");
  groupEnd();
}

function testTiming() {
  time("dataProcessing");
  setTimeout(() => {
    timeEnd("dataProcessing");
  }, 750); // Simulate a 750ms operation
}

function testScopedLogger() {
  info("Demonstrating scoped loggers...");
  const apiLogger = scope("API");
  apiLogger.info("Fetching user data...");
  const uiLogger = scope("UI");
  uiLogger.debug("Rendering user profile component.");
  apiLogger.success("User data fetched successfully.");
  apiLogger.error("Failed to update settings.");
}

function testTrace() {
  function innerFunction() {
    function deepFunction() {
        trace("Trace from a deeply nested function.");
    }
    deepFunction();
  }
  innerFunction();
}

// Visual feature tests
function testBanners() {
  demonstrateBanners();
}

function testThemes() {
  demonstrateThemes();
}

function testSVG() {
  demonstrateSVG();
}

function testAnimations() {
  demonstrateAnimations();
}

function testCLI() {
  demonstrateCLI();
}

function testExports() {
  demonstrateExports();
}

function testAllFeatures() {
  group("🌟 Demonstrating Core Logger Features");
  testDebug();
  testInfo();
  testWarn();
  testError();
  testSuccess();
  testCritical();
  testTable();
  testGrouping();
  testTiming();
  testScopedLogger();
  testTrace();
  groupEnd();
  
  setTimeout(() => {
    info('🎨 Running visual features demo...');
    demoAllFeatures();
  }, 2000);
}

// Expose functions to global scope for onclick attributes in index.html
if (typeof window !== 'undefined') {
  // Core logging tests
  (window as any).testDebug = testDebug;
  (window as any).testInfo = testInfo;
  (window as any).testWarn = testWarn;
  (window as any).testError = testError;
  (window as any).testSuccess = testSuccess;
  (window as any).testCritical = testCritical;
  (window as any).testTable = testTable;
  (window as any).testGrouping = testGrouping;
  (window as any).testTiming = testTiming;
  (window as any).testScopedLogger = testScopedLogger;
  (window as any).testTrace = testTrace;
  (window as any).testAllFeatures = testAllFeatures;
  
  // Visual feature tests  
  (window as any).testBanners = testBanners;
  (window as any).testThemes = testThemes;
  (window as any).testSVG = testSVG;
  (window as any).testAnimations = testAnimations;
  (window as any).testCLI = testCLI;
  (window as any).testExports = testExports;
  
  // Direct access to library functions
  (window as any).cli = cli;
  (window as any).setTheme = setTheme;
  (window as any).setBannerType = setBannerType;
  (window as any).showBanner = showBanner;
  (window as any).logWithSVG = logWithSVG;
  (window as any).logAnimated = logAnimated;
  (window as any).createStyle = createStyle;
  (window as any).stylePresets = stylePresets;
  
  // Display welcome info
  setTimeout(() => {
    console.log('%c💡 Quick Start Guide', stylePresets.info);
    console.log('🎨 Visual: testBanners(), testThemes(), testSVG(), testAnimations()');
    console.log('📊 Core: testTable(), testGrouping(), testTiming(), testTrace()');
    console.log('💻 CLI: cli("/help") - Try commands like "/theme neon", "/banner ascii"');
    console.log('🌟 Full Demo: testAllFeatures()');
  }, 1000);
}
