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
  createScopedLogger,
  cli,
  setTheme,
} from './Logger.ts';

// The init banner from Logger.ts is displayed automatically on import.
console.log("Advanced Logger script loaded. Test functions are now available.");

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
  const apiLogger = createScopedLogger("API");
  apiLogger.info("Fetching user data...");
  const uiLogger = createScopedLogger("UI");
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

function testAllFeatures() {
  group("🌟 Demonstrating All Logger Features");
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
}

// Expose functions to global scope for onclick attributes in index.html
if (typeof window !== 'undefined') {
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
  
  // Expose CLI functions globally
  (window as any).cli = cli;
  (window as any).setTheme = setTheme;
  
  // Display CLI usage info
  console.log('%c🚀 Logger CLI Available! Try: cli("/help")', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;');
}
