/**
 * @fileoverview Configuraciones de banner para Advanced Logger.
 */

import type { BannerType, ThemeVariant } from '../types/index.js';

/**
 * Catálogo de variantes del banner de inicialización del logger.
 *
 * Cada variante es un par `{ text, style }` listo para pasar a
 * `console.log(\`%c${text}\`, style)`. Las variantes escalan en complejidad
 * visual según las capacidades del navegador:
 *  - `simple`   — una sola línea con gradiente.
 *  - `ascii`    — ASCII art multiníveles (Safari, sin SVG).
 *  - `unicode`  — caja Unicode con gradiente de fondo.
 *  - `svg`      — `background-image` SVG con texto vectorial.
 *  - `animated` — gradiente animado vía `@keyframes gradientShift`.
 *
 * La función {@link detectBannerCapabilities} elige automáticamente la
 * variante más rica soportada por el entorno actual.
 *
 * @example
 * ```ts
 * import { BANNER_VARIANTS } from '@mks2508/better-logger/styles';
 *
 * const { text, style } = BANNER_VARIANTS.unicode;
 * console.log(`%c${text}`, style);
 * ```
 *
 * @see {@link BannerType} para la unión de claves válidas.
 * @see {@link displayInitBanner} para pintar el banner auto-detectado.
 */
export const BANNER_VARIANTS = {
    simple: {
        text: '🚀 ADVANCED LOGGER v2.0.0 - State-of-the-art Console Styling 🚀',
        style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 14px;'
    },
    ascii: {
        text: `
   ___     ____  _   __   ___     _   __  _____ _____ ____     __     ___    _____ _____ _____ ____  
  / _ \\   / __ \\| | / /  / _ \\   | \\ | |/ ____| ____|  _ \\   |  |   / _ \\  / ____|  ___|  _  |  _ \\ 
 / /_\\ \\ / / _\` | |/ /  / /_\\ \\  |  \\| | |   | |__  | | | |  |  |  / / \\ \\| |  __| |_  | |_| | |_) |
 |  _  || | (_| |   <   |  _  |  | . \` | |   |  __| | | | |  |  | | |   | | | |_ |  _| |    /|  _ < 
 | | | |\\ \\__,_|_|\\_\\  | | | |  | |\\  | |___| |____| |_| |  |  |__\\ \\_/ /| |__| | |___| |\\ \\| |_) |
 \\_| |_/ \\____/        \\_| |_/  |_| \\_|\\_____|______|____/   |_____/\\___/  \\_____|_____|_| \\_|____/

                            Advanced Logger v2.0.0 - Console Excellence`,
        style: 'font-family: "Courier New", Consolas, Monaco, monospace; color: #667eea; font-size: 11px; line-height: 1.2;'
    },
    unicode: {
        text: `
╔══════════════════════════════════════════════════════════════════════════╗
║                         🚀 ADVANCED LOGGER v2.0.0                       ║
║                      State-of-the-art Console Styling                    ║  
╚══════════════════════════════════════════════════════════════════════════╝`,
        style: 'font-family: "Courier New", Consolas, Monaco, monospace; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.3;'
    },
    svg: {
        text: '                    ',
        style: `
            background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='0%'><stop offset='0%' style='stop-color:%23667eea'/><stop offset='100%' style='stop-color:%23764ba2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23grad)' rx='8'/><text x='200' y='30' text-anchor='middle' fill='white' font-family='monospace' font-size='14' font-weight='bold'>🚀 ADVANCED LOGGER</text><text x='200' y='50' text-anchor='middle' fill='white' font-family='monospace' font-size='12'>State-of-the-art Console Styling</text><text x='200' y='65' text-anchor='middle' fill='white' font-family='monospace' font-size='10'>v2.0.0</text></svg>");
            background-repeat: no-repeat;
            background-size: 400px 80px;
            padding: 40px 200px;
            color: transparent;
            display: inline-block;
            border-radius: 8px;
        `
    },
    animated: {
        text: '         🚀 ADVANCED LOGGER v2.0.0         ',
        style: `
            background: linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2);
            background-size: 400% 400%;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 14px;
            font-family: monospace;
            animation: gradientShift 3s ease infinite;
            display: inline-block;
        `
    }
};

/**
 * Banners de inicialización específicos por {@link ThemeVariant}.
 *
 * Cada theme trae su propio par `{ simple, style }` (banner de una línea
 * + CSS) que combina con la paleta del theme. El texto del banner es
 * siempre una sola línea (sin ASCII art), por lo que es la variante
 * usada por defecto cuando el logger arranca con un theme concreto.
 *
 * @example
 * ```ts
 * import { THEME_BANNERS } from '@mks2508/better-logger/styles';
 *
 * const { simple, style } = THEME_BANNERS.cyberpunk;
 * console.log(`%c${simple}`, style);
 * ```
 *
 * @see {@link THEME_PRESETS} para los estilos de badge por nivel de cada theme.
 * @see {@link ThemeVariant} para la lista de themes disponibles.
 */
