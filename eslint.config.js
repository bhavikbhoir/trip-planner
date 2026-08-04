import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

// Minimal, catches-real-bugs config — not a style-enforcement setup. The
// point of adding this to CI is "don't deploy a broken hook or an undefined
// variable," not "enforce a formatting convention" (no Prettier/style rules
// here on purpose). eslint-plugin-react is required even though we don't use
// most of its rules — its JSX AST handling is what makes core no-unused-vars
// correctly see `<AppShell>` as a use of the `AppShell` import; without it
// every component import in the app false-positives as unused.
export default [
  {
    ignores: ['build/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Marks a variable referenced as a JSX tag (<AppShell>) as "used" —
      // without this, core no-unused-vars can't see JSX usage and every
      // component import in the app false-positives as unused.
      'react/jsx-uses-vars': 'error',
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
    settings: { react: { version: 'detect' } },
  },
]
