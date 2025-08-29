/**
 * @fileoverview StyleBuilder class for Advanced Logger
 */

/**
 * Utility class for creating dynamic console styles with method chaining
 */
export class StyleBuilder {
    private styles: string[] = [];

    constructor(baseStyle = '') {
        if (baseStyle) this.styles.push(baseStyle);
    }

    /**
     * Add background color or gradient
     */
    bg(background: string): StyleBuilder {
        this.styles.push(`background: ${background}`);
        return this;
    }

    /**
     * Add text color
     */
    color(color: string): StyleBuilder {
        this.styles.push(`color: ${color}`);
        return this;
    }

    /**
     * Add border styling
     */
    border(border: string): StyleBuilder {
        this.styles.push(`border: ${border}`);
        return this;
    }

    /**
     * Add box shadow
     */
    shadow(shadow: string): StyleBuilder {
        this.styles.push(`box-shadow: ${shadow}`);
        return this;
    }

    /**
     * Add padding
     */
    padding(padding: string): StyleBuilder {
        this.styles.push(`padding: ${padding}`);
        return this;
    }

    /**
     * Add margin
     */
    margin(margin: string): StyleBuilder {
        this.styles.push(`margin: ${margin}`);
        return this;
    }

    /**
     * Add border radius
     */
    rounded(radius: string = '4px'): StyleBuilder {
        this.styles.push(`border-radius: ${radius}`);
        return this;
    }

    /**
     * Add font weight
     */
    bold(): StyleBuilder {
        this.styles.push('font-weight: bold');
        return this;
    }

    /**
     * Add font styling
     */
    font(font: string): StyleBuilder {
        this.styles.push(`font-family: ${font}`);
        return this;
    }

    /**
     * Add font size
     */
    size(size: string): StyleBuilder {
        this.styles.push(`font-size: ${size}`);
        return this;
    }

    /**
     * Add line height
     */
    lineHeight(height: string): StyleBuilder {
        this.styles.push(`line-height: ${height}`);
        return this;
    }

    /**
     * Add text decoration
     */
    underline(): StyleBuilder {
        this.styles.push('text-decoration: underline');
        return this;
    }

    /**
     * Add text transform
     */
    uppercase(): StyleBuilder {
        this.styles.push('text-transform: uppercase');
        return this;
    }

    /**
     * Add opacity
     */
    opacity(value: number): StyleBuilder {
        this.styles.push(`opacity: ${value}`);
        return this;
    }

    /**
     * Add display property
     */
    display(value: string): StyleBuilder {
        this.styles.push(`display: ${value}`);
        return this;
    }

    /**
     * Add position property
     */
    position(value: string): StyleBuilder {
        this.styles.push(`position: ${value}`);
        return this;
    }

    /**
     * Add transform property
     */
    transform(value: string): StyleBuilder {
        this.styles.push(`transform: ${value}`);
        return this;
    }

    /**
     * Add animation property
     */
    animation(value: string): StyleBuilder {
        this.styles.push(`animation: ${value}`);
        return this;
    }

    /**
     * Add transition property
     */
    transition(value: string): StyleBuilder {
        this.styles.push(`transition: ${value}`);
        return this;
    }

    /**
     * Add cursor property
     */
    cursor(value: string): StyleBuilder {
        this.styles.push(`cursor: ${value}`);
        return this;
    }

    /**
     * Add any custom CSS property
     */
    custom(property: string, value: string): StyleBuilder {
        this.styles.push(`${property}: ${value}`);
        return this;
    }

    /**
     * Add any CSS property (alias for custom)
     */
    css(property: string, value: string): StyleBuilder {
        return this.custom(property, value);
    }

    /**
     * Build the final CSS string
     */
    build(): string {
        return this.styles.join('; ');
    }

    /**
     * Clear all styles and start fresh
     */
    clear(): StyleBuilder {
        this.styles = [];
        return this;
    }

    /**
     * Clone this StyleBuilder with the same styles
     */
    clone(): StyleBuilder {
        const cloned = new StyleBuilder();
        cloned.styles = [...this.styles];
        return cloned;
    }

    /**
     * Merge another StyleBuilder's styles into this one
     */
    merge(other: StyleBuilder): StyleBuilder {
        this.styles.push(...other.styles);
        return this;
    }
}

/**
 * Proxy-based dynamic styler for chainable console styling
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
 * Dynamic styler instance for external use
 */
export const $ = createStyler();

/**
 * Pre-defined style presets for common use cases
 */
export const StylePresets = {
    success: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #00b894 0%, #00a085 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    error: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #e84393 0%, #d63031 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    warning: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)')
        .color('#2d3436')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    info: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    debug: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        .color('#ffffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold(),

    muted: () => new StyleBuilder()
        .color('#6c757d')
        .font('Monaco, Consolas, monospace')
        .size('12px'),

    accent: () => new StyleBuilder()
        .bg('#f8f9fa')
        .color('#495057')
        .padding('2px 6px')
        .rounded('3px')
        .border('1px solid #dee2e6'),

    neon: () => new StyleBuilder()
        .bg('linear-gradient(135deg, #0f3460 0%, #e94560 100%)')
        .color('#00ffff')
        .padding('4px 8px')
        .rounded('4px')
        .bold()
        .shadow('0 0 10px rgba(0, 255, 255, 0.5)'),
};