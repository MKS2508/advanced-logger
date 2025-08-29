import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/main.ts', 'src/example.ts'],
      outDir: 'dist/types',
      rollupTypes: true,
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: {
        // Main entry - Full logger with all features
        index: resolve(__dirname, 'src/index.ts'),
        
        // Core module - Minimal logger without advanced features
        core: resolve(__dirname, 'src/core.ts'),
        
        // Styling module - Advanced visual features
        styling: resolve(__dirname, 'src/styling-module.ts'),
        
        // Exports module - Export and remote handlers  
        exports: resolve(__dirname, 'src/exports-module.ts')
      },
      name: 'BetterLogger',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'cjs' ? 'cjs' : 'js';
        return `${entryName}.${ext}`;
      }
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
        preserveModules: false,
        chunkFileNames: 'chunks/[name]-[hash].js',
        manualChunks: (id) => {
          // Separate styling features into their own chunk
          if (id.includes('styling/') || id.includes('banners.ts') || id.includes('themes.ts')) {
            return 'styling';
          }
          // Separate export handlers
          if (id.includes('handlers/Export') || id.includes('handlers/Remote')) {
            return 'exports';
          }
          // Core functionality
          if (id.includes('src/types/') || id.includes('src/utils/')) {
            return 'core';
          }
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.debug'],
        passes: 2
      },
      mangle: {
        properties: false,
        keep_classnames: true,
        keep_fnames: true
      },
      format: {
        comments: false,
        preserve_annotations: true
      }
    },
    target: 'es2022'
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})