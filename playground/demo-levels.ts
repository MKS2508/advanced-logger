/**
 * setCLILevel() toggling: silent → quiet → normal → verbose.
 * Run: bun playground/demo-levels.ts
 */
import { Logger } from '../src/Logger.js';
import type { CLILogLevel } from '../src/types/index.js';

const logger = new Logger();

function demonstrateLevel(level: CLILogLevel) {
    logger.setCLILevel(level);
    process.stderr.write(`\n── setCLILevel('${level}') ──\n`);

    // Try each primitive
    logger.header('Header', 'subtitle');
    logger.divider();
    logger.step(1, 3, 'Step message');
    logger.box('Box content', { title: 'Box', borderStyle: 'rounded' });
    logger.cliTable([{ key: 'value', status: 'ok' }]);
    logger.blank();

    // Also test regular log methods
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    process.stderr.write(`── end '${level}' ──\n`);
}

function main() {
    // Start with a visible header
    logger.setCLILevel('normal');
    logger.header('CLI Level Demos');
    logger.divider();

    logger.info('Each level sets verbosity + primitive visibility:');
    logger.info('  silent  → no output at all');
    logger.info('  quiet   → errors only, primitives hidden');
    logger.info('  normal  → info+, primitives visible');
    logger.info('  verbose → debug+, primitives visible');
    logger.blank();

    // Demonstrate each level
    const levels: CLILogLevel[] = ['silent', 'quiet', 'normal', 'verbose'];
    for (const level of levels) {
        demonstrateLevel(level);
    }

    // Restore to normal
    logger.setCLILevel('normal');
    logger.blank();
    logger.divider();
    logger.info('Level demos complete. Restored to "normal".');
}

main();
