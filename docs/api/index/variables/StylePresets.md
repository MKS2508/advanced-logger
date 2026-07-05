---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / StylePresets

# Variable: StylePresets

> `const` **StylePresets**: `object`

Defined in: [styling/StyleBuilder.ts:610](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L610)

Catálogo de factories de estilos pre-armados para los casos de uso más
comunes en logging: un preset por severity (`success`/`error`/`warning`/
`info`/`debug`), uno para texto secundario (`muted`), uno para tags
neutros (`accent`) y uno decorativo (`neon`).

Cada preset es una función zero-arg que devuelve un [StyleBuilder](../classes/StyleBuilder.md)
nuevo, ya configurado y listo para `.build()` o para extender con más
reglas antes del build. El patrón factory evita compartir estado entre
llamadas: cada invocación es independiente.

## Type Declaration

### success

> **success**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para severity "success" (operación completada OK). Gradiente
verde → verde oscuro, texto blanco, badge con padding/bold/radius
estándar.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo verde de éxito.

#### Example

```ts
console.log('%c LOGIN OK ', StylePresets.success().build());
```

### error

> **error**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para severity "error" (fallo que requiere atención). Gradiente
rosa → rojo intenso, texto blanco, badge bold para destacar sobre
el resto de la línea.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo rojo de error.

#### Example

```ts
console.log('%c DB DOWN ', StylePresets.error().build());
```

### warning

> **warning**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para severity "warning" (situación recuperable pero a vigilar).
Gradiente ámbar → naranja cálido, texto oscuro (`#2d3436`) para
mantener contraste sobre fondo claro.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo ámbar de advertencia.

#### Example

```ts
console.log('%c RATE LIMIT ', StylePresets.warning().build());
```

### info

> **info**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para severity "info" (mensaje informativo, flujo normal).
Gradiente azul claro → azul medio, texto blanco, badge estándar.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo azul informativo.

#### Example

```ts
console.log('%c USER LOGIN ', StylePresets.info().build());
```

### debug

> **debug**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para severity "debug" (traza de diagnóstico, normalmente
oculta en producción). Gradiente índigo → púrpura, distinto del
azul de `info` para que se distinga visualmente.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo púrpura de debug.

#### Example

```ts
console.log('%c CACHE MISS ', StylePresets.debug().build());
```

### muted

> **muted**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para texto secundario (timestamps, metadatos, contexto
auxiliar). Sin fondo, color gris y font monospace pequeño (`12px`):
pensado para que el ojo lo lea como "de apoyo" y no compita con el
severity principal.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo gris monoespaciado y reducido.

#### Example

```ts
console.log('%c 2026-01-01T12:00:00Z ', StylePresets.muted().build());
```

### accent

> **accent**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset para tags neutros sobre fondo claro (categorías, IDs, labels
que no son severity). Fondo gris muy claro, texto gris medio, borde
sutil y padding más ajustado que los presets de severity para que
conviva visualmente con ellos.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo "chip" neutro con borde.

#### Example

```ts
console.log('%c svc:auth ', StylePresets.accent().build());
```

### neon

> **neon**: () => [`StyleBuilder`](../classes/StyleBuilder.md)

Preset decorativo neón (gradiente azul oscuro → rojo coral con halo
cyan). Pensado para banners o highlights puntuales que quieren llamar
la atención por estética, no por severity. El `box-shadow` con alfa
baja genera el glow característico.

#### Returns

[`StyleBuilder`](../classes/StyleBuilder.md)

Estilo neón con sombra glow.

#### Example

```ts
console.log('%c ★ BANNER ★ ', StylePresets.neon().build());
```

## Examples

```ts
// Usar un preset tal cual
console.log('%c OK ', StylePresets.success().build());
```

```ts
// Extender un preset con reglas extra antes de materializar
const css = StylePresets.info()
  .custom('text-shadow', '0 1px 0 rgba(0,0,0,0.3)')
  .build();
```

## See

[StyleBuilder](../classes/StyleBuilder.md) para la API completa de reglas encadenables.
