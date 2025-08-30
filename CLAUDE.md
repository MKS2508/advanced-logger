# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Advanced Logger** TypeScript library that provides state-of-the-art console logging with advanced CSS styling, performance monitoring, and extensible architecture. The project is built with modern TypeScript patterns and targets browser environments.

### Core Architecture

- **Main Logger Class**: `src/Logger.ts` contains the primary Logger class with advanced styling capabilities
- **Style System**: Built around a fluent `StyleBuilder` class that creates CSS-in-JS console styles
- **Handler Architecture**: Extensible system with `ILogHandler` interface for custom log destinations (File, Remote, Analytics)
- **Scoped Logging**: Support for prefixed logger instances for different modules/components
- **Performance Monitoring**: Built-in timing capabilities with `time()` and `timeEnd()`

### Key Components

- **Logger Core** (`src/Logger.ts:373-732`): Main logger implementation with hierarchical log levels
- **Style Builder** (`src/Logger.ts:141-226`): Chainable CSS styling system
- **Log Handlers** (`src/Logger.ts:737-971`): FileLogHandler, RemoteLogHandler, AnalyticsLogHandler
- **Demo/Test Interface** (`index.html`): Interactive test page with styled buttons
- **Usage Examples** (`src/example.ts`, `src/main.ts`): Comprehensive usage demonstrations

## Development Commands

### Build & Development
```bash
npm run dev          # Start Vite dev server (runs on http://localhost:5173)
npm run build        # TypeScript compilation + Vite production build
npm run preview      # Preview production build
```

### Testing the Logger
- Open `index.html` in development server
- Use browser DevTools console to see styled output
- Click buttons to test different log levels and features

### Testing & Validation
```bash
# Validar workflows YAML y estructura
./tests/validate-workflows.sh

# Test completo de resolución de conflictos  
bun tests/test-conflict-resolution.ts
```

## Architecture Patterns

### Log Level Hierarchy
```typescript
LOG_LEVELS = {
    debug: 0,    // Lowest priority
    info: 1,
    warn: 2, 
    error: 3,
    critical: 4  // Highest priority
}
```

### Styling System
The project uses a sophisticated CSS-in-JS approach:
- **StyleBuilder**: Chainable pattern for building console CSS styles
- **LEVEL_STYLES**: Pre-configured gradients, colors, and shadows for each log level
- **Dynamic Styling**: Uses `%c` console formatting with built CSS strings

### Handler Pattern
Extensible logging through the `ILogHandler` interface:
- Handlers receive log metadata including timestamps, stack traces, and prefixes
- Multiple handlers can be registered simultaneously
- Built-in handlers for file logging, remote logging, and analytics

### Performance Features
- **Stack Trace Parsing**: Automatic caller location detection
- **Performance Timers**: Built-in timing with `performance.now()`
- **Grouping**: Console grouping with automatic indentation
- **Table Display**: Formatted data tables in console

## Code Conventions

### TypeScript Patterns
- Uses modern ES2022+ features with strict typing
- Leverages `as const` for readonly object typing
- Interface-based extensibility patterns
- Generic types for flexible APIs (`logGrouped<T>`)

### Styling Conventions
- All styles use CSS gradients and modern properties
- Consistent color palette across log levels
- Responsive design patterns in HTML interface
- CSS Grid for layout with modern browser features

### Error Handling
- Graceful degradation when browser features unavailable
- Try-catch blocks around experimental features
- Silent failure for log handlers to prevent infinite loops

## Browser Compatibility

### Modern Features Used
- **CSS Gradients**: Extensive use of `linear-gradient()`
- **Performance API**: `performance.now()` for timing
- **Modern Console**: `%c` formatting, `console.table()`, `console.group()`
- **ES2022 Features**: Object.groupBy (with fallback)
- **Fetch API**: Used in RemoteLogHandler

### Fallback Patterns
- Stack trace parsing handles different browser formats (Chrome/Firefox)
- Object.groupBy fallback to reduce()
- Modern Date API with ISO formatting fallback

## Key Files Structure

```
src/
  ├── Logger.ts      # Main logger implementation (972 lines)
  ├── example.ts     # Comprehensive usage examples  
  ├── main.ts        # Test functions for HTML interface
  └── style.css      # Basic Vite styling (not logger-related)
```

The logger is designed as a single-file library with comprehensive TypeScript documentation and can be imported as individual functions or as a class instance.