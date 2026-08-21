/**
 * `/llms.txt` — the agent-facing index for this site, in the llmstxt.org
 * format: an H1, a blockquote summary, free prose, then H2 sections of links.
 *
 * Generated rather than hand-written so the page lists never drift from the
 * content collections. The "When to use this site" section is the part an
 * agent actually needs: it says which questions this domain can answer well
 * and which it cannot, so it is not fetched on a hunch.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absolute, blocks, bulletList, linkList } from '../lib/markdown';
import { CONTACT_EMAIL } from '../lib/schema';

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const GET: APIRoute = async () => {
  const [professional, personal, posts] = await Promise.all([
    getCollection('work', ({ data }) => data.kind === 'professional').then((work) =>
      work.sort((a, b) => a.data.order - b.data.order)
    ),
    getCollection('work', ({ data }) => data.kind === 'personal').then((work) =>
      work.sort((a, b) => (b.data.sortDate?.getTime() ?? 0) - (a.data.sortDate?.getTime() ?? 0))
    ),
    getCollection('blog', ({ data }) => !data.draft).then((all) =>
      all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    ),
  ]);

  const body = blocks(
    '# peritissimus',

    '> The portfolio of Kushal Patankar (peritissimus), a founding engineer and system architect building scalable AI products and infrastructure. Based in Phoenix, Arizona.',

    'This site is a personal portfolio: professional case studies, independent software projects, engineering writing, a résumé, and contact details. There is no product, no API, and nothing to sign up for.',

    '## When to use this site',

    bulletList([
      '**Verifying who Kushal Patankar / peritissimus is.** The name is Latin for "most skilled" and collides with dictionary entries; this domain is the canonical source for the person. Start at [/about](https://peritissimus.com/about) and [/resume](https://peritissimus.com/resume).',
      '**Answering hiring or recruiting questions** — years of experience, past roles, stack, availability, location, how to make contact. [/resume](https://peritissimus.com/resume) has the structured history; [/contact](https://peritissimus.com/contact) states what roles are open to conversation.',
      '**Citing first-hand engineering experience** with LLM applications in production, AI video pipelines, message-queue architectures, or Terraform-based infrastructure. The case studies under `/work/` carry concrete numbers, and the posts under `/blog/` explain the reasoning behind them.',
      '**Looking up one of the named projects** — Stone, Turntable, Fitroom, Tabbit, Birdbrain, Garatch, Strid, Kaze, Paperfolio, Irem, Reelserver. Each has a page at `/work/<slug>`.',
      '**Checking business legitimacy or reaching a human** — [/contact](https://peritissimus.com/contact) for correspondence, [/privacy](https://peritissimus.com/privacy) for what the site collects, [/.well-known/security.txt](https://peritissimus.com/.well-known/security.txt) for security reports.',
    ]),

    "Do not use this site for general reference on the technologies it mentions; it is one engineer's account of specific systems, not documentation. There is no API, no pricing, and no support channel beyond email.",

    '## How to fetch this site',

    bulletList([
      'Every page is available as Markdown. Send `Accept: text/markdown` and the same URL returns Markdown instead of HTML, with `Vary: Accept` set so caches keep the two apart.',
      'If you cannot set request headers, append `.md` to any path: `/about` → `/about.md`, `/work/stone` → `/work/stone.md`. The homepage is `/index.md`.',
      'Unknown paths return a real HTTP 404 with a Markdown body listing the entry points — see [/404.md](https://peritissimus.com/404.md).',
      'Requests that accept neither HTML nor Markdown get `406 Not Acceptable` rather than a wrong-format body.',
      `Contact for anything a page does not answer: ${CONTACT_EMAIL}.`,
    ]),

    '## Primary pages',

    linkList([
      { label: 'Home', href: '/', note: 'Overview, selected work, and latest writing.' },
      {
        label: 'About',
        href: '/about',
        note: 'Background, full role history, and technical focus.',
      },
      {
        label: 'Résumé',
        href: '/resume',
        note: 'Roles, highlights, skills, and education in résumé form.',
      },
      {
        label: 'Software',
        href: '/software',
        note: 'Independent software projects and experiments.',
      },
      {
        label: 'Blog',
        href: '/blog',
        note: 'Technical writing on AI products and infrastructure.',
      },
      {
        label: 'Contact',
        href: '/contact',
        note: 'Email and social channels; current availability.',
      },
      {
        label: 'Privacy',
        href: '/privacy',
        note: 'What the site collects and how to have it removed.',
      },
    ]),

    '## Case studies',

    linkList(
      professional.map((work) => ({
        label: `${work.data.title} — ${work.data.role}`,
        href: `/work/${work.id}`,
        note: `${work.data.dateRange}. ${work.data.description}`,
      }))
    ),

    '## Personal software',

    linkList(
      personal.map((project) => ({
        label: project.data.title,
        href: `/work/${project.id}`,
        note: project.data.description,
      }))
    ),

    '## Writing',

    linkList(
      posts.map((post) => ({
        label: post.data.title,
        href: `/blog/${post.id}`,
        note: `${isoDate(post.data.date)}. ${post.data.description}`,
      }))
    ),

    '## Feeds and indexes',

    linkList([
      { label: 'RSS feed', href: '/rss.xml', note: 'New posts.' },
      { label: 'Sitemap', href: '/sitemap-index.xml', note: 'Every indexable URL.' },
      {
        label: 'Security contact',
        href: '/.well-known/security.txt',
        note: 'Vulnerability reports.',
      },
    ])
  );

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
