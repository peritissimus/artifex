// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkCaptureCodeLang, rehypeBlogTransform } from './src/plugins/rehype-blog-transform.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://peritissimus.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkCaptureCodeLang],
    rehypePlugins: [rehypeBlogTransform],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Silence deprecation warnings for legacy sass APIs
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    build: {
      // Code splitting similar to your current setup
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
          },
        },
      },
    },
  },
  // Clean URLs (no .html extension)
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
