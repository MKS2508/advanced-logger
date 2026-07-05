---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / renderStep

# Function: renderStep()

> **renderStep**(`current`, `total`, `msg`, `colorCap`): `string`

Defined in: [playground/step.ts:34](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/step.ts#L34)

Renderiza un indicador de progreso de step con el formato `  [n/total] msg`,
donde el `[n/total]` se emite en cian bold (respetando `colorCap`) para
destacarlo del mensaje descriptivo. Pensado para output secuencial de CLI
tipo "steps de un build", "fases de un deploy" o "tareas de un script".

No hace ningún chequeo de rango sobre `current`/`total` — el caller es
responsable de pasar valores coherentes (se renderizan tal cual).

## Parameters

### current

`number`

Número de step actual (típicamente 1-based).

### total

`number`

Total de steps del proceso.

### msg

`string`

Descripción corta del step en curso.

### colorCap

`ColorCapability`

Capacidad de color del terminal destino. Si es `'none'`,
  el label `[n/total]` se emite sin color.

## Returns

`string`

String de una sola línea con formato `  [n/total] msg`.

## Example

```ts
const steps = ['Resolving deps', 'Bundling', 'Writing dist'];
steps.forEach((step, i) => {
  process.stdout.write(renderStep(i + 1, steps.length, step, 'full') + '\n');
});
//   [1/3] Resolving deps
//   [2/3] Bundling
//   [3/3] Writing dist
```
