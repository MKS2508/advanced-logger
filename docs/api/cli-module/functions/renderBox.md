---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / renderBox

# Function: renderBox()

> **renderBox**(`content`, `options?`, `colorCap?`): `string`

Defined in: [playground/box.ts:68](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/box.ts#L68)

Renderiza `content` envuelto en un box con borde Unicode, respetando el
ancho del terminal. El ancho interno se calcula a partir de la l\u00ednea m\u00e1s
larga (o del [IBoxOptions.title](../../index/interfaces/IBoxOptions.md#title) si es m\u00e1s ancho) y se acota a
`min(terminalWidth - 4, 80)` columnas para no romper layouts estrechos.

El padding se aplica como l\u00edneas vac\u00edas sim\u00e9tricas arriba/abajo del
contenido. Si `borderColor` se omite o `colorCap` es `'none'`, el borde se
emite sin secuencias ANSI (output plain-text seguro para logs y pipes).

## Parameters

### content

`string`

Texto a envolver; puede contener m\u00faltiples l\u00edneas (`\n`) y
  secuencias ANSI embebidas \u2014 el c\u00e1lculo de ancho usa el largo visible.

### options?

[`IBoxOptions`](../../index/interfaces/IBoxOptions.md) = `{}`

Configuraci\u00f3n del box (title, borderColor, borderStyle,
  padding). Ver [IBoxOptions](../../index/interfaces/IBoxOptions.md).

### colorCap?

`ColorCapability` = `'full'`

Capacidad de color del terminal destino. Si es `'none'`,
  se omite cualquier secuencia ANSI.

## Returns

`string`

String multilinea con el box ya construido (sin trailing newline).

## Examples

```ts
// Box b\u00e1sico con borde redondeado (default)
process.stdout.write(renderBox('Deploy completado') + '\n');
```

```ts
// Box con t\u00edtulo embebido en el borde superior y color custom
process.stdout.write(renderBox('Service: auth-svc\nStatus: healthy', {
  title: 'Health Check',
  borderColor: '#00bcd4',
  borderStyle: 'double',
  padding: 1
}) + '\n');
```

## See

 - [IBoxOptions](../../index/interfaces/IBoxOptions.md) para el detalle de cada opci\u00f3n.
 - [getTerminalWidth](../../index/functions/getTerminalWidth.md) para la detecci\u00f3n de ancho.
