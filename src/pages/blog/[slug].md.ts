import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { absolutizeLinks, isoDate, markdownDocument, markdownResponse } from '../../lib/markdown';

export const getStaticPaths = (async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

/** Markdown twin of `/blog/<slug>`: the post's own markdown source. */
export const GET: APIRoute<{ post: CollectionEntry<'blog'> }> = ({ props: { post } }) => {
  const { data } = post;

  return markdownResponse(
    markdownDocument({
      title: data.title,
      description: data.description,
      path: `/blog/${post.id}`,
      body: [
        [
          `- Author: ${data.author}`,
          `- Published: ${isoDate(data.date)}`,
          data.updated && `- Updated: ${isoDate(data.updated)}`,
          `- Category: ${data.category || 'AI/LLM'}`,
          data.tags.length > 0 && `- Topics: ${data.tags.join(', ')}`,
          `- Reading time: ${data.readTime || '5 min read'}`,
        ]
          .filter(Boolean)
          .join('\n'),
        absolutizeLinks(post.body ?? ''),
      ],
    })
  );
};
