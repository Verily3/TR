import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore build outputs and generated files
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/drizzle/**',
      'components/**',
    ],
  },

  // TypeScript files in all packages
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...tsPlugin.configs['flat/recommended'].rules,
      // Allow explicit any with a warning (the codebase has some justified uses)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Ignore unused vars starting with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Allow require() in config files etc.
      '@typescript-eslint/no-require-imports': 'off',
      // Disable rules that are too noisy for this codebase
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Disable formatting rules (Prettier handles those)
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    rules: prettierConfig.rules,
  },
];
