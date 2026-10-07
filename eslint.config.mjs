import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // Ignore build outputs and dependencies
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Start from @typescript-eslint recommended rules
      ...(tsPlugin.configs.recommended?.rules ?? {}),
      // Rely on TypeScript for undefined checks in TS files
      'no-undef': 'off',
      // Allow practical 'any' where needed for untyped inputs and parsing
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];

