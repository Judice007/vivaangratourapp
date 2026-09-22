import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Builds the swipe-card island as a single IIFE bundle consumed by dist/index.html.
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  publicDir: false,
  build: {
    outDir: path.resolve(import.meta.dirname, '../dist/cards-widget'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(import.meta.dirname, './src/widget.tsx'),
      name: 'AngraCardWidgetBundle',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.[ext]',
      },
    },
  },
})
