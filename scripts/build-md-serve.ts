#!/usr/bin/env bun
/**
 * Post-Jekyll build step: serve raw `.md` versions of every docs page plus a
 * navigable index (`llms.txt`) and a concatenated-content file (`llms-full.txt`)
 * for agent consumption, per the llmstxt.org spec.
 *
 * Why a post-build step and not a Jekyll plugin? GitHub Pages (`actions/jekyll-build-pages`)
 * runs on a hardened image that disallows custom plugins, so any non-trivial
 * generation has to live outside Jekyll.
 *
 * Behavior:
 * - For each `*.md` in `docs/` (excluding Jekyll internals) and every page
 *   typedoc emits under `docs/api/`, strip front-matter and copy the cleaned
 *   body to `<out>/<relpath>`.
 * - Generate `llms.txt` indexing only top-level narrative pages + per-module
 *   API READMEs (decoupled: all `.md` are served, only ~12 are indexed).
 * - Generate `llms-full.txt` concatenating the full content of every indexed
 *   page for agents that cannot follow links.
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

interface IDocEntry {
    relPath: string;
    url: string;
    title: string;
    description: string;
    body: string;
    section: string;
}

const ROOT = process.cwd();
const DOCS_SRC = join(ROOT, 'docs');
const SITE_OUT = process.env.OUT_DIR ?? join(ROOT, '_site', 'docs');

/**
 * Parse a markdown file: strip front-matter, extract title (front-matter `title:`
 * or first H1) and description (front-matter `description:` or first non-heading
 * prose paragraph).
 */
