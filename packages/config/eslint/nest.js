import boundaries from 'eslint-plugin-boundaries';
import { defineConfig } from 'eslint/config';
import base from './base.js';

/**
 * NestJS apps (api, mcp): a modular monolith of hexagonal modules (rule
 * 20-backend). A module reaches another module only through its
 * `<Module>Facade` and contract DTOs, never through its domain/, application/
 * or infrastructure/. Inside a module, domain/ imports nothing but domain/.
 *
 * eslint-plugin-boundaries v7: element descriptors capture `module` from the
 * first `*`; policies compare the importer's captured module with the
 * target's via a template, negated to mean "a different module".
 */
const INTERNAL_LAYERS = ['domain', 'application', 'infrastructure'];

const sameModuleOnly = (fromType) => ({
  from: { element: { type: fromType } },
  disallow: {
    to: {
      element: {
        types: { anyOf: ['module-domain', 'module-internal'] },
        captured: { module: '!{{from.element.captured.module}}' },
      },
    },
  },
});

export default defineConfig(...base, {
  files: ['src/**/*.ts'],
  plugins: { boundaries },
  settings: {
    // NodeNext imports end in .js and resolve to .ts; the default resolver cannot follow them.
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: ['./tsconfig.json'] },
    },
    'boundaries/include': ['src/**/*.ts'],
    'boundaries/elements': [
      {
        type: 'module-domain',
        pattern: 'src/modules/*/domain/**',
        capture: ['module'],
        partialMatch: false,
      },
      ...INTERNAL_LAYERS.filter((layer) => layer !== 'domain').map((layer) => ({
        type: 'module-internal',
        pattern: `src/modules/*/${layer}/**`,
        capture: ['module'],
        partialMatch: false,
      })),
      { type: 'module', pattern: 'src/modules/*/**', capture: ['module'], partialMatch: false },
      { type: 'shared', pattern: 'src/common/**', partialMatch: false },
      { type: 'shared', pattern: 'src/config/**', partialMatch: false },
      { type: 'shared', pattern: 'src/infra/**', partialMatch: false },
      { type: 'root', pattern: 'src', partialMatch: false },
    ],
  },
  rules: {
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        message:
          'Modules import each other only through <Module>Facade and contract DTOs; domain/ imports only domain/ (rule 20-backend).',
        policies: [
          sameModuleOnly('module'),
          sameModuleOnly('module-internal'),
          sameModuleOnly('module-domain'),
          {
            from: { element: { type: 'module-domain' } },
            disallow: {
              to: {
                element: { types: { anyOf: ['module', 'module-internal', 'shared', 'root'] } },
              },
            },
          },
          {
            from: { element: { type: 'shared' } },
            disallow: {
              to: { element: { types: { anyOf: ['module', 'module-internal', 'module-domain'] } } },
            },
          },
        ],
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@deck-club/*/src/*'],
            message: 'Import packages through their public entry, never src/.',
          },
        ],
      },
    ],
  },
});
