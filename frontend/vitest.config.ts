import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    // Use happy-dom as the test environment
    environment: 'happy-dom',

    // Global setup file for mocks and configuration
    setupFiles: ['./src/tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        'vitest.config.ts',
        'src/comfy-shim.d.ts',
        'src/app.d.ts',
      ],
      // Set 80% coverage threshold (goal for the project)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Test file matching patterns
    include: ['src/**/*.test.ts'],

    // Exclude certain directories
    exclude: ['node_modules/', 'dist/'],

    // Watch mode settings
    watch: true,

    // UI for debugging
    ui: true,
  },

  // Path aliases for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
