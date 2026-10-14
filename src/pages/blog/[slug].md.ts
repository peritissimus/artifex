import type { APIRoute, GetStaticPaths } from 'astro';
import { relatedPosts } from '../../lib/related-posts';
import { servicePath, servicesForContent } from '../../lib/consulting';
import { getCollection, type CollectionEntry } from 'astro:content';
import { absolutizeLinks, isoDate, markdownDocument, markdownResponse } from '../../lib/markdown';

export const getStaticPaths = (async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

/** Markdown twin of `/blog/<slug>`: the post's own markdown source. */
export const GET: APIRoute<{ post: CollectionEntry<'blog'> }> = async ({ props: { post } }) => {
  const { data } = post;
  const related = relatedPosts(post.id, await getCollection('blog'));
  const services = servicesForContent(`/blog/${post.id}`);

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
        related.length > 0 &&
          absolutizeLinks(
            [
              '## Continue reading',
              ...related.map((entry) => `- [${entry.data.title}](/blog/${entry.id})`),
              '\nExplore [personal software projects and practical guides](/software).',
            ].join('\n')
          ),
        services.length > 0 && '## Working on a similar problem?',
        services.length > 0 && 'I’m open to focused consulting conversations around these systems.',
        services
          .map(
            (service) =>
              `- [${service.name} consulting →](https://peritissimus.com${servicePath(service)})`
          )
          .join('\n'),
      ],
    })
  );
};
