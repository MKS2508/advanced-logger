/**
 * Niveles de log soportados en orden jerárquico
 * (trace < debug < info < warn < error < critical)
 *
 * @constant {Object} LOG_LEVELS
 * @property {number} trace - Nivel -1: Trazas muy verbosas (alineado con OTel TRACE severity 1-4)
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
    trace: -1,
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4,
} as const;

/**
 * Tipo de nivel de log derivado de las claves de LOG_LEVELS
 * @typedef {'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical'} LogLevel
 */
export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Tag especial de "nivel" usado por `success()` — mapea a severidad INFO de OTel.
 * Vive fuera del union `LogLevel` estándar para que las comparaciones internas
 * de nivel (trace < debug < info < warn < error < critical) no se vean alteradas.
 */
export const SUCCESS_LEVEL = 'success' as const;

/**
 * Tags aceptados por la familia `log()` y los métodos visuales (`success()`
 * emite a severidad INFO pero usa styling de success). Útil para transports
 * que necesitan distinguir "success" de logs info genéricos.
 */
export type LogTag = LogLevel | typeof SUCCESS_LEVEL;

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
 * Modos de output para controlar dónde se escriben los logs.
 * @typedef {'console' | 'silent' | 'custom'} OutputMode
 *
 * @description
 * - console: Output estándar vía `console.log` (default)
 * - silent: Sin output
 * - custom: Usa un `OutputWriter` custom para escenarios avanzados
 */
export type OutputMode = 'console' | 'silent' | 'custom';

/**
 * Interfaz de output writer custom para redirigir el output de logs.
 *
 * @interface OutputWriter
 *
 * @description
 * Permite redirigir el output de logs a destinos custom como:
 * - DraftLog para CLI spinners con logging concurrente
 * - Buffers para colectar logs durante operaciones
 * - Streams o transports custom
 *
 * @example
 * class BufferWriter implements OutputWriter {
 *   private buffer: string[] = [];
 *
 *   write(message: string, level: LogLevel, styles: string[]): void {
 *     this.buffer.push(message);
 *   }
 *
 *   flush(): void {
 *     this.buffer.forEach(msg => console.log(msg));
 *     this.buffer = [];
 *   }
 * }
 */
export interface OutputWriter {
    write(message: string, level: LogLevel, styles: string[]): void;
    flush?(): void;
}

/**
 * Shape mínima de recurso OTel — duplicada aquí para evitar un import
 * circular con `./transports.js`. El `ILogResource` canónico vive en
 * `./transports.js`; ambos shapes se mantienen sincronizados vía el
 * contrato público (service.name + version opcional + environment opcional).
 */
export interface ILogResourceRef {
    'service.name': string;
    'service.version'?: string;
    'deployment.environment'?: string;
    [key: string]: string | undefined;
}

/**
 * Configuración de una instancia de `Logger`. Los campos booleanos activan
 * o desactivan features visuales (colores, timestamps, stack traces); los
 * campos selectores controlan tema, banner y formato de salida. Todos los
 * campos son opcionales salvo `verbosity`, `enableColors` y
 * `enableTimestamps`, que el constructor del logger rellena desde
 * `DEFAULT_CONFIG` cuando no se proveen.
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
    /** Modo de output: 'console' (default), 'silent' o 'custom'. */
    outputMode?: OutputMode;
    /** Writer custom cuando outputMode es 'custom'. */
    outputWriter?: OutputWriter;
    /** Nivel de verbosidad CLI para controlar el output primitivo. */
    cliLevel?: CLILogLevel;
    /**
     * Recurso OTel por defecto adjuntado a cada record que no lo sobreescriba.
     * Se setea una vez por proceso (service.name, service.version, deployment.environment).
     */
    resource?: Partial<ILogResourceRef>;
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
 * Layout de la línea de log: spacing entre elementos, padding interior,
 * margen externo y separador entre partes. Lo consume el renderer para
 * estructurar la salida visual.
 *
 * @interface LogLayout
 */
export interface LogLayout {
    spacing: SpacingType;
    innerPadding?: string;
    outerMargin?: string;
    separator?: string;
}

