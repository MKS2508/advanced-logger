/**
 * Vite config for the demo only.
 *
 * - `root: 'demo'` tells vite the source lives in `demo/` (index.html + main.ts
 *   + styles.css + snippets.ts), separate from the library build.
 * - `outDir: '../dist-demo'` places the production build next to the regular
 *   `dist/` (lib build) so the deploy workflow can copy them independently.
 * - `base: './'` makes asset URLs relative, which is required when the demo
 *   is served from a subpath (e.g. GitHub Pages project sites).
 */
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'demo',
    base: './',
    build: {
        outDir: '../dist-demo',
        emptyOutDir: true,
        sourcemap: true,
        target: 'es2022',
    },
    server: {
        port: 5173,
        strictPort: true,
    },
});