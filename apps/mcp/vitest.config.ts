import swc from 'unplugin-swc';
import { baseConfig } from '@deck-club/config/vitest';

// Nest constructor injection needs emitDecoratorMetadata, which esbuild
// cannot produce; swc transforms the test files instead.
export default baseConfig({
  // The view bundles the widget tests read are built first, by the same
  // script `pnpm build` runs.
  test: {
    globalSetup: ['./test/build-views.global.ts'],
    setupFiles: ['./test/silence-logger.ts'],
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: { transform: { legacyDecorator: true, decoratorMetadata: true } },
    }),
  ],
});
