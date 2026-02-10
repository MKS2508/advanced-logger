/**
 * CLI table — various column counts, auto-width, explicit columns.
 * Run: bun playground/demo-table.ts
 */
import { Logger } from '../src/Logger.js';

const logger = new Logger();

function main() {
    logger.header('Table Demos');
    logger.divider();
    logger.blank();

    // ── Auto-detect columns from data ─────────────────
    logger.info('1. Auto-detected columns');
    logger.blank();

    logger.cliTable([
        { name: 'Gemini SDK', version: '1.0.0', status: 'active' },
        { name: 'Groq SDK', version: '0.8.2', status: 'active' },
        { name: 'OpenRouter', version: '2.1.0', status: 'fallback' },
    ]);
    logger.blank();

    // ── Explicit columns via options ──────────────────
    logger.info('2. Explicit columns (subset)');
    logger.blank();

    logger.cliTable(
        [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
            { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
        ],
        { columns: ['name', 'role'] },
    );
    logger.blank();

    // ── Various value lengths ─────────────────────────
    logger.info('3. Mixed value lengths');
    logger.blank();

    logger.cliTable([
        { key: 'a', value: 'short' },
        { key: 'longer-key-name', value: 'This is a much longer value to test column sizing' },
        { key: 'b', value: '42' },
    ]);
    logger.blank();

    // ── Numeric and boolean values ────────────────────
    logger.info('4. Numeric and boolean values');
    logger.blank();

    logger.cliTable([
        { metric: 'Requests/sec', value: 12500, healthy: true },
        { metric: 'Avg latency', value: 23.4, healthy: true },
        { metric: 'Error rate', value: 0.02, healthy: true },
        { metric: 'Memory (MB)', value: 512, healthy: false },
    ]);
    logger.blank();

    // ── Many columns ──────────────────────────────────
    logger.info('5. Many columns');
    logger.blank();

    logger.cliTable([
        { col1: 'A', col2: 'B', col3: 'C', col4: 'D', col5: 'E', col6: 'F' },
        { col1: '1', col2: '2', col3: '3', col4: '4', col5: '5', col6: '6' },
    ]);
    logger.blank();

    // ── Single row ────────────────────────────────────
    logger.info('6. Single row');
    logger.blank();

    logger.cliTable([{ provider: 'Gemini SDK', model: 'gemini-2.5-flash', latency: '120ms' }]);
    logger.blank();

    logger.divider();
    logger.info('Table demos complete.');
}

main();
