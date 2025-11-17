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
    target: 'es2015', // Better browser compatibility
    esbuild: {
      drop: ['console', 'debugger'], // Remove console logs and debugger in production
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        ai: resolve(__dirname, 'ai.html'),
        blog: resolve(__dirname, 'blog.html'),
        brihaspati: resolve(__dirname, 'work/brihaspati.html'),
        dubverse: resolve(__dirname, 'work/dubverse.html'),
        simplesounds: resolve(__dirname, 'work/simplesounds.html'),
        zoca: resolve(__dirname, 'work/zoca.html'),
        'blog-scaling-llm': resolve(__dirname, 'blog/scaling-llm-applications.html'),
      },
      output: {
        // Optimized code splitting strategy
        manualChunks(id) {
          // Three.js in separate chunk (lazy loaded)
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          // WebGL-related code in separate chunk
          if (id.includes('webgl/ParticleGrid')) {
            return 'webgl';
          }
          // Other vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 500, // Stricter limit for better monitoring
    // CSS code splitting - split per page for faster loading
    cssCodeSplit: true,
    // Inline small CSS chunks to reduce requests
    assetsInlineLimit: 4096 // Inline assets < 4kb
  }
});
