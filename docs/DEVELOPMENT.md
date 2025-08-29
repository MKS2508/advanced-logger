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

- **Bun** 1.0+ (Primary runtime - https://bun.sh)
- **Node.js** 18+ (Backup compatibility)
- **Git** 2.30+

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/MKS2508/advanced-logger.git
cd advanced-logger

# Install dependencies with Bun
bun install

# Build all modules
bun run build:all

# Run development server
bun run dev
```

### Quick Start (Automated)

```bash
# Complete setup and first commit
bun install
bun run type-check        # Verify setup
bun run build:all         # Build all modules
bun run commit:auto       # AI-powered first commit
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
# Modular build system with Bun runtime
bun run build:full     # Complete bundle with all modules
bun run build:core     # Core logging only (minimal size)
bun run build:styling  # Styling + theming features  
bun run build:exports  # Export handlers (file, remote, analytics)
bun run build:all      # All modules + full build

# Traditional build scripts
bun run build          # Alias for build:full
bun run clean          # Clean dist/ and packages/*/dist/
bun run type-check     # TypeScript validation
```

### 🤖 Automated Development Workflow

```bash
# Commit automation (with Gemini AI)
bun run commit:auto    # Auto-generate commit, stage, and push
bun run commit:ui      # Interactive commit UI

# Version management
bun run version:auto   # Auto-detect version type from commits
bun run version:patch  # 0.2.0 → 0.2.1  
bun run version:minor  # 0.2.0 → 0.3.0
bun run version:major  # 0.2.0 → 1.0.0

# Pre-release channels  
bun run version:alpha  # 0.2.0 → 0.2.1-alpha.0
bun run version:beta   # 0.2.0 → 0.2.1-beta.0  
bun run version:stable # 0.2.1-alpha.0 → 0.2.1

# Release automation
bun run release:github # Create GitHub release with assets
bun run release:auto   # Full release with Gemini AI analysis
```

### 🚀 Complete Workflow Scripts

```bash
# Development workflows
bun run workflow:commit   # commit:auto
bun run workflow:release  # version:auto + build:all + release:github
bun run workflow:full     # commit:auto + release:full

# Production release workflows  
bun run release:full      # version:auto + build:all + release:github + publish
```

### 🧪 Testing & Quality Scripts

```bash
# Testing
bun run test             # Run test suite
bun run test:performance # Performance benchmarks
bun run test:visual      # Visual regression tests
bun run size-limit       # Bundle size analysis

# CI/CD compatibility
bun run ci:build         # Build all modules
bun run ci:test          # Run tests in CI
```

### 📦 Publishing Scripts

```bash
# NPM Registry (Production)
bun run ci:publish       # Publish to public NPM

# GitHub Packages (Beta testing)  
bun run ci:publish:github # Publish to GitHub registry

# Note: Publishing is also integrated into release workflows
```

---

## 🔄 Local Development Workflows

### 🛠️ Common Development Scenarios

#### **Scenario 1: Bug Fix in Core Module**
```bash
# 1. Make changes to src/core.ts or src/Logger.ts
# 2. Test changes
bun run type-check
bun run build:core

# 3. Commit with AI assistance
bun run commit:auto
# AI detects: "fix(core): resolve logging level hierarchy issue"

# 4. Create patch release
bun run version:patch     # 0.2.0 → 0.2.1
bun run build:all         # Rebuild all modules with new version
bun run release:github    # Create GitHub release

# 5. Optional: Publish to NPM
bun run ci:publish        # Publish stable version
```

#### **Scenario 2: New Feature in Styling Module**
```bash
# 1. Develop new theme or styling feature
# 2. Test visual changes
bun run dev               # Preview changes
bun run build:styling     # Test styling build

# 3. Automated workflow
bun run workflow:commit   # Auto-commit changes
# AI detects: "feat(styling): add cyberpunk theme with neon effects"

# 4. Feature release
bun run version:minor     # 0.2.0 → 0.3.0
bun run workflow:release  # Build + GitHub release (no publish)

# 5. Beta testing before production
bun run version:beta      # 0.3.0 → 0.3.1-beta.0
bun run build:all
bun run ci:publish:github # Publish beta to GitHub Packages
```

#### **Scenario 3: Major Refactoring (Breaking Changes)**
```bash
# 1. Complete refactoring work
# 2. Update all modules affected
bun run build:all         # Verify all builds work
bun run type-check        # Ensure no type errors

# 3. Create comprehensive commit
bun run commit:auto
# AI detects: "feat!: redesign API with breaking changes to Logger interface"

# 4. Major version release
bun run version:major     # 0.2.0 → 1.0.0
bun run build:all
bun run release:github

# 5. Production release (after testing)
bun run ci:publish        # Publish new major version
```

#### **Scenario 4: Alpha/Beta Release Cycle**
```bash
# Development phase
bun run commit:auto       # Commit feature work
bun run version:alpha     # 0.2.0 → 0.2.1-alpha.0
bun run build:all
bun run ci:publish:github # Alpha testing in GitHub Packages

# More development...
bun run commit:auto
bun run version:alpha     # 0.2.1-alpha.0 → 0.2.1-alpha.1

# Beta phase
bun run version:beta      # 0.2.1-alpha.1 → 0.2.1-beta.0
bun run workflow:release  # Build + GitHub release

# Stable release
bun run version:stable    # 0.2.1-beta.0 → 0.2.1
bun run release:full      # Full production release with NPM publish
```

#### **Scenario 5: Hotfix in Production**
```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug
# 2. Fix issue quickly
bun run type-check

# 3. Emergency release
bun run commit:auto       # Quick commit
bun run version:patch     # Immediate patch version
bun run build:all
bun run ci:publish        # Direct to production (skip GitHub packages)

# 4. Create GitHub release after
bun run release:github
```

### 🔧 Advanced Workflow Combinations

#### **Full Development Cycle**
```bash
# Complete development workflow
bun run workflow:full
# Executes: commit:auto → version:auto → build:all → release:github → ci:publish
```

#### **Safe Testing Workflow**
```bash
# Test without publishing to NPM
bun run workflow:commit   # Commit changes
bun run workflow:release  # Version + build + GitHub release
bun run ci:publish:github # Test publish to GitHub Packages only
```

#### **AI-Powered Release**
```bash
# Let Gemini AI analyze and create complete release
bun run release:auto
# AI analyzes all changes, creates optimized commits, versions, and releases
```

### 📋 Script Execution Order Reference

#### **For Bug Fixes**
1. `bun run commit:auto` → Auto-commit with fix message
2. `bun run version:patch` → Increment patch version
3. `bun run build:core` → Build affected module only
4. `bun run release:github` → Create release
5. `bun run ci:publish` → Publish if needed

#### **For New Features**  
1. `bun run commit:auto` → Auto-commit with feat message
2. `bun run version:minor` → Increment minor version
3. `bun run build:all` → Build all modules
4. `bun run release:github` → Create release
5. `bun run ci:publish:github` → Beta test first
6. `bun run ci:publish` → Production when ready

#### **For Breaking Changes**
1. `bun run commit:auto` → Auto-commit with breaking change
2. `bun run version:major` → Increment major version
3. `bun run build:all` → Build all modules
4. `bun run release:github` → Create release with breaking change notes
5. Manual testing before `bun run ci:publish`

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

### Modular Architecture

#### **Source Structure**
```
src/
├── core.ts                 # Core logging functionality (6KB)
├── styling-module.ts       # Visual features & themes (78KB)  
├── exports-module.ts       # Data export & remote logging (80KB)
├── index.ts               # Full library entry point (complete bundle)
├── cli/                   # CLI interface modules
├── styling/               # Styling system components
├── handlers/              # Log handler implementations
├── utils/                 # Utility functions
└── types/                 # TypeScript definitions
```

#### **Build Outputs**
```
dist/                      # Full bundle build
├── index.js              # Complete library (ES modules)
├── index.cjs             # Complete library (CommonJS)
├── core.js               # Core module only
├── styling.js            # Styling module only
├── exports.js            # Exports module only
└── types/                # TypeScript definitions

packages/                  # Individual module builds
├── core/
│   ├── package.json      # @mks2508/better-logger-core
│   └── dist/            # Core module build
├── styling/  
│   ├── package.json      # @mks2508/better-logger-styling
│   └── dist/            # Styling module build
└── exports/
    ├── package.json      # @mks2508/better-logger-exports  
    └── dist/            # Exports module build
```

#### **Package Distribution**
- **@mks2508/better-logger**: Full bundle (all modules)
- **@mks2508/better-logger-core**: Core logging only (minimal)
- **@mks2508/better-logger-styling**: Visual features + theming
- **@mks2508/better-logger-exports**: Export handlers + remote logging

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