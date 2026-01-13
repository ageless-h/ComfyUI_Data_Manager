import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '../web',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/extension.ts'),
      external: ['../../scripts/app.js'],
      output: {
        entryFileNames: 'extension.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        format: 'es',
        globals: {
          '../../scripts/app.js': 'app'
        }
      }
    },
    target: 'ES2020',
    minify: 'esbuild',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
