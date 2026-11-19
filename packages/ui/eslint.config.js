import { defineConfig } from 'eslint/config';
import reactLibrary from '@deck-club/config/eslint/react-library';

export default defineConfig(
  {
    // shadcn/ui primitives, vendored as the CLI writes them and never edited
    // (README.md). `pnpm lint` checks them against ui-lock.json instead, and
    // `pnpm typecheck` still type-checks them.
    ignores: ['src/ui/**', 'storybook-static/**'],
  },
  ...reactLibrary,
  {
    // Maintenance scripts report what they did on stdout.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
);
