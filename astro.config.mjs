// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkCaptureCodeLang, rehypeBlogTransform } from './src/plugins/rehype-blog-transform.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://peritissimus.com',
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkCaptureCodeLang],
    rehypePlugins: [rehypeBlogTransform],
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
  },
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
