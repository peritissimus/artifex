import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isoDate, link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/blog` — keep in step with `blog/index.astro`. */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return markdownResponse(
    markdownDocument({
      title: 'Blog',
      description:
        'Build personal software with practical guides by Kushal Patankar: local AI, searchable notes, X bookmark archives, and the engineering behind them.',
      path: '/blog',
      body: [
        'Notes on personal software, local AI, and the engineering behind useful tools.',
        posts
          .map(
            (post) =>
              `- ${link(post.data.title, `/blog/${post.id}`)} (${isoDate(post.data.date)}): ${post.data.description}`
          )
          .join('\n'),
        `Feed: ${link('RSS', '/rss.xml')}`,
      ],
    })
  );
};
