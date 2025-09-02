/**
 * @fileoverview LogStyleBuilder for fluent log styling API
 */

import type { Logger } from '../Logger.js';
import type { LogStyles, LogLayout, SpacingType } from '../types/index.js';
import { 
    TimestampStyler, 
    LevelStyler, 
    PrefixStyler, 
    MessageStyler, 
    LocationStyler 
} from './SemanticStyles.js';

/**
 * Fluent API builder for log styling with semantic methods
 */
export class LogStyleBuilder {
    private logStyles: LogStyles = {};
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Configure timestamp styling
     */
    timestamp(): TimestampStyleBuilderProxy {
        return new TimestampStyleBuilderProxy(this);
    }

    /**
     * Configure level badge styling
     */
    level(): LevelStyleBuilderProxy {
        return new LevelStyleBuilderProxy(this);
    }

    /**
     * Configure prefix styling
     */
    prefix(): PrefixStyleBuilderProxy {
        return new PrefixStyleBuilderProxy(this);
    }

    /**
     * Configure message text styling
     */
    message(): MessageStyleBuilderProxy {
        return new MessageStyleBuilderProxy(this);
    }

    /**
     * Configure location info styling
     */
    location(): LocationStyleBuilderProxy {
        return new LocationStyleBuilderProxy(this);
    }

    /**
     * Use a predefined preset
     */
    usePreset(presetName: string): LogStyleBuilder {
        // Will be implemented when we create the presets
        console.warn(`Preset '${presetName}' will be available in next implementation phase`);
        return this;
    }

    /**
     * Customize with partial configuration
     */
    customize(overrides: Partial<LogStyles>): LogStyleBuilder {
        this.logStyles = { ...this.logStyles, ...overrides };
        return this;
    }

    /**
     * Set layout spacing
     */
    spacing(type: SpacingType): LogStyleBuilder {
        if (!this.logStyles.layout) {
            this.logStyles.layout = { spacing: type };
        } else {
            this.logStyles.layout.spacing = type;
        }

        // Apply spacing-specific configurations
        switch (type) {
            case 'compact':
                this.logStyles.layout.innerPadding = '1px';
                this.logStyles.layout.outerMargin = '0px';
                break;
            case 'spacious':
                this.logStyles.layout.innerPadding = '4px';
                this.logStyles.layout.outerMargin = '2px';
                break;
            default: // normal
                this.logStyles.layout.innerPadding = '2px';
                this.logStyles.layout.outerMargin = '1px';
        }
        
        return this;
    }

    /**
     * Set backdrop filter for glassmorphism effects
     */
    backdrop(filter: string): LogStyleBuilder {
        this.logStyles.backdrop = filter;
        return this;
    }

    /**
     * Set overall transparency
     */
    transparency(value: number): LogStyleBuilder {
        this.logStyles.transparency = Math.max(0, Math.min(1, value));
        return this;
    }

    /**
     * Apply the configured styles to the logger
     */
    apply(): void {
        // Store the configuration in the logger
        // This will be implemented when we integrate with the main Logger
        (this.logger as any)._customLogStyles = this.logStyles;
        console.log('Applied log styles:', this.logStyles);
    }

    /**
     * Get current configuration (for debugging)
     */
    getConfig(): LogStyles {
        return { ...this.logStyles };
    }

    /**
     * Internal method to update part configuration
     */
    _updatePartConfig(part: keyof LogStyles, styles: string): void {
        if (part === 'layout' || part === 'backdrop' || part === 'transparency') {
            return; // Skip these non-part configs
        }
        
        if (!this.logStyles[part]) {
            this.logStyles[part] = {};
        }
        
        // Parse basic CSS styles into config
        // This is a simplified approach - in production might want more sophisticated parsing
        this.logStyles[part]!.style = styles;
    }
}

/**
 * Base proxy class for part-specific styling
 */
abstract class PartStyleBuilderProxy {
    protected parentBuilder: LogStyleBuilder;
    protected partName: keyof LogStyles;

    constructor(parentBuilder: LogStyleBuilder, partName: keyof LogStyles) {
        this.parentBuilder = parentBuilder;
        this.partName = partName;
    }

