import config from '@qvlt/config-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  ...config,

  // global override using import/* rules
  {
    plugins: { import: importPlugin },
    rules: {
      'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
    },
  },

  // tests override using import/* rules
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true, peerDependencies: true }],
    },
  },

  {
    files: ['tests/smoke-node.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['example/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/util/devConsole.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
