import react from '@vitejs/plugin-react';
import { defaultClientConditions } from 'vite';
import { baseConfig } from '@deck-club/config/vitest';

// Component tests render in jsdom. The `source` condition resolves the
// package's own `#ui/*`, `#lib/*`… imports to src/ instead of dist/.
export default baseConfig({
  plugins: [react()],
  resolve: { conditions: ['source', ...defaultClientConditions] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
