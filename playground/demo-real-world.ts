/**
 * Real-world simulation: a commit-wizard-like CLI workflow.
 * Run: bun playground/demo-real-world.ts
 */
import { Logger } from '../src/Logger.js';

const logger = new Logger();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    // ── Startup ───────────────────────────────────────
    logger.header('Commit Wizard', 'v2.0.0');
    logger.divider();
    logger.blank();

    // ── Step 1: Analyze repository ────────────────────
    logger.step(1, 5, 'Analyzing repository...');
    const s1 = logger.spinner('Loading git diff...');
    s1.start();
    await sleep(1200);
    s1.succeed('3 files changed, 47 insertions, 12 deletions');
    logger.blank();

    // ── Step 2: Detect provider ───────────────────────
    logger.step(2, 5, 'Detecting provider...');
    await sleep(300);

    logger.cliTable([
        { provider: 'Gemini SDK', key: 'GEMINI_API_KEY', status: 'not set' },
        { provider: 'Groq', key: 'GROQ_API_KEY', status: 'found ✓' },
        { provider: 'OpenRouter', key: 'OPENROUTER_API_KEY', status: 'not set' },
        { provider: 'Gemini CLI', key: 'binary', status: 'not found' },
    ]);
    logger.blank();
    logger.info('  Using provider: Groq (llama-3.3-70b-versatile)');
    logger.blank();

    // ── Step 3: Generate commit ───────────────────────
    logger.step(3, 5, 'Generating commit message...');
    const s3 = logger.spinner('AI thinking...');
    s3.start();
    await sleep(800);
    s3.text('Analyzing diff patterns...');
    await sleep(600);
    s3.text('Composing message...');
    await sleep(600);
    s3.succeed('Commit message generated');
    logger.blank();

    logger.box(
        [
            'feat(providers): add multi-provider AI support',
            '',
            'Implement Gemini SDK, Groq, and OpenRouter providers',
            'with automatic detection based on available API keys.',
            '',
            '<technical>',
            '- Added GeminiSdkProvider, GroqProvider, OpenRouterProvider classes',
            '- Factory function with priority-based auto-detection',
            '- Shared IAIProvider interface for all implementations',
            '</technical>',
            '',
            '<changelog>',
            '## Feature 🚀',
            'Multi-provider AI support with automatic fallback',
            '</changelog>',
        ].join('\n'),
        { title: 'Commit #1', borderStyle: 'rounded', borderColor: '#ff6b6b' },
    );
    logger.blank();

    // ── Step 4: Apply commit ──────────────────────────
    logger.step(4, 5, 'Applying commit...');
    const s4 = logger.spinner('Running git commit...');
    s4.start();
    await sleep(800);
    s4.succeed('Commit applied: abc1234');
    logger.blank();

    // ── Step 5: Done ──────────────────────────────────
    logger.step(5, 5, 'Done');
    logger.blank();

    logger.box(
        [
            '1 commit applied successfully',
            '',
            'Provider: Groq',
            'Model:    llama-3.3-70b-versatile',
            'Time:     2.4s',
        ].join('\n'),
        { title: 'Summary', borderStyle: 'rounded', borderColor: '#00ff00' },
    );
    logger.blank();
    logger.divider();
}

main().catch(console.error);
