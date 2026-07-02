/**
 * @fileoverview Entry point for ./serializers subpath.
 * Serializer registry and bridge.
 */
export { SerializerRegistry, getDefaultSerializerRegistry } from './serializers/index.js';
export { createSerializerBridge, type SerializerBridge } from './serializers/index.js';
