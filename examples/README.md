# 📚 Better Logger Examples

This directory contains practical examples demonstrating various features of Better Logger.

## 🚀 Quick Start

```bash
# Install dependencies
cd examples
npm install

# Run all examples
npm run all

# Or run individual examples
npm run basic        # Basic logging features
npm run performance  # Performance timing
npm run styling      # Themes and visual styling  
npm run export       # Data export and remote logging
```

## 📋 Available Examples

### 1. 🔤 Basic Logging (`basic-logging.js`)

Learn the fundamentals of logging with Better Logger:

- **Log Levels**: debug, info, warn, error, critical, success
- **Data Types**: Strings, numbers, booleans, arrays, objects, errors
- **Message Formatting**: Multiple arguments and structured data
- **Practical Usage**: Real-world logging scenarios

**Key Features Demonstrated:**
```javascript
logger.info('User login', { userId: 123, method: 'oauth' });
logger.error('Connection failed', error);
logger.success('Operation completed', { duration: '2.5s' });
```

**Run:** `npm run basic`

---

### 2. ⏱️ Performance Timing (`performance-timing.js`)

Master performance monitoring and timing operations:

- **Basic Timing**: `time()` and `timeEnd()` operations
- **Intermediate Timing**: `timeLog()` for step-by-step tracking
- **Concurrent Operations**: Multiple timers running simultaneously
- **Nested Timing**: Parent and child operation tracking
- **Performance Comparison**: Benchmarking different approaches

**Key Features Demonstrated:**
```javascript
logger.time('database-query');
const result = await executeQuery();
logger.timeLog('database-query', 'Query executed');
logger.timeEnd('database-query');
```

**Run:** `npm run performance`

---

### 3. 🎨 Styling & Themes (`styling-themes.js`)

Explore visual customization and theming capabilities:

- **Theme System**: 5 built-in themes (default, dark, neon, cyberpunk, retro)
- **Banner Types**: ASCII, Unicode, SVG, and animated banners
- **Custom Styles**: StyleBuilder API for creating unique appearances
- **Style Presets**: Ready-to-use styles for common scenarios
- **SVG Integration**: Custom graphics in console output (browser)

**Key Features Demonstrated:**
```javascript
setTheme('cyberpunk');
const customStyle = createStyle()
  .bg('linear-gradient(45deg, #ff6b6b, #feca57)')
  .color('white')
  .padding('12px 24px')
  .rounded('8px')
  .build();
```

**Run:** `npm run styling`

**Note:** Best viewed in browser console for full visual effects.

---

### 4. 📤 Data Export & Remote (`data-export.js`)

Learn data management, export, and remote logging:

- **Log Buffering**: Circular buffer management with configurable size
- **Export Formats**: CSV, JSON, XML with filtering options
- **Remote Logging**: HTTP and WebSocket endpoint simulation
- **Analytics**: Log statistics and performance metrics
- **Filtering**: Advanced search and filtering capabilities

**Key Features Demonstrated:**
```javascript
const csvData = await logger.exportLogs('csv', {
  filter: { level: 'error', from: yesterday },
  limit: 100
});

logger.addRemoteHandler('https://api.logs.com', {
  apiKey: 'secret-key',
  batchSize: 10
});
```

**Run:** `npm run export`

**Output:** Creates `exports/` directory with sample export files.

---

## 🎯 Learning Path

### Beginner (Start Here)
1. **Basic Logging** - Learn core logging methods
2. **Performance Timing** - Add timing to your applications

### Intermediate  
3. **Styling & Themes** - Customize visual appearance
4. **Data Export** - Implement log management

### Advanced
- Combine examples to create comprehensive logging solutions
- Explore the full [API Reference](../docs/API.md)
- Check out the [Interactive Demo](https://mks2508.github.io/advanced-logger/)

## 💡 Tips for Running Examples

### Node.js Environment
All examples work in Node.js, but some visual features are optimized for browsers:

```bash
# Works everywhere
npm run basic
npm run performance
npm run export

# Limited visual effects in Node.js
npm run styling
```

### Browser Environment
For full visual experience with styling and animations:

1. Import Better Logger in your browser console:
   ```javascript
   // Using CDN
   import('https://unpkg.com/@mks2508/better-logger@latest')
   ```

2. Copy and paste example code from `styling-themes.js`

### File Outputs
The `data-export.js` example creates files in the `exports/` directory:

```
exports/
├── logs-all.csv        # All logs in CSV format
├── logs-errors.json    # Error logs in JSON format  
├── logs-recent.xml     # Recent logs in XML format
└── logs-24h.json       # Last 24 hours in JSON format
```

## 🔗 Related Resources

- 📚 [API Reference](../docs/API.md) - Complete method documentation
- 🎮 [Interactive Demo](https://mks2508.github.io/advanced-logger/) - Try features live
- 📦 [NPM Package](https://www.npmjs.com/package/@mks2508/better-logger) - Installation guide
- 🐛 [Issues & Support](https://github.com/MKS2508/advanced-logger/issues) - Get help

## 🤝 Contributing Examples

Have a useful logging pattern or use case? We'd love to see your examples!

1. Create a new `.js` file following the existing pattern
2. Add a script to `package.json`
3. Update this README with documentation
4. Submit a pull request

**Example Template:**
```javascript
/**
 * [Feature Name] Example
 * 
 * Demonstrates [specific capabilities] including:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * Run: node examples/your-example.js
 */

// Your example code here
```

---

Happy logging! 🎉