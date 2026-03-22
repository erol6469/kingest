import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Single chunk — no code splitting for WKWebView compatibility
        manualChunks: undefined,
        inlineDynamicImports: true,
        // Use IIFE format for WKWebView (no ES modules on file://)
        format: 'iife',
      },
    },
  },
  server: {
    port: 3000,
  },
});
