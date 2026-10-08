import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  absoluteUrl,
  absolutizeLinks,
  markdownDocument,
  markdownResponse,
} from '../../lib/markdown';

export const getStaticPaths = (async () => {
  const works = await getCollection('work');
  return works.map((work) => ({ params: { slug: work.id }, props: { work } }));
}) satisfies GetStaticPaths;

/** Markdown twin of `/work/<slug>` — mirrors the sections of `work/[...slug].astro`. */
export const GET: APIRoute<{ work: CollectionEntry<'work'> }> = ({ props: { work } }) => {
  const { data } = work;
  const screenshot = data.kind === 'personal' ? data.screenshot : undefined;

  return markdownResponse(
    markdownDocument({
      title: data.title,
      description: data.description,
      path: `/work/${work.id}`,
      body: [
        [
          `- Type: ${data.kind === 'personal' ? 'Personal project' : 'Work experience'}`,
          `- Role: ${data.role}`,
          `- Dates: ${data.dateRange}`,
          `- Location: ${data.location}`,
          data.externalUrl && `- Link: ${data.externalUrl}`,
        ]
          .filter(Boolean)
          .join('\n'),
        '## Overview',
        absolutizeLinks(work.body ?? ''),
        screenshot &&
          `![${screenshot.alt}](${absoluteUrl(screenshot.src)})\n\n*${screenshot.caption}*`,
        data.achievements.length > 0 && '## Key achievements',
        data.achievements.map((achievement) => `- ${achievement}`).join('\n'),
        data.technologies.length > 0 && `## Technologies\n\n${data.technologies.join(', ')}`,
        data.stats &&
          data.stats.length > 0 &&
          `## Impact\n\n${data.stats.map((stat) => `- **${stat.value}** ${stat.label}`).join('\n')}`,
        data.outcome && `## Outcome\n\n${data.outcome}`,
      ],
    })
  );
};
