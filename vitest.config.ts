import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/**/*.test.ts'],
        exclude: ['node_modules', 'dist', 'cdk'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'cdk/**',
                'test/**',
                '**/*.test.ts',
                '**/*.config.ts',
                'build.mjs',
                'scripts/**',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
        setupFiles: [],
        mockReset: true,
        restoreMocks: true,
        clearMocks: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
