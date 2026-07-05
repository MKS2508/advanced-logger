---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [serializers-module](../README.md) / SerializerRegistry

# Class: SerializerRegistry

Defined in: [serializers/SerializerRegistry.ts:59](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L59)

Registry de serializers tipados por constructor.

Mantiene un mapa ordenado por `priority` (mayor primero) de serializers
registrados para clases específicas. El método [SerializerRegistry.serialize](#serialize)
recorre objetos de forma recursiva aplicando el serializer que matchee por
`instanceof`, con dos guardas de seguridad:

- **Depth guard**: corta la recursión al llegar a `maxDepth` y emite el
  placeholder `'[Max Depth]'`.
- **Circular ref**: lleva un `WeakSet` de objetos visitados en el path actual;
  al re-encontrar uno aplica la estrategia de `circular` (`placeholder` por
  default).

Implementa [ISerializerRegistry](../../index/interfaces/ISerializerRegistry.md). Suele usarse vía el singleton de
[getDefaultSerializerRegistry](../functions/getDefaultSerializerRegistry.md), expuesto al Logger a través del
SerializerBridge.

## Example

```ts
const registry = new SerializerRegistry({ maxDepth: 3 });

registry.add(URL, (url: URL) => ({
  href: url.href,
  origin: url.origin
}), 60);

const safe = registry.serialize(someMaybeCyclicObject);
```

## See

 - [ISerializerRegistry](../../index/interfaces/ISerializerRegistry.md) para el contrato interface.
 - [SerializerConfig](../../index/interfaces/SerializerConfig.md) para las opciones del constructor.

## Implements

- [`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md)

## Constructors

### Constructor

> **new SerializerRegistry**(`config?`): `SerializerRegistry`

Defined in: [serializers/SerializerRegistry.ts:90](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L90)

Crea un registry nuevo con los serializers builtin ya registrados
(Error, Date, RegExp, Map, Set, Buffer cuando está disponible).

#### Parameters

##### config?

[`SerializerConfig`](../../index/interfaces/SerializerConfig.md) = `{}`

Overrides sobre DEFAULT\_CONFIG.
  - `maxDepth` (default `5`): profundidad máxima de anidamiento antes del
    placeholder `'[Max Depth]'`.
  - `circular` (default `'placeholder'`): qué hacer ante una referencia
    circular. `'placeholder'` emite `'[Circular]'`, `'skip'` omite la key
    (devuelve `undefined`), `'error'` lanza.
  - `preserveUndefined` (default `false`): si `true` deja `undefined`
    textual; si `false` lo reemplaza por `'[undefined]'` (más seguro para
    JSON / transporte).

#### Returns

`SerializerRegistry`

#### Example

```ts
// Defaults (depth 5, circular → placeholder)
const a = new SerializerRegistry();

// Estricto: lanza ante ciclo, conservar undefined
const b = new SerializerRegistry({
  maxDepth: 10,
  circular: 'error',
  preserveUndefined: true
});
```

## Methods

### add()

> **add**\<`T`\>(`type`, `serializer`, `priority?`): `void`

Defined in: [serializers/SerializerRegistry.ts:187](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L187)

Registra (o reemplaza) el serializer para una clase constructora.

Si ya existía un serializer para `type`, se sobrescribe. La `priority`
sólo ordena de cara al lookup por `instanceof` hecho en
[SerializerRegistry.getAll](#getall) — útil cuando una subclass debería
matchear antes que su superclass (p.ej. `TypeError` antes que `Error`).

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

Constructor de la clase a matchear.

##### serializer

[`SerializerFn`](../../index/type-aliases/SerializerFn.md)\<`T`\>

Función que recibe la instancia y el
  [SerializerContext](../../index/interfaces/SerializerContext.md) (depth, path, seen); devuelve una representación
  serializable.

##### priority?

`number` = `50`

Orden de lookup (mayor = primero). Los
  defaults builtin usan 70–100.

#### Returns

`void`

#### Example

```ts
registry.add(
  URL,
  (url: URL, ctx) => ({ href: url.href, origin: url.origin }),
  60
);
```

#### Implementation of

[`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md).[`add`](../../index/interfaces/ISerializerRegistry.md#add)

***

### remove()

> **remove**\<`T`\>(`type`): `boolean`

Defined in: [serializers/SerializerRegistry.ts:207](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L207)

Elimina el serializer registrado para `type`.

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

Constructor a remover.

#### Returns

`boolean`

`true` si existía y fue removido, `false` si no había registro.

#### Example

```ts
registry.remove(Date); // → true (estaba registrado por defecto)
registry.remove(Date); // → false (ya no está)
```

#### Implementation of

[`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md).[`remove`](../../index/interfaces/ISerializerRegistry.md#remove)

***

### has()

> **has**\<`T`\>(`type`): `boolean`

Defined in: [serializers/SerializerRegistry.ts:224](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L224)

Indica si hay un serializer registrado para `type`.

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

Constructor a consultar.

#### Returns

`boolean`

`true` si `type` está registrado.

#### Example

```ts
if (!registry.has(CustomError)) {
  registry.add(CustomError, serializeCustomError, 95);
}
```

#### Implementation of

[`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md).[`has`](../../index/interfaces/ISerializerRegistry.md#has)

***

### getAll()

> **getAll**(): `SerializerEntry`\<`any`\>[]

Defined in: [serializers/SerializerRegistry.ts:244](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L244)

Devuelve todas las entradas registradas, ordenadas por `priority`
descendente (mayor priority primero). Este es el orden en el que
[SerializerRegistry.serialize](#serialize) los prueba vía `instanceof`.

#### Returns

`SerializerEntry`\<`any`\>[]

Array de entradas ordenadas por prioridad.

#### Example

```ts
const entries = registry.getAll();
console.log(entries.map(e => [e.type.name, e.priority]));
// [['Error', 100], ['Date', 90], ['RegExp', 90], ['Map', 80], ...]
```

#### See

SerializerEntry

#### Implementation of

[`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md).[`getAll`](../../index/interfaces/ISerializerRegistry.md#getall)

***

### serialize()

> **serialize**(`value`, `config?`): `any`

Defined in: [serializers/SerializerRegistry.ts:380](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/serializers/SerializerRegistry.ts#L380)

Serializa un valor arbitrario a una representación segura para transporte
(JSON, remote log, OTLP, etc.).

Entry point público del pipeline. Construye un [SerializerContext](../../index/interfaces/SerializerContext.md)
fresco (depth 0, path vacío, `WeakSet` nuevo para detección de ciclos),
merguea overrides de `config` sobre los del constructor y delega a
SerializerRegistry.serializeInternal.

#### Parameters

##### value

`any`

Valor a serializar. Cualquier tipo.

##### config?

[`SerializerConfig`](../../index/interfaces/SerializerConfig.md)

Overrides puntuales para esta llamada
  (no mutan la config del registry). Útil para, p.ej., subir `maxDepth`
  sólo en un log concreto.

#### Returns

`any`

Valor serializable. Para objetos sin serializer registrado
  se devuelve un plain object; para tipos builtin, la shape definida en
  SerializerRegistry.registerDefaults; para los cortes de
  profundidad o circular, los placeholders `'[Max Depth]'` / `'[Circular]'`.

#### Throws

Sólo si `circular: 'error'` y se detecta una referencia circular.

#### Example

```ts
// Objetos simples
registry.serialize({ a: 1, b: [2, 3] });
// → { a: 1, b: [2, 3] }

// Errores (serializer builtin)
registry.serialize(new Error('boom'));
// → { name: 'Error', message: 'boom', stack: [...] }

// Referencia circular → placeholder
const o: any = {};
o.self = o;
registry.serialize(o); // → { self: '[Circular]' }

// Override puntual de maxDepth
registry.serialize(deepObj, { maxDepth: 2 });
```

#### See

SerializerRegistry.serializeInternal para el detalle del pipeline.

#### Implementation of

[`ISerializerRegistry`](../../index/interfaces/ISerializerRegistry.md).[`serialize`](../../index/interfaces/ISerializerRegistry.md#serialize)
