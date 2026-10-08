import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { softwareProjects } from '../lib/projects';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/software` — keep in step with `software.astro`. */
export const GET: APIRoute = async () => {
  const projects = softwareProjects(await getCollection('work'));

  return markdownResponse(
    markdownDocument({
      title: 'Personal software',
      description:
        'Independent software by Kushal Patankar: a local-first notes app, a Chrome tab organiser, a code-search CLI, Garmin watch faces, and other tools built outside of work.',
      path: '/software',
      body: [
        'Small tools and independent experiments I design and build outside of work — local-first apps, browser utilities, wearable interfaces, and studios for making things look good.',
        projects
          .map(
            (project) =>
              `- ${link(project.data.title, `/work/${project.id}`)} (${project.data.dateRange}): ${project.data.description}`
          )
          .join('\n'),
      ],
    })
  );
};
