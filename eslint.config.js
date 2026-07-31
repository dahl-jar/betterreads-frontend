import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', '.wrangler', '.playwright-mcp']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      importPlugin.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'import/no-default-export': 'error',
      'import/no-cycle': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/components', from: ['./src/features', './src/app'] },
            { target: './src/hooks', from: ['./src/features', './src/app'] },
            { target: './src/lib', from: ['./src/features', './src/app'] },
            { target: './src/features', from: './src/app' },
            { target: './src/features/auth', from: './src/features', except: ['./auth'] },
            { target: './src/features/book', from: './src/features', except: ['./book'] },
            { target: './src/features/catalog', from: './src/features', except: ['./catalog'] },
            { target: './src/features/comments', from: './src/features', except: ['./comments'] },
            { target: './src/features/reviews', from: './src/features', except: ['./reviews'] },
            { target: './src/features/search', from: './src/features', except: ['./search'] },
            { target: './src/features/shelf', from: './src/features', except: ['./shelf'] },
          ],
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['vite.config.ts', 'src/main.tsx', '**/*.config.{ts,js}'],
    rules: { 'import/no-default-export': 'off' },
  },
  {
    files: ['src/features/**/*.test.{ts,tsx}'],
    ignores: ['src/features/*/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: 'Feature tests belong in the feature __tests__ folder.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/testing/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-restricted-paths': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/components/ui/**'],
    rules: {
      'import/order': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*Context.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
