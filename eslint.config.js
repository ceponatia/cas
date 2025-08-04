const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ...tseslint.configs.recommendedTypeChecked[0],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.base.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.recommended[0],
  },
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/build/',
    ],
  }
);