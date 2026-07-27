// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkCaptureCodeLang, rehypeBlogTransform } from './src/plugins/rehype-blog-transform.js';

/**
 * Map of route path -> lastmod date, read from content frontmatter
 * (`updated` falling back to `date` for blog, `sortDate` for work).
 */
function contentLastmodDates() {
  /** @type {Record<string, string>} */
  const dates = {};

  const collect = (dir, routePrefix, fields) => {
    for (const file of readdirSync(new URL(dir, import.meta.url))) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      const source = readFileSync(new URL(`${dir}/${file}`, import.meta.url), 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      for (const field of fields) {
        const value = frontmatter.match(new RegExp(`^${field}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
        if (value) {
          dates[`${routePrefix}/${file.replace(/\.(md|mdx)$/, '')}`] = value;
          break;
        }
      }
    }
  };

  collect('./src/content/blog', '/blog', ['updated', 'date']);
  collect('./src/content/work', '/work', ['sortDate']);
  return dates;
}

const lastmodDates = contentLastmodDates();

// https://astro.build/config
export default defineConfig({
  site: 'https://peritissimus.com',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      // Keep noindex routes out of the sitemap.
      filter: (page) => !page.includes('/terminal') && !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\.html$/, '').replace(/\/$/, '');
        const lastmod = lastmodDates[path];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
    // Astro 7 defaults to the Sätteri processor; the blog's custom remark/rehype
    // plugins need the unified() pipeline from @astrojs/markdown-remark.
    processor: unified({
      remarkPlugins: [remarkCaptureCodeLang],
      rehypePlugins: [rehypeBlogTransform],
    }),
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
