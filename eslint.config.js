import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactPlugin from '@eslint-react/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'e2e', 'playwright.config.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Base JS
      js.configs.recommended,

      // TypeScript — strict type-checked + stylistic
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,

      // React — type-aware rules, hooks, HMR safety
      reactPlugin.configs['recommended-type-checked'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,

      // Accessibility
      jsxA11y.flatConfigs.recommended,

      // Modern JS patterns
      unicorn.configs.recommended,

      // Code quality / complexity
      sonarjs.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ── JavaScript ──────────────────────────────────────────────────────
      'no-console': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
      curly: ['error', 'all'],

      // ── TypeScript (not in strictTypeChecked / stylisticTypeChecked) ────
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],

      // ── SonarJS overrides ────────────────────────────────────────────────
      'sonarjs/function-return-type': 'off', // redundant with @typescript-eslint/explicit-function-return-type

      // ── Unicorn overrides ────────────────────────────────────────────────
      // PascalCase for components/classes, kebab-case for utilities/hooks
      'unicorn/filename-case': ['error', { cases: { pascalCase: true, kebabCase: true } }],
      'unicorn/prevent-abbreviations': 'off', // Props/Ref/e are established React/TS patterns
      'unicorn/no-null': 'off',               // null is valid with DOM APIs and React error boundaries
    },
  },
])
