---
layout: default
title: Serializers
permalink: /serializers/
---

# 🧬 Serializers

## Qué son

Los **serializers** son transformadores tipados que convierten instancias de clases
(`Error`, `Date`, `Map`, `Set`, `Buffer`, o tus propias clases) a representaciones
seguras antes de que el valor llegue al `TransportRecord`. Sin serializers, un `Map`
se loguea como `{}` al pasar por `JSON.stringify`, y un `Error` pierde el stack.

El registry hace matching por **constructor mediante `instanceof`**, ordenado por
`priority` (mayor gana primero). Esto permite registrar un serializer para `TypeError`
que matchee antes que el de `Error`.

Cuando usar serializers:

- Una clase de dominio (`User`, `Session`) que necesita redactar campos sensibles.
- Un tipo nativo (`Map`/`Set`/`Buffer`) que se rompe al serializar a JSON.
- Errores con stack traza enorme que quieres compactar a las N líneas más relevantes.
- Cualquier valor cuyo `toString()` no refleja su estado real.

## Defaults registrados

El `SerializerRegistry` arranca con serializers builtin cubriendo los tipos que
tradicionalmente se rompen al loguearlos:

| Tipo     | Priority | Salida                                            |
|----------|----------|---------------------------------------------------|
| `Error`  | 100      | `{ name, message, stack[], cause? }` (top-10)     |
| `Date`   | 90       | `{ iso, timestamp }`                              |
| `RegExp` | 90       | `{ pattern, flags }`                              |
| `Map`    | 80       | `{ __type:'Map', entries }`                       |
| `Set`    | 80       | `{ __type:'Set', values[] }`                      |
| `Buffer` | 70       | `{ __type:'Buffer', length, preview }` (Node)     |

`Buffer` sólo se registra cuando está disponible (runtime Node). Los defaults cubren
la mayoría de casos; registra los tuyos para tipos de dominio.

## addSerializer

Registra (o reemplaza) el serializer para una clase constructora. El `priority`
sólo ordena el lookup por `instanceof`; útil cuando una subclass debe matchear antes
que su superclass (`TypeError` antes que `Error`).

Vía la instancia del Logger (default `priority: 50`):

```typescript
import logger from '@mks2508/better-logger';

// Compactar Error stacks a las 5 primeras líneas
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 5),
}));

// Redactar PII: User sin password
class User {
  constructor(public id: string, public email: string, public password: string) {}
}

logger.addSerializer(User, (user) => ({
  id: user.id,
  email: user.email,
  // password omitida
}));

logger.error('login failed:', new Error('timeout'));
// → stack compacto a 5 líneas en vez de la traza completa
```

Hay también exports funcionales que operan sobre el logger singleton:

```typescript
import { addSerializer } from '@mks2508/better-logger';
addSerializer(User, (u) => ({ id: u.id, email: u.email }));
```

Ejemplo con prioridad explícita para que una subclass gane sobre la superclass:

```typescript
class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// priority 110 > 100 del default de Error → ApiError matchea primero
logger.addSerializer(ApiError, (err) => ({
  code: err.code,
  message: err.message,
}), 110);
```

## removeSerializer / getSerializerRegistry

```typescript
// Elimina el serializer de un tipo
logger.removeSerializer(Error); // → true (estaba registrado por defecto)
logger.removeSerializer(Error); // → false (ya no está)

// Accede al registry subyacente para operaciones avanzadas
const registry = logger.getSerializerRegistry();
console.log(registry.getAll().map(e => [e.type.name, e.priority]));
// [['Error', 100], ['Date', 90], ['RegExp', 90], ['Map', 80], ...]

registry.has(User);     // → true / false
registry.serialize(someMaybeCyclicObject);  // serialización manual
```

## Config

El `SerializerConfig` controla los tres cortes de seguridad del pipeline:

```typescript
interface SerializerConfig {
  maxDepth: number;          // default 5 — profundidad máxima antes de '[Max Depth]'
  circular: 'placeholder' | 'error' | 'skip';  // default 'placeholder'
  preserveUndefined: boolean;  // default false
}
```

| Opción             | Default       | Comportamiento                                              |
|--------------------|---------------|-------------------------------------------------------------|
| `maxDepth`         | `5`           | Corta la recursión y emite `'[Max Depth]'`                  |
| `circular`         | `'placeholder'` | `'[Circular]'` \| omitir key \| lanzar `Error`            |
| `preserveUndefined`| `false`       | `false` → `'[undefined]'` (más seguro para JSON); `true` → deja `undefined` |

Sobre el registry directo (configura al construir):

