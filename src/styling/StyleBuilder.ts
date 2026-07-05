/**
 * @fileoverview StyleBuilder — constructor fluido de estilos CSS para
 * `%c`-formatting del console. Basis de todos los gradientes, badges,
 * presets y estilos por nivel del logger.
 */

/**
 * Constructor fluido de estilos CSS orientado al `%c`-formatting del
 * DevTools console.
 *
 * Cada método empuja una declaración CSS a un buffer interno y retorna
 * `this`, lo que permite encadenar llamadas para componer un estilo
 * completo en una sola expresión. El string final se materializa con
 * {@link StyleBuilder.build}, que une todas las declaraciones con `"; "`
 * — exactamente el formato que espera `console.log("%c...", style)`.
 *
 * Está pensado como bloque base de la capa de styling del logger: los
 * {@link StylePresets} se construyen con esta clase, y el proxy exportado
 * `$` no es más que una instancia fresca expuesta vía `Proxy` para
 * usarse ad-hoc sin instanciar manualmente.
 *
 * @example
 * // Estilo inline para un solo log
 * const banner = new StyleBuilder()
 *   .bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
 *   .color('#ffffff')
 *   .padding('4px 8px')
 *   .rounded('4px')
 *   .bold()
 *   .build();
 * console.log('%c MiApp ', banner);
 *
 * @example
 * // Clonar + variar sin mutar el builder original (útil para
 * // compartir una base entre variantes de badge)
 * const base = new StyleBuilder().padding('2px 6px').rounded('3px');
 * const ok = base.clone().color('#00b894').build();
 * const warn = base.clone().color('#fdcb6e').build();
 *
 * @see {@link StylePresets} para presets listos (success, error, warning, ...).
 * @see {@link $} para el proxy global reutilizable sin instanciar.
 */
export class StyleBuilder {
    private styles: string[] = [];

    /**
     * Crea un builder opcionalmente inicializado con una declaración CSS
     * base (p.ej. un fragmento de estilo compartido del que arrancar).
     *
     * @param {string} [baseStyle] - Declaración CSS inicial en formato
     * `"prop: value"`. Si se omite, el builder arranca vacío y se rellena
     * vía los métodos chainable.
     *
     * @example
     * const sb = new StyleBuilder('color: #333');
     * sb.bg('#eee').build(); // => "color: #333; background: #eee"
     */
    constructor(baseStyle = '') {
        if (baseStyle) this.styles.push(baseStyle);
    }

    /**
     * Define el `background` del estilo. Acepta tanto colores planos
     * (`#1e1e1e`) como gradientes CSS completos (`linear-gradient(...)`),
     * que es lo que da el efecto "badge con color" característico del
     * logger por nivel.
     *
     * @param {string} background - Valor crudo para la propiedad CSS
     * `background` (color, gradiente o shorthand).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().bg('linear-gradient(135deg, #00b894, #00a085)');
     */
    bg(background: string): StyleBuilder {
        this.styles.push(`background: ${background}`);
        return this;
    }

    /**
     * Define el `color` (color del texto). Es el principal contraste
     * contra el `background`: en badges con gradiente se suele usar
     * `#ffffff`, mientras que en logs "muted" se rebaja la opacidad o
     * se usa un gris (`#6c757d`).
     *
     * @param {string} color - Valor CSS de color (hex, rgb, named, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().bg('#1e1e1e').color('#00ffff');
     */
    color(color: string): StyleBuilder {
        this.styles.push(`color: ${color}`);
        return this;
    }

    /**
     * Define el shorthand `border`. Útil para tags tipo "outline" sobre
     * fondos neutros (ver preset `accent`) donde un borde sutil
     * (`1px solid #dee2e6`) separa el badge del contenido sin saturar.
     *
     * @param {string} border - Shorthand CSS `border` completo
     * (`"1px solid #dee2e6"`, `"2px dashed #e84393"`, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().border('1px solid #dee2e6').padding('2px 6px');
     */
    border(border: string): StyleBuilder {
        this.styles.push(`border: ${border}`);
        return this;
    }

