---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / renderHeader

# Function: renderHeader()

> **renderHeader**(`title`, `subtitle?`): `string`

Defined in: [playground/header.ts:30](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/header.ts#L30)

Renderiza un header de sección: `title` en bold seguido opcionalmente de
`subtitle` en dim (ANSI `2`), ideal para marcar bloques en output de CLI.
No usa colores de foreground — sólo atributos de texto, así que el renderer
es seguro para cualquier terminal sin importar la paleta del theme activo.

## Parameters

### title

`string`

Texto principal del header (siempre en bold).

### subtitle?

`string`

Texto secundario a la derecha del título; se renderiza
  dimmed y separado por un espacio. Omitir si no aplica.

## Returns

`string`

String de una línea con formato `  <bold>title</bold> <dim>subtitle</dim>`.

## Examples

```ts
process.stdout.write(renderHeader('Deploy', 'production · us-east-1') + '\n');
//   **Deploy** production · us-east-1   (con atributos ANSI aplicados)
```

```ts
// Header sin subtítulo
process.stdout.write(renderHeader('Build summary') + '\n');
```
