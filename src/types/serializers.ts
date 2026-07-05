import type { LogLevel } from './core.js';

/**
 * Función de serialización registrada para un tipo específico de valor.
 *
 * Recibe el valor a serializar y un {@link SerializerContext} con el estado
 * del recorrido (profundidad, camino de claves, set de objetos ya vistos para
 * detectar ciclos). Devuelve una representación segura para logs / JSON —
 * normalmente un plain object o un primitivo que `JSON.stringify` pueda emitir
 * sin perder información ni lanzar sobre estructuras profundas.
 *
 * @typeParam T - Tipo del valor que este serializer sabe manejar.
 * @param value - Instancia a serializar.
 * @param context - Estado del recorrido (depth, path, seen).
 * @returns Representación serializable del valor de entrada.
 *
 * @example
 * // Serializer para `Error` que aplana los campos relevantes
 * const errorSerializer: SerializerFn<Error> = (err) => ({
 *   name: err.name,
 *   message: err.message,
 *   stack: err.stack
 * });
 */
export type SerializerFn<T = any> = (value: T, context: SerializerContext) => any;

/**
 * Estado de recorrido que el {@link ISerializerRegistry} pasa a cada
 * {@link SerializerFn} durante la serialización de un valor.
 *
 * Permite que los serializers personalizados respeten `maxDepth`, reconozcan
 * su posición dentro del grafo de objetos y participen de la detección de
 * referencias circulares.
 *
 * @property depth - Profundidad actual dentro del grafo (raíz = 0).
 * @property maxDepth - Profundidad máxima permitida antes de truncar.
 * @property path - Camino de claves desde la raíz hasta el nodo actual.
 * @property seen - `WeakSet` de objetos ya visitados, para detectar ciclos.
 */
export interface SerializerContext {
    depth: number;
    maxDepth: number;
    path: string[];
    seen: WeakSet<object>;
}

/**
 * Entrada del registry que asocia un constructor con su {@link SerializerFn}
 * y la prioridad con la que fue registrado.
 *
 * Cuando varios serializers matchean por jerarquía (p.ej. `TypeError` vs
 * `Error`), gana el de `priority` más alta; en empate gana el registrado más
 * tarde. Devuelto por {@link ISerializerRegistry.getAll} para inspección y
 * depuración del orden de resolución.
 */
export interface SerializerEntry<T = any> {
    type: new (...args: any[]) => T;
    serializer: SerializerFn<T>;
    priority: number;
}

/**
 * Opciones de serialización pasadas a {@link ISerializerRegistry.serialize}.
 *
 * @property maxDepth - Profundidad máxima antes de truncar el subárbol con un placeholder. Toma el default del registry si se omite.
 * @property circular - Estrategia ante referencias circulares:
 *   - `'error'` — lanza al detectar un ciclo.
 *   - `'skip'` — omite el campo circular del output.
 *   - `'placeholder'` — reemplaza el ciclo por `'[Circular]'` (default).
 * @property preserveUndefined - Si mantener `undefined` (en lugar de omitirlo). Por compatibilidad con JSON, default `false`.
 */
export interface SerializerConfig {
    maxDepth?: number;
    circular?: 'error' | 'skip' | 'placeholder';
    preserveUndefined?: boolean;
}

/**
 * Contrato del registry de serializers por tipo.
 *
 * Mantiene una tabla de constructors → {@link SerializerFn} con prioridades,
 * y expone `serialize()` para transformar valores arbitrarios (`Error`,
 * `Date`, `Map`, `Set`, tipos custom del dominio) en representaciones
 * seguras para logs y para `JSON.stringify`.
 *
 * La resolución recorre la cadena de prototipos del valor y aplica el
 * serializer más específico registrado; si nadie matchea, cae al serializer
 * por defecto (JSON-safe).
 *
 * @example
 * const registry: ISerializerRegistry = createRegistry();
 * registry.add(Error, (e: Error) => ({ name: e.name, message: e.message }), 10);
 * registry.serialize(new TypeError('boom'));
 * // → { name: 'TypeError', message: 'boom' }  (TypeError hereda de Error)
 */
export interface ISerializerRegistry {
    add<T>(type: new (...args: any[]) => T, serializer: SerializerFn<T>, priority?: number): void;
    remove<T>(type: new (...args: any[]) => T): boolean;
    has<T>(type: new (...args: any[]) => T): boolean;
    serialize(value: any, config?: SerializerConfig): any;
    getAll(): SerializerEntry[];
}
