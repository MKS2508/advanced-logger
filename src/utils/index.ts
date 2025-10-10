/**
 * @fileoverview Utility functions exports for Advanced Logger
 */

export { parseStackTrace } from './stackTrace.js';
export {
    formatTimestamp,
    parseRelativeTime,
    parseTimeInput,
    formatDisplayTime
} from './timestamps.js';
export {
    createStyledOutput,
    generateLogId,
    escapeHtml,
    safeStringify,
    detectDevToolsTheme,
    getAdaptiveColor,
    setupThemeChangeListener,
    type LevelStyleConfig
} from './output.js';
export {
    createPlainOutput,
    createOutput,
    createANSIOutput,
    createBuildOutput,
    createCIOutput,
    detectOptimalFormat,
    getConsoleMethod,
    createLogEntry,
    formatTablePlain,
    safeSerialize
} from './formatting.js';