```typescript
import { SerializerRegistry } from '@mks2508/better-logger/serializers';

// Estricto: lanza ante ciclo, conservar undefined
const strict = new SerializerRegistry({
  maxDepth: 10,
  circular: 'error',
  preserveUndefined: true,
});
```

Override puntual en una sola llamada (no muta la config del registry):

```typescript
registry.serialize(deepObj, { maxDepth: 2 });
```

## Pipeline interno

El pipeline de `serialize()` aplica guardas en orden; cada una corta la recursión:

1. `null` / `undefined` → directo (respeta `preserveUndefined`).
2. `function` → placeholder `'[Function: name]'`.
3. Primitiva no-objeto → se devuelve tal cual.
4. **Depth guard**: si `depth >= maxDepth` → `'[Max Depth]'`.
5. **Circular ref**: si el valor ya está en el `WeakSet` `seen` del path actual
   → aplica `circular` (`'[Circular]'` por defecto).
6. Lookup por `instanceof` en orden de `priority` descendente; si matchea, delega
   (el serializer puede recursar vía `ctx`).
7. Arrays → mapea cada item incrementando depth y extendiendo path.
8. Plain objects → itera keys recursivamente.

Ejemplo visible de los placeholders:

```typescript
const o: any = {};
o.self = o;
registry.serialize(o);
// → { self: '[Circular]' }

registry.serialize([[[[[[[[]]]]]]]]);  // con maxDepth 5
// → [ [ [ [ [ '[Max Depth]' ] ] ] ] ]
```

## Subpath `./serializers`

El subpath `./serializers` expone la API de registry/bridge para uso avanzado
(crear tu propio registry independiente en vez de usar el singleton del Logger):

```typescript
import {
  SerializerRegistry,
  getDefaultSerializerRegistry,
  createSerializerBridge,
} from '@mks2508/better-logger/serializers';

// Registry singleton compartido por el Logger
const reg = getDefaultSerializerRegistry();
if (!reg.has(CustomError)) {
  reg.add(CustomError, (e) => ({ code: e.code, message: e.message }), 95);
}

// Bridge aislado (registry nuevo, no afecta al Logger)
const bridge = createSerializerBridge();
bridge.addSerializer(User, (u) => ({ id: u.id, email: u.email }));
bridge.getSerializerRegistry().serialize(someValue);
```

## Casos de uso

### Redactar PII antes de loguear

El caso típico: una entidad de dominio con `password`, `token`, `ssn` que nunca
debe llegar al log ni al transporte remoto.

```typescript
class Session {
  constructor(
    public userId: string,
    public token: string,        // sensible
    public ipAddress: string,
  ) {}
}

logger.addSerializer(Session, (s) => ({
  userId: s.userId,
  token: '<redacted>',
  ip: s.ipAddress,
}));

logger.info('session started', session);
// → { userId: 'u_123', token: '<redacted>', ip: '10.0.0.1' }
```

### Compactar Error stacks en producción

El default recorta a 10 líneas. En producción muchas veces quieres menos:

```typescript
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 3),
  ...(err.cause ? { cause: err.cause } : {}),
}), 100);
```

### Serializar Map / Set a JSON-compatible

Los defaults ya cubren esto, pero si necesitas otra shape (p.ej. solo valores
de un `Map<string, V>` sin las keys stringificadas):

```typescript
logger.addSerializer(Map, (map: Map<string, unknown>) => ({
  __type: 'Map',
  values: Array.from(map.values()),
}), 85);  // gana sobre el default priority 80
```

### Logging seguro de objetos potencialmente circulares

Si logueas árboles DOM, grafo de reactivo, o estructuras mutuamente referenciadas,
el circular-ref guard evita el stack overflow sin que tengas que sanitizar a mano:

```typescript
const a: any = { name: 'A' };
const b: any = { name: 'B', parent: a };
a.child = b;
logger.info('graph', a);  // → { name: 'A', child: { name: 'B', parent: '[Circular]' } }
```

## Referencia API

- Clase: [`SerializerRegistry`](../docs/api/serializers-module/classes/SerializerRegistry.md)
- Función: [`getDefaultSerializerRegistry`](../docs/api/serializers-module/functions/getDefaultSerializerRegistry.md)
- Métodos del Logger: `addSerializer`, `removeSerializer`, `getSerializerRegistry`
  en [`Logger`](../docs/api/index/classes/Logger.md)

> `createSerializerBridge` y la interface `SerializerBridge` están marcados
> `@internal`: se exportan desde el subpath `./serializers` para uso avanzado pero
> TypeDoc no los documenta. Si los usas, consulta `src/serializers/SerializerBridge.ts`.
