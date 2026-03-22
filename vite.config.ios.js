import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// iOS-specific build: single bundle, no ES modules, no code-splitting
// WKWebView loadFileURL has issues with type="module" and crossorigin
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-ios',
    sourcemap: false,
    target: 'es2020',
    modulePreload: false,
    rollupOptions: {
      output: {
        // Single chunk — no code splitting
        manualChunks: undefined,
        inlineDynamicImports: true,
        // Use IIFE format instead of ES modules
        format: 'iife',
        entryFileNames: 'assets/app.js',
      },
    },
    cssCodeSplit: false,
  },
});
