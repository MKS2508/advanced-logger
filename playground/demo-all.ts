/**
 * Full showcase of every CLI primitive in sequence.
 * Run: bun playground/demo-all.ts
 */
import { Logger } from '../src/Logger.js';
import type { CLILogLevel } from '../src/types/index.js';

const logger = new Logger();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    // ── Header & Divider ──────────────────────────────
    logger.header('Better Logger v5', 'CLI Primitives Showcase');
    logger.divider();
    logger.blank();

    // ── Steps ─────────────────────────────────────────
    logger.info('▸ Step progress');
    for (let i = 1; i <= 5; i++) {
        logger.step(i, 5, `Processing item ${i}...`);
        await sleep(200);
    }
    logger.blank();

    // ── Box — all border styles ───────────────────────
    logger.info('▸ Box primitives');
    logger.blank();

    const styles = ['single', 'rounded', 'double', 'bold'] as const;
    for (const style of styles) {
        logger.box(`borderStyle: "${style}"`, {
            title: style.toUpperCase(),
            borderStyle: style,
        });
        logger.blank();
    }

    logger.box('Box with custom border color\nand multiline content', {
        title: 'Colored',
        borderStyle: 'rounded',
        borderColor: '#ff6b6b',
    });
    logger.blank();

    // ── Table ─────────────────────────────────────────
    logger.info('▸ CLI Table');
    logger.blank();
    logger.cliTable([
        { provider: 'Gemini SDK', model: 'gemini-2.5-flash', status: 'active' },
        { provider: 'Groq', model: 'llama-3.3-70b', status: 'active' },
        { provider: 'OpenRouter', model: 'claude-sonnet-4', status: 'fallback' },
        { provider: 'Gemini CLI', model: 'default', status: 'inactive' },
    ]);
    logger.blank();

    // ── Spinner — succeed ─────────────────────────────
    logger.info('▸ Spinner (succeed)');
    const s1 = logger.spinner('Loading configuration...');
    s1.start();
    await sleep(1000);
    s1.text('Almost done...');
    await sleep(600);
    s1.succeed('Configuration loaded');
    logger.blank();

    // ── Spinner — fail ────────────────────────────────
    logger.info('▸ Spinner (fail)');
    const s2 = logger.spinner('Connecting to remote...');
    s2.start();
    await sleep(800);
    s2.fail('Connection timed out');
    logger.blank();

    // ── setCLILevel ───────────────────────────────────
    logger.info('▸ setCLILevel demo');
    logger.blank();

    logger.setCLILevel('quiet');
    logger.info('  [quiet] This box should NOT appear:');
    logger.box('You should not see this', { title: 'Hidden' });

    logger.setCLILevel('normal');
    logger.box('CLI level restored to normal', {
        title: 'Visible Again',
        borderStyle: 'rounded',
        borderColor: '#00ff00',
    });
    logger.blank();

    // ── Done ──────────────────────────────────────────
    logger.divider();
    logger.header('Showcase Complete');
}

main().catch(console.error);
