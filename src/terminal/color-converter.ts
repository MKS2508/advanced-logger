/**
 * Color Converter - CSS colors to ANSI extended color codes
 * Supports 256-color and truecolor (24-bit) terminals
 */

export type ColorCapability = 'full' | 'basic' | 'none';

export interface RGB {
    r: number;
    g: number;
    b: number;
}

const ANSI_16_COLORS: Record<string, { fg: string; bg: string; bright: { fg: string; bg: string } }> = {
    black:   { fg: '30', bg: '40', bright: { fg: '90', bg: '100' } },
    red:     { fg: '31', bg: '41', bright: { fg: '91', bg: '101' } },
    green:   { fg: '32', bg: '42', bright: { fg: '92', bg: '102' } },
    yellow:  { fg: '33', bg: '43', bright: { fg: '93', bg: '103' } },
    blue:    { fg: '34', bg: '44', bright: { fg: '94', bg: '104' } },
    magenta: { fg: '35', bg: '45', bright: { fg: '95', bg: '105' } },
    cyan:    { fg: '36', bg: '46', bright: { fg: '96', bg: '106' } },
    white:   { fg: '37', bg: '47', bright: { fg: '97', bg: '107' } },
    gray:    { fg: '90', bg: '100', bright: { fg: '37', bg: '47' } },
    grey:    { fg: '90', bg: '100', bright: { fg: '37', bg: '47' } },
};

const CSS_NAMED_COLORS: Record<string, string> = {
    aliceblue: '#f0f8ff', antiquewhite: '#faebd7', aqua: '#00ffff',
    aquamarine: '#7fffd4', azure: '#f0ffff', beige: '#f5f5dc',
    bisque: '#ffe4c4', black: '#000000', blanchedalmond: '#ffebcd',
    blue: '#0000ff', blueviolet: '#8a2be2', brown: '#a52a2a',
    burlywood: '#deb887', cadetblue: '#5f9ea0', chartreuse: '#7fff00',
    chocolate: '#d2691e', coral: '#ff7f50', cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc', crimson: '#dc143c', cyan: '#00ffff',
    darkblue: '#00008b', darkcyan: '#008b8b', darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9', darkgreen: '#006400', darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b', darkolivegreen: '#556b2f', darkorange: '#ff8c00',
    darkorchid: '#9932cc', darkred: '#8b0000', darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f', darkslateblue: '#483d8b', darkslategray: '#2f4f4f',
    darkturquoise: '#00ced1', darkviolet: '#9400d3', deeppink: '#ff1493',
    deepskyblue: '#00bfff', dimgray: '#696969', dodgerblue: '#1e90ff',
    firebrick: '#b22222', floralwhite: '#fffaf0', forestgreen: '#228b22',
    fuchsia: '#ff00ff', gainsboro: '#dcdcdc', ghostwhite: '#f8f8ff',
    gold: '#ffd700', goldenrod: '#daa520', gray: '#808080',
    green: '#008000', greenyellow: '#adff2f', honeydew: '#f0fff0',
    hotpink: '#ff69b4', indianred: '#cd5c5c', indigo: '#4b0082',
    ivory: '#fffff0', khaki: '#f0e68c', lavender: '#e6e6fa',
    lavenderblush: '#fff0f5', lawngreen: '#7cfc00', lemonchiffon: '#fffacd',
    lightblue: '#add8e6', lightcoral: '#f08080', lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2', lightgray: '#d3d3d3', lightgreen: '#90ee90',
    lightpink: '#ffb6c1', lightsalmon: '#ffa07a', lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa', lightslategray: '#778899', lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0', lime: '#00ff00', limegreen: '#32cd32',
    linen: '#faf0e6', magenta: '#ff00ff', maroon: '#800000',
    mediumaquamarine: '#66cdaa', mediumblue: '#0000cd', mediumorchid: '#ba55d3',
    mediumpurple: '#9370db', mediumseagreen: '#3cb371', mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a', mediumturquoise: '#48d1cc', mediumvioletred: '#c71585',
    midnightblue: '#191970', mintcream: '#f5fffa', mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5', navajowhite: '#ffdead', navy: '#000080',
    oldlace: '#fdf5e6', olive: '#808000', olivedrab: '#6b8e23',
    orange: '#ffa500', orangered: '#ff4500', orchid: '#da70d6',
    palegoldenrod: '#eee8aa', palegreen: '#98fb98', paleturquoise: '#afeeee',
    palevioletred: '#db7093', papayawhip: '#ffefd5', peachpuff: '#ffdab9',
    peru: '#cd853f', pink: '#ffc0cb', plum: '#dda0dd',
    powderblue: '#b0e0e6', purple: '#800080', rebeccapurple: '#663399',
    red: '#ff0000', rosybrown: '#bc8f8f', royalblue: '#4169e1',
    saddlebrown: '#8b4513', salmon: '#fa8072', sandybrown: '#f4a460',
    seagreen: '#2e8b57', seashell: '#fff5ee', sienna: '#a0522d',
    silver: '#c0c0c0', skyblue: '#87ceeb', slateblue: '#6a5acd',
    slategray: '#708090', snow: '#fffafa', springgreen: '#00ff7f',
    steelblue: '#4682b4', tan: '#d2b48c', teal: '#008080',
    thistle: '#d8bfd8', tomato: '#ff6347', turquoise: '#40e0d0',
    violet: '#ee82ee', wheat: '#f5deb3', white: '#ffffff',
    whitesmoke: '#f5f5f5', yellow: '#ffff00', yellowgreen: '#9acd32',
};

