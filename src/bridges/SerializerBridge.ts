/**
 * @fileoverview SerializerBridge — SerializerRegistry facade.
 * Encapsulates serializer registration, removal, and registry access.
 */

import type { SerializerFn } from '../types/index.js';
import { SerializerRegistry } from '../serializers/index.js';

/**
 * Bridge for serializer management.
 */
export interface SerializerBridge {
    /** Adds a serializer for a type. */
    addSerializer<T>(type: new (...args: unknown[]) => T, serializer: SerializerFn<T>, priority?: number): void;
    /** Removes a serializer for a type. Returns true if removed. */
    removeSerializer<T>(type: new (...args: unknown[]) => T): boolean;
    /** Returns the underlying registry. */
    getSerializerRegistry(): SerializerRegistry;
}

/**
 * Creates a SerializerBridge instance.
 */
export function createSerializerBridge(): SerializerBridge {
    const serializerRegistry = new SerializerRegistry();

    return {
        addSerializer<T>(type: new (...args: unknown[]) => T, serializer: SerializerFn<T>, priority?: number): void {
            serializerRegistry.add(type, serializer, priority);
        },

        removeSerializer<T>(type: new (...args: unknown[]) => T): boolean {
            return serializerRegistry.remove(type);
        },

        getSerializerRegistry(): SerializerRegistry {
            return serializerRegistry;
        }
    };
}
