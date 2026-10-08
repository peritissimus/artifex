import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/schema';
import { link, markdownResponse } from '../lib/markdown';

/**
 * Body of the 404 response for agents that ask for markdown. Served with a
 * 404 status by `functions/_middleware.js`; it points at the indexes an agent
 * can recover from.
 */
export const GET: APIRoute = () =>
  markdownResponse(
    `${[
      '# 404 — Page not found',
      `Nothing exists at this URL on ${SITE_URL}. The page may have moved, or the address may be mistyped.`,
      '## Where to look next',
      [
        `- ${link('llms.txt', '/llms.txt')}: what this site covers and when to use it, with links to every section.`,
        `- ${link('Sitemap', '/sitemap-index.xml')}: every public URL.`,
        `- ${link('Home', '/')}: overview, selected work, and latest writing.`,
        `- ${link('Blog', '/blog')}: technical articles.`,
        `- ${link('Personal software', '/software')}: independent projects, including Stone.`,
        `- ${link('About', '/about')}, ${link('Résumé', '/resume')}, and ${link('Contact', '/contact')}: background, experience, and contact details.`,
      ].join('\n'),
      'Every page is available as markdown: send `Accept: text/markdown`, or append `.md` to the path (the homepage is `/index.md`).',
    ].join('\n\n')}\n`
  );
