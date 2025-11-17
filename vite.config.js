import { defineConfig } from 'vite';
import { resolve } from 'path';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl({
      include: [
        '**/*.glsl',
        '**/*.vert',
        '**/*.frag',
        '**/*.vs',
        '**/*.fs'
      ],
      compress: true, // Enable compression for production
      watch: true,
      root: '/'
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'], // Remove console logs and debugger in production
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        ai: resolve(__dirname, 'ai.html'),
        converter: resolve(__dirname, 'converter.html'),
        brihaspati: resolve(__dirname, 'work/brihaspati.html'),
        dubverse: resolve(__dirname, 'work/dubverse.html'),
        simplesounds: resolve(__dirname, 'work/simplesounds.html'),
        zoca: resolve(__dirname, 'work/zoca.html'),
      },
      output: {
        manualChunks: {
          'three': ['three'] // Separate three.js into its own chunk
        }
      }
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000
  }
});
