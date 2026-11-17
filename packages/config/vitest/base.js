import { defineConfig, mergeConfig } from 'vitest/config';

/**
 * Shared Vitest base. Every package runs `vitest run` with this and adds
 * only what it needs (a Node vs jsdom environment, an swc plugin for Nest
 * decorators). Tests colocate under src/ or live under test/ (rule 40-tests).
 */
export function baseConfig(overrides = {}) {
  return mergeConfig(
    defineConfig({
      test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*.test.ts'],
        environment: 'node',
        passWithNoTests: false,
        clearMocks: true,
        restoreMocks: true,
        coverage: {
          provider: 'v8',
          reporter: ['text-summary', 'lcov'],
          include: ['src/**'],
          exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
        },
      },
    }),
    overrides,
  );
}
