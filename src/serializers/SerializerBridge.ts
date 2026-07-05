/**
 * @fileoverview SerializerBridge — facade de SerializerRegistry.
 * Encapsula registro, eliminación y acceso al registry de serializers.
 *
 * @internal
 */

import type { SerializerFn } from '../types/index.js';
import { SerializerRegistry } from './index.js';

/**
 * Bridge para la gestión de serializers.
 *
 * @internal
 */
export interface SerializerBridge {
    /** Añade un serializer para un tipo. */
    addSerializer<T>(type: new (...args: unknown[]) => T, serializer: SerializerFn<T>, priority?: number): void;
    /** Elimina el serializer asociado a un tipo. Devuelve `true` si se eliminó. */
    removeSerializer<T>(type: new (...args: unknown[]) => T): boolean;
    /** Devuelve el registry subyacente. */
    getSerializerRegistry(): SerializerRegistry;
}

/**
 * Crea una instancia de {@link SerializerBridge}.
 *
 * @internal
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
