/**
 * Step progress walkthrough with simulated work delays.
 * Run: bun playground/demo-steps.ts
 */
import { Logger } from '../src/Logger.js';

const logger = new Logger();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    logger.header('Step Progress Demos');
    logger.divider();
    logger.blank();

    // ── Basic step sequence ───────────────────────────
    logger.info('1. Basic step sequence');
    logger.blank();

    const steps = [
        'Reading configuration...',
        'Validating schema...',
        'Compiling sources...',
        'Running tests...',
        'Generating output...',
    ];

    for (let i = 0; i < steps.length; i++) {
        logger.step(i + 1, steps.length, steps[i]);
        await sleep(300);
    }
    logger.blank();

    // ── Steps combined with spinners ──────────────────
    logger.info('2. Steps with spinners');
    logger.blank();

    logger.step(1, 3, 'Fetching remote data');
    const s1 = logger.spinner('Downloading manifest...');
    s1.start();
    await sleep(1000);
    s1.succeed('Manifest downloaded (2.3 KB)');

    logger.step(2, 3, 'Processing data');
    const s2 = logger.spinner('Parsing JSON...');
    s2.start();
    await sleep(600);
    s2.text('Validating entries...');
    await sleep(600);
    s2.succeed('42 entries validated');

    logger.step(3, 3, 'Writing output');
    const s3 = logger.spinner('Generating report...');
    s3.start();
    await sleep(800);
    s3.succeed('Report saved to ./output/report.json');
    logger.blank();

    // ── Many steps ────────────────────────────────────
    logger.info('3. Long step sequence (10 steps)');
    logger.blank();

    for (let i = 1; i <= 10; i++) {
        logger.step(i, 10, `Migration step ${i}`);
        await sleep(150);
    }
    logger.blank();

    logger.divider();
    logger.info('Step demos complete.');
}

main().catch(console.error);
