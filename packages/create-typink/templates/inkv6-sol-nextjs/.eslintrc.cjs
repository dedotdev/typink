module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // tells ESLint to parse TS
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended', // base rules
    'plugin:@typescript-eslint/recommended', // TS rules
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: ['dist', '.eslintrc.js', 'src/contracts/types'],
  parserOptions: {
    ecmaVersion: 'latest', // modern ECMAScript
    sourceType: 'module', // allow import/export
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json', // point to your tsconfig
      },
    },
  },
  rules: {
    '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
