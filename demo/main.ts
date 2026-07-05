/**
 * Demo orchestrator.
 *
 * Wires up:
 *  - a console.* hook that paints every call into the output panel (styled
 *    spans for %c format strings, JSON.stringify for objects, Error rendering
 *    for Error instances, an HTML table for console.table calls).
 *  - the snippet list (left side) — click any entry to run it.
 *  - the theme/preset dropdowns — pick a value to apply it live.
 *  - the REPL at the bottom — type any expression and hit run.
 *
 * Imports the logger from `../dist/index.js` (the built artifact). Run
 * `bun run build` first if you change anything in `src/`.
 */
import logger, {
    THEME_PRESETS,
    api,
    component,
    critical,
    debug,
    error,
    info,
    success,
    trace,
    warn,
} from '../src/index.ts';
import type { ThemeVariant } from '../src/index.ts';

import { snippets } from './snippets.js';

// ────────────────────────────────────────────────────────────────────────────
// Console hook
// ────────────────────────────────────────────────────────────────────────────

type ConsoleFn = (...args: unknown[]) => void;

const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    trace: console.trace.bind(console),
    table: console.table.bind(console),
    group: console.group.bind(console),
    groupCollapsed: console.groupCollapsed.bind(console),
    groupEnd: console.groupEnd.bind(console),
} satisfies Record<string, ConsoleFn>;

const outputPanel = document.getElementById('output-panel') as HTMLDivElement;

/**
 * Render one argument into a DOM node. Strings are text nodes; objects become
 * pretty-printed JSON spans; Errors get a dedicated error class for styling.
 */
function argToNode(arg: unknown): Node {
    if (arg === null) return document.createTextNode('null');
    if (arg === undefined) return document.createTextNode('undefined');
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return document.createTextNode(String(arg));
    }
    if (arg instanceof Error) {
        const wrap = document.createElement('span');
        wrap.className = 'output__error';
        wrap.textContent = `${arg.name}: ${arg.message}`;
        if (arg.stack) {
            const stack = document.createElement('pre');
            stack.className = 'output__stack';
            stack.textContent = arg.stack;
            wrap.appendChild(stack);
        }
        return wrap;
    }
    const span = document.createElement('span');
    span.className = 'output__obj';
    try {
        span.textContent = JSON.stringify(arg, null, 2);
    } catch {
        span.textContent = String(arg);
    }
    return span;
}

/**
 * Parse a `%c...` format string and apply each CSS argument to the
 * corresponding segment. Mirrors how `console.log(format, css1, css2, ...)`
 * is interpreted by the browser.
 */
function renderArgs(args: unknown[]): DocumentFragment {
    const frag = document.createDocumentFragment();
    let argIdx = 0;
    const formatStr = typeof args[0] === 'string' ? (args[0] as string) : '';
    argIdx = formatStr ? 1 : 0;

    if (formatStr) {
        const segments = formatStr.split('%c');
        for (let i = 0; i < segments.length; i++) {
            const text = segments[i] ?? '';
            if (i === 0) {
                if (text) frag.appendChild(document.createTextNode(text));
                continue;
            }
            const css = String(args[argIdx++] ?? '');
            const span = document.createElement('span');
            if (css) span.style.cssText = css;
            span.textContent = text;
            frag.appendChild(span);
        }
    }

    while (argIdx < args.length) {
        frag.appendChild(argToNode(args[argIdx++]));
    }

    return frag;
}

/**
 * Build a small HTML table mirroring the layout of `console.table`. The
 * logger calls `console.table(data, columns?)` so we receive arrays of
 * objects (most common) or arrays of primitives.
 */