function parseMarkdown(content: string): { title: string; description: string; body: string } {
    let body = content;
    const fmMatch = body.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    let frontmatter = '';
    if (fmMatch) {
        frontmatter = fmMatch[1];
        body = body.slice(fmMatch[0].length);
    }

    let title = '';
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
    if (!title) {
        const h1Match = body.match(/^#\s+(.+)$/m);
        if (h1Match) title = h1Match[1].trim();
    }

    let description = '';
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    if (descMatch) description = descMatch[1].trim().replace(/^["']|["']$/g, '');
    if (!description) {
        const paragraphs = body.split(/\n\n+/);
        for (const p of paragraphs) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('#')) continue;
            if (trimmed.startsWith('```')) continue;
            if (trimmed.startsWith('|')) continue;
            if (/^[-*]\s/.test(trimmed)) continue;
            if (trimmed.startsWith('>')) continue;
            // skip paragraphs that are only a package-name link (typedoc boilerplate)
            const linkOnly = trimmed
                .replace(/\[[^\]]+\]\([^)]+\)/g, '')
                .replace(/[*_`]/g, '')
                .trim();
            if (linkOnly.length < 20) continue;
            // skip pure package-name-only paragraphs
            if (/^[\s*`@/.-]+$/.test(linkOnly)) continue;
            description = trimmed
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/[*_`]/g, '')
                .slice(0, 220);
            break;
        }
    }

    return { title, description, body: body.trimStart() };
}

/** Recursively collect every `.md` file under `dir`, sorted for determinism. */
async function walk(dir: string): Promise<string[]> {
    const out: string[] = [];
    if (!existsSync(dir)) return out;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
            out.push(...(await walk(full)));
        } else if (e.name.endsWith('.md')) {
            out.push(full);
        }
    }
    return out.sort();
}

/** Copy a `.md` file to the site output, with front-matter stripped. */
async function serveFile(src: string, destRel: string): Promise<IDocEntry> {
    const { title, description, body } = parseMarkdown(await readFile(src, 'utf-8'));
    const destAbs = join(SITE_OUT, destRel);
    await mkdir(dirname(destAbs), { recursive: true });
    await writeFile(destAbs, body);
    return {
        relPath: destRel,
        url: destRel,
        title,
        description,
        body,
        section: '', // filled in by caller
    };
}

async function main(): Promise<void> {
    console.log('📄 build-md-serve');
    console.log(`   source : ${DOCS_SRC}`);
    console.log(`   output : ${SITE_OUT}`);

    if (!existsSync(DOCS_SRC)) {
        throw new Error(`docs source not found: ${DOCS_SRC}`);
    }
    await mkdir(SITE_OUT, { recursive: true });

    const docEntries: IDocEntry[] = [];
    const apiEntries: IDocEntry[] = [];
    const subPageCount = { served: 0 };

    // ─── Top-level narrative pages ───────────────────────────────
    const topLevel = (await readdir(DOCS_SRC))
        .filter(f => f.endsWith('.md') && !f.startsWith('_'));
    for (const file of topLevel.sort()) {
        const entry = await serveFile(join(DOCS_SRC, file), file);
        entry.section = 'Docs';
        docEntries.push(entry);
        console.log(`  ✓ ${entry.relPath}`);
    }

    // ─── API surface ─────────────────────────────────────────────
    // `api/README.md` is the package-level overview; every module directory has
    // its own README.md. Both are indexed in llms.txt. Sub-pages (classes/,
    // functions/, interfaces/, variables/, type-aliases/) are served raw so any
    // agent can request them by URL, but are not indexed to keep llms.txt
    // navigable.
    const apiSrc = join(DOCS_SRC, 'api');
    if (existsSync(apiSrc)) {
        // Package-level README
        const pkgReadme = join(apiSrc, 'README.md');
        if (existsSync(pkgReadme)) {
            const entry = await serveFile(pkgReadme, 'api/README.md');
            entry.section = 'API · @mks2508/better-logger';
            apiEntries.push(entry);
            console.log(`  ✓ ${entry.relPath}`);
        }

        // Module READMEs
        const moduleDirs = (await readdir(apiSrc, { withFileTypes: true }))
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .sort();
        for (const mod of moduleDirs) {
            const modReadme = join(apiSrc, mod, 'README.md');
            if (!existsSync(modReadme)) continue;
            const entry = await serveFile(modReadme, `api/${mod}/README.md`);
            entry.section = `API · ${mod}`;
            apiEntries.push(entry);
            console.log(`  ✓ ${entry.relPath}`);

            // Sub-pages (classes/, functions/, etc.) — served, not indexed.
            const subFiles = await walk(join(apiSrc, mod));
            for (const sub of subFiles) {
                if (sub.endsWith('README.md')) continue;
                const relFromApi = sub.slice(apiSrc.length + 1);
                await serveFile(sub, `api/${relFromApi}`);
                subPageCount.served++;
            }
        }
    }

    // ─── llms.txt (navigable index per llmstxt.org) ──────────────
    const indexed = [...docEntries, ...apiEntries];
    const siteRoot = 'https://mks2508.github.io/advanced-logger/docs';

    let llms = `# better-logger\n\n`;
    llms += `> TypeScript logger with CSS styling, MDC context propagation, transports (File / HTTP / OTLP→SigNoz), hooks, serializers, and integrated CLI primitives. Dual browser / terminal support from a single package.\n\n`;
    llms +=
        `Documentation: <${siteRoot}/>. All pages listed here are also served as plain Markdown — ` +
        'append `.md` to the page path or follow the relative link.\n\n';

    if (docEntries.length) {
        llms += `## Documentation\n\n`;
        for (const e of docEntries) {
            llms += `- [${e.title}](${e.url})${e.description ? `: ${e.description}` : ''}\n`;
        }
        llms += `\n`;
    }

    if (apiEntries.length) {
        llms += `## API reference\n\n`;
        for (const e of apiEntries) {
            llms += `- [${e.title}](${e.url})${e.description ? `: ${e.description}` : ''}\n`;
        }
        llms += `\n`;
    }

    llms += `## Optional\n\n`;
    llms += `- [llms-full.txt](llms-full.txt): concatenated full content of every page above, for agents that cannot follow links.\n`;

    await writeFile(join(SITE_OUT, 'llms.txt'), llms);
    console.log(`  ✓ llms.txt (${indexed.length} entries)`);

    // ─── llms-full.txt (concatenated content) ────────────────────
    let llmsFull = `# better-logger — full content\n\n`;
    llmsFull +=
        '> Concatenated content of every documentation page indexed in llms.txt. ' +
        `Generated from the same source files used to render the HTML docs at <${siteRoot}/>. ` +
        'Each section starts with a `---` separator and its source path.\n\n';

    for (const e of indexed) {
        llmsFull += `---\n\n`;
        llmsFull += `# ${e.title}\n\n`;
        llmsFull += `Source: ${e.url}\n\n`;
        llmsFull += e.body.trim() + `\n\n`;
    }

    await writeFile(join(SITE_OUT, 'llms-full.txt'), llmsFull);
    const fullSize = (await stat(join(SITE_OUT, 'llms-full.txt'))).size;
    console.log(`  ✓ llms-full.txt (${(fullSize / 1024).toFixed(1)} KB)`);

    console.log(
        `\n✅ build-md-serve: ${docEntries.length} docs + ${apiEntries.length} api modules indexed, ${subPageCount.served} api sub-pages served`
    );
}

main().catch(err => {
    console.error('build-md-serve failed:', err);
    process.exit(1);
});