export const THEME_BANNERS: Record<ThemeVariant, { simple: string; style: string }> = {
    default: {
        simple: '🚀 ADVANCED LOGGER v2.0.0 - State-of-the-art Console Styling 🚀',
        style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold;'
    },
    dark: {
        simple: '🌙 ADVANCED LOGGER v2.0.0 - Dark Mode Console Excellence 🌙',
        style: 'background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); color: #e2e8f0; padding: 12px 20px; border-radius: 8px; font-weight: bold; border: 1px solid #4a5568;'
    },
    neon: {
        simple: '⚡ ADVANCED LOGGER v2.0.0 - Cyberpunk Console Experience ⚡',
        style: 'background: linear-gradient(135deg, #0f3460 0%, #e94560 100%); color: #00ffff; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-shadow: 0 0 10px #00ffff;'
    },
    minimal: {
        simple: 'ADVANCED LOGGER v2.0.0 - Clean Console Styling',
        style: 'background: #f7fafc; color: #2d3748; padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; font-weight: 500;'
    },
    light: {
        simple: '☀️ ADVANCED LOGGER v2.0.0 - Bright Console Styling ☀️',
        style: 'background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); color: #495057; padding: 12px 20px; border-radius: 8px; font-weight: bold; border: 1px solid #dee2e6;'
    },
    cyberpunk: {
        simple: '🤖 ADVANCED LOGGER v2.0.0 - Neural Console Interface 🤖',
        style: 'background: linear-gradient(135deg, #0d1b2a 0%, #415a77 100%); color: #00d4aa; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-shadow: 0 0 10px #00d4aa; border: 1px solid #00d4aa;'
    }
};

/**
 * Detecta la variante de banner más rica que el entorno puede renderizar.
 *
 * Usa `navigator.userAgent` y probes sobre `document` para decidir entre
 * `animated` (Chrome con CSS animations), `svg` (Chrome/Firefox con SVG),
 * `unicode` (Chrome/Firefox fallback), `ascii` (Safari) o `simple`
 * (todo lo demás). En entornos sin `navigator` o `document` retorna
 * `'simple'` inmediatamente (Node, SSR, Web Workers).
 *
 * @returns {BannerType} Variante de banner recomendada para el entorno.
 *
 * @example
 * ```ts
 * import { detectBannerCapabilities } from '@mks2508/better-logger/styles';
 *
 * const capable = detectBannerCapabilities();
 * console.log(`Best banner for this env: ${capable}`);
 * ```
 *
 * @see {@link BANNER_VARIANTS} para el catálogo que indexa este resultado.
 */
export function detectBannerCapabilities(): BannerType {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') {
        return 'simple';
    }

    // Detectar capacidades del navegador
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

    // SVG support (la mayoría de navegadores modernos)
    const supportsSVG = !!document.createElementNS &&
        !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

    // CSS animation support
    const supportsAnimations = 'animationName' in document.createElement('div').style;

    // Progressive enhancement: elegir la variante más rica soportada
    if (supportsAnimations && isChrome) {
        return 'animated';
    } else if (supportsSVG && (isChrome || isFirefox)) {
        return 'svg';
    } else if (isChrome || isFirefox) {
        return 'unicode';
    } else if (isSafari) {
        return 'ascii';
    }

    return 'simple';
}

/**
 * Pinta el banner de inicialización del logger en la consola del navegador.
 *
 * Si no se pasa `bannerType`, se auto-detecta vía
 * {@link detectBannerCapabilities}. Además del banner, abre un
 * `console.group` con la lista de features soportadas (styling, stack
 * traces, performance timers, handlers, ...).
 *
 * No-op cuando `document` no está disponible (Node, SSR, Web Workers),
 * para evitar referencias a APIs inexistentes.
 *
 * @param {BannerType} [bannerType] - Variante de banner a pintar. Si se
 *   omite, se detecta automáticamente la mejor soportada.
 * @returns {void}
 *
 * @example
 * ```ts
 * import { displayInitBanner } from '@mks2508/better-logger/styles';
 *
 * displayInitBanner();          // auto-detecta
 * displayInitBanner('ascii');   // fuerza ASCII art
 * ```
 *
 * @see {@link BANNER_VARIANTS} para las variantes disponibles.
 * @see {@link THEME_BANNERS} para banners específicos por theme.
 */
export function displayInitBanner(bannerType?: BannerType): void {
    if (typeof document === 'undefined') return;

    const selectedType = bannerType || detectBannerCapabilities();
    const banner = BANNER_VARIANTS[selectedType];

    // Añadir @keyframes CSS si hace falta
    if (selectedType === 'animated') {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    }

    console.log(`%c${banner.text}`, banner.style);

    // Mostrar features destacadas
    const features = [
        '🎨 Advanced CSS Console Styling',
        '📍 Automatic Stack Trace Parsing',
        '🔧 Scoped Loggers & Prefixes',
        '⚡ Performance Timers',
        '🎯 Verbosity Filtering',
        '🔌 Extensible Handlers',
        '📱 Modern TypeScript Patterns',
        '📤 Export & Clipboard Support'
    ];

    console.group(`%c✨ Features`, 'background: #f8f9fa; color: #495057; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

    features.forEach(feature => {
        console.log(`%c${feature}`, 'color: #6c757d; font-size: 13px;');
    });

    console.groupEnd();
    console.log(''); // Espaciado final
}