    /**
     * Define el `box-shadow`. Se usa sobre todo para efectos neón o de
     * glow (preset `neon`), donde una sombra con alfa baja
     * (`0 0 10px rgba(0,255,255,0.5)`) genera el halo alrededor del
     * badge sin necesidad de animaciones.
     *
     * @param {string} shadow - Shorthand CSS `box-shadow`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().shadow('0 0 10px rgba(0, 255, 255, 0.5)');
     */
    shadow(shadow: string): StyleBuilder {
        this.styles.push(`box-shadow: ${shadow}`);
        return this;
    }

    /**
     * Define el `padding` interno del badge. El valor típico en los
     * presets del logger es `'4px 8px'` (vertical/horizontal), lo justo
     * para que el texto respire sin engordar demasiado la línea de log.
     *
     * @param {string} padding - Shorthand CSS `padding`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().padding('4px 8px').rounded('4px');
     */
    padding(padding: string): StyleBuilder {
        this.styles.push(`padding: ${padding}`);
        return this;
    }

    /**
     * Define el `margin` externo. Rara vez se usa en estilos de console
     * (el flujo del DevTools no respeta margin igual que el DOM), pero
     * queda expuesto para casos donde se quiera separar visualmente un
     * bloque de logs contiguos.
     *
     * @param {string} margin - Shorthand CSS `margin`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().margin('0 0 4px 0');
     */
    margin(margin: string): StyleBuilder {
        this.styles.push(`margin: ${margin}`);
        return this;
    }

    /**
     * Define el `border-radius`. Redondea las esquinas del badge para
     * darle acabado de "pill" / "chip" en lugar de bloque recto.
     *
     * @param {string} [radius='4px'] - Valor CSS de `border-radius`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().rounded('999px'); // pill completo
     */
    rounded(radius: string = '4px'): StyleBuilder {
        this.styles.push(`border-radius: ${radius}`);
        return this;
    }

    /**
     * Aplica `font-weight: bold`. Marca el texto del badge como enfatizado:
     * los presets por nivel (`success`, `error`, ...) lo incluyen para que
     * el severity destaque sobre el resto de la línea de log.
     *
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().bg('#e84393').color('#fff').bold();
     */
    bold(): StyleBuilder {
        this.styles.push('font-weight: bold');
        return this;
    }

    /**
     * Define el `font-family`. Recibe el stack completo (coma-incluido)
     * tal cual se inyecta en CSS. Para stacks ya probados en DevTools,
     * preferir los atajos {@link StyleBuilder.mono} y
     * {@link StyleBuilder.system} en lugar de escribir el stack a mano.
     *
     * @param {string} font - Stack de `font-family` CSS.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().font('"JetBrains Mono", monospace');
     */
    font(font: string): StyleBuilder {
        this.styles.push(`font-family: ${font}`);
        return this;
    }

    /**
     * Atajo de {@link StyleBuilder.font} con un stack monospace portable
     * (`Monaco, Consolas, "Courier New", monospace`). Es el stack que usa
     * el preset `muted` para logs de detalle/auxiliares, donde la
     * alineación monoespaciada ayuda a escanear tablas y pares k=v.
     *
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().mono().size('12px').color('#6c757d');
     */
    mono(): StyleBuilder {
        return this.font('Monaco, Consolas, "Courier New", monospace');
    }

