import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, mergeConfig } from 'vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  core: { disableTelemetry: true },
  typescript: { reactDocgen: 'react-docgen-typescript' },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [react(), tailwindcss()],
      // The package's own `#ui/*`, `#lib/*`… imports resolve to src/, not dist/.
      resolve: { conditions: ['source', ...defaultClientConditions] },
    }),
};

export default config;
