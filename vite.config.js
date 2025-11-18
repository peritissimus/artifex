import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import glsl from 'vite-plugin-glsl';

// Recursively discover all HTML files
function discoverHtmlFiles(dir, baseDir = __dirname, prefix = '') {
  const entries = readdirSync(dir, { withFileTypes: true });
  const htmlFiles = {};

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.replace(baseDir + '/', '');

    if (entry.isDirectory()) {
      // Skip node_modules, dist, and hidden directories
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue;
      }
      // Recursively process subdirectories
      Object.assign(htmlFiles, discoverHtmlFiles(fullPath, baseDir, prefix));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      // Create a unique key for this HTML file
      const key = relativePath.replace(/\.html$/, '').replace(/\//g, '-');
      htmlFiles[key] = resolve(baseDir, relativePath);
    }
  }

  return htmlFiles;
}

const allHtmlFiles = discoverHtmlFiles(__dirname);

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs'],
      compress: true, // Enable compression for production
      watch: true,
      root: '/',
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Enable sourcemaps for debugging
    minify: 'esbuild',
    target: 'es2015', // Better browser compatibility
    esbuild: {
      drop: ['console', 'debugger'], // Remove console logs and debugger in production
    },
    rollupOptions: {
      input: allHtmlFiles,
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
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 500, // Stricter limit for better monitoring
    // CSS code splitting - split per page for faster loading
    cssCodeSplit: true,
    // Inline small CSS chunks to reduce requests
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
});
