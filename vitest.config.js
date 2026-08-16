import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,ts}',
      'tests/engineering/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'tests/smoke/**/*',
      'tests/engineering/firstPrinciplesAudit.test.mjs'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@engineering': path.resolve(__dirname, './frontend/src/engineering'),
      '@shared': path.resolve(__dirname, './frontend/src'),
      '@frontend': path.resolve(__dirname, './frontend/src')
    }
  }
});
