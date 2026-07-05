/**
 * Demo snippets — each shows a real feature of the logger against the actual
 * runtime, not a stub. The runner captures the console output and paints it
 * into the page so the snippets exercise the real render path.
 *
 * Imports reach into `../dist/index.js` because the demo is served as static
 * files; the library must be built first (`bun run build`) for changes to be
 * picked up.
 */
import logger, {
    addSerializer,
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

/**
 * A runnable snippet. `run()` invokes the logger with a realistic payload;
 * whatever it logs is captured by the demo's console hook and rendered to
 * the page. The description shows in the snippet list as a tooltip.
 */
export interface ISnippet {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly run: () => void;
}

const themes: readonly ThemeVariant[] = [
    'default',
    'dark',
    'neon',
    'cyberpunk',
    'minimal',
    'light',
];

export const snippets: readonly ISnippet[] = [
    {
        id: 'levels',
        title: 'Log levels',
        description: 'Seven levels with structured payloads.',
        run: () => {
            debug('loading module', { module: 'auth', attempt: 1 });
            info('user signed in', { user: 'mks', ttl: 3600 });
            warn('rate limit approaching', { remaining: 3, limit: 100 });
            error('upstream failed', new Error('503 Service Unavailable'));
            success('migration complete', { rows: 4218, ms: 1230 });
            critical('database unreachable');
            trace('handler entered', { fn: 'handleRequest' });
        },
    },
    {
        id: 'scope',
        title: 'Scoped loggers',
        description:
            'api() and component() inherit the parent prefix and add their own scope.',
        run: () => {
            const auth = api('Auth');
            const users = auth.component('Users');

            auth.info('starting session');
            users.info('looking up user', { id: 'u-1024' });
            users.warn('password expiring', { daysLeft: 7 });
            users.success('user loaded');
        },
    },
    {
        id: 'mdc',
        title: 'MDC child context',
        description:
            'child() propagates bindings to every nested call without leaking globals.',
        run: () => {
            const req = logger.child({ requestId: 'req-a1b2' });
            req.info('received request', { path: '/orders' });

            const handler = req.component('Handler');
            handler.info('validating input');
            handler.info('querying database');
            handler.success('response sent', { ms: 23 });
        },
    },
    {
        id: 'theme',
        title: 'Theme switching',
        description: 'setTheme() mutates badge styles live — click again to cycle.',
        run: () => {
            const current = logger.getConfig().theme as ThemeVariant;
            const idx = themes.indexOf(current);
            const next = themes[(idx + 1) % themes.length] as ThemeVariant;
            logger.setTheme(next);
            logger.info('theme changed', { from: current, to: next });
        },
    },
    {
        id: 'serializer',
        title: 'Custom serializer',
        description: 'addSerializer() controls how classes render in the output.',
        run: () => {
            class Money {
                constructor(
                    public amount: number,
                    public currency: string,
                ) {}
            }
            addSerializer(Money, (m: Money) => `${m.currency} ${m.amount.toFixed(2)}`);

            logger.info('order placed', {
                orderId: 'ord-77',
                total: new Money(42.5, 'EUR'),
                placedAt: new Date(),
            });
        },
    },
];