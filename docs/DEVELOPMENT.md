---
layout: default
title: Development Guide
permalink: /DEVELOPMENT/
---

# 🛠️ Development Guide

Complete guide for contributing to Better Logger, including development scripts, use cases, and best practices.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Available Scripts](#available-scripts)
- [Use Cases & Patterns](#use-cases--patterns)
- [Architecture Overview](#architecture-overview)
- [Testing Strategy](#testing-strategy)
- [Release Process](#release-process)

---

## 🚀 Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 8+ or **yarn** 1.22+
- **Git** 2.30+

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/MKS2508/advanced-logger.git
cd advanced-logger

# Install dependencies
npm install

# Build the project
npm run build

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Optional: Analytics/monitoring endpoints for testing
ANALYTICS_ENDPOINT=http://localhost:8080/analytics
LOG_ENDPOINT=http://localhost:8080/logs

# Development flags
DEBUG_MODE=true
ENABLE_SOURCE_MAPS=true
```

---

## 📜 Available Scripts

### 🏗️ Build Scripts

```bash
# Full production build
npm run build

# Watch mode for development
npm run build:watch

# Bundle analysis (size optimization)
npm run build:analyze
```

### 🧪 Development Scripts

```bash
# Start Vite development server
npm run dev

# Type checking (TypeScript)
npm run type-check

# Linting (future implementation)
npm run lint
npm run lint:fix
```

### 🧩 Testing Scripts

```bash
# Run all tests (placeholder for now)
npm run test

# Watch mode testing
npm run test:watch

# Coverage reports
npm run test:coverage

# Performance benchmarks
npm run test:performance

# Visual regression tests
npm run test:visual
```

### 📦 Release Scripts

```bash
# Version bumps
npm run release         # Patch version (0.0.1 → 0.0.2)
npm run release:minor   # Minor version (0.0.1 → 0.1.0)
npm run release:major   # Major version (0.0.1 → 1.0.0)

# Pre-release versions
npm run release:alpha   # Alpha release (0.0.1-alpha.0)
npm run release:beta    # Beta release (0.0.1-beta.0)
```

### 🧹 Maintenance Scripts

```bash
# Clean build artifacts
npm run clean

# Size analysis
npm run size-limit

# Serve demo locally
npm run demo:serve      # Python server on port 8080

# Preview production build
npm run preview
```

### 🤖 CI/CD Scripts

```bash
# CI-optimized scripts
npm run ci:install      # Install dependencies (CI)
npm run ci:build        # Build for CI/CD
npm run ci:test         # Run tests in CI
npm run ci:publish      # Publish to npm (CI)
```

---

## 🎯 Use Cases & Patterns

### 1. Frontend Application Logging

**Scenario**: React/Vue/Angular application with visual debugging needs

```typescript
import { Logger } from '@mks2508/better-logger';
import { setTheme } from '@mks2508/better-logger/styling';

// Setup for frontend development
const logger = new Logger({ 
  prefix: 'APP',
  enableStackTrace: true 
});

// Development theme
if (process.env.NODE_ENV === 'development') {
  setTheme('neon');
}

// Component lifecycle logging
logger.info('Component mounted', { component: 'UserDashboard' });
logger.time('data-fetch');

// API interaction
try {
  const data = await fetchUserData();
  logger.timeEnd('data-fetch');
  logger.success('User data loaded', { records: data.length });
} catch (error) {
  logger.error('Failed to load user data', error);
}
```

### 2. Node.js Backend Service

**Scenario**: Express.js API server with structured logging

```typescript
import { Logger } from '@mks2508/better-logger/core';
import { ExportLogger } from '@mks2508/better-logger/exports';

// Production-ready logger for Node.js
const logger = new ExportLogger({
  prefix: 'API',
  bufferSize: 5000,
  level: process.env.LOG_LEVEL || 'info'
});

// Setup file and remote logging
logger.addRemoteHandler(process.env.LOG_ENDPOINT, {
  apiKey: process.env.LOG_API_KEY,
  batchSize: 50,
  interval: 30000
});

// Request middleware
app.use((req, res, next) => {
  logger.time(`request-${req.id}`);
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Error handling
app.use((error, req, res, next) => {
  logger.error('Request failed', {
    error: error.message,
    stack: error.stack,
    requestId: req.id
  });
  res.status(500).json({ error: 'Internal server error' });
});
```

### 3. Library/SDK Development

**Scenario**: Creating a library with optional logging

```typescript
import { Logger } from '@mks2508/better-logger/core';

class MySDK {
  private logger: Logger;

  constructor(options = {}) {
    // Allow users to provide their own logger
    this.logger = options.logger || new Logger({ 
      prefix: 'SDK',
      level: options.debug ? 'debug' : 'warn'
    });
  }

  async performOperation() {
    this.logger.debug('Starting operation');
    
    try {
      this.logger.time('operation');
      const result = await this.internalWork();
      this.logger.timeEnd('operation');
      
      this.logger.info('Operation completed', { result });
      return result;
    } catch (error) {
      this.logger.error('Operation failed', error);
      throw error;
    }
  }
}
```

### 4. Development Tool Integration

**Scenario**: Build tools, CLI applications, development utilities

```typescript
import { Logger } from '@mks2508/better-logger';
import { setTheme, showBanner } from '@mks2508/better-logger/styling';

// CLI tool with visual feedback
const logger = new Logger({ prefix: 'TOOL' });

// Show branded startup
setTheme('cyberpunk');
showBanner('ascii');

// Build process logging
logger.info('Starting build process...');

logger.time('webpack-build');
await runWebpack();
logger.timeEnd('webpack-build');

// File operations with progress
const files = await glob('src/**/*.ts');
logger.info(`Processing ${files.length} files`);

for (const file of files) {
  logger.debug('Processing file', { file });
  await processFile(file);
}

logger.success('Build completed successfully!');
```

### 5. Testing & Debugging

**Scenario**: Test suites with detailed logging for debugging

```typescript
import { Logger } from '@mks2508/better-logger';
import { createStyle } from '@mks2508/better-logger/styling';

const testLogger = new Logger({ prefix: 'TEST' });

// Custom styles for test results
const passStyle = createStyle()
  .bg('#4CAF50')
  .color('white')
  .padding('4px 8px')
  .build();

const failStyle = createStyle()
  .bg('#F44336')
  .color('white')
  .padding('4px 8px')
  .build();

describe('User Authentication', () => {
  beforeEach(() => {
    testLogger.info('Setting up test environment');
  });

  it('should authenticate valid user', async () => {
    testLogger.time('auth-test');
    
    const result = await authenticateUser(validCredentials);
    
    if (result.success) {
      console.log('%c✅ PASS', passStyle);
      testLogger.success('Authentication test passed');
    } else {
      console.log('%c❌ FAIL', failStyle);
      testLogger.error('Authentication test failed', result);
    }
    
    testLogger.timeEnd('auth-test');
  });
});
```

---

## 🏗️ Architecture Overview

### Module Structure

```
src/
├── core.ts                 # Core logging functionality (6KB)
├── styling-module.ts       # Visual features & themes (26KB)  
├── exports-module.ts       # Data export & remote logging (12KB)
├── index.ts               # Full library entry point (64KB)
├── cli/                   # CLI interface modules
├── styling/               # Styling system components
├── handlers/              # Log handler implementations
├── utils/                 # Utility functions
└── types/                 # TypeScript definitions
```

### Build System

- **Vite** - Fast development and optimized production builds
- **TypeScript** - Type safety and modern JavaScript features
- **Rollup** - Library-optimized bundling
- **Terser** - Minification and compression

### Bundle Strategy

```typescript
// Entry points for different use cases
export * from './core';         // Essential features
export * from './styling';      // Visual enhancements  
export * from './exports';      // Data management
export * from './cli';          // CLI interface
```

---

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests** - Individual function/method testing
2. **Integration Tests** - Module interaction testing
3. **Visual Tests** - Screenshot-based UI testing
4. **Performance Tests** - Bundle size and runtime performance
5. **Cross-platform Tests** - Browser and Node.js compatibility

### Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── core.test.js
│   ├── styling.test.js
│   └── exports.test.js
├── integration/           # Integration tests
│   ├── full-workflow.test.js
│   └── cross-module.test.js
├── visual/               # Visual regression tests
│   ├── themes.spec.js
│   └── styling.spec.js
├── performance/          # Performance benchmarks
│   └── bundle-size.test.js
└── fixtures/            # Test data and utilities
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# Visual tests (Playwright)
npm run test:visual

# Performance tests
npm run test:performance

# All tests
npm test
```

---

## 🚀 Release Process

### Version Strategy

Better Logger follows [Semantic Versioning](https://semver.org/):

- **Patch** (0.0.1 → 0.0.2): Bug fixes, performance improvements
- **Minor** (0.0.1 → 0.1.0): New features, backward compatible
- **Major** (0.0.1 → 1.0.0): Breaking changes
- **Pre-release**: Alpha/Beta versions for testing

### Release Steps

1. **Development**
   ```bash
   # Feature development
   git checkout -b feature/new-feature
   npm run dev
   npm run test
   ```

2. **Testing**
   ```bash
   # Run full test suite
   npm run test:all
   npm run build:analyze
   ```

3. **Release**
   ```bash
   # Version bump and publish
   npm run release:alpha    # For testing
   npm run release         # Production release
   ```

4. **Post-Release**
   - GitHub release with changelog
   - Documentation updates
   - Demo site deployment

### CI/CD Pipeline

Our GitHub Actions automatically:

- ✅ Run tests on multiple Node.js versions
- ✅ Build and test the package
- ✅ Run visual regression tests
- ✅ Publish to npm registry
- ✅ Create GitHub releases
- ✅ Deploy demo to GitHub Pages

---

## 🤝 Contributing Guidelines

### Code Standards

- **TypeScript** for all source code
- **ESLint** and **Prettier** for formatting
- **JSDoc** comments for public APIs
- **Semantic** commit messages

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request with clear description

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] Performance impact is acceptable
- [ ] No breaking changes (unless major version)

---

## 🔧 Troubleshooting

### Common Development Issues

**Build Failures**
```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Type Errors**
```bash
# Run type checking
npm run type-check
# Fix issues and rebuild
```

**Development Server Issues**
```bash
# Restart with clean slate
npm run clean
npm run dev
```

### Getting Help

- 📖 [API Documentation](API.md)
- 🐛 [Issue Tracker](https://github.com/MKS2508/advanced-logger/issues)
- 💬 [Discussions](https://github.com/MKS2508/advanced-logger/discussions)

---

**Happy developing! 🚀**