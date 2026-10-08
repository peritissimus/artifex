/**
 * Markdown twins of the site's pages, for AI agents.
 *
 * Every indexable route has a `.md` sibling built from the same data as its
 * HTML: `/about` → `/about.md`, `/blog/<slug>` → `/blog/<slug>.md`, and the
 * homepage → `/index.md`. `functions/_middleware.js` serves these at the HTML
 * URL when a request prefers `Accept: text/markdown`.
 */

import { SITE_URL } from './schema';

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

/** Path of a route's markdown twin: `/` → `/index.md`, `/about` → `/about.md`. */
export function markdownPath(routePath: string): string {
  const trimmed = routePath.replace(/\/+$/, '');
  return `${trimmed || '/index'}.md`;
}

export function absoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

/** `[label](https://peritissimus.com/path)` */
export function link(label: string, path: string): string {
  return `[${label}](${absoluteUrl(path)})`;
}

/**
 * Rewrite root-relative link and image targets (`](/work/stone)`) to absolute
 * URLs, so the markdown still works once an agent has lifted it out of the
 * page. Fenced code blocks are left untouched.
 */
export function absolutizeLinks(markdown: string): string {
  let inFence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : line.replace(/\]\((\/(?!\/)[^)\s]*)/g, `](${SITE_URL}$1`);
    })
    .join('\n');
}

interface MarkdownDocument {
  title: string;
  description: string;
  /** Route path of the HTML page this document mirrors. */
  path: string;
  /** Blocks of markdown; empty ones are dropped. */
  body: Array<string | false | null | undefined>;
}

/**
 * A complete markdown document: title, summary, body, and a footer that points
 * an agent at the HTML original and the rest of the site.
 */
export function markdownDocument({ title, description, path, body }: MarkdownDocument): string {
  const blocks = [
    `# ${title}`,
    `> ${description}`,
    ...body,
    '---',
    [
      `HTML version: ${absoluteUrl(path)}`,
      `Site index for agents: ${SITE_URL}/llms.txt`,
      `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    ].join('  \n'),
  ];

  return `${blocks
    .filter((block): block is string => typeof block === 'string' && block.trim() !== '')
    .map((block) => block.trim())
    .join('\n\n')}\n`;
}

export function markdownResponse(markdown: string): Response {
  return new Response(markdown, { headers: { 'Content-Type': MARKDOWN_CONTENT_TYPE } });
}

/** `2026-10-05` — matches the date format the blog pages display. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
