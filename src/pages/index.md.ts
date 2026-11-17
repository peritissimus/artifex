import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { featuredProjects } from '../lib/projects';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/` — keep in step with `index.astro`. */
export const GET: APIRoute = async () => {
  const latestPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .slice(0, 3);

  return markdownResponse(
    markdownDocument({
      title: 'Kushal Patankar — Applied AI & Distributed Systems Engineer',
      description:
        'Kushal Patankar builds scalable AI infrastructure, applied AI products, distributed systems, and local-first personal software.',
      path: '/',
      body: [
        '## I build AI products and the systems that make them scale.',
        'I’m Kushal Patankar, a founding engineer working across applied AI engineering, scalable AI infrastructure, and distributed systems. I turn AI capabilities into reliable products and build local-first personal software outside of work. Currently building tools for local businesses at Zoca.',
        [
          `- ${link('More about me', '/about')}`,
          `- ${link('Résumé', '/resume')}`,
          `- ${link('Get in touch', '/contact')}`,
        ].join('\n'),
        '## Personal software',
        [
          ...featuredProjects.map(
            (project) => `- ${link(project.name, `/work/${project.slug}`)}: ${project.description}`
          ),
          `- ${link('All projects', '/software')}`,
        ].join('\n'),
        latestPosts.length > 0 && '## Latest writing',
        latestPosts
          .map(
            (latestPost) =>
              `- ${link(latestPost.data.title, `/blog/${latestPost.id}`)} (${latestPost.data.date.toISOString().slice(0, 10)})`
          )
          .join('\n'),
      ],
    })
  );
};
