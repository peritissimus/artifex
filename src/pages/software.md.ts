import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { softwareProjects } from '../lib/projects';
import { personalSoftware } from '../lib/personal-software';
import { link, markdownDocument, markdownResponse } from '../lib/markdown';

/** Markdown twin of `/software` — keep in step with `software.astro`. */
export const GET: APIRoute = async () => {
  const projects = softwareProjects(await getCollection('work'));

  return markdownResponse(
    markdownDocument({
      title: 'Personal software',
      description: personalSoftware.description,
      path: '/software',
      body: [
        personalSoftware.intro,
        `## ${personalSoftware.heading}`,
        personalSoftware.explanation,
        personalSoftware.guides
          .map(
            (guide, index) =>
              `${index + 1}. ${link(guide.title, guide.href)} — ${guide.description}`
          )
          .join('\n'),
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
