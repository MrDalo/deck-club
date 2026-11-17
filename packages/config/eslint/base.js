import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Test, fixture and harness paths: size budgets are relaxed, naming is not. */
const TEST_FILES = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/test/**/*.ts',
  '**/testing/**/*.ts',
  '**/test-fixtures.ts',
];

/**
 * Syntax no file may use. Exported because a later `no-restricted-syntax`
 * block replaces this list rather than adding to it, so a config that adds
 * its own entries (web.js) restates these first.
 */
export const BASE_RESTRICTED_SYNTAX = [
  {
    selector: 'TSEnumDeclaration',
    message: 'Use a const object with `as const` and a derived union instead of an enum.',
  },
];

export default defineConfig(
  {
    ignores: [
      'dist/**',
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'next-env.d.ts',
      '.turbo/**',
      'drizzle/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Zod schemas live in @deck-club/contracts and nowhere else (rule
      // 15-contracts). Deliberately the @typescript-eslint/ rule rather than
      // core no-restricted-imports: nest.js and web.js override the core rule,
      // and a flat-config override REPLACES the option object, so a ban placed
      // there would silently vanish in exactly those packages.
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'zod',
              allowTypeImports: true,
              message:
                'Schemas live in @deck-club/contracts (rule 15-contracts). Boot-time env parsing (env.ts) is the one exemption.',
            },
          ],
          patterns: [
            {
              group: [
                '@deck-club/api',
                '@deck-club/api/*',
                '@deck-club/mcp',
                '@deck-club/mcp/*',
                '@deck-club/web',
                '@deck-club/web/*',
              ],
              message:
                'Nothing imports an app: apps are deployables at the top of the dependency graph. Move shared code into a package.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/dot-notation': ['error', { allowIndexSignaturePropertyAccess: true }],
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      // Rule 45-code-structure: a name is a word, not a letter.
      'id-length': ['error', { min: 2, properties: 'never', exceptions: ['_'] }],
      // Rule 45-code-structure: budgets are smoke alarms, not targets.
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-depth': ['error', 4],
      'no-nested-ternary': 'error',
      complexity: ['error', 15],
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: TEST_FILES,
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
    },
  },
  {
    // Boot-time environment parsing is the one legitimate zod use outside
    // packages/contracts: it validates process.env in the process it configures.
    files: ['**/env.ts', '**/*.config.ts'],
    rules: { '@typescript-eslint/no-restricted-imports': 'off' },
  },
  prettier,
);
