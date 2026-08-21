/**
 * Renderer for the Markdown twins of every page.
 *
 * Each HTML route has a `.md` sibling built from the same data (`/about` and
 * `/about.md`, `/blog/x` and `/blog/x.md`). The Cloudflare middleware in
 * `functions/_middleware.js` serves whichever one the request's `Accept`
 * header asks for; the files themselves stay plain static assets, so an agent
 * that cannot negotiate can fetch the `.md` URL directly.
 */
import { SITE_URL } from './schema';

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

export interface MarkdownPageInput {
  /** Document title — becomes the H1. */
  title: string;
  /** One-line summary — becomes the blockquote under the H1. */
  description: string;
  /** Canonical HTML route this document mirrors, e.g. `/about`. */
  path: string;
  /** Body Markdown. Headings start at level 2; the H1 belongs to the title. */
  body: string;
}

/** Absolute URL for a site-relative path. */
export function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Rewrite root-relative Markdown links to absolute URLs.
 *
 * A `.md` twin is read on its own, often by something that never saw the page
 * it came from, so `[Zoca](/work/zoca)` has to resolve without a base URL.
 * Protocol-relative and anchor links are left alone.
 */
export function absolutizeLinks(markdown: string): string {
  return markdown.replace(/(\]\()\/(?!\/)/g, `$1${SITE_URL}/`);
}

/** `- [label](url)` list, with an optional trailing note per item. */
export function linkList(items: Array<{ label: string; href: string; note?: string }>): string {
  return items
    .map(({ label, href, note }) => {
      const url = href.startsWith('http') ? href : absolute(href);
      return note ? `- [${label}](${url}): ${note}` : `- [${label}](${url})`;
    })
    .join('\n');
}

/** `- item` list. */
export function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

/** Join body blocks with exactly one blank line between them, dropping empties. */
export function blocks(...parts: Array<string | false | null | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim())
    .join('\n\n');
}

/**
 * Render a full Markdown document.
 *
 * The header carries the canonical HTML URL and the footer carries the site's
 * machine-readable entry points, so an agent that arrived at one `.md` file
 * with no other context can still find everything else.
 */
export function renderMarkdownPage({ title, description, path, body }: MarkdownPageInput): string {
  return `${blocks(
    `# ${title}`,
    `> ${description}`,
    `Canonical HTML page: ${absolute(path)}`,
    body,
    '---',
    blocks(
      '## Elsewhere on this site',
      linkList([
        { label: 'Agent index (llms.txt)', href: '/llms.txt' },
        { label: 'Sitemap', href: '/sitemap-index.xml' },
        { label: 'RSS feed', href: '/rss.xml' },
        { label: 'Contact', href: '/contact' },
      ]),
      'Every page on this site is also available as Markdown: request it with `Accept: text/markdown`, or append `.md` to the path.'
    )
  )}\n`;
}

/** Build the endpoint response for a Markdown twin. */
export function markdownPageResponse(input: MarkdownPageInput): Response {
  return new Response(renderMarkdownPage(input), {
    headers: { 'Content-Type': MARKDOWN_CONTENT_TYPE },
  });
}
