import { defineConfig } from 'rolldown'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

const entries = {
    index: resolve(root, 'src/index.ts'),
    core: resolve(root, 'src/core.ts'),
    cli: resolve(root, 'src/cli-module.ts'),
}

const external = [
    /^node:/,
    'fs', 'path', 'process', 'util', 'os', 'stream', 'crypto',
]

const distDir = resolve(root, 'dist')

export default defineConfig([
    {
        input: entries,
        output: {
            dir: distDir,
            format: 'es',
            entryFileNames: '[name].js',
            chunkFileNames: 'chunks/[name]-[hash].js',
            sourcemap: true,
            exports: 'named',
        },
        external,
        platform: 'neutral',
        treeshake: true,
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
    },
    {
        input: entries,
        output: {
            dir: distDir,
            format: 'cjs',
            entryFileNames: '[name].cjs',
            chunkFileNames: 'chunks/[name]-[hash].cjs',
            sourcemap: true,
            exports: 'named',
        },
        external,
        platform: 'neutral',
        treeshake: true,
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
    },
])
