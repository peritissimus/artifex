/**
 * Markdown twins of the single-file pages: `/about.md`, `/contact.md`, and so
 * on, plus `/index.md` for the homepage and `/404.md` for the recovery
 * document agents get when a path does not exist.
 *
 * Collection-backed routes have their own endpoints in `blog/` and `work/`.
 *
 * Everything here is built from the same modules the `.astro` pages read
 * (`lib/resume.ts`, the content collections), so a change to a role or a
 * project shows up in both representations at once. Prose that only exists in
 * a `.astro` template is restated here; keep the two in step when editing.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import {
  absolute,
  blocks,
  bulletList,
  linkList,
  markdownPageResponse,
  type MarkdownPageInput,
} from '../lib/markdown';
import { privacyUpdated } from '../lib/privacy';
import { education, metrics, resumeRoles, roles, skills } from '../lib/resume';

/** Newest-first professional case studies. */
async function professionalWork() {
  return (await getCollection('work', ({ data }) => data.kind === 'professional')).sort(
    (a, b) => a.data.order - b.data.order
  );
}

/** Personal projects, newest first. */
async function personalWork() {
  return (await getCollection('work', ({ data }) => data.kind === 'personal')).sort(
    (a, b) => (b.data.sortDate?.getTime() ?? 0) - (a.data.sortDate?.getTime() ?? 0)
  );
}

