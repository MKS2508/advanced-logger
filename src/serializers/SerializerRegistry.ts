/**
 * @fileoverview Registry de serializers con control de profundidad, detección
 * de referencias circulares y soporte para tipos builtin (Error, Date, RegExp,
 * Map, Set, Buffer). Implementa {@link ISerializerRegistry}.
 */
import type {
    SerializerFn,
    SerializerContext,
    SerializerEntry,
    SerializerConfig,
    ISerializerRegistry
} from '../types/index.js';

/**
 * Configuración por defecto del registry. Se merguea con la config que reciba
 * el constructor (gana la del caller).
 *
 * @internal Constante de módulo; no es API pública.
 */
const DEFAULT_CONFIG: Required<SerializerConfig> = {
    maxDepth: 5,
    circular: 'placeholder',
    preserveUndefined: false
};

/**
 * Registry de serializers tipados por constructor.
 *
 * Mantiene un mapa ordenado por `priority` (mayor primero) de serializers
 * registrados para clases específicas. El método {@link SerializerRegistry.serialize}
 * recorre objetos de forma recursiva aplicando el serializer que matchee por
 * `instanceof`, con dos guardas de seguridad:
 *
 * - **Depth guard**: corta la recursión al llegar a `maxDepth` y emite el
 *   placeholder `'[Max Depth]'`.
 * - **Circular ref**: lleva un `WeakSet` de objetos visitados en el path actual;
 *   al re-encontrar uno aplica la estrategia de `circular` (`placeholder` por
 *   default).
 *
 * Implementa {@link ISerializerRegistry}. Suele usarse vía el singleton de
 * {@link getDefaultSerializerRegistry}, expuesto al Logger a través del
 * {@link SerializerBridge}.
 *
 * @example
 * ```ts
 * const registry = new SerializerRegistry({ maxDepth: 3 });
 *
 * registry.add(URL, (url: URL) => ({
 *   href: url.href,
 *   origin: url.origin
 * }), 60);
 *
 * const safe = registry.serialize(someMaybeCyclicObject);
 * ```
 *
 * @see {@link ISerializerRegistry} para el contrato interface.
 * @see {@link SerializerConfig} para las opciones del constructor.
 */
export class SerializerRegistry implements ISerializerRegistry {
    private serializers: Map<Function, SerializerEntry> = new Map();
    private config: Required<SerializerConfig>;

    /**
     * Crea un registry nuevo con los serializers builtin ya registrados
     * (Error, Date, RegExp, Map, Set, Buffer cuando está disponible).
     *
     * @param {SerializerConfig} config - Overrides sobre {@link DEFAULT_CONFIG}.
     *   - `maxDepth` (default `5`): profundidad máxima de anidamiento antes del
     *     placeholder `'[Max Depth]'`.
     *   - `circular` (default `'placeholder'`): qué hacer ante una referencia
     *     circular. `'placeholder'` emite `'[Circular]'`, `'skip'` omite la key
     *     (devuelve `undefined`), `'error'` lanza.
     *   - `preserveUndefined` (default `false`): si `true` deja `undefined`
     *     textual; si `false` lo reemplaza por `'[undefined]'` (más seguro para
     *     JSON / transporte).
     *
     * @example
     * ```ts
     * // Defaults (depth 5, circular → placeholder)
     * const a = new SerializerRegistry();
     *
     * // Estricto: lanza ante ciclo, conservar undefined
     * const b = new SerializerRegistry({
     *   maxDepth: 10,
     *   circular: 'error',
     *   preserveUndefined: true
     * });
     * ```
     */
    constructor(config: SerializerConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.registerDefaults();
    }

    /**
     * Registra los serializers builtin con sus prioridades. Invocado por el
     * constructor; no es API pública.
     *
     * Defaults (mayor priority = gana primero en `instanceof`):
     *
     * | Tipo     | Priority | Salida                                         |
     * |----------|----------|------------------------------------------------|
     * | `Error`  | 100      | `{ name, message, stack[], cause? }`           |
     * | `Date`   | 90       | `{ iso, timestamp }`                           |
     * | `RegExp` | 90       | `{ pattern, flags }`                           |
     * | `Map`    | 80       | `{ __type:'Map', entries }`                    |
     * | `Set`    | 80       | `{ __type:'Set', values[] }`                   |
     * | `Buffer` | 70       | `{ __type:'Buffer', length, preview }` (Node)  |
     *
     * @internal
     */
    private registerDefaults(): void {
        this.add(Error, (err: Error) => ({
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 10),
            ...(err.cause ? { cause: this.serialize(err.cause) } : {})
        }), 100);

        this.add(Date, (date: Date) => ({
            iso: date.toISOString(),
            timestamp: date.getTime()
        }), 90);

        this.add(RegExp, (regex: RegExp) => ({
            pattern: regex.source,
            flags: regex.flags
        }), 90);

