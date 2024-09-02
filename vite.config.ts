import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 3005,
    },
    build: {
        rollupOptions: {
            output: {
                dir: './app/build',
            },
        },
    },
});
