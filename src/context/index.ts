/**
 * @fileoverview Context/MDC subpath barrel.
 * Exports: child, withContext, withContextAsync, getContext, clearContext, setResource
 */
export {
    createLogContext,
    type LogContext,
    type ContextSnapshot,
    type ChildLoggerFactory,
    type ChildLoggerShape,
} from './LogContext.js';
