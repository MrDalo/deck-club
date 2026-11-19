import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Deck Club UI',
    colorPrimary: '#6e56cf',
    colorSecondary: '#6e56cf',
    appBg: '#faf8ff',
    appContentBg: '#ffffff',
    appBorderColor: '#e4def5',
    textColor: '#24203a',
    textMutedColor: '#5b5575',
    barBg: '#ffffff',
    barSelectedColor: '#6e56cf',
    fontBase: '"Atkinson Hyperlegible", ui-sans-serif, system-ui, sans-serif',
  }),
});
