import { defineConfig } from 'eslint/config';
import nest from '@deck-club/config/eslint/nest';

export default defineConfig(
  ...nest,
  {
    // A view runs in the host's iframe: the only way it can report a problem
    // to a developer is the browser console.
    files: ['src/modules/widgets/views/browser/**/*.ts'],
    rules: { 'no-console': ['error', { allow: ['error'] }] },
  },
  {
    // Build scripts report what they built on stdout.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
);
