import * as esbuild from 'esbuild';

const isProduction = process.env.NODE_ENV === 'production';

await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    format: 'esm',
    outfile: 'dist/index.js',
    sourcemap: true,
    minify: isProduction,
    treeShaking: true,
    external: [
        '@aws-sdk/*',
        '@fastify/*',
        'fastify',
        'fastify-plugin',
        'zod',
        'dotenv',
        'pino-pretty',
    ],
    logLevel: 'info',
    metafile: true,
}).then((result) => {
    console.log('✓ Build completed successfully');
    if (result.metafile) {
        console.log('\nBundle analysis:');
        const outputs = Object.entries(result.metafile.outputs);
        for (const [path, info] of outputs) {
            const sizeKB = (info.bytes / 1024).toFixed(2);
            console.log(`  ${path}: ${sizeKB} KB`);
        }
    }
}).catch((error) => {
    console.error('✗ Build failed:', error);
    process.exit(1);
});
