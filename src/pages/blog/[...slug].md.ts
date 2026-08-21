/**
 * Markdown twin of every blog post: `/blog/<slug>.md`.
 *
 * Posts are already Markdown, so the body is the source file itself rather
 * than a re-rendering of the HTML — an agent gets exactly what was written,
 * minus the frontmatter.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { absolutizeLinks, blocks, bulletList, markdownPageResponse } from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const GET: APIRoute = ({ props }) => {
  const post = props.post as Awaited<ReturnType<typeof getCollection<'blog'>>>[number];
  const { data } = post;

  const facts = [
    `Published: ${isoDate(data.date)}`,
    data.updated ? `Updated: ${isoDate(data.updated)}` : null,
    `Author: ${data.author}`,
    data.category ? `Category: ${data.category}` : null,
    data.tags.length ? `Tags: ${data.tags.join(', ')}` : null,
    data.readTime ? `Read time: ${data.readTime}` : null,
  ].filter((fact): fact is string => fact !== null);

  return markdownPageResponse({
    title: data.title,
    description: data.description,
    path: `/blog/${post.id}`,
    // `post.body` is the raw Markdown source, headings and code fences intact.
    body: blocks(bulletList(facts), absolutizeLinks(post.body ?? '')),
  });
};
