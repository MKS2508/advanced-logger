# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-10-28

### ✨ Added
- **🌟 Dual Environment Support**: Automatic detection and adaptation between browser and terminal environments
- **🎨 ANSI Color Support**: Full terminal color support using ANSI escape sequences
- **🖥️ Terminal Renderer**: Dedicated rendering engine for terminal/servers with optimized formatting
- **🔄 Smart Adapter System**: Converts CSS-based styles to ANSI formatting automatically
- **🔍 Environment Detection**: Robust detection of browser, terminal, server, and Node.js environments
- **📱 All Presets Adapted**: All existing presets (cyberpunk, production, minimal, debug, glassmorphism) now work in terminal
- **⚡ Performance Optimized**: Zero configuration required - automatic adaptation based on environment

### 🔧 Technical Changes
- **New Modules**:
  - `src/terminal/terminal-renderer.ts` - ANSI rendering engine
  - `src/utils/environment-detector.ts` - Environment detection system
  - `src/utils/adapter.ts` - CSS to ANSI adapter
- **Enhanced Core**:
  - Updated `createStyledOutput()` to support dual rendering
  - Modified Logger class to pass preset information to terminal renderer
  - Added smart preset message handling (verbose logs only in browser)

### 🎯 Features
- **Automatic Environment Detection**: Detects browser vs terminal vs server automatically
- **Seamless Presets**: Same presets work in both environments with appropriate styling
- **Color Capability Detection**: Supports full color, basic 16-color, and no-color modes
- **Terminal Optimized**: Cyberpunk preset with vibrant ANSI colors in terminal
- **Clean Production Logs**: Professional formatting optimized for server logs

### 📚 Enhanced Documentation
- Updated package.json with new keywords: terminal, ansi, chalk, server, nodejs
- Enhanced description highlighting dual environment support

## [1.2.1] - 2024-10-28

### 🔧 Fixes
- **Enhanced Domain Badges**: Domain/scope now displays as proper badges with background color (e.g., `[CONNECTION]` instead of plain text)
- **Improved Stack Trace**: Better filtering of minified/bundle files to show TypeScript source locations
- **Cleaner File Names**: Transforms minified filenames like `Logger-BynuRJQf.js` to clean names like `logger.ts`
- **Consistent Styling**: All badges (level and domain) now use consistent visual styling

### 🎨 Visual Improvements
- Domain badges use background color + text styling similar to level badges
- Uppercase domain names for better visibility
- Enhanced cyberpunk preset with more vibrant badge styling
- Better visual hierarchy in terminal logs

### 🐛 Bug Fixes
- Fixed undefined filename handling in stack trace parsing
- Improved TypeScript type safety in stack trace functions
- Better error handling for malformed stack traces

---

## [1.1.0] - Previous

### ✨ Added
- Advanced styling system with CSS gradients and animations
- Smart presets (cyberpunk, glassmorphism, minimal, debug, production)
- Scoped loggers with automatic prefix management
- Performance monitoring with timing capabilities
- CLI integration with interactive commands
- Export handlers for file and remote logging
- SVG and animation support
- Theme detection and automatic adaptation

---

## [1.0.0] - Initial Release

### ✨ Added
- Core logging functionality with multiple log levels
- Style Builder with fluent API
- Browser DevTools integration
- TypeScript definitions
- Basic theming system