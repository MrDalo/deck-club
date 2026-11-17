import { configDefaults } from 'vitest/config';
import { baseConfig } from '@deck-club/config/vitest';
import { DOM_TESTS } from './vitest.dom.config';

// Pure modules run in Node; `*.dom.test.tsx` files run separately under jsdom.
export default baseConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: { exclude: [...configDefaults.exclude, DOM_TESTS] },
});
