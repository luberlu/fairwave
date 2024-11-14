import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, '')
            }
        }
    },
    plugins: [
        sveltekit(),
        svelteTesting(),
        NodeGlobalsPolyfillPlugin({
            buffer: true, // Polyfill pour `Buffer`
        }),
    ],
    define: {
        global: 'window', // Redirige `global` vers `window` pour compatibilité navigateur
    },
    resolve: {
        alias: {
            buffer: 'buffer', // Spécifie l'utilisation de `buffer` comme alias
        },
    },
    optimizeDeps: {
        include: ['buffer'], // Assure l'inclusion de `buffer` dans les dépendances optimisées
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest-setup.js'],
    },
});
