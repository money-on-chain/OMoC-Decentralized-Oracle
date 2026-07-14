// @ts-check

import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import chaiFriendly from 'eslint-plugin-chai-friendly';

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
        files: ['hardhat.config.ts', 'src/**/*.ts'],
        extends: [tseslint.configs.recommended, prettierConfig],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
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
    {
        files: ['test/**/*.ts'],
        extends: [tseslint.configs.recommended, prettierConfig],
        plugins: {
            'chai-friendly': chaiFriendly,
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'chai-friendly/no-unused-expressions': 'error',
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
