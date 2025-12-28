/**
 * @fileoverview Definiciones de tipos principales para Better Logger
 * @version 0.3.0
 * @since 2024
 */

/**
 * Niveles de log soportados en orden jerárquico (debug < info < warn < error < critical)
 * 
 * @constant {Object} LOG_LEVELS
 * @property {number} debug - Nivel 0: Información de depuración detallada
 * @property {number} info - Nivel 1: Mensajes informativos generales
 * @property {number} warn - Nivel 2: Advertencias que no detienen la ejecución
 * @property {number} error - Nivel 3: Errores que pueden afectar funcionalidad
 * @property {number} critical - Nivel 4: Errores críticos que requieren atención inmediata
 * 
 * @example
 * // Verificar si un nivel debe mostrarse
 * if (LOG_LEVELS[currentLevel] >= LOG_LEVELS.warn) {
 *   // Mostrar solo warn, error y critical
 * }
 */
export const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
} as const;

/**
 * Tipo de nivel de log derivado de las claves de LOG_LEVELS
 * @typedef {'debug' | 'info' | 'warn' | 'error' | 'critical'} LogLevel
 */
export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Tipo de nivel de verbosidad para filtrar logs
 * @typedef {LogLevel | 'silent'} Verbosity
 * @description 'silent' desactiva completamente todos los logs
 */
export type Verbosity = LogLevel | 'silent';

/**
 * Variantes de tema para diferentes estilos visuales
 * @typedef {'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk'} ThemeVariant
 * 
 * @description
 * - default: Tema adaptativo automático (claro/oscuro)
 * - dark: Tema oscuro con colores vibrantes
 * - light: Tema claro con colores suaves
 * - neon: Colores neón brillantes con efectos de resplandor
 * - minimal: Diseño minimalista y limpio
 * - cyberpunk: Estilo futurista con neón y efectos
 */
export type ThemeVariant = 'default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk';

/**
 * Detección de tema de DevTools del navegador
 * @typedef {'light' | 'dark'} DevToolsTheme
 */
export type DevToolsTheme = 'light' | 'dark';

/**
 * Tipos de banner para diferentes enfoques visuales
 * @typedef {'simple' | 'ascii' | 'unicode' | 'svg' | 'animated'} BannerType
 * 
 * @description
 * - simple: Texto simple sin decoración
 * - ascii: Arte ASCII tradicional
 * - unicode: Caracteres Unicode decorativos
 * - svg: Gráfico SVG embebido
 * - animated: Banner con animación CSS
 */
export type BannerType = 'simple' | 'ascii' | 'unicode' | 'svg' | 'animated';

/**
 * Formatos de exportación para datos de log
 * @typedef {'json' | 'csv' | 'markdown' | 'plain' | 'html'} ExportFormat
 *
 * @description
 * - json: Formato JSON estructurado
 * - csv: Valores separados por comas para Excel/Sheets
 * - markdown: Formato Markdown para documentación
 * - plain: Texto plano sin formato
 * - html: HTML con estilos para visualización web
 */
export type ExportFormat = 'json' | 'csv' | 'markdown' | 'plain' | 'html';

/**
 * Formatos de salida para diferentes entornos
 * @typedef {'auto' | 'plain' | 'ansi' | 'build' | 'ci'} OutputFormat
 *
 * @description
 * - auto: Detección automática basada en entorno (recomendado)
 * - plain: Texto plano sin colores (máxima compatibilidad)
 * - ansi: Colores ANSI para terminales modernos
 * - build: Formato optimizado para builds (Next.js, webpack, etc.)
 * - ci: Formato optimizado para CI/CD (sin emojis, texto simple)
 */
export type OutputFormat = 'auto' | 'plain' | 'ansi' | 'build' | 'ci';

/**
 * Interfaz de configuración para instancias del logger
 * 
 * @interface LoggerConfig
 * @since 0.3.0
 * 
 * @example
 * const config: LoggerConfig = {
 *   globalPrefix: 'MiApp',
 *   verbosity: 'info',
 *   enableColors: true,
 *   enableTimestamps: true,
 *   enableStackTrace: false,
 *   theme: 'cyberpunk',
 *   bannerType: 'animated',
 *   bufferSize: 500,
 *   autoDetectTheme: true
 * };
 */