function buildTableNode(data: unknown, columns?: readonly string[]): HTMLTableElement {
    const table = document.createElement('table');
    table.className = 'output__table';

    const rows = Array.isArray(data) ? data : [data];
    const inferredColumns =
        columns ?? (rows[0] && typeof rows[0] === 'object'
            ? Object.keys(rows[0] as Record<string, unknown>)
            : ['value']);

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const col of inferredColumns) {
        const th = document.createElement('th');
        th.textContent = col;
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows) {
        const tr = document.createElement('tr');
        for (const col of inferredColumns) {
            const td = document.createElement('td');
            const value = (row as Record<string, unknown> | null)?.[col];
            td.textContent = value === undefined ? '' : String(value);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}

/**
 * Push a row into the panel tagged with the log level so we can style the
 * left border / spacing per severity. The real logger output is what we
 * display — no synthetic styling here.
 */
function pushRow(level: string, args: unknown[], builder: (row: HTMLDivElement) => void) {
    const row = document.createElement('div');
    row.className = `output__row output__row--${level}`;
    builder(row);
    outputPanel.appendChild(row);
    outputPanel.scrollTop = outputPanel.scrollHeight;
}

function makeHook(level: string, originalFn: ConsoleFn): ConsoleFn {
    return (...args: unknown[]) => {
        pushRow(level, args, (row) => row.appendChild(renderArgs(args)));
        originalFn(...args);
    };
}

console.log = makeHook('log', original.log);
console.info = makeHook('info', original.info);
console.warn = makeHook('warn', original.warn);
console.error = makeHook('error', original.error);
console.debug = makeHook('debug', original.debug);
console.trace = makeHook('trace', original.trace);

console.table = (data: unknown, columns?: readonly string[]) => {
    pushRow('table', [], (row) => row.appendChild(buildTableNode(data, columns)));
    original.table(data as Parameters<typeof original.table>[0], columns as Parameters<typeof original.table>[1]);
};

console.group = (...args: unknown[]) => {
    const row = document.createElement('div');
    row.className = 'output__row output__row--group';
    row.appendChild(renderArgs(args));
    outputPanel.appendChild(row);
    original.group(...args);
};

console.groupCollapsed = (...args: unknown[]) => {
    const row = document.createElement('div');
    row.className = 'output__row output__row--group';
    row.appendChild(renderArgs(args));
    outputPanel.appendChild(row);
    original.groupCollapsed(...args);
};

console.groupEnd = () => {
    original.groupEnd();
};

// ────────────────────────────────────────────────────────────────────────────
// Snippets
// ────────────────────────────────────────────────────────────────────────────

const snippetList = document.getElementById('snippet-list') as HTMLUListElement;

for (const snippet of snippets) {
    const li = document.createElement('li');
    li.className = 'snippet';

    const btn = document.createElement('button');
    btn.className = 'snippet__btn';
    btn.type = 'button';
    btn.title = snippet.description;
    btn.innerHTML = `
        <span class="snippet__id">${snippet.id}</span>
        <span class="snippet__title">${snippet.title}</span>
    `;
    btn.addEventListener('click', () => {
        try {
            snippet.run();
        } catch (err) {
            error('snippet failed', err instanceof Error ? err : new Error(String(err)));
        }
    });

    li.appendChild(btn);
    snippetList.appendChild(li);
}

// ────────────────────────────────────────────────────────────────────────────
// Theme / preset dropdowns
// ────────────────────────────────────────────────────────────────────────────

const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;

const themes = Object.keys(THEME_PRESETS) as ThemeVariant[];
for (const theme of themes) {
    const opt = document.createElement('option');
    opt.value = theme;
    opt.textContent = theme;
    themeSelect.appendChild(opt);
}
themeSelect.value = (logger.getConfig().theme as string | undefined) ?? themes[0];
themeSelect.addEventListener('change', () => {
    try {
        logger.setTheme(themeSelect.value as ThemeVariant);
    } catch (err) {
        error('setTheme failed', err instanceof Error ? err : new Error(String(err)));
    }
});

const presets = logger.presets();
for (const name of presets) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    presetSelect.appendChild(opt);
}
presetSelect.value = presets[0] ?? '';
presetSelect.addEventListener('change', () => {
    try {
        logger.preset(presetSelect.value);
    } catch (err) {
        error('preset failed', err instanceof Error ? err : new Error(String(err)));
    }
});

// ────────────────────────────────────────────────────────────────────────────
// Clear button
// ────────────────────────────────────────────────────────────────────────────

document.getElementById('clear-output')?.addEventListener('click', () => {
    outputPanel.replaceChildren();
});

// ────────────────────────────────────────────────────────────────────────────
// REPL
// ────────────────────────────────────────────────────────────────────────────

const replInput = document.getElementById('repl-input') as HTMLTextAreaElement;
const replRun = document.getElementById('repl-run') as HTMLButtonElement;

const replScope = {
    logger,
    info,
    warn,
    error,
    debug,
    critical,
    success,
    trace,
    api,
    component,
};

function runRepl() {
    const code = replInput.value;
    if (!code.trim()) return;
    const fn = new Function(...Object.keys(replScope), code);
    try {
        fn(...Object.values(replScope));
    } catch (err) {
        error('repl error', err instanceof Error ? err : new Error(String(err)));
    }
}

replRun.addEventListener('click', runRepl);
replInput.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runRepl();
    }
});

// ────────────────────────────────────────────────────────────────────────────
// Welcome banner
// ────────────────────────────────────────────────────────────────────────────

info('better-logger demo ready', {
    snippets: snippets.length,
    themes: themes.length,
    presets: presets.length,
});
info('click a snippet on the left, or try the REPL below');