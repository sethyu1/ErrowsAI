import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10_000,
    optimizer: {
      ssr: {
        include:  ['../../packages/models']
      }
    },
    coverage: {
      exclude: [
        'config.js',
        'config/**',
        'scripts/**',
      ]
    },
    watch: false
  }
});