import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { servicePath, servicesForContent, relatedInquiryIntroduction } from '../../lib/consulting';
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
  const services = servicesForContent(`/work/${work.id}`);

  return markdownResponse(
    markdownDocument({
      title: data.title,
      description: data.description,
      path: `/work/${work.id}`,
      body: [
        data.externalUrl && `- Link: ${data.externalUrl}`,
        '## Overview',
        absolutizeLinks(work.body ?? ''),
        screenshot &&
          `![${screenshot.alt}](${absoluteUrl(screenshot.src)})\n\n*${screenshot.caption}*`,
        data.achievements.length > 0 &&
          (data.kind === 'personal' ? '## Technical highlights' : '## Key achievements'),
        data.achievements.map((achievement) => `- ${achievement}`).join('\n'),
        data.stats &&
          data.stats.length > 0 &&
          `## Impact\n\n${data.stats.map((stat) => `- **${stat.value}** ${stat.label}`).join('\n')}`,
        data.outcome && `## Outcome\n\n${data.outcome}`,
        [
          '## Project details',
          `- Type: ${data.kind === 'personal' ? 'Personal project' : 'Work experience'}`,
          `- Role: ${data.role}`,
          `- Dates: ${data.dateRange}`,
          `- Location: ${data.location}`,
          data.technologies.length > 0 && `- Technologies: ${data.technologies.join(', ')}`,
        ]
          .filter(Boolean)
          .join('\n'),
        services.length > 0 && '## Working on a similar problem?',
        services.length > 0 && relatedInquiryIntroduction,
        services
          .map(
            (service) => `- [${service.title} →](https://peritissimus.com${servicePath(service)})`
          )
          .join('\n'),
      ],
    })
  );
};