        this.add(Map, (map: Map<any, any>, ctx) => {
            const obj: Record<string, any> = {};
            map.forEach((value, key) => {
                const keyStr = typeof key === 'object' ? JSON.stringify(key) : String(key);
                obj[keyStr] = this.serializeInternal(value, {
                    ...ctx,
                    depth: ctx.depth + 1,
                    path: [...ctx.path, keyStr]
                });
            });
            return { __type: 'Map', entries: obj };
        }, 80);

        this.add(Set, (set: Set<any>, ctx) => ({
            __type: 'Set',
            values: Array.from(set).map((v, i) =>
                this.serializeInternal(v, {
                    ...ctx,
                    depth: ctx.depth + 1,
                    path: [...ctx.path, `[${i}]`]
                })
            )
        }), 80);

        if (typeof Buffer !== 'undefined') {
            this.add(Buffer as any, (buf: Buffer) => ({
                __type: 'Buffer',
                length: buf.length,
                preview: buf.slice(0, 50).toString('hex')
            }), 70);
        }
    }

    /**
     * Registra (o reemplaza) el serializer para una clase constructora.
     *
     * Si ya existía un serializer para `type`, se sobrescribe. La `priority`
     * sólo ordena de cara al lookup por `instanceof` hecho en
     * {@link SerializerRegistry.getAll} — útil cuando una subclass debería
     * matchear antes que su superclass (p.ej. `TypeError` antes que `Error`).
     *
     * @param {new (...args: any[]) => T} type - Constructor de la clase a matchear.
     * @param {SerializerFn<T>} serializer - Función que recibe la instancia y el
     *   {@link SerializerContext} (depth, path, seen); devuelve una representación
     *   serializable.
     * @param {number} [priority=50] - Orden de lookup (mayor = primero). Los
     *   defaults builtin usan 70–100.
     *
     * @example
     * ```ts
     * registry.add(
     *   URL,
     *   (url: URL, ctx) => ({ href: url.href, origin: url.origin }),
     *   60
     * );
     * ```
     */
    add<T>(
        type: new (...args: any[]) => T,
        serializer: SerializerFn<T>,
        priority: number = 50
    ): void {
        this.serializers.set(type, { type, serializer, priority });
    }

    /**
     * Elimina el serializer registrado para `type`.
     *
     * @param {new (...args: any[]) => T} type - Constructor a remover.
     * @returns `true` si existía y fue removido, `false` si no había registro.
     *
     * @example
     * ```ts
     * registry.remove(Date); // → true (estaba registrado por defecto)
     * registry.remove(Date); // → false (ya no está)
     * ```
     */
    remove<T>(type: new (...args: any[]) => T): boolean {
        return this.serializers.delete(type);
    }

    /**
     * Indica si hay un serializer registrado para `type`.
     *
     * @param {new (...args: any[]) => T} type - Constructor a consultar.
     * @returns `true` si `type` está registrado.
     *
     * @example
     * ```ts
     * if (!registry.has(CustomError)) {
     *   registry.add(CustomError, serializeCustomError, 95);
     * }
     * ```
     */
    has<T>(type: new (...args: any[]) => T): boolean {
        return this.serializers.has(type);
    }

    /**
     * Devuelve todas las entradas registradas, ordenadas por `priority`
     * descendente (mayor priority primero). Este es el orden en el que
     * {@link SerializerRegistry.serialize} los prueba vía `instanceof`.
     *
     * @returns {SerializerEntry[]} Array de entradas ordenadas por prioridad.
     *
     * @example
     * ```ts
     * const entries = registry.getAll();
     * console.log(entries.map(e => [e.type.name, e.priority]));
     * // [['Error', 100], ['Date', 90], ['RegExp', 90], ['Map', 80], ...]
     * ```
     *
     * @see {@link SerializerEntry}
     */
    getAll(): SerializerEntry[] {
        return Array.from(this.serializers.values())
            .sort((a, b) => (b.priority ?? 50) - (a.priority ?? 50));
    }

    /**
     * Busca el primer serializer cuyo `type` matchee `value instanceof type`,
     * recorriendo las entradas en orden de prioridad descendente.
     *
     * @internal Helper del pipeline interno; no es API pública.
     * @param value - Valor a testear.
     * @returns Entrada matcheante, o `null` si ninguna aplica.
     */
    private findSerializer(value: any): SerializerEntry | null {
        const sorted = this.getAll();
        for (const entry of sorted) {
            if (value instanceof entry.type) {
                return entry;
            }
        }
        return null;
    }

    /**
     * Pipeline interno de serialización recursiva. Es el core de
     * {@link SerializerRegistry.serialize}; no es API pública pero se documenta
     * aquí para mantener la semántica del pipeline en un solo lugar.
     *
     * Orden de guardas (cada una corta la recursión):
     *
     * 1. `null` / `undefined` — directo (respeta `preserveUndefined`).
     * 2. `function` — placeholder `'[Function: name]'`.
     * 3. Primitiva no-objeto — se devuelve tal cual.
     * 4. **Depth guard**: si `depth >= maxDepth` → `'[Max Depth]'`.
     * 5. **Circular**: si `value` ya está en el `WeakSet` `seen` del contexto,
     *    aplica `circular` (`placeholder` / `skip` / `error`).
     * 6. Se marca en `seen`, se busca serializer por `instanceof`; si matchea,
     *    se delega (el serializer puede recursar via `ctx`).
     * 7. Si es array, mapea cada item incrementando depth y extendiendo path.
     * 8. Si es plain object, itera keys recursivamente.
     *
     * @internal
     * @param value - Valor a serializar.
     * @param context - Estado de recursión (depth, path, seen, maxDepth).
     * @returns Valor serializable (puede ser primitiva, objeto, array o placeholder).
     * @throws {Error} Sólo si `circular: 'error'` y se detecta ciclo.
     */
    private serializeInternal(value: any, context: SerializerContext): any {
        if (value === null) return null;
        if (value === undefined) return this.config.preserveUndefined ? undefined : '[undefined]';
        if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
        if (typeof value !== 'object') return value;

        if (context.depth >= this.config.maxDepth) {
            return '[Max Depth]';
        }

        if (context.seen.has(value)) {
            switch (this.config.circular) {
                case 'error':
                    throw new Error(`Circular reference at ${context.path.join('.')}`);
                case 'skip':
                    return undefined;
                case 'placeholder':
                default:
                    return '[Circular]';
            }
        }
        context.seen.add(value);

        const serializer = this.findSerializer(value);
        if (serializer) {
            return serializer.serializer(value, context);
        }

        if (Array.isArray(value)) {
            return value.map((item, i) =>
                this.serializeInternal(item, {
                    ...context,
                    depth: context.depth + 1,
                    path: [...context.path, `[${i}]`]
                })
            );
        }

        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = this.serializeInternal(val, {
                ...context,
                depth: context.depth + 1,
                path: [...context.path, key]
            });
        }
        return result;
    }

    /**
     * Serializa un valor arbitrario a una representación segura para transporte
     * (JSON, remote log, OTLP, etc.).
     *
     * Entry point público del pipeline. Construye un {@link SerializerContext}
     * fresco (depth 0, path vacío, `WeakSet` nuevo para detección de ciclos),
     * merguea overrides de `config` sobre los del constructor y delega a
     * {@link SerializerRegistry.serializeInternal}.
     *
     * @param {any} value - Valor a serializar. Cualquier tipo.
     * @param {SerializerConfig} [config] - Overrides puntuales para esta llamada
     *   (no mutan la config del registry). Útil para, p.ej., subir `maxDepth`
     *   sólo en un log concreto.
     * @returns {any} Valor serializable. Para objetos sin serializer registrado
     *   se devuelve un plain object; para tipos builtin, la shape definida en
     *   {@link SerializerRegistry.registerDefaults}; para los cortes de
     *   profundidad o circular, los placeholders `'[Max Depth]'` / `'[Circular]'`.
     * @throws {Error} Sólo si `circular: 'error'` y se detecta una referencia circular.
     *
     * @example
     * ```ts
     * // Objetos simples
     * registry.serialize({ a: 1, b: [2, 3] });
     * // → { a: 1, b: [2, 3] }
     *
     * // Errores (serializer builtin)
     * registry.serialize(new Error('boom'));
     * // → { name: 'Error', message: 'boom', stack: [...] }
     *
     * // Referencia circular → placeholder
     * const o: any = {};
     * o.self = o;
     * registry.serialize(o); // → { self: '[Circular]' }
     *
     * // Override puntual de maxDepth
     * registry.serialize(deepObj, { maxDepth: 2 });
     * ```
     *
     * @see {@link SerializerRegistry.serializeInternal} para el detalle del pipeline.
     */
    serialize(value: any, config?: SerializerConfig): any {
        const mergedConfig = { ...this.config, ...config };
        return this.serializeInternal(value, {
            depth: 0,
            maxDepth: mergedConfig.maxDepth,
            path: [],
            seen: new WeakSet()
        });
    }
}

/**
 * Cache del singleton de {@link SerializerRegistry}. Module-private.
 *
 * @internal
 */
let _defaultRegistry: SerializerRegistry | null = null;

/**
 * Devuelve el singleton de {@link SerializerRegistry} (lo crea con config
 * default en la primera llamada). Es la vía canónica de obtener el registry
 * compartido que usa el Logger internamente.
 *
 * @returns {SerializerRegistry} Instancia singleton.
 *
 * @example
 * ```ts
 * import { getDefaultSerializerRegistry } from '@mks2508/better-logger/serializers';
 *
 * const registry = getDefaultSerializerRegistry();
 * if (!registry.has(CustomError)) {
 *   registry.add(CustomError, (e) => ({ code: e.code, message: e.message }), 95);
 * }
 * ```
     */
export function getDefaultSerializerRegistry(): SerializerRegistry {
    if (!_defaultRegistry) {
        _defaultRegistry = new SerializerRegistry();
    }
    return _defaultRegistry;
}
