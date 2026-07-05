---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / StyleBuilder

# Class: StyleBuilder

Defined in: [styling/StyleBuilder.ts:43](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L43)

Constructor fluido de estilos CSS orientado al `%c`-formatting del
DevTools console.

Cada método empuja una declaración CSS a un buffer interno y retorna
`this`, lo que permite encadenar llamadas para componer un estilo
completo en una sola expresión. El string final se materializa con
[StyleBuilder.build](#build), que une todas las declaraciones con `"; "`
— exactamente el formato que espera `console.log("%c...", style)`.

Está pensado como bloque base de la capa de styling del logger: los
[StylePresets](../variables/StylePresets.md) se construyen con esta clase, y el proxy exportado
`$` no es más que una instancia fresca expuesta vía `Proxy` para
usarse ad-hoc sin instanciar manualmente.

## Examples

```ts
// Estilo inline para un solo log
const banner = new StyleBuilder()
  .bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
  .color('#ffffff')
  .padding('4px 8px')
  .rounded('4px')
  .bold()
  .build();
console.log('%c MiApp ', banner);
```

```ts
// Clonar + variar sin mutar el builder original (útil para
// compartir una base entre variantes de badge)
const base = new StyleBuilder().padding('2px 6px').rounded('3px');
const ok = base.clone().color('#00b894').build();
const warn = base.clone().color('#fdcb6e').build();
```

## See

 - [StylePresets](../variables/StylePresets.md) para presets listos (success, error, warning, ...).
 - $ para el proxy global reutilizable sin instanciar.

## Constructors

### Constructor

> **new StyleBuilder**(`baseStyle?`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:58](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L58)

Crea un builder opcionalmente inicializado con una declaración CSS
base (p.ej. un fragmento de estilo compartido del que arrancar).

#### Parameters

##### baseStyle?

`string` = `''`

Declaración CSS inicial en formato
`"prop: value"`. Si se omite, el builder arranca vacío y se rellena
vía los métodos chainable.

#### Returns

`StyleBuilder`

#### Example

```ts
const sb = new StyleBuilder('color: #333');
sb.bg('#eee').build(); // => "color: #333; background: #eee"
```

## Methods

### bg()

> **bg**(`background`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:75](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L75)

Define el `background` del estilo. Acepta tanto colores planos
(`#1e1e1e`) como gradientes CSS completos (`linear-gradient(...)`),
que es lo que da el efecto "badge con color" característico del
logger por nivel.

#### Parameters

##### background

`string`

Valor crudo para la propiedad CSS
`background` (color, gradiente o shorthand).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().bg('linear-gradient(135deg, #00b894, #00a085)');
```

***

### color()

> **color**(`color`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:92](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L92)

Define el `color` (color del texto). Es el principal contraste
contra el `background`: en badges con gradiente se suele usar
`#ffffff`, mientras que en logs "muted" se rebaja la opacidad o
se usa un gris (`#6c757d`).

#### Parameters

##### color

`string`

Valor CSS de color (hex, rgb, named, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().bg('#1e1e1e').color('#00ffff');
```

***

### border()

> **border**(`border`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:109](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L109)

Define el shorthand `border`. Útil para tags tipo "outline" sobre
fondos neutros (ver preset `accent`) donde un borde sutil
(`1px solid #dee2e6`) separa el badge del contenido sin saturar.

#### Parameters

##### border

`string`

Shorthand CSS `border` completo
(`"1px solid #dee2e6"`, `"2px dashed #e84393"`, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().border('1px solid #dee2e6').padding('2px 6px');
```

***

### shadow()

> **shadow**(`shadow`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:126](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L126)

Define el `box-shadow`. Se usa sobre todo para efectos neón o de
glow (preset `neon`), donde una sombra con alfa baja
(`0 0 10px rgba(0,255,255,0.5)`) genera el halo alrededor del
badge sin necesidad de animaciones.

#### Parameters

##### shadow

`string`

Shorthand CSS `box-shadow`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().shadow('0 0 10px rgba(0, 255, 255, 0.5)');
```

***

### padding()

> **padding**(`padding`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:142](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L142)

Define el `padding` interno del badge. El valor típico en los
presets del logger es `'4px 8px'` (vertical/horizontal), lo justo
para que el texto respire sin engordar demasiado la línea de log.

#### Parameters

##### padding

`string`

Shorthand CSS `padding`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().padding('4px 8px').rounded('4px');
```

***

### margin()

> **margin**(`margin`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:159](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L159)

Define el `margin` externo. Rara vez se usa en estilos de console
(el flujo del DevTools no respeta margin igual que el DOM), pero
queda expuesto para casos donde se quiera separar visualmente un
bloque de logs contiguos.

#### Parameters

##### margin

`string`

Shorthand CSS `margin`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().margin('0 0 4px 0');
```

***

### rounded()

> **rounded**(`radius?`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:174](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L174)

Define el `border-radius`. Redondea las esquinas del badge para
darle acabado de "pill" / "chip" en lugar de bloque recto.

#### Parameters

##### radius?

`string` = `'4px'`

Valor CSS de `border-radius`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().rounded('999px'); // pill completo
```

***

### bold()

> **bold**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:189](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L189)

Aplica `font-weight: bold`. Marca el texto del badge como enfatizado:
los presets por nivel (`success`, `error`, ...) lo incluyen para que
el severity destaque sobre el resto de la línea de log.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().bg('#e84393').color('#fff').bold();
```

***

### font()

> **font**(`font`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:206](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L206)

Define el `font-family`. Recibe el stack completo (coma-incluido)
tal cual se inyecta en CSS. Para stacks ya probados en DevTools,
preferir los atajos [StyleBuilder.mono](#mono) y
[StyleBuilder.system](#system) en lugar de escribir el stack a mano.

#### Parameters

##### font

`string`

Stack de `font-family` CSS.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().font('"JetBrains Mono", monospace');
```

***

### mono()

> **mono**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:222](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L222)

Atajo de [StyleBuilder.font](#font) con un stack monospace portable
(`Monaco, Consolas, "Courier New", monospace`). Es el stack que usa
el preset `muted` para logs de detalle/auxiliares, donde la
alineación monoespaciada ayuda a escanear tablas y pares k=v.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().mono().size('12px').color('#6c757d');
```

***

### system()

> **system**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:236](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L236)

Atajo de [StyleBuilder.font](#font) con el stack "system-ui" nativo
del SO del usuario. Útil cuando se quiere que el log se integre
visualmente con la UI nativa en lugar de marcar como "técnico".

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().system().size('14px');
```

***

### size()

> **size**(`size`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:252](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L252)

Define el `font-size`. El valor por defecto del DevTools suele ser
suficiente; este método se usa para logs auxiliares (preset `muted`
baja a `12px`) o para encabezados tipo banner donde se sube a
`18px`-`24px`.

#### Parameters

##### size

`string`

Valor CSS de `font-size` (`'12px'`, `'1.1em'`).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().size('20px').bold();
```

***

### lineHeight()

> **lineHeight**(`height`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:268](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L268)

Define el `line-height`. Aplicable cuando un badge envuelve varias
líneas o cuando se quiere controlar la altura visual del bloque de
log para que no "salte" respecto al texto adyacente.

#### Parameters

##### height

`string`

Valor CSS de `line-height` (`'1.4'`, `'20px'`).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().lineHeight('1.5').padding('8px');
```

***

### underline()

> **underline**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:283](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L283)

Aplica `text-decoration: underline`. Útil para resaltar un token
concreto dentro del mensaje (p.ej. un ID o un path) cuando el
`color` por sí solo no basta para marcar jerarquía visual.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().underline().color('#0984e3');
```

***

### uppercase()

> **uppercase**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:298](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L298)

Aplica `text-transform: uppercase`. Convierte el texto a mayúsculas
sin mutar el string original: ideal para tags cortos como severity
(`INFO`, `WARN`) o siglas que conviene leer en bloque.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().uppercase().bold().padding('2px 6px');
```

***

### opacity()

> **opacity**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:316](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L316)

Define la `opacity` global del estilo (0 a 1). Es el mecanismo
recomendado para "apagar" un log sin tener que oscurecer el color
a mano: sobre fondo oscuro, bajar opacity a `0.6` da el efecto
muted sin perder legibilidad del hue.

#### Parameters

##### value

`number`

Valor de opacidad entre `0` (invisible) y
`1` (opaco).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().opacity(0.5).color('#999');
```

***

### display()

> **display**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:335](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L335)

Define la propiedad `display`. Expuesta por completitud: en la
mayoría de estilos de console el `display` del badge es controlado
por el propio DevTools y este setter no tiene efecto visible, pero
queda disponible para casos de render en contenedores DOM reales
(preview components, overlays de playground).

#### Parameters

##### value

`string`

Valor CSS de `display` (`'inline-block'`,
`'flex'`, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().display('inline-block').padding('4px 8px');
```

***

### position()

> **position**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:353](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L353)

Define la propiedad `position`. Mismo alcance que
[StyleBuilder.display](#display): no afecta al flujo normal del
DevTools console, pero queda disponible para estilos que se
reutilizan fuera del console (playground DOM, tests visuales).

#### Parameters

##### value

`string`

Valor CSS de `position` (`'relative'`,
`'absolute'`, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().position('relative').display('inline-block');
```

***

### transform()

> **transform**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:371](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L371)

Define la propiedad `transform`. Permite aplicar traslaciones,
escalados o rotaciones al estilo. Útil en el playground DOM para
micro-interacciones (hover scale, énfasis de banner); en el console
crudo el soporte varía según navegador.

#### Parameters

##### value

`string`

Valor CSS de `transform` (`'scale(1.1)'`,
`'translateY(-2px)'`, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().transform('scale(1.05)');
```

***

### animation()

> **animation**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:388](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L388)

Define la propiedad `animation`. Aplica keyframes definidos en el
contexto de render; en el DevTools console el soporte de animaciones
es limitado y solo se materializa en el playground DOM o en
overlays HTML, no en el flujo plano de logs.

#### Parameters

##### value

`string`

Shorthand CSS `animation`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().animation('pulse 1s ease-in-out infinite');
```

***

### transition()

> **transition**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:405](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L405)

Define la propiedad `transition`. Mismo alcance que
[StyleBuilder.animation](#animation): pensado para el playground DOM,
donde los estilos del logger se reutilizan en elementos que sí
soportan transiciones (hover, focus, state changes).

#### Parameters

##### value

`string`

Shorthand CSS `transition`.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().transition('background 200ms ease');
```

***

### cursor()

> **cursor**(`value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:422](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L422)

Define la propiedad `cursor`. Aplicable cuando el estilo se reutiliza
en elementos interactivos del playground (chips clicables, badges con
tooltip) donde se quiere sugerir affordance de click.

#### Parameters

##### value

`string`

Valor CSS de `cursor` (`'pointer'`,
`'help'`, ...).

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().cursor('pointer').rounded('4px');
```

***

### custom()

> **custom**(`property`, `value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:440](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L440)

Escape hatch para cualquier propiedad CSS que no tenga método
dedicado. Empuja la declaración `property: value` tal cual al
buffer, sin validación — útil para props modernas
(`backdrop-filter`, `clip-path`, `text-shadow`) o vendor prefixes.

#### Parameters

##### property

`string`

Nombre de la propiedad CSS.

##### value

`string`

Valor crudo de la propiedad.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().custom('backdrop-filter', 'blur(8px)');
```

***

### css()

> **css**(`property`, `value`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:457](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L457)

Alias de [StyleBuilder.custom](#custom). Mismo comportamiento exacto,
expuesto solo porque `css(prop, val)` lee mejor como DSL inline
cuando se está encadenando mucho.

#### Parameters

##### property

`string`

Nombre de la propiedad CSS.

##### value

`string`

Valor crudo de la propiedad.

#### Returns

`StyleBuilder`

`this` para encadenar más reglas.

#### Example

```ts
new StyleBuilder().css('letter-spacing', '0.5px');
```

***

### build()

> **build**(): `string`

Defined in: [styling/StyleBuilder.ts:473](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L473)

Materializa el string CSS final uniendo todas las declaraciones
acumuladas con `"; "`. Es el formato exacto que espera el segundo
argumento de `console.log("%c…", style)` — el resultado se puede
pasar directo al logger o al DevTools.

#### Returns

`string`

String CSS listo para `%c`-formatting.

#### Example

```ts
const css = new StyleBuilder().bg('#000').color('#0ff').build();
console.log('%c DEBUG ', css);
```

***

### clear()

> **clear**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:491](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L491)

Vacía el buffer de estilos y reinicia el builder al estado inicial.
Útil cuando se reutiliza la misma instancia en un bucle para
generar variantes (p.ej. render de N badges con estilo derivado)
sin pagar el costo de instanciar un builder nuevo en cada pasada.

#### Returns

`StyleBuilder`

`this` ya vaciado, listo para reutilizar.

#### Example

```ts
const sb = new StyleBuilder();
for (const lvl of ['info', 'warn', 'error']) {
  sb.clear().bg(COLORS[lvl]).color('#fff').build();
}
```

***

### clone()

> **clone**(): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:509](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L509)

Devuelve una copia independiente del builder con los mismos estilos
acumulados. La clave para variar un estilo base sin mutar el
original: el clone comparte las declaraciones hasta el momento del
`clone()`, pero a partir de ahí cada uno acumula por su lado.

#### Returns

`StyleBuilder`

Nuevo builder con el mismo buffer de estilos.

#### Example

```ts
const base = new StyleBuilder().padding('2px 6px').rounded('3px');
const ok = base.clone().color('#00b894').build();
const err = base.clone().color('#e84393').build();
```

***

### merge()

> **merge**(`other`): `StyleBuilder`

Defined in: [styling/StyleBuilder.ts:531](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/styling/StyleBuilder.ts#L531)

Anexa las declaraciones de otro builder al final del buffer actual.
Útil para componer un estilo a partir de capas (p.ej. base común +
override por tema) sin perder la trazabilidad de quién aportó qué.

No deduplica: si ambos builders setean `color`, el resultado tendrá
dos declaraciones y el navegador se queda con la última.

#### Parameters

##### other

`StyleBuilder`

Builder cuyas declaraciones se anexan.

#### Returns

`StyleBuilder`

`this` con los estilos mergueados.

#### Example

```ts
const base = new StyleBuilder().padding('4px 8px');
const theme = new StyleBuilder().bg('#222').color('#eee');
base.merge(theme).build();
```
