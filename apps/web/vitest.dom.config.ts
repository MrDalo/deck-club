import { defineConfig } from 'vitest/config';

export const DOM_TESTS = 'src/**/*.dom.test.tsx';

// Component tests under jsdom, run after the node suite by the `test` script.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: {
    include: [DOM_TESTS],
    setupFiles: ['./vitest.dom.setup.ts'],
    environment: 'jsdom',
    pool: 'threads',
    passWithNoTests: false,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 20_000,
  },
});