/** Published posts, newest first. */
async function publishedPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const contactChannels = [
  { label: 'Email', href: 'mailto:149.kush@gmail.com', note: '149.kush@gmail.com' },
  {
    label: 'GitHub',
    href: 'https://github.com/peritissimus',
    note: 'Source and personal projects',
  },
  { label: 'Twitter / X', href: 'https://twitter.com/peritissimus_', note: '@peritissimus_' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/peritissimus', note: 'Professional history' },
  { label: 'Résumé', href: '/resume', note: 'Experience, skills, and background' },
];

/** One builder per static page. The key is the emitted filename minus `.md`. */
const pages: Record<string, () => Promise<MarkdownPageInput>> = {
  index: async () => {
    const [work, projects, posts] = await Promise.all([
      professionalWork(),
      personalWork(),
      publishedPosts(),
    ]);

    return {
      title: 'peritissimus — Kushal Patankar',
      description:
        'Founding engineer and system architect building scalable AI products and infrastructure.',
      path: '/',
      body: blocks(
        "I'm Kushal Patankar (peritissimus), a founding engineer working across product, infrastructure, and applied AI. Currently building tools for local businesses at Zoca.",
        '## Selected work',
        linkList(
          work.slice(0, 3).map((entry) => ({
            label: `${entry.data.title} — ${entry.data.role}`,
            href: `/work/${entry.id}`,
            note: entry.data.description,
          }))
        ),
        '## Personal software',
        linkList(
          projects.map((project) => ({
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
            note: post.data.description,
          }))
        ),
        '## Pages',
        linkList([
          { label: 'About', href: '/about', note: 'Background and experience' },
          { label: 'Résumé', href: '/resume', note: 'Roles, highlights, and skills' },
          { label: 'Software', href: '/software', note: 'Independent projects' },
          { label: 'Blog', href: '/blog', note: 'Engineering notes' },
          { label: 'Contact', href: '/contact', note: 'How to get in touch' },
          { label: 'Privacy', href: '/privacy', note: 'What this site collects' },
        ])
      ),
    };
  },

  about: async () => ({
    title: 'About',
    description:
      'Kushal Patankar (peritissimus) is a founding engineer and system architect building scalable AI-powered platforms and infrastructure.',
    path: '/about',
    body: blocks(
      'Kushal Patankar (peritissimus) is a founding engineer and full-stack developer with expertise in building scalable AI-powered platforms and infrastructure.',
      'IIT Kharagpur graduate (B.Tech, 2021) with 6+ years of experience spanning founding engineer roles, technical leadership, and entrepreneurship. Specialised in backend architecture, frontend development, infrastructure automation, and AI integration.',
      'Previously co-founded Deepmynd Innovative Technologies and Brihaspati AI, building next-generation consumer products with AI at their core. At Brihaspati, implemented dynamic prompt engineering and context-aware memory retrieval, improving D7 retention by 20%.',
      'As a founding member at Dübverse, helped design, architect, and scale an enterprise-grade AI video dubbing platform processing 570,000+ hours of audio-video content for 1M+ users — 6,000+ production commits across eight codebases, supporting 40%+ B2B growth.',
      '## Highlights',
      bulletList(metrics.map((metric) => `${metric.value} — ${metric.label}`)),
      '## Work experience',
      roles
        .map((role) =>
          blocks(
            `### ${role.company} — ${role.role}`,
            [
              `${role.date} · ${role.location}`,
              role.link ? `[Case study](${absolute(role.link)})` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            role.highlights?.length ? bulletList(role.highlights) : ''
          )
        )
        .join('\n\n'),
      '## Education',
      `${education.degree}, ${education.institution} (${education.date}).`
    ),
  }),

  contact: async () => ({
    title: 'Contact',
    description:
      'How to reach Kushal Patankar (peritissimus) — open to founding and staff engineering roles in applied AI and infrastructure.',
    path: '/contact',
    body: blocks(
      'Interested in collaboration, have a project in mind, or just want to connect? Any of the channels below reaches me directly.',
      'Currently building at Zoca, and open to conversations about founding and staff engineering roles — particularly in applied AI, distributed backends, and the infrastructure underneath them.',
      '## Channels',
      linkList(contactChannels),
      '## Security',
      `Security contact details are published at ${'https://peritissimus.com/.well-known/security.txt'}.`
    ),
  }),

  software: async () => {
    const projects = await personalWork();

    return {
      title: 'Personal software',
      description: 'Small tools and independent experiments I design and build outside of work.',
      path: '/software',
      body: blocks(
        'Small tools and independent experiments I design and build outside of work — local-first apps, browser utilities, wearable interfaces, and studios for making things look good.',
        '## Projects',
        projects
          .map((project) =>
            blocks(
              `### ${project.data.title}`,
              `${project.data.dateRange} · ${project.data.role}`,
              project.data.description,
              project.data.technologies.length
                ? `Built with: ${project.data.technologies.join(', ')}.`
                : '',
              linkList([
                { label: 'Case study', href: `/work/${project.id}` },
                ...(project.data.externalUrl
                  ? [{ label: 'Project site', href: project.data.externalUrl }]
                  : []),
              ])
            )
          )
          .join('\n\n')
      ),
    };
  },

  resume: async () => ({
    title: 'Kushal Patankar — Résumé',
    description:
      'Founding engineer and system architect. Roles, highlights, skills, and education.',
    path: '/resume',
    body: blocks(
      'Founding engineer and system architect building scalable AI products and infrastructure. Based in Phoenix, Arizona.',
      '## Highlights',
      bulletList(metrics.map((metric) => `${metric.value} — ${metric.label}`)),
      '## Experience',
      resumeRoles
        .map((role) =>
          blocks(
            `### ${role.company} — ${role.role}`,
            `${role.date} · ${role.location}`,
            role.highlights?.length ? bulletList(role.highlights) : ''
          )
        )
        .join('\n\n'),
      '## Skills',
      bulletList(skills.map((skill) => `${skill.label}: ${skill.items}`)),
      '## Education',
      `${education.degree}, ${education.institution} (${education.date}).`,
      '## Contact',
      linkList(contactChannels.filter((channel) => channel.label !== 'Résumé'))
    ),
  }),

  blog: async () => {
    const posts = await publishedPosts();

    return {
      title: 'Blog',
      description:
        'Technical writing on AI, system architecture, and software engineering by Kushal Patankar.',
      path: '/blog',
      body: blocks(
        'Engineering notes on shipping AI products and the infrastructure underneath them.',
        '## Posts',
        posts
          .map((post) =>
            blocks(
              `### ${post.data.title}`,
              `${isoDate(post.data.date)}${post.data.category ? ` · ${post.data.category}` : ''}`,
              post.data.description,
              linkList([{ label: 'Read the post', href: `/blog/${post.id}` }])
            )
          )
          .join('\n\n'),
        linkList([{ label: 'RSS feed', href: '/rss.xml' }])
      ),
    };
  },

  privacy: async () => ({
    title: 'Privacy',
    description:
      'What peritissimus.com collects, what it does not, and how to have anything about you removed.',
    path: '/privacy',
    body: blocks(
      'This is a personal portfolio, not a product. It has no accounts, no sign-up, no advertising, and nothing to sell — so it collects the least it can and still know whether anyone is reading.',
      '## What is collected',
      'Two analytics tools run on this site, and neither is given a name, an email address, or anything else that identifies you personally.',
      bulletList([
        '**Cloudflare Web Analytics** — aggregate page views, referrers, country, and browser, derived from the request itself. No cookies, no cross-site profile.',
        "**PostHog** — which pages are read and which links are followed. Stores a random visitor identifier in the browser's `localStorage` rather than a cookie, and runs only on `peritissimus.com`; development and preview builds are excluded.",
      ]),
      '## What is not collected',
      bulletList([
        'No advertising or marketing cookies, and no ad networks of any kind.',
        'No cross-site tracking pixels and no data broker integrations.',
        'No form submissions — there is no form on this site.',
        "Nothing is sold, rented, or shared for anyone else's marketing.",
      ]),
      '## Email',
      'The contact page publishes an email address. If you write, the message and your address sit in an ordinary mailbox for as long as the conversation is useful, and are used only to reply to you. You are not added to a list, because there is no list.',
      '## Where data lives',
      'The site is served by Cloudflare, which processes request metadata to deliver pages and block abuse. Analytics events are processed by PostHog. Both are third-party processors with their own privacy policies. Aggregate analytics are retained for a rolling window and are not joined to any other dataset.',
      '## Your choices',
      'Blocking JavaScript, using a tracker blocker, or enabling Do Not Track stops PostHog from loading; every page still works, because the content is prerendered HTML. Clearing site data removes the local visitor identifier. To have anything associated with you deleted, email 149.kush@gmail.com and it will be removed.',
      '## Security and changes',
      'Security contact details are published at https://peritissimus.com/.well-known/security.txt. If this policy changes, the date below changes with it.',
      `Last updated ${privacyUpdated}.`
    ),
  }),

  404: async () => ({
    title: 'Page not found (HTTP 404)',
    description:
      'This path does not exist on peritissimus.com. The entry points below cover everything that does.',
    path: '/404',
    body: blocks(
      'The requested path does not exist or has moved. Nothing here is behind a login, so a 404 means the URL is wrong rather than that access was denied.',
      '## Where to look next',
      linkList([
        {
          label: 'Agent index (llms.txt)',
          href: '/llms.txt',
          note: 'Every page, with when to use it',
        },
        {
          label: 'Sitemap',
          href: '/sitemap-index.xml',
          note: 'Complete machine-readable URL list',
        },
        { label: 'Home', href: '/', note: 'Overview, selected work, latest writing' },
        { label: 'Blog', href: '/blog', note: 'Engineering notes' },
        { label: 'Software', href: '/software', note: 'Independent projects' },
        { label: 'About', href: '/about', note: 'Background and experience' },
        { label: 'Résumé', href: '/resume', note: 'Roles, highlights, and skills' },
        { label: 'Contact', href: '/contact', note: 'How to get in touch' },
      ]),
      '## Route shapes',
      bulletList([
        'Blog posts live at `/blog/<slug>`.',
        'Case studies and projects live at `/work/<slug>`.',
        'Append `.md` to any of those paths for the Markdown representation.',
      ])
    ),
  }),
};

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(pages).map((page) => ({ params: { page } }));

export const GET: APIRoute = async ({ params }) => {
  const build = pages[String(params.page)];
  if (!build) return new Response('Not found', { status: 404 });
  return markdownPageResponse(await build());
};
