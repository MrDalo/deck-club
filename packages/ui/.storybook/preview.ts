import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      options: {
        paper: { name: 'Paper', value: '#faf8ff' },
        card: { name: 'Card', value: '#ffffff' },
      },
    },
    // Every story is checked against WCAG 2.2 AA; a violation fails the check.
    a11y: { test: 'error' },
  },
  initialGlobals: { backgrounds: { value: 'paper' } },
};

export default preview;
