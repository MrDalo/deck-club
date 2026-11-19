import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import base, { BASE_RESTRICTED_SYNTAX } from './base.js';

/**
 * A React library resolves modules like a bundler, which accepts `./button`,
 * but the declarations it emits are also read by NodeNext consumers (the MCP
 * Apps views). There an extensionless `export … from './button'` does not
 * resolve and, under skipLibCheck, the component silently types as `any`.
 */
const RELATIVE_IMPORT_WITHOUT_EXTENSION = {
  selector:
    ':matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression) > Literal[value=/^\\.{1,2}(\\/|$)/]:not([value=/\\.(js|css|json)$/])',
  message:
    "End relative imports with '.js' ('./button.js' for button.tsx): the emitted .d.ts files must resolve under NodeNext too.",
};

/**
 * A module that calls a client hook cannot run as a React Server Component,
 * and Next.js refuses to build a server page that imports it. Only `useId`
 * works on the server. (Passing functions such as render props or
 * formatters into client primitives also needs the directive; review those.)
 */
const CLIENT_HOOK_WITHOUT_DIRECTIVE = {
  selector:
    "Program:not(:has(> ExpressionStatement[directive='use client'])) ImportSpecifier[imported.name=/^(use(?!Id$)[A-Z]\\w*|createContext)$/]",
  message:
    'This module uses a client hook: start the file with "use client" so a Next.js server component can import it.',
};

/**
 * React component libraries (packages/ui): the base rules plus React hooks
 * and Storybook's CSF rules. Browser globals, because components render in a
 * browser (the web app, an MCP Apps iframe, Storybook).
 */
export default defineConfig(
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: { ...globals.browser } },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Only what is emitted to dist/ is read by consumers.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_RESTRICTED_SYNTAX,
        RELATIVE_IMPORT_WITHOUT_EXTENSION,
        CLIENT_HOOK_WITHOUT_DIRECTIVE,
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    // A story file is a catalogue of every variant: long by nature.
    files: ['**/*.stories.{ts,tsx}'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
);
