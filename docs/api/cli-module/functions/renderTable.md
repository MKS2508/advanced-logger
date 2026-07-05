---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / renderTable

# Function: renderTable()

> **renderTable**(`rows`, `options?`, `colorCap?`): `string`

Defined in: [playground/cli-table.ts:53](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/cli-table.ts#L53)

Renderiza un array de objetos como tabla ASCII alineada, con headers en
cian bold y separador (`─`) bajo la cabecera. Las columnas se autodetectan
a partir de las keys del primer row salvo que `options.columns` las imponga,
y los labels se toman de `options.head` (default: nombres de columna).

El ancho de cada columna se calcula como `max(header, valor más largo) + 2`
para garantizar padding horizontal consistente. Si `colorCap` es `'none'`,
se omiten todas las secuencias ANSI (útil para logs plain-text o CI).

## Parameters

### rows

`Record`\<`string`, `unknown`\>[]

Array de row objects. Un array vacío devuelve string vacío.

### options?

[`ITableOptions`](../../index/interfaces/ITableOptions.md) = `{}`

Ver [ITableOptions](../../index/interfaces/ITableOptions.md) para `columns` y `head`.

### colorCap?

`ColorCapability` = `'full'`

Capacidad de color del terminal destino.

## Returns

`string`

String multilinea con la tabla (header + separator + data rows),
  o `''` si `rows` está vacío.

## Examples

```ts
// Auto-detect columnas desde las keys del primer row
const rows = [
  { service: 'auth', status: 'healthy', latency: 12 },
  { service: 'api',  status: 'degraded', latency: 245 }
];
process.stdout.write(renderTable(rows) + '\n');
// ┌─────────┬──────────┬─────────┐
// │ service │ status   │ latency │
// ─────────────────────────────────
// │ auth    │ healthy  │ 12      │
// │ api     │ degraded │ 245     │
```

```ts
// Forzar columnas y renombrar headers
process.stdout.write(renderTable(rows, {
  columns: ['service', 'latency'],
  head:    ['Service', 'Latency (ms)']
}, 'none') + '\n');
```

## See

 - [ITableOptions](../../index/interfaces/ITableOptions.md) para las opciones disponibles.
 - getVisibleLength y padToWidth para el cálculo de ancho.
