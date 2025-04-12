import { defineConfig } from 'vite';
import compress from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compress({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    compress({
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    cssCodeSplit: false,
    reportCompressedSize: true,
    target: 'es2018',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['animejs'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    open: true,
    cors: true,
  },
});