export function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) {
        return { r: 255, g: 255, b: 255 };
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexTo256(hex: string): number {
    const { r, g, b } = hexToRgb(hex);

    if (r === g && g === b) {
        if (r < 8) return 16;
        if (r > 248) return 231;
        return Math.round(((r - 8) / 247) * 24) + 232;
    }

    const ri = Math.round(r / 255 * 5);
    const gi = Math.round(g / 255 * 5);
    const bi = Math.round(b / 255 * 5);

    return 16 + (36 * ri) + (6 * gi) + bi;
}

export function colorToHex(color: string): string {
    if (color.startsWith('#')) {
        return color;
    }

    const named = CSS_NAMED_COLORS[color.toLowerCase()];
    if (named) {
        return named;
    }

    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
        return rgbToHex(
            parseInt(rgbMatch[1]),
            parseInt(rgbMatch[2]),
            parseInt(rgbMatch[3])
        );
    }

    return '#ffffff';
}

export function getANSIForeground(color: string, capability: ColorCapability): string {
    if (capability === 'none') return '';

    const lowerColor = color.toLowerCase();

    if (capability === 'basic' && ANSI_16_COLORS[lowerColor]) {
        return `\x1b[${ANSI_16_COLORS[lowerColor].fg}m`;
    }

    if (capability === 'basic') {
        const hex = colorToHex(color);
        const nearestBasic = findNearestBasicColor(hex);
        const basicColor = ANSI_16_COLORS[nearestBasic];
        return basicColor ? `\x1b[${basicColor.fg}m` : '\x1b[37m';
    }

    const hex = colorToHex(color);
    const { r, g, b } = hexToRgb(hex);
    return `\x1b[38;2;${r};${g};${b}m`;
}

export function getANSIBackground(color: string, capability: ColorCapability): string {
    if (capability === 'none') return '';

    const lowerColor = color.toLowerCase();

    if (capability === 'basic' && ANSI_16_COLORS[lowerColor]) {
        return `\x1b[${ANSI_16_COLORS[lowerColor].bg}m`;
    }

    if (capability === 'basic') {
        const hex = colorToHex(color);
        const nearestBasic = findNearestBasicColor(hex);
        const basicColor = ANSI_16_COLORS[nearestBasic];
        return basicColor ? `\x1b[${basicColor.bg}m` : '\x1b[47m';
    }

    const hex = colorToHex(color);
    const { r, g, b } = hexToRgb(hex);
    return `\x1b[48;2;${r};${g};${b}m`;
}

