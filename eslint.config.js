import config from '@qvlt/config-eslint';

export default [
  ...config,
  {
    rules: {
      'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,js,jsx}'],
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
];
