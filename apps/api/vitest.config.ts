import swc from 'unplugin-swc';
import { baseConfig } from '@deck-club/config/vitest';

// Nest constructor injection needs emitDecoratorMetadata, which esbuild
// cannot produce; swc transforms the test files instead.
export default baseConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: { transform: { legacyDecorator: true, decoratorMetadata: true } },
    }),
  ],
});
