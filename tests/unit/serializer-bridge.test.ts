/**
 * SerializerBridge unit tests — addSerializer, removeSerializer,
 * priority ordering, typed registration, empty registry passthrough.
 *
 *
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSerializerBridge, type SerializerBridge } from '../../src/serializers/SerializerBridge.js';
import { cleanup } from '../setup.js';

class CustomType {
    constructor(public readonly value: string) {}
}

class AnotherType {
    constructor(public readonly id: number) {}
}

describe('SerializerBridge', () => {
    let bridge: SerializerBridge;

    beforeEach(() => {
        bridge = createSerializerBridge();
    });

    afterEach(() => {
        cleanup();
    });

    describe('addSerializer', () => {
        it('registers a serializer for a type', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ value: ct.value }));
            const reg = bridge.getSerializerRegistry();
            expect(reg.has(CustomType)).toBe(true);
        });

        it('addSerializer without priority uses default of 50', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ value: ct.value }));
            const reg = bridge.getSerializerRegistry();
            const all = reg.getAll();
            const entry = all.find(e => e.type === CustomType);
            expect(entry?.priority ?? 50).toBe(50);
        });

        it('registers multiple serializers for different types', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ value: ct.value }));
            bridge.addSerializer(AnotherType, (at: AnotherType) => ({ id: at.id }));
            const reg = bridge.getSerializerRegistry();
            expect(reg.has(CustomType)).toBe(true);
            expect(reg.has(AnotherType)).toBe(true);
        });
    });

    describe('removeSerializer', () => {
        it('removes a registered serializer', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ value: ct.value }));
            const removed = bridge.removeSerializer(CustomType);
            expect(removed).toBe(true);
            expect(bridge.getSerializerRegistry().has(CustomType)).toBe(false);
        });

        it('removeSerializer returns false for unregistered type', () => {
            const removed = bridge.removeSerializer(CustomType);
            expect(removed).toBe(false);
        });
    });

    describe('priority ordering', () => {
        it('addSerializer replaces existing serializer for the same type', () => {
            // A type can only have ONE serializer; calling addSerializer again replaces it
            bridge.addSerializer(CustomType, () => ({ v: 'first' }), 30);
            bridge.addSerializer(CustomType, () => ({ v: 'second' }), 70);
            bridge.addSerializer(CustomType, () => ({ v: 'third' }), 50);

            const reg = bridge.getSerializerRegistry();
            const result = reg.serialize(new CustomType('test'));
            // Last added (priority 50) wins
            expect(result).toEqual({ v: 'third' });
        });

        it('getAll returns all serializers sorted by priority descending', () => {
            // Using unique types so they don't overwrite each other
            bridge.addSerializer(CustomType, () => ({ v: 1 }), 30);
            bridge.addSerializer(AnotherType, () => ({ id: 2 }), 70);

            const all = bridge.getSerializerRegistry().getAll();
            const ourEntries = all.filter(e => e.type === CustomType || e.type === AnotherType);
            const priorities = ourEntries.map(e => e.priority);
            expect(priorities).toEqual([70, 30]); // Descending order
        });
    });

    describe('typed serializer registration', () => {
        it('serializes custom type with typed serializer', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ serializedValue: ct.value }));
            const result = bridge.getSerializerRegistry().serialize(new CustomType('hello'));
            expect(result).toEqual({ serializedValue: 'hello' });
        });

        it('serializes AnotherType with typed serializer', () => {
            bridge.addSerializer(AnotherType, (at: AnotherType) => ({ serializedId: at.id }));
            const result = bridge.getSerializerRegistry().serialize(new AnotherType(42));
            expect(result).toEqual({ serializedId: 42 });
        });

        it('serializes unknown type with default fallback (no crash)', () => {
            const result = bridge.getSerializerRegistry().serialize({ unknown: 'object' });
            expect(result).toBeDefined();
        });
    });

    describe('empty registry', () => {
        it('serializes primitive types even with empty registry', () => {
            // Default serializers (Error, Date, etc.) are always registered in SerializerRegistry
            const result = bridge.getSerializerRegistry().serialize('plain string');
            expect(result).toBe('plain string');
        });

        it('has default serializers registered by default', () => {
            // SerializerRegistry.registerDefaults() adds Error, Date, RegExp, Map, Set
            const reg = bridge.getSerializerRegistry();
            expect(reg.has(Error)).toBe(true);
            expect(reg.has(Date)).toBe(true);
            expect(reg.has(RegExp)).toBe(true);
            expect(reg.has(Map)).toBe(true);
            expect(reg.has(Set)).toBe(true);
        });
    });

    describe('getSerializerRegistry', () => {
        it('returns the same registry instance', () => {
            const reg1 = bridge.getSerializerRegistry();
            const reg2 = bridge.getSerializerRegistry();
            expect(reg1).toBe(reg2);
        });

        it('registry reflects serializers added via bridge', () => {
            bridge.addSerializer(CustomType, (ct: CustomType) => ({ value: ct.value }));
            expect(bridge.getSerializerRegistry().has(CustomType)).toBe(true);
        });
    });
});
