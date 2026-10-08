import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { featuredProjects } from '../lib/projects';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/` — keep in step with `index.astro`. */
export const GET: APIRoute = async () => {
  const selectedWork = (await getCollection('work', ({ data }) => data.kind === 'professional'))
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, 3);

  const latestPost = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  )[0];

  return markdownResponse(
    markdownDocument({
      title: 'peritissimus — Kushal Patankar',
      description:
        'Founding engineer and system architect building scalable AI products and infrastructure.',
      path: '/',
      body: [
        '## I build AI products and the systems that make them scale.',
        'I’m Kushal Patankar, a founding engineer working across product, infrastructure, and applied AI. Currently building tools for local businesses at Zoca.',
        [
          `- ${link('More about me', '/about')}`,
          `- ${link('Résumé', '/resume')}`,
          `- ${link('Get in touch', '/contact')}`,
        ].join('\n'),
        '## Personal software',
        'Small tools and independent experiments I design and build outside of work.',
        [
          ...featuredProjects.map(
            (project) => `- ${link(project.name, `/work/${project.slug}`)}: ${project.description}`
          ),
          `- ${link('All projects', '/software')}`,
        ].join('\n'),
        '## Selected work',
        selectedWork
          .map(
            (work) =>
              `- ${link(work.data.company, `/work/${work.id}`)} (${work.data.dateRange}): ${work.data.description}`
          )
          .join('\n'),
        latestPost && '## Latest writing',
        latestPost &&
          `- ${link(latestPost.data.title, `/blog/${latestPost.id}`)} (${latestPost.data.readTime || '5 min read'}): ${latestPost.data.description}`,
      ],
    })
  );
};