export interface LoggerConfig {
    globalPrefix?: string;
    verbosity: Verbosity;
    enableColors: boolean;
    enableTimestamps: boolean;
    enableStackTrace: boolean;
    theme?: ThemeVariant;
    bannerType?: BannerType;
    bufferSize?: number;
    autoDetectTheme?: boolean;
    outputFormat?: OutputFormat;
}

/**
 * Información parseada del stack trace
 * 
 * @interface StackInfo
 * @description Contiene la ubicación exacta donde se originó el log
 */
export interface StackInfo {
    file: string;
    line: number;
    column: number;
    function?: string;
}

/**
 * Entrada de temporizador para medición de rendimiento
 * 
 * @interface TimerEntry
 * @description Usado internamente para rastrear temporizadores activos
 */
export interface TimerEntry {
    label: string;
    startTime: number;
}

/**
 * Opciones para estilizar componentes
 * 
 * @interface StyleOptions
 * @description Configuración de dimensiones y espaciado para elementos visuales
 */
export interface StyleOptions {
    width?: number;
    height?: number;
    padding?: string;
}

/**
 * Configuración de colores adaptativos para temas claro/oscuro
 * 
 * @interface AdaptiveColors
 * @description Define colores que se ajustan automáticamente al tema del navegador
 */
export interface AdaptiveColors {
    light: string;
    dark: string;
}

/**
 * Configuración de espaciado para elementos del log
 * @typedef {'compact' | 'normal' | 'spacious'} SpacingType
 * 
 * @description
 * - compact: Espaciado mínimo para más densidad
 * - normal: Espaciado estándar balanceado
 * - spacious: Espaciado amplio para mejor legibilidad
 */
export type SpacingType = 'compact' | 'normal' | 'spacious';

/**
 * Configuración de layout para la estructura del log
 * 
 * @interface LogLayout
 * @description Define cómo se organizan visualmente los elementos del log
 */
export interface LogLayout {
    spacing: SpacingType;
    innerPadding?: string;
    outerMargin?: string;
    separator?: string;
}

/**
 * Configuración para partes individuales del log
 * 
 * @interface LogPartConfig
 * @description Permite personalizar cada elemento del log por separado
 * 
 * @example
 * const timestampConfig: LogPartConfig = {
 *   show: true,
 *   color: '#888',
 *   font: 'Monaco',
 *   size: '11px'
 * };
 */
export interface LogPartConfig {
    show?: boolean;
    style?: string;
    font?: string;
    size?: string;
    color?: string; // Automatically adaptive by default
    background?: string;
    padding?: string;
    margin?: string;
    border?: string;
    shadow?: string;
    uppercase?: boolean;
}

/**
 * Configuración completa de estilos del log
 * 
 * @interface LogStyles
 * @description Agrupa todas las opciones de estilo en una sola configuración
 * @since 0.3.0
 */
export interface LogStyles {
    layout?: LogLayout;
    timestamp?: LogPartConfig;
    level?: LogPartConfig;
    prefix?: LogPartConfig;
    message?: LogPartConfig;
    location?: LogPartConfig;
    backdrop?: string;
    transparency?: number;
}

export interface TimerResult {
    label: string;
    duration: number;
    startTime: number;
    endTime: number;
}

export interface IScopedLogger {
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    success(...args: any[]): void;
    critical(...args: any[]): void;
    trace(...args: any[]): void;

    badges(badges: string[]): this;
    badge(badge: string): this;
    clearBadges(): this;

    time(label: string): void;
    timeEnd(label: string): number | undefined;

    style(presetName: string): this;
}

export interface IAPILogger extends IScopedLogger {
    slow(message: string, duration?: number): void;
    rateLimit(message: string): void;
    auth(message: string): void;
    deprecated(message: string): void;
}

export interface IComponentLogger extends IScopedLogger {
    lifecycle(event: string, message?: string): void;
    stateChange(from: string, to: string, data?: any): void;
    propsChange(changes: Record<string, any>): void;
}

export interface Bindings {
    scope?: string;
    badges?: string[];
    type?: 'scope' | 'api' | 'component';
    context?: string[];
}