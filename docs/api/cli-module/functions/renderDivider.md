---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / renderDivider

# Function: renderDivider()

> **renderDivider**(`width?`): `string`

Defined in: [playground/divider.ts:32](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/divider.ts#L32)

Renderiza una línea divisoria horizontal dimmed (ANSI `2`) usando el
caracter `─`. Por defecto el ancho es `min(terminalWidth - 4, 60)` para
no ocupar todo el ancho de ventana y quedar visualmente alineado con otros
primitives (box, header, table) que dejan 2 espacios de indentación.

## Parameters

### width?

`number`

Ancho explícito en columnas visibles. Si se omite, se calcula
  automáticamente a partir del ancho del terminal (capped a 60).

## Returns

`string`

String de una línea con `width` caracteres `─` envueltos en ANSI dim.

## Examples

```ts
// Divider automático (respeta el ancho del terminal)
process.stdout.write(renderDivider() + '\n');
```

```ts
// Divider de ancho fijo para alinear con otra salida
process.stdout.write(renderDivider(40) + '\n');
```

## See

[getTerminalWidth](../../index/functions/getTerminalWidth.md) para la detección de ancho cuando `width` se omite.
