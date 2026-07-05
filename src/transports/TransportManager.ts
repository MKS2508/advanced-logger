import type {
    TransportRecord,
    TransportTarget,
    TransportOptions,
    ITransport,
    ITransportManager,
    LogLevel
} from '../types/index.js';
import { LOG_LEVELS } from '../types/index.js';
import { ConsoleTransport } from './ConsoleTransport.js';
import { FileTransport } from './FileTransport.js';
import { HttpTransport } from './HttpTransport.js';
import { OtlpTransport } from './OtlpTransport.js';

/**
 * Genera un id opaco y estable en el tiempo para cada transport añadido al
 * manager. Combina timestamp (base36) con un sufijo aleatorio para evitar
 * colisiones entre adds casi simultáneos.
 *
 * @internal No es API pública — el formato del id es inestable y los callers
 *   deben tratarlo como opaco (solo compararlo y pasárselo a `remove`).
 */
function generateTransportId(): string {
    return `transport-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Firma del constructor de los transports registrados en el registry
 * built-in. Acepta el tipo propio de options del transport; el pass-through
 * se enforcea en registro vía TypeScript pero se borra en runtime.
 */
export type TransportConstructor = new (options?: TransportOptions) => ITransport;

/**
 * Registry estático de los transports built-in, con el que se inicializa el
 * registry vivo de cada instancia de {@link TransportManager}. Los customs
 * se añaden al registry por-instancia vía {@link TransportManager.register}
 * (no a este Map módulo-nivel).
 *
 * Los cuatro built-ins registrados automáticamente:
 *   - `'console'` → {@link ConsoleTransport}
 *   - `'file'`    → {@link FileTransport}
 *   - `'http'`    → {@link HttpTransport}
 *   - `'otlp'`    → {@link OtlpTransport}
 *
 * @internal No exportado — los callers externos usan
 *   {@link TransportManager.register} / {@link TransportManager.listRegistered}.
 */
const BUILTIN_REGISTRY: Map<string, TransportConstructor> = new Map([
    ['console', ConsoleTransport as unknown as TransportConstructor],
    ['file', FileTransport as unknown as TransportConstructor],
    ['http', HttpTransport as unknown as TransportConstructor],
    ['otlp', OtlpTransport as unknown as TransportConstructor]
]);

/**
 * Entrada interna del set de transports activos. Guarda la instancia, las
 * options (con `transform`) y el nivel pre-resuelto a su valor numérico
 * (`levelValue`) para que el filtro en `write()` sea una comparación directa.
 *
 * @internal
 */
interface TransportEntry {
    id: string;
    transport: ITransport;
    options: TransportOptions;
    level: LogLevel;
    levelValue: number;
}

/**
 * Registry y dispatcher de transports. Mantiene el set activo de destinos
 * de log (console, file, http, otlp, o transports custom registrados vía
 * {@link TransportManager.register}) y les dispatcha cada
 * {@link TransportRecord} producido por el Logger.
 *
 * Cada transport added se identifica por un `id` opaco (generado por la
 * propia instancia) que devuelven {@link add} y {@link list}, y que acepta
 * {@link remove}. El registry arranca con los cuatro built-ins
 * (`console` / `file` / `http` / `otlp`) ya cargados; {@link register}
 * añade customs sin poder sobreescribir los built-ins (lanza).
 *
 * El dispatch ({@link write}) aplica el filtro de `level` por transport y
 * el `transform` opcional de {@link TransportOptions}, y captura toda
 * excepción / rechazo de cada transport para que un transport roto nunca
 * rompa el log call del caller. El propio Logger habla con el manager a
 * través del facade {@link TransportBridge} (ver
 * `Logger.addTransport` / `Logger.getTransportManager`).
 *
 * Implementa {@link ITransportManager}.
 *
 * @example
 * // Manager con nivel default y transports añadidos por nombre
 * const tm = new TransportManager('info');
 * tm.add({ target: 'console' });
 * tm.add({ target: 'file', options: { path: './app.log' } });
 *
 * @example
 * // Registrar un transport custom y usarlo por nombre
 * tm.register('datadog', DatadogTransport);
 * tm.add({ target: 'datadog', options: { apiKey: env('DD_KEY') } });
 *
 * @example
 * // Pasar una instancia de ITransport directamente (sin pasar por registry)
 * tm.add({ target: new MyTransport(), level: 'warn' });
 *
 * @example
 * // Dispatch + ciclo de vida
 * await tm.write(record);
 * await tm.flush();   // flusha todos los buffered
 * await tm.close();   // flush + close + clear
 *
 * @see {@link ITransportManager}
 * @see {@link TransportTarget}
 * @see {@link TransportBridge}
 */
export class TransportManager implements ITransportManager {
    private transports: Map<string, TransportEntry> = new Map();
    private defaultLevel: LogLevel = 'info';
    private readonly registry: Map<string, TransportConstructor> = new Map(BUILTIN_REGISTRY);

    /**
     * Crea un nuevo manager.
     *
     * @param {LogLevel} [defaultLevel='info'] - Nivel mínimo por defecto
     *   para transports añadidos sin `level` explícito en su
     *   {@link TransportTarget}. Records con `levelValue` inferior al del
     *   transport se descartan en {@link write}.
     *
     * @example
     * const tm = new TransportManager('debug'); // todo pasa salvo filter propio
     */
    constructor(defaultLevel?: LogLevel) {
        if (defaultLevel) {
            this.defaultLevel = defaultLevel;
        }
    }

    /**
     * Registra un constructor de transport bajo un nombre string. Tras el
     * registro, `add({ target: name, options })` instancia ese transport con
     * las options pasadas.
     *
     * No se puede sobreescribir un built-in (`console` / `file` / `http` /
     * `otlp`): lanza para evitar silenciar un transport crítico por un
     * accidente de naming. El registro es por-instancia (no comparte entre
     * managers).
     *
     * @param {string} name - Nombre bajo el que registrar (usado luego como
     *   `target` en {@link TransportTarget}).
     * @param {TransportConstructor} ctor - Constructor que acepta
     *   {@link TransportOptions} y devuelve un {@link ITransport}.
     * @throws {Error} Si `name` colisiona con un built-in del registry.
     *
     * @example
     * tm.register('datadog', DatadogTransport);
     * tm.add({ target: 'datadog', options: { apiKey: env('DD_KEY') } });
     *
     * @see {@link listRegistered}
     */
    register(name: string, ctor: TransportConstructor): void {
        if (BUILTIN_REGISTRY.has(name)) {
            throw new Error(`TransportManager.register: '${name}' is a built-in and cannot be overridden`);
        }
        this.registry.set(name, ctor);
    }

    /**
     * Lista los nombres de transports registrados en esta instancia
     * (built-ins + customs añadidos vía {@link register}).
     *
     * @returns {string[]} Nombres registrados. Incluye siempre los cuatro
     *   built-ins.
     *
     * @example
     * tm.register('loki', LokiTransport);
     * tm.listRegistered(); // ['console', 'file', 'http', 'otlp', 'loki']
     */
    listRegistered(): string[] {
        return [...this.registry.keys()];
    }

    /**
     * Añade un transport al set activo y devuelve su id opaco.
     *
     * Acepta dos formas de `target`:
     *   - **string**: se resuelve contra el registry (built-ins + customs
     *     vía {@link register}). Lanza si el nombre no existe, listando los
     *     registrados para facilitar el debug.
     *   - **ITransport instancia**: se registra tal cual, sin pasar por el
     *     registry. Útil para transports one-off o cuya configuración no
     *     encaja en un constructor reutilizable.
     *
     * El `level` (explícito en el target o `defaultLevel` del manager) fija
     * el filtro por transport — los records con `levelValue` inferior se
     * descartan en {@link write}. El `transform` opcional de
     * {@link TransportOptions} se aplica por transport antes de delegar al
     * `write` concreto.
     *
     * @param {TransportTarget} target - Especificación del transport a añadir.
     * @returns {string} Id opaco del transport añadido. Úsalo con
     *   {@link remove}; aparece en {@link list}.
     * @throws {Error} Si `target.target` es un string no presente en el
     *   registry.
     *
     * @example
     * // Por nombre (built-in o custom registrado)
     * const id = tm.add({ target: 'console' });
     *
     * @example
     * // Instancia directa con nivel y transform propios
     * const id = tm.add({
     *   target: new MyTransport(),
     *   level: 'warn',
     *   options: { transform: r => r.level === 'debug' ? null : r }
     * });
     *
     * @see {@link TransportTarget}
     */
    add(target: TransportTarget): string {
        const id = generateTransportId();
        const level = target.level || this.defaultLevel;

        let transport: ITransport;

        if (typeof target.target === 'string') {
            const ctor = this.registry.get(target.target);
            if (!ctor) {
                throw new Error(
                    `TransportManager.add: unknown transport name '${target.target}'. ` +
                    `Registered: ${this.listRegistered().join(', ')}`
                );
            }
            transport = new ctor(target.options ?? {});
        } else {
            transport = target.target;
        }

        const entry: TransportEntry = {
            id,
            transport,
            options: target.options || {},
            level,
            levelValue: LOG_LEVELS[level]
        };

        this.transports.set(id, entry);
        return id;
    }

    /**
     * Elimina un transport del set por su id. Si el transport expone
     * `close()`, lo invoca para liberar recursos (timers, sockets, file
     * handles). Si `close()` devuelve una Promise, su eventual rechazo se
     * ignora de forma best-effort — los errores de close durante la
     * remoción no se propagan al caller.
     *
     * @param {string} id - Id devuelto por {@link add}.
     * @returns {boolean} `true` si había un transport con ese id (y se
     *   eliminó), `false` si el id no existía.
     *
     * @example
     * const id = tm.add({ target: 'file', options: { path: './app.log' } });
     * tm.remove(id); // true — FileTransport.close() se invoca
     */
    remove(id: string): boolean {
        const entry = this.transports.get(id);
        if (entry) {
            const closeResult = entry.transport.close?.();
            if (closeResult instanceof Promise) {
                void closeResult.catch(() => {
                    // los fallos de close son best-effort durante remove
                });
            }
            return this.transports.delete(id);
        }
        return false;
    }

    /**
     * Dispatcha un {@link TransportRecord} a todos los transports activos
     * que pasen el filtro de nivel.
     *
     * Por cada transport, en orden:
     *   1. **Filtro de nivel**: si `record.levelValue < entry.levelValue`,
     *      se skipa (ese transport no recibe este record).
     *   2. **Transform**: si `entry.options.transform` está seteado, se
     *      aplica al record. Si devuelve `null`, el record se droppea para
     *      este transport (no para los demás).
     *   3. **Write**: se llama a `transport.write(transformedRecord)`. Si
     *      devuelve una Promise, se añade al batch await. Toda excepción
     *      sincrónica o rechazo de Promise se captura y se loguea por
     *      consola — el log call original del caller nunca rompe por un
     *      transport roto.
     *
     * El método es async: retorna después de que todos los transports hayan
     * resuelto (o fallado) su write. Para fire-and-forget desde el Logger,
     * el caller puede ignorar la Promise.
     *
     * @param {TransportRecord} record - Record a dispatchar.
     * @returns {Promise<void>} Resuelve cuando todos los writes terminaron
     *   (exitosos o fallidos). Nunca rechaza.
     *
     * @example
     * await tm.write({
     *   level: 'info', levelValue: 1, severityNumber: 9, severityText: 'INFO',
     *   time: Date.now(), msg: 'boot ok'
     * });
     *
     * @see {@link TransportRecord}
     */
    async write(record: TransportRecord): Promise<void> {
        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (record.levelValue < entry.levelValue) {
                continue;
            }

            let transformedRecord: TransportRecord = record;
            if (entry.options.transform) {
                const result = entry.options.transform(record);
                if (result === null) continue;
                transformedRecord = result;
            }

            try {
                const result = entry.transport.write(transformedRecord);
                if (result instanceof Promise) {
                    promises.push(
                        result.catch(err => {
                            // Surfear los fallos de write por consola (sin drop silencioso)
                            // sin throwear — el path principal del logger se queda sync.
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.write: transport failed:', err);
                        })
                    );
                }
            } catch (error) {
                // Los errores sincrónicos de write se surfean pero nunca rompen el log call.
                // eslint-disable-next-line no-console
                console.error('TransportManager.write: transport threw synchronously:', error);
            }
        }

        await Promise.all(promises);
    }

    /**
     * Flushea todos los transports que expongan `flush()` (buffered transports
     * como {@link HttpTransport}, {@link FileTransport}, {@link OtlpTransport}).
     * Los transports sin `flush()` (p.ej. {@link ConsoleTransport}) se
     * skipan sin error.
     *
     * Errores de flush (sync throw o Promise rejection) se capturan y
     * loguean por consola — nunca propagan al caller. Útil para forzar el
     * envío del batch pendiente antes de un graceful shutdown.
     *
     * @returns {Promise<void>} Resuelve cuando todos los flushes terminaron.
     *
     * @example
     * await tm.flush();
     */
    async flush(): Promise<void> {
        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.flush) {
                try {
                    const result = entry.transport.flush();
                    if (result instanceof Promise) {
                        promises.push(result.catch(err => {
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.flush: transport failed:', err);
                        }));
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('TransportManager.flush: transport threw synchronously:', error);
                }
            }
        }

        await Promise.all(promises);
    }

    /**
     * Shutdown ordenado: flushea todos los transports buffered, luego
     * invoca `close()` en cada uno, y finalmente limpia el set interno.
     * Tras esto la instancia queda sin transports — reusarla requiere
     * `add()` de nuevo.
     *
     * Los errores de close (sync throw o Promise rejection) se capturan y
     * loguean — nunca propagan al caller.
     *
     * @returns {Promise<void>} Resuelve cuando flush + close de todos los
     *   transports terminaron.
     *
     * @example
     * // Shutdown limpio del proceso
     * process.on('SIGTERM', async () => {
     *   await logger.getTransportManager()?.close();
     *   process.exit(0);
     * });
     */
    async close(): Promise<void> {
        await this.flush();

        const promises: Promise<unknown>[] = [];

        for (const entry of this.transports.values()) {
            if (entry.transport.close) {
                try {
                    const result = entry.transport.close();
                    if (result instanceof Promise) {
                        promises.push(result.catch(err => {
                            // eslint-disable-next-line no-console
                            console.error('TransportManager.close: transport failed:', err);
                        }));
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('TransportManager.close: transport threw synchronously:', error);
                }
            }
        }

        await Promise.all(promises);
        this.transports.clear();
    }

    /**
     * Número de transports actualmente en el set activo.
     *
     * @returns {number}
     *
     * @example
     * if (tm.count === 0) console.warn('no transports configured');
     */
    get count(): number {
        return this.transports.size;
    }

    /**
     * Lista los ids opacos de los transports actualmente activos.
     *
     * @returns {string[]} Array de ids (mismo formato opaco que devolvió
     *   {@link add}).
     *
     * @example
     * for (const id of tm.list()) {
     *   console.log('removing transport', id);
     *   tm.remove(id);
     * }
     */
    list(): string[] {
        return Array.from(this.transports.keys());
    }
}