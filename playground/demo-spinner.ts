/**
 * Spinner lifecycle: start, text update, succeed/fail.
 * Run: bun playground/demo-spinner.ts
 */
import { Logger } from '../src/Logger.js';

const logger = new Logger();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    logger.header('Spinner Demos');
    logger.divider();
    logger.blank();

    // ── Basic spinner → succeed ───────────────────────
    logger.info('1. Basic spinner with succeed');
    const s1 = logger.spinner('Installing dependencies...');
    s1.start();
    await sleep(1500);
    s1.succeed('Dependencies installed');
    logger.blank();

    // ── Spinner with text() update ────────────────────
    logger.info('2. Spinner with text update');
    const s2 = logger.spinner('Downloading package 1/3...');
    s2.start();
    await sleep(800);
    s2.text('Downloading package 2/3...');
    await sleep(800);
    s2.text('Downloading package 3/3...');
    await sleep(800);
    s2.succeed('All packages downloaded');
    logger.blank();

    // ── Spinner → fail ────────────────────────────────
    logger.info('3. Spinner with fail');
    const s3 = logger.spinner('Connecting to database...');
    s3.start();
    await sleep(1200);
    s3.fail('Connection refused on port 5432');
    logger.blank();

    // ── Multiple sequential spinners ──────────────────
    logger.info('4. Sequential spinners');
    const tasks = [
        'Compiling TypeScript...',
        'Running linter...',
        'Building bundles...',
        'Generating types...',
    ];
    for (const task of tasks) {
        const s = logger.spinner(task);
        s.start();
        await sleep(700);
        s.succeed();
    }
    logger.blank();

    // ── Spinner concurrent with logger.info ───────────
    logger.info('5. Spinner with interleaved log messages');
    const s5 = logger.spinner('Processing files...');
    s5.start();
    await sleep(400);
    logger.info('  Found 42 files');
    await sleep(400);
    logger.info('  Processed batch 1');
    await sleep(400);
    logger.info('  Processed batch 2');
    await sleep(400);
    s5.succeed('All files processed');
    logger.blank();

    logger.divider();
    logger.info('Spinner demos complete.');
}

main().catch(console.error);
