import { defineConfig, UserConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// Configuración base compartida
const baseConfig = {
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/main.ts', 'src/example.ts'],
      rollupTypes: true,
      insertTypesEntry: true,
    })
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
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
  }
};

// Configuraciones específicas por build
const buildConfigs = {
  // Build completa - Incluye todas las funcionalidades
  full: {
    ...baseConfig,
    plugins: [
      dts({
        ...baseConfig.plugins[0].options,
        outDir: 'dist/types',
      })
    ],
    build: {
      ...baseConfig.build,
      outDir: 'dist',
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
          core: resolve(__dirname, 'src/core.ts'),
          styling: resolve(__dirname, 'src/styling-module.ts'),
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
          chunkFileNames: 'chunks/[name]-[hash].js'
        }
      }
    }
  },

  // Build modular - Solo core (logger básico)
  core: {
    ...baseConfig,
    plugins: [
      dts({
        ...baseConfig.plugins[0].options,
        outDir: 'dist/modular/core/types',
        include: ['src/core.ts', 'src/constants.ts', 'src/types/**/*'],
      })
    ],
    build: {
      ...baseConfig.build,
      outDir: 'dist/modular/core',
      lib: {
        entry: resolve(__dirname, 'src/core.ts'),
        name: 'BetterLoggerCore',
        formats: ['es', 'cjs'],
        fileName: (format) => {
          const ext = format === 'cjs' ? 'cjs' : 'js';
          return `index.${ext}`;
        }
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {},
          exports: 'named'
        }
      }
    }
  },

  // Build modular - Solo styling (características visuales)
  styling: {
    ...baseConfig,
    plugins: [
      dts({
        ...baseConfig.plugins[0].options,
        outDir: 'dist/modular/styling/types',
        include: ['src/styling-module.ts', 'src/constants.ts', 'src/types/**/*'],
      })
    ],
    build: {
      ...baseConfig.build,
      outDir: 'dist/modular/styling',
      lib: {
        entry: resolve(__dirname, 'src/styling-module.ts'),
        name: 'BetterLoggerStyling',
        formats: ['es', 'cjs'],
        fileName: (format) => {
          const ext = format === 'cjs' ? 'cjs' : 'js';
          return `index.${ext}`;
        }
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {},
          exports: 'named'
        }
      }
    }
  },

  // Build modular - Solo exports (handlers de exportación)
  exports: {
    ...baseConfig,
    plugins: [
      dts({
        ...baseConfig.plugins[0].options,
        outDir: 'dist/modular/exports/types',
        include: ['src/exports-module.ts', 'src/constants.ts', 'src/types/**/*'],
      })
    ],
    build: {
      ...baseConfig.build,
      outDir: 'dist/modular/exports',
      lib: {
        entry: resolve(__dirname, 'src/exports-module.ts'),
        name: 'BetterLoggerExports',
        formats: ['es', 'cjs'],
        fileName: (format) => {
          const ext = format === 'cjs' ? 'cjs' : 'js';
          return `index.${ext}`;
        }
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {},
          exports: 'named'
        }
      }
    }
  }
};

// Determinar configuración según variable de entorno
const buildMode = process.env.BUILD_MODE || 'full';

if (!buildConfigs[buildMode]) {
  throw new Error(`Build mode "${buildMode}" not found. Available modes: ${Object.keys(buildConfigs).join(', ')}`);
}

export default defineConfig(buildConfigs[buildMode] as UserConfig);