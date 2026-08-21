/**
 * Markdown twin of every case study and project page: `/work/<slug>.md`.
 *
 * The HTML page renders frontmatter (stats, technologies, achievements) as
 * chrome around the Markdown body; this restates those fields as text so the
 * two representations carry the same facts.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import {
  absolutizeLinks,
  blocks,
  bulletList,
  linkList,
  markdownPageResponse,
} from '../../lib/markdown';

export const getStaticPaths: GetStaticPaths = async () => {
  const works = await getCollection('work');
  return works.map((work) => ({ params: { slug: work.id }, props: { work } }));
};

export const GET: APIRoute = ({ props }) => {
  const work = props.work as Awaited<ReturnType<typeof getCollection<'work'>>>[number];
  const { data } = work;

  const facts = [
    `Kind: ${data.kind === 'personal' ? 'Personal project' : 'Work experience'}`,
    `Company: ${data.company}`,
    `Role: ${data.role}`,
    `Dates: ${data.dateRange}`,
    `Location: ${data.location}`,
    data.technologies.length ? `Technologies: ${data.technologies.join(', ')}` : null,
  ].filter((fact): fact is string => fact !== null);

  return markdownPageResponse({
    title: data.title,
    description: data.description,
    path: `/work/${work.id}`,
    body: blocks(
      bulletList(facts),
      data.outcome ? blocks('## Outcome', data.outcome) : '',
      data.stats?.length
        ? blocks('## By the numbers', bulletList(data.stats.map((s) => `${s.value} — ${s.label}`)))
        : '',
      data.achievements.length ? blocks('## Achievements', bulletList(data.achievements)) : '',
      absolutizeLinks(work.body ?? ''),
      data.externalUrl ? linkList([{ label: 'Project site', href: data.externalUrl }]) : ''
    ),
  });
};
