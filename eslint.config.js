// Root config covers root-level config files only. Each workspace package has
// its own eslint.config.js picking the flavour it needs from @deck-club/config.
import { defineConfig } from 'eslint/config';
import base from '@deck-club/config/eslint/base';

export default defineConfig(
  {
    ignores: [
      'apps/**',
      'packages/**',
      '**/node_modules/**',
      '.turbo/**',
      '.claude/**',
      '.agents/**',
    ],
  },
  ...base,
);
