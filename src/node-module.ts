/**
 * @fileoverview Entry point for ./node subpath.
 *
 * Reserved namespace for Node-only utilities. Use the main entry (`@mks2508/better-logger`)
 * for cross-runtime APIs. This subpath exists so future Node-only features
 * (file-based log capture, fs-backed rotation, etc.) can land here without
 * polluting the default bundle.
 */
