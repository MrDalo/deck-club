import nextPlugin from '@next/eslint-plugin-next';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import base, { BASE_RESTRICTED_SYNTAX } from './base.js';

/**
 * The Next.js web app. docs/frontend-structure.md made mechanical:
 * app → features → shared → packages; feature groups never import each
 * other; the API transport is private to shared/api.
 *
 * eslint-plugin-boundaries v7: `default: 'disallow'` also covers external
 * modules, so packages are allowed explicitly first.
 */
const anyOf = (...types) => ({ element: { types: { anyOf: types } } });

/**
 * A `<form>` with neither `action` nor `method` is submitted by the browser
 * itself when it is pressed before hydration: a native GET that puts every
 * named field (an email, card text) in the URL, the history and access logs.
 * Client forms render through the shared `Form` (method="post"); a server
 * action form passes `action` itself.
 */
const FORM_WITHOUT_ACTION = {
  selector:
    "JSXOpeningElement[name.name='form']:not(:has(JSXAttribute[name.name='action'])):not(:has(JSXAttribute[name.name='method']))",
  message:
    'Use the shared Form component (or give the form an action): a bare <form onSubmit> sends its fields in a GET URL when pressed before hydration (rule 30-web).',
};

/** Hard-coded user-facing copy belongs in messages/*.json (rule 30-web, i18n). */
const RAW_JSX_TEXT = {
  selector: 'JSXText[value=/[A-Za-z]{3,}/]',
  message:
    'User-facing text comes from next-intl messages (useTranslations / getTranslations), never a JSX literal (rule 30-web).',
};

export default defineConfig(
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries, 'react-hooks': reactHooks, '@next/next': nextPlugin },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: ['./tsconfig.json'] },
      },
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'feature', pattern: 'src/features/*/**', capture: ['group'], partialMatch: false },
        { type: 'shared', pattern: 'src/shared/**', partialMatch: false },
        { type: 'i18n', pattern: 'src/i18n/**', partialMatch: false },
        { type: 'root', pattern: 'src', partialMatch: false },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'Imports point app → features → shared → packages; feature groups never import each other (rule 30-web, docs/frontend-structure.md).',
          policies: [
            { allow: { to: { module: { origin: 'external' } } } },
            {
              from: anyOf('app', 'root'),
              allow: { to: anyOf('app', 'feature', 'shared', 'i18n') },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: [
                  {
                    element: {
                      type: 'feature',
                      captured: { group: '{{from.element.captured.group}}' },
                    },
                  },
                  anyOf('shared', 'i18n'),
                ],
              },
            },
            { from: anyOf('shared'), allow: { to: anyOf('shared', 'i18n') } },
            { from: anyOf('i18n'), allow: { to: anyOf('i18n') } },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...BASE_RESTRICTED_SYNTAX,
        FORM_WITHOUT_ACTION,
        RAW_JSX_TEXT,
      ],
      // `t` is next-intl's translator by universal convention; every other name is still a word.
      'id-length': ['error', { min: 2, properties: 'never', exceptions: ['_', 't'] }],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX] },
  },
);