    /**
     * Return to the main builder for chaining other parts
     */
    and(): LogStyleBuilder {
        return this.parentBuilder;
    }

    /**
     * Apply styles and finish configuration
     */
    apply(): void {
        this.parentBuilder.apply();
    }

    /**
     * Helper to apply styles to the parent builder
     */
    protected applyStyles(styler: any): this {
        const styles = styler.build();
        this.parentBuilder._updatePartConfig(this.partName, styles);
        return this;
    }
}

/**
 * Timestamp styling proxy with fluent API
 */
class TimestampStyleBuilderProxy extends PartStyleBuilderProxy {
    constructor(parentBuilder: LogStyleBuilder) {
        super(parentBuilder, 'timestamp');
    }

    default(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().default());
    }

    hidden(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().hidden());
    }

    minimal(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().minimal());
    }

    muted(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().muted());
    }

    mono(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().mono());
    }

    compact(): TimestampStyleBuilderProxy {
        return this.applyStyles(new TimestampStyler().compact());
    }
}

/**
 * Level badge styling proxy with fluent API
 */
class LevelStyleBuilderProxy extends PartStyleBuilderProxy {
    constructor(parentBuilder: LogStyleBuilder) {
        super(parentBuilder, 'level');
    }

    badge(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().badge());
    }

    gradient(from?: string, to?: string): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().gradient(from, to));
    }

    glowing(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().glowing());
    }

    flat(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().flat());
    }

    bold(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().bold());
    }

    uppercase(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().uppercase());
    }

    neon(): LevelStyleBuilderProxy {
        return this.applyStyles(new LevelStyler().neon());
    }
}

/**
 * Prefix styling proxy with fluent API
 */
class PrefixStyleBuilderProxy extends PartStyleBuilderProxy {
    constructor(parentBuilder: LogStyleBuilder) {
        super(parentBuilder, 'prefix');
    }

    dark(): PrefixStyleBuilderProxy {
        return this.applyStyles(new PrefixStyler().dark());
    }

    light(): PrefixStyleBuilderProxy {
        return this.applyStyles(new PrefixStyler().light());
    }

    compact(): PrefixStyleBuilderProxy {
        return this.applyStyles(new PrefixStyler().compact());
    }

    muted(): PrefixStyleBuilderProxy {
        return this.applyStyles(new PrefixStyler().muted());
    }

    mono(): PrefixStyleBuilderProxy {
        return this.applyStyles(new PrefixStyler().mono());
    }
}

/**
 * Message styling proxy with fluent API
 */
class MessageStyleBuilderProxy extends PartStyleBuilderProxy {
    constructor(parentBuilder: LogStyleBuilder) {
        super(parentBuilder, 'message');
    }

    readable(): MessageStyleBuilderProxy {
        return this.applyStyles(new MessageStyler().readable());
    }

    code(): MessageStyleBuilderProxy {
        return this.applyStyles(new MessageStyler().code());
    }

    large(): MessageStyleBuilderProxy {
        return this.applyStyles(new MessageStyler().large());
    }

    system(): MessageStyleBuilderProxy {
        return this.applyStyles(new MessageStyler().system());
    }

    mono(): MessageStyleBuilderProxy {
        return this.applyStyles(new MessageStyler().mono());
    }
}

/**
 * Location styling proxy with fluent API
 */
class LocationStyleBuilderProxy extends PartStyleBuilderProxy {
    constructor(parentBuilder: LogStyleBuilder) {
        super(parentBuilder, 'location');
    }

    subtle(): LocationStyleBuilderProxy {
        return this.applyStyles(new LocationStyler().subtle());
    }

    hidden(): LocationStyleBuilderProxy {
        return this.applyStyles(new LocationStyler().hidden());
    }

    clickable(): LocationStyleBuilderProxy {
        return this.applyStyles(new LocationStyler().clickable());
    }

    muted(): LocationStyleBuilderProxy {
        return this.applyStyles(new LocationStyler().muted());
    }

    mono(): LocationStyleBuilderProxy {
        return this.applyStyles(new LocationStyler().mono());
    }
}

/**
 * Create a new LogStyleBuilder instance
 */
export function createLogStyleBuilder(logger: Logger): LogStyleBuilder {
    return new LogStyleBuilder(logger);
}