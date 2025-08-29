/**
 * @fileoverview Banner configurations for Advanced Logger
 */

import type { BannerType, ThemeVariant } from '../types/index.js';

/**
 * Banner variants for different display capabilities
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
 * Theme-specific banners for enhanced visual theming
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
 * Feature detection for banner capabilities
 */
export function detectBannerCapabilities(): BannerType {
    // Try to detect browser capabilities
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    // Check for SVG support (most modern browsers)
    const supportsSVG = !!document.createElementNS && 
        !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    
    // Check for CSS animation support
    const supportsAnimations = typeof document !== 'undefined' && 
        'animationName' in document.createElement('div').style;
    
    // Progressive enhancement
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
 * Display initialization banner with advanced styling
 */
export function displayInitBanner(bannerType?: BannerType): void {
    const selectedType = bannerType || detectBannerCapabilities();
    const banner = BANNER_VARIANTS[selectedType];
    
    // Add CSS animation keyframes if needed
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

    // Show feature highlights
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
    console.log(''); // Add spacing
}