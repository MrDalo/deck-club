import { defineConfig } from 'eslint/config';
import library from '@deck-club/config/eslint/library';

export default defineConfig(...library, {
  // This package is where schemas live, so it is the one place zod is imported.
  files: ['src/**/*.ts'],
  rules: { '@typescript-eslint/no-restricted-imports': 'off' },
});
