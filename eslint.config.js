// @ts-check

import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
    globalIgnores([
        'dist/**',
        'artifacts/**',
        'cache/**',
        'coverage/**',
        'node_modules/**',
        'types/**',
        '**/*.d.ts',
        'soljson-latest.js',
    ]),

    {
        files: ['**/*.js'],
        extends: [js.configs.recommended, prettierConfig],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    {
        files: ['hardhat.config.ts', 'test/**/*.ts'],
        extends: [tseslint.configs.recommended, prettierConfig],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'prefer-const': 'off',
        },
    },
]);
