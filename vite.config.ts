import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/webview',
  build: {
    outDir: '../../dist/webview',
    emptyOutDir: true,
    cssCodeSplit: false, // Bundle all CSS into one file
    rollupOptions: {
      input: path.resolve(__dirname, 'src/webview/main.tsx'),
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: 'main.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'main.css';
          }
          return '[name].[ext]';
        },
        format: 'iife' // Use IIFE format for VSCode webviews (not ESM)
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/webview')
    }
  }
});