/**
 * Estilo de un elemento individual del log (timestamp, level, prefix,
 * mensaje, location). Cada campo es opcional y se aplica solo al elemento
 * seleccionado sin tocar el resto de la línea.
 *
 * @interface LogPartConfig
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
    color?: string; // Adaptativo por defecto
    background?: string;
    padding?: string;
    margin?: string;
    border?: string;
    shadow?: string;
    uppercase?: boolean;
}

/**
 * Estilos globales del log: layout, configuración por elemento (timestamp,
 * level, prefix, mensaje, location) y props visuales de fondo (backdrop,
 * transparency).
 *
 * @interface LogStyles
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

/**
 * Resultado de un timer completado. Lo retorna internamente `Logger.timeEnd`
 * y lo pasan los hooks en `extra` para mediciones de rendimiento.
 *
 * @property label - Etiqueta con la que se registró el timer vía `time(label)`.
 * @property duration - Milisegundos transcurridos entre `startTime` y `endTime`.
 * @property startTime - Marca temporal de inicio (`performance.now()` o `Date.now()`).
 * @property endTime - Marca temporal de fin.
 */
export interface TimerResult {
    label: string;
    duration: number;
    startTime: number;
    endTime: number;
}

/**
 * Contrato del logger retornado por los factory de scope (`Logger.component`,
 * `Logger.scope`). Expone los métodos de log por nivel más una API fluida
 * para badges, timers y estilos.
 *
 * Los métodos de log (`debug`, `info`, ...) devuelven `void`; los métodos de
 * configuración (`badges`, `badge`, `clearBadges`, `style`) devuelven `this`
 * para permitir encadenamiento.
 *
 * @example
 * const auth = logger.component('Auth');
 * auth.badge('JWT').info('Token validado');
 * auth.style('cyberpunk').success('Login OK');
 */
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

/**
 * Logger especializado para servicios API. Extiende {@link IScopedLogger} con
 * verbosidades específicas de backend: latencia (`slow`), rate limiting
 * (`rateLimit`), fallos de credenciales (`auth`) y endpoints legacy
 * (`deprecated`).
 */
export interface IAPILogger extends IScopedLogger {
    slow(message: string, duration?: number): void;
    rateLimit(message: string): void;
    auth(message: string): void;
    deprecated(message: string): void;
}

/**
 * Logger especializado para componentes UI. Extiende {@link IScopedLogger}
 * con verbosidades de lifecycle: montaje/desmontaje (`lifecycle`), cambios
 * de estado (`stateChange`) y diffs de props (`propsChange`). Útil para
 * depurar re-renders y flujos de componentes sin inundar el log de ruido.
 */
export interface IComponentLogger extends IScopedLogger {
    lifecycle(event: string, message?: string): void;
    stateChange(from: string, to: string, data?: any): void;
    propsChange(changes: Record<string, any>): void;
}

/**
 * Bindings inmutables que viajan con un logger scoped/child. Definen la
 * "identidad" del logger para filtrado, agrupación y atribución en
 * transports. Se propagan a través de `child()` y se merguean al construir
 * el {@link TransportRecord} que reciben los transports.
 *
 * @property scope - Etiqueta lógica del scope (p.ej. `"Auth"`, `"API:Users"`).
 * @property badges - Lista de badges a renderizar junto al mensaje.
 * @property type - Categoría del logger: `'scope'` (genérico), `'api'` (verbosidades HTTP), `'component'` (UI lifecycle).
 * @property context - Cadena jerárquica de contexto (parent → child) para traces anidados.
 */
export interface Bindings {
    scope?: string;
    badges?: string[];
    type?: 'scope' | 'api' | 'component';
    context?: string[];
}

/**
 * Estilo visual del wrapper de un badge.
 *
 * - `'brackets'` — `[badge]`
 * - `'rounded'` — `(badge)`
 * - `'plain'` — `badge` (sin wrapper)
 * - `'unicode'` — `「badge」`
 * - `'pill'` — badge con fondo redondeado estilo pill (CSS)
 */