export function getANSI256Foreground(colorIndex: number): string {
    return `\x1b[38;5;${colorIndex}m`;
}

export function getANSI256Background(colorIndex: number): string {
    return `\x1b[48;5;${colorIndex}m`;
}

function findNearestBasicColor(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    const basicColors: Record<string, RGB> = {
        black:   { r: 0, g: 0, b: 0 },
        red:     { r: 205, g: 0, b: 0 },
        green:   { r: 0, g: 205, b: 0 },
        yellow:  { r: 205, g: 205, b: 0 },
        blue:    { r: 0, g: 0, b: 238 },
        magenta: { r: 205, g: 0, b: 205 },
        cyan:    { r: 0, g: 205, b: 205 },
        white:   { r: 229, g: 229, b: 229 },
    };

    let nearest = 'white';
    let minDistance = Infinity;

    for (const [name, rgb] of Object.entries(basicColors)) {
        const distance = Math.sqrt(
            Math.pow(r - rgb.r, 2) +
            Math.pow(g - rgb.g, 2) +
            Math.pow(b - rgb.b, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = name;
        }
    }

    return nearest;
}

export function extractGradientColors(gradient: string): string[] {
    const hexMatches = gradient.match(/#[a-fA-F0-9]{6}/g) || [];
    const rgbMatches = gradient.match(/rgba?\([^)]+\)/g) || [];
    const namedMatches = gradient.match(/,\s*([a-z]+)(?:\s|,|\))/gi) || [];

    const colors: string[] = [
        ...hexMatches,
        ...rgbMatches.map(colorToHex),
        ...namedMatches.map(m => {
            const name = m.replace(/[,\s)]/g, '').toLowerCase();
            return CSS_NAMED_COLORS[name] || null;
        }).filter((c): c is string => c !== null)
    ];

    return colors.length > 0 ? colors : ['#ffffff'];
}

export function gradientToSingleColor(gradient: string): string {
    const colors = extractGradientColors(gradient);
    if (colors.length === 0) return '#ffffff';
    if (colors.length === 1) return colors[0] ?? '#ffffff';

    const rgbs = colors.map(c => hexToRgb(colorToHex(c)));
    const avgR = Math.round(rgbs.reduce((sum, rgb) => sum + rgb.r, 0) / rgbs.length);
    const avgG = Math.round(rgbs.reduce((sum, rgb) => sum + rgb.g, 0) / rgbs.length);
    const avgB = Math.round(rgbs.reduce((sum, rgb) => sum + rgb.b, 0) / rgbs.length);

    return rgbToHex(avgR, avgG, avgB);
}

export function cssColorToANSI(
    cssColor: string,
    capability: ColorCapability,
    isBackground: boolean = false
): string {
    if (capability === 'none') return '';

    let resolvedColor: string;

    if (cssColor.includes('gradient')) {
        resolvedColor = gradientToSingleColor(cssColor);
    } else {
        resolvedColor = colorToHex(cssColor);
    }

    return isBackground
        ? getANSIBackground(resolvedColor, capability)
        : getANSIForeground(resolvedColor, capability);
}

export const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',
    inverse: '\x1b[7m',
    hidden: '\x1b[8m',
    strikethrough: '\x1b[9m',

    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        brightRed: '\x1b[91m',
        brightGreen: '\x1b[92m',
        brightYellow: '\x1b[93m',
        brightBlue: '\x1b[94m',
        brightMagenta: '\x1b[95m',
        brightCyan: '\x1b[96m',
        brightWhite: '\x1b[97m',
    },

    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        gray: '\x1b[100m',
        brightRed: '\x1b[101m',
        brightGreen: '\x1b[102m',
        brightYellow: '\x1b[103m',
        brightBlue: '\x1b[104m',
        brightMagenta: '\x1b[105m',
        brightCyan: '\x1b[106m',
        brightWhite: '\x1b[107m',
    },

    rgb: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
    bgRgb: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
    color256: (n: number) => `\x1b[38;5;${n}m`,
    bgColor256: (n: number) => `\x1b[48;5;${n}m`,
};
