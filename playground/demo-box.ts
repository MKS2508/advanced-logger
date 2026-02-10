/**
 * Box primitive — all border styles, colors, titles, multiline.
 * Run: bun playground/demo-box.ts
 */
import { Logger } from '../src/Logger.js';

const logger = new Logger();

function main() {
    logger.header('Box Demos');
    logger.divider();
    logger.blank();

    // ── Each border style ─────────────────────────────
    logger.info('1. Border styles');
    logger.blank();

    logger.box('Single border style', { borderStyle: 'single', title: 'single' });
    logger.blank();

    logger.box('Rounded border style (default)', { borderStyle: 'rounded', title: 'rounded' });
    logger.blank();

    logger.box('Double border style', { borderStyle: 'double', title: 'double' });
    logger.blank();

    logger.box('Bold border style', { borderStyle: 'bold', title: 'bold' });
    logger.blank();

    // ── With / without title ──────────────────────────
    logger.info('2. Title variations');
    logger.blank();

    logger.box('This box has a title above', { title: 'With Title' });
    logger.blank();

    logger.box('This box has no title');
    logger.blank();

    // ── Border colors ─────────────────────────────────
    logger.info('3. Border colors');
    logger.blank();

    logger.box('Red border', { title: 'Error', borderColor: '#ff4444', borderStyle: 'bold' });
    logger.blank();

    logger.box('Green border', { title: 'Success', borderColor: '#00cc66', borderStyle: 'rounded' });
    logger.blank();

    logger.box('Blue border', { title: 'Info', borderColor: '#4488ff', borderStyle: 'double' });
    logger.blank();

    logger.box('Yellow border', { title: 'Warning', borderColor: '#ffaa00', borderStyle: 'single' });
    logger.blank();

    // ── Multiline content ─────────────────────────────
    logger.info('4. Multiline content');
    logger.blank();

    logger.box(
        [
            'feat(providers): add multi-provider AI support',
            '',
            'Added Gemini SDK, Groq, and OpenRouter providers',
            'with automatic detection and fallback chain.',
        ].join('\n'),
        { title: 'Commit #1', borderStyle: 'rounded', borderColor: '#ff6b6b' },
    );
    logger.blank();

    // ── Long content ──────────────────────────────────
    logger.info('5. Long single-line content');
    logger.blank();

    logger.box(
        'This is a very long line of text that should demonstrate how the box renderer handles content that extends beyond a typical terminal width to verify wrapping or truncation behavior.',
        { title: 'Long Content', borderStyle: 'rounded' },
    );
    logger.blank();

    logger.divider();
    logger.info('Box demos complete.');
}

main();
