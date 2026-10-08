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
        'Engineering notes by Kushal Patankar on LLM applications, queues and distributed systems, local AI, search, and building local-first software.',
      path: '/blog',
      body: [
        'Thoughts on AI, system architecture, and building scalable products.',
        posts
          .map(
            (post) =>
              `- ${link(post.data.title, `/blog/${post.id}`)} (${isoDate(post.data.date)}, ${post.data.readTime || '5 min read'}): ${post.data.description}`
          )
          .join('\n'),
        `Feed: ${link('RSS', '/rss.xml')}`,
      ],
    })
  );
};