export type BadgeStyle = 'brackets' | 'rounded' | 'plain' | 'unicode' | 'pill';

/**
 * Formato de renderizado del timestamp en la línea de log.
 *
 * - `'iso'` — `2026-07-05T12:34:56.789Z` (default, sortable)
 * - `'time'` — `12:34:56`
 * - `'timeMs'` — `12:34:56.789`
 * - `'relative'` — tiempo relativo al momento de carga del logger
 * - `'elapsed'` — `+1.2s` transcurrido desde el primer log de la sesión
 * - `'date'` — `2026-07-05 12:34:56` (local)
 * - `'custom'` — delega al formateador custom registrado en el logger
 */
export type TimestampFormat = 'iso' | 'time' | 'timeMs' | 'relative' | 'elapsed' | 'date' | 'custom';

/**
 * Alineación horizontal de una celda dentro de una columna de
 * `Logger.cliTable`.
 */
export type ColumnAlign = 'left' | 'right' | 'center';

/**
 * Definición de una columna para `Logger.cliTable`. `content` es la fuente
 * del valor (clave del row o string fijo); los demás campos controlan layout
 * y color.
 *
 * @property content - Clave del row a renderizar, o string fijo para todas las filas.
 * @property width - Ancho fijo en caracteres; si se omite, se auto-detecta del contenido.
 * @property align - Alineación del contenido dentro de la celda.
 * @property color - Color del texto (hex, nombre CSS o nombre ANSI).
 */
export interface ColumnConfig {
    content: string;
    width?: number;
    align?: ColumnAlign;
    color?: string;
}

/**
 * Opciones de presentación aplicables a un log individual. Controlan layout
 * multi-columna, ancho máximo, modo clave-valor, estilo de badge y formato
 * de timestamp — todo sin alterar el `LoggerConfig` global del logger.
 *
 * @property rightAlign - Texto alineado a la derecha del mensaje principal (p.ej. duración).
 * @property columns - Definición de columnas para modo tabla.
 * @property maxWidth - Ancho máximo del mensaje antes de truncar/wrap.
 * @property keyValue - Si `true`, renderiza los argumentos como `clave: valor`.
 * @property badgeStyle - Override del estilo de badge para esta entrada.
 * @property timestampFormat - Override del formato de timestamp para esta entrada.
 */
export interface LogOptions {
    rightAlign?: string;
    columns?: ColumnConfig[];
    maxWidth?: number;
    keyValue?: boolean;
    badgeStyle?: BadgeStyle;
    timestampFormat?: TimestampFormat;
}

// ===== CLI PRIMITIVES =====

/**
 * Niveles de verbosidad CLI para controlar el output primitivo.
 */
export type CLILogLevel = 'silent' | 'quiet' | 'normal' | 'verbose' | 'debug';

/**
 * Handle retornado por `logger.spinner()` para controlar el ciclo de vida
 * del spinner.
 */
export interface ISpinnerHandle {
    /** Arranca la animación del spinner. */
    start(): void;
    /** Detiene el spinner sin mensaje de status. */
    stop(): void;
    /** Detiene el spinner con un mensaje de success. */
    succeed(msg?: string): void;
    /** Detiene el spinner con un mensaje de failure. */
    fail(msg?: string): void;
    /** Actualiza el texto del spinner mientras corre. */
    text(msg: string): void;
}

/**
 * Opciones para el output de `logger.box()`.
 */
export interface IBoxOptions {
    /** Título mostrado en el borde superior. */
    title?: string;
    /** Color del borde (hex, nombre CSS o nombre ANSI). */
    borderColor?: string;
    /** Estilo de caracteres del borde. */
    borderStyle?: 'single' | 'double' | 'rounded' | 'bold';
    /** Líneas de padding interior (default: 0). */
    padding?: number;
}

/**
 * Opciones para el output de `logger.cliTable()`.
 */
export interface ITableOptions {
    /** Nombres de columnas a mostrar (sobreescribe la auto-detección). */
    columns?: string[];
    /** Labels del header (default: nombres de columnas). */
    head?: string[];
}