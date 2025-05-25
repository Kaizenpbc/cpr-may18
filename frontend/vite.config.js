import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
console.log('Loading Vite config');
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
            '@tanstack/react-query',
            '@mui/x-date-pickers',
            'date-fns',
            'papaparse',
            'react-phone-number-input'
        ],
        force: true
    },
    root: path.resolve(__dirname),
    base: '/',
    server: {
        port: 5173,
        strictPort: true,
        host: 'localhost',
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 5173,
            clientPort: 5173,
            timeout: 10000,
            overlay: true,
            path: 'hmr'
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    clearScreen: false,
    logLevel: 'info'
});