    /**
     * Atajo de {@link StyleBuilder.font} con el stack "system-ui" nativo
     * del SO del usuario. Útil cuando se quiere que el log se integre
     * visualmente con la UI nativa en lugar de marcar como "técnico".
     *
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().system().size('14px');
     */
    system(): StyleBuilder {
        return this.font('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
    }

    /**
     * Define el `font-size`. El valor por defecto del DevTools suele ser
     * suficiente; este método se usa para logs auxiliares (preset `muted`
     * baja a `12px`) o para encabezados tipo banner donde se sube a
     * `18px`-`24px`.
     *
     * @param {string} size - Valor CSS de `font-size` (`'12px'`, `'1.1em'`).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().size('20px').bold();
     */
    size(size: string): StyleBuilder {
        this.styles.push(`font-size: ${size}`);
        return this;
    }

    /**
     * Define el `line-height`. Aplicable cuando un badge envuelve varias
     * líneas o cuando se quiere controlar la altura visual del bloque de
     * log para que no "salte" respecto al texto adyacente.
     *
     * @param {string} height - Valor CSS de `line-height` (`'1.4'`, `'20px'`).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().lineHeight('1.5').padding('8px');
     */
    lineHeight(height: string): StyleBuilder {
        this.styles.push(`line-height: ${height}`);
        return this;
    }

    /**
     * Aplica `text-decoration: underline`. Útil para resaltar un token
     * concreto dentro del mensaje (p.ej. un ID o un path) cuando el
     * `color` por sí solo no basta para marcar jerarquía visual.
     *
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().underline().color('#0984e3');
     */
    underline(): StyleBuilder {
        this.styles.push('text-decoration: underline');
        return this;
    }

    /**
     * Aplica `text-transform: uppercase`. Convierte el texto a mayúsculas
     * sin mutar el string original: ideal para tags cortos como severity
     * (`INFO`, `WARN`) o siglas que conviene leer en bloque.
     *
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().uppercase().bold().padding('2px 6px');
     */
    uppercase(): StyleBuilder {
        this.styles.push('text-transform: uppercase');
        return this;
    }

    /**
     * Define la `opacity` global del estilo (0 a 1). Es el mecanismo
     * recomendado para "apagar" un log sin tener que oscurecer el color
     * a mano: sobre fondo oscuro, bajar opacity a `0.6` da el efecto
     * muted sin perder legibilidad del hue.
     *
     * @param {number} value - Valor de opacidad entre `0` (invisible) y
     * `1` (opaco).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().opacity(0.5).color('#999');
     */
    opacity(value: number): StyleBuilder {
        this.styles.push(`opacity: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `display`. Expuesta por completitud: en la
     * mayoría de estilos de console el `display` del badge es controlado
     * por el propio DevTools y este setter no tiene efecto visible, pero
     * queda disponible para casos de render en contenedores DOM reales
     * (preview components, overlays de playground).
     *
     * @param {string} value - Valor CSS de `display` (`'inline-block'`,
     * `'flex'`, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().display('inline-block').padding('4px 8px');
     */
    display(value: string): StyleBuilder {
        this.styles.push(`display: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `position`. Mismo alcance que
     * {@link StyleBuilder.display}: no afecta al flujo normal del
     * DevTools console, pero queda disponible para estilos que se
     * reutilizan fuera del console (playground DOM, tests visuales).
     *
     * @param {string} value - Valor CSS de `position` (`'relative'`,
     * `'absolute'`, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().position('relative').display('inline-block');
     */
    position(value: string): StyleBuilder {
        this.styles.push(`position: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `transform`. Permite aplicar traslaciones,
     * escalados o rotaciones al estilo. Útil en el playground DOM para
     * micro-interacciones (hover scale, énfasis de banner); en el console
     * crudo el soporte varía según navegador.
     *
     * @param {string} value - Valor CSS de `transform` (`'scale(1.1)'`,
     * `'translateY(-2px)'`, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().transform('scale(1.05)');
     */
    transform(value: string): StyleBuilder {
        this.styles.push(`transform: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `animation`. Aplica keyframes definidos en el
     * contexto de render; en el DevTools console el soporte de animaciones
     * es limitado y solo se materializa en el playground DOM o en
     * overlays HTML, no en el flujo plano de logs.
     *
     * @param {string} value - Shorthand CSS `animation`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().animation('pulse 1s ease-in-out infinite');
     */
    animation(value: string): StyleBuilder {
        this.styles.push(`animation: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `transition`. Mismo alcance que
     * {@link StyleBuilder.animation}: pensado para el playground DOM,
     * donde los estilos del logger se reutilizan en elementos que sí
     * soportan transiciones (hover, focus, state changes).
     *
     * @param {string} value - Shorthand CSS `transition`.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().transition('background 200ms ease');
     */
    transition(value: string): StyleBuilder {
        this.styles.push(`transition: ${value}`);
        return this;
    }

    /**
     * Define la propiedad `cursor`. Aplicable cuando el estilo se reutiliza
     * en elementos interactivos del playground (chips clicables, badges con
     * tooltip) donde se quiere sugerir affordance de click.
     *
     * @param {string} value - Valor CSS de `cursor` (`'pointer'`,
     * `'help'`, ...).
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().cursor('pointer').rounded('4px');
     */
    cursor(value: string): StyleBuilder {
        this.styles.push(`cursor: ${value}`);
        return this;
    }

    /**
     * Escape hatch para cualquier propiedad CSS que no tenga método
     * dedicado. Empuja la declaración `property: value` tal cual al
     * buffer, sin validación — útil para props modernas
     * (`backdrop-filter`, `clip-path`, `text-shadow`) o vendor prefixes.
     *
     * @param {string} property - Nombre de la propiedad CSS.
     * @param {string} value - Valor crudo de la propiedad.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().custom('backdrop-filter', 'blur(8px)');
     */
    custom(property: string, value: string): StyleBuilder {
        this.styles.push(`${property}: ${value}`);
        return this;
    }

    /**
     * Alias de {@link StyleBuilder.custom}. Mismo comportamiento exacto,
     * expuesto solo porque `css(prop, val)` lee mejor como DSL inline
     * cuando se está encadenando mucho.
     *
     * @param {string} property - Nombre de la propiedad CSS.
     * @param {string} value - Valor crudo de la propiedad.
     * @returns {StyleBuilder} `this` para encadenar más reglas.
     *
     * @example
     * new StyleBuilder().css('letter-spacing', '0.5px');
     */
    css(property: string, value: string): StyleBuilder {
        return this.custom(property, value);
    }

    /**
     * Materializa el string CSS final uniendo todas las declaraciones
     * acumuladas con `"; "`. Es el formato exacto que espera el segundo
     * argumento de `console.log("%c…", style)` — el resultado se puede
     * pasar directo al logger o al DevTools.
     *
     * @returns {string} String CSS listo para `%c`-formatting.
     *
     * @example
     * const css = new StyleBuilder().bg('#000').color('#0ff').build();
     * console.log('%c DEBUG ', css);
     */
    build(): string {
        return this.styles.join('; ');
    }

    /**
     * Vacía el buffer de estilos y reinicia el builder al estado inicial.
     * Útil cuando se reutiliza la misma instancia en un bucle para
     * generar variantes (p.ej. render de N badges con estilo derivado)
     * sin pagar el costo de instanciar un builder nuevo en cada pasada.
     *
     * @returns {StyleBuilder} `this` ya vaciado, listo para reutilizar.
     *
     * @example
     * const sb = new StyleBuilder();
     * for (const lvl of ['info', 'warn', 'error']) {
     *   sb.clear().bg(COLORS[lvl]).color('#fff').build();
     * }
     */
    clear(): StyleBuilder {
        this.styles = [];
        return this;
    }

    /**
     * Devuelve una copia independiente del builder con los mismos estilos
     * acumulados. La clave para variar un estilo base sin mutar el
     * original: el clone comparte las declaraciones hasta el momento del
     * `clone()`, pero a partir de ahí cada uno acumula por su lado.
     *
     * @returns {StyleBuilder} Nuevo builder con el mismo buffer de estilos.
     *
     * @example
     * const base = new StyleBuilder().padding('2px 6px').rounded('3px');
     * const ok = base.clone().color('#00b894').build();
     * const err = base.clone().color('#e84393').build();
     */
    clone(): StyleBuilder {
        const cloned = new StyleBuilder();
        cloned.styles = [...this.styles];
        return cloned;
    }

    /**
     * Anexa las declaraciones de otro builder al final del buffer actual.
     * Útil para componer un estilo a partir de capas (p.ej. base común +
     * override por tema) sin perder la trazabilidad de quién aportó qué.
     *
     * No deduplica: si ambos builders setean `color`, el resultado tendrá
     * dos declaraciones y el navegador se queda con la última.
     *
     * @param {StyleBuilder} other - Builder cuyas declaraciones se anexan.
     * @returns {StyleBuilder} `this` con los estilos mergueados.
     *
     * @example
     * const base = new StyleBuilder().padding('4px 8px');
     * const theme = new StyleBuilder().bg('#222').color('#eee');
     * base.merge(theme).build();
     */
    merge(other: StyleBuilder): StyleBuilder {
        this.styles.push(...other.styles);
        return this;
    }
}

/**
 * Construye el `Proxy` que envuelve un {@link StyleBuilder} fresco para
 * exponer una instancia "always-on" sin necesidad de instanciar la clase
 * a mano. El handler bindea cada método al builder interno al primer
 * acceso, de forma que las llamadas encadenadas (`$.bg(...).color(...)`)
 * operan sobre la misma instancia subyacente.
 *
 * @internal Helper del proxy exportado {@link $}; no es API pública.
 * @returns Instancia proxy sobre un `StyleBuilder`.
 */
function createStyler(): any {
    const builder = new StyleBuilder();
    return new Proxy(builder, {
        get(target: StyleBuilder, prop: string) {
            if (prop in target) {
                const method = (target as any)[prop];
                if (typeof method === 'function') {
                    return method.bind(target);
                }
                return method;
            }
            return undefined;
        }
    });
}

/**
 * Instancia global del styler expuesta vía `Proxy` para uso ad-hoc.
 *
 * Es la vía más cómoda de construir un estilo inline sin instanciar
 * `new StyleBuilder()`: se llama directamente como `$.bg(...).color(...)`
 * y se cierra con `.build()`. Internamente delega en un
 * {@link StyleBuilder} envuelto por {@link createStyler}, así que
 * soporta exactamente los mismos métodos.
 *
 * Como comparte estado entre llamadas, si se necesita un estilo aislado
 * (p.ej. para evitar que un `clear()` afecte a otros usos), instanciar
 * `new StyleBuilder()` directamente o usar {@link StyleBuilder.clone}.
 *
 * @example
 * // Badge rápido sin instanciar la clase
 * console.log('%c HLLO ', $.bg('#222').color('#0ff').bold().build());
 *
 * @example
 * // Reutilizar para varios logs (mismo builder subyacente)
 * $.bg('#1e1e1e').color('#eee').padding('4px 8px').rounded('4px');
 * const badge = $.build();
 */
export const $ = createStyler();

/**
 * Catálogo de factories de estilos pre-armados para los casos de uso más
 * comunes en logging: un preset por severity (`success`/`error`/`warning`/
 * `info`/`debug`), uno para texto secundario (`muted`), uno para tags
 * neutros (`accent`) y uno decorativo (`neon`).
 *
 * Cada preset es una función zero-arg que devuelve un {@link StyleBuilder}
 * nuevo, ya configurado y listo para `.build()` o para extender con más
 * reglas antes del build. El patrón factory evita compartir estado entre
 * llamadas: cada invocación es independiente.
 *
 * @example
 * // Usar un preset tal cual
 * console.log('%c OK ', StylePresets.success().build());
 *
 * @example
 * // Extender un preset con reglas extra antes de materializar
 * const css = StylePresets.info()
 *   .custom('text-shadow', '0 1px 0 rgba(0,0,0,0.3)')
 *   .build();
 *
 * @see {@link StyleBuilder} para la API completa de reglas encadenables.
 */
export const StylePresets = {
    /**
     * Preset para severity "success" (operación completada OK). Gradiente
     * verde → verde oscuro, texto blanco, badge con padding/bold/radius
     * estándar.
     *
     * @returns {StyleBuilder} Estilo verde de éxito.
     *
     * @example
     * console.log('%c LOGIN OK ', StylePresets.success().build());
     */
    success: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #00b894 0%, #00a085 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    /**
     * Preset para severity "error" (fallo que requiere atención). Gradiente
     * rosa → rojo intenso, texto blanco, badge bold para destacar sobre
     * el resto de la línea.
     *
     * @returns {StyleBuilder} Estilo rojo de error.
     *
     * @example
     * console.log('%c DB DOWN ', StylePresets.error().build());
     */
    error: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #e84393 0%, #d63031 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    /**
     * Preset para severity "warning" (situación recuperable pero a vigilar).
     * Gradiente ámbar → naranja cálido, texto oscuro (`#2d3436`) para
     * mantener contraste sobre fondo claro.
     *
     * @returns {StyleBuilder} Estilo ámbar de advertencia.
     *
     * @example
     * console.log('%c RATE LIMIT ', StylePresets.warning().build());
     */
    warning: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)')
        .color('#2d3436')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    /**
     * Preset para severity "info" (mensaje informativo, flujo normal).
     * Gradiente azul claro → azul medio, texto blanco, badge estándar.
     *
     * @returns {StyleBuilder} Estilo azul informativo.
     *
     * @example
     * console.log('%c USER LOGIN ', StylePresets.info().build());
     */
    info: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    /**
     * Preset para severity "debug" (traza de diagnóstico, normalmente
     * oculta en producción). Gradiente índigo → púrpura, distinto del
     * azul de `info` para que se distinga visualmente.
     *
     * @returns {StyleBuilder} Estilo púrpura de debug.
     *
     * @example
     * console.log('%c CACHE MISS ', StylePresets.debug().build());
     */
    debug: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    /**
     * Preset para texto secundario (timestamps, metadatos, contexto
     * auxiliar). Sin fondo, color gris y font monospace pequeño (`12px`):
     * pensado para que el ojo lo lea como "de apoyo" y no compita con el
     * severity principal.
     *
     * @returns {StyleBuilder} Estilo gris monoespaciado y reducido.
     *
     * @example
     * console.log('%c 2026-01-01T12:00:00Z ', StylePresets.muted().build());
     */
    muted: () => new StyleBuilder()
        .color('#6c757d')
        .font('Monaco, Consolas, monospace')
        .size('12px'),

    /**
     * Preset para tags neutros sobre fondo claro (categorías, IDs, labels
     * que no son severity). Fondo gris muy claro, texto gris medio, borde
     * sutil y padding más ajustado que los presets de severity para que
     * conviva visualmente con ellos.
     *
     * @returns {StyleBuilder} Estilo "chip" neutro con borde.
     *
     * @example
     * console.log('%c svc:auth ', StylePresets.accent().build());
     */
    accent: () => new StyleBuilder()
        .bg('#f8f9fa')
        .color('#495057')
        .padding('2px 6px')
        .rounded('3px')
        .border('1px solid #dee2e6'),

    /**
     * Preset decorativo neón (gradiente azul oscuro → rojo coral con halo
     * cyan). Pensado para banners o highlights puntuales que quieren llamar
     * la atención por estética, no por severity. El `box-shadow` con alfa
     * baja genera el glow característico.
     *
     * @returns {StyleBuilder} Estilo neón con sombra glow.
     *
     * @example
     * console.log('%c ★ BANNER ★ ', StylePresets.neon().build());
     */
    neon: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #0f3460 0%, #e94560 100%)')
        .color('#00ffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold()
        .shadow('0 0 10px rgba(0, 255, 255, 0.5)'),
};