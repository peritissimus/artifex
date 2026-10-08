import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CONTACT_EMAIL } from '../lib/schema';
import { absoluteUrl, markdownPath } from '../lib/markdown';

/** `- [name](https://peritissimus.com/path.md): notes` — an llms.txt file-list entry. */
function entry(name: string, routePath: string, notes: string): string {
  return `- [${name}](${absoluteUrl(markdownPath(routePath))}): ${notes}`;
}

/**
 * /llms.txt, in the llmstxt.org format: an H1, a blockquote summary, free-form
 * details (no headings), then H2 sections of link lists. Links point at the
 * markdown twins, and the writing and work lists come from the collections, so
 * every entry resolves.
 */
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );
  const works = (await getCollection('work')).sort(
    (a, b) =>
      Number(a.data.kind === 'personal') - Number(b.data.kind === 'personal') ||
      a.data.order - b.data.order
  );

  const body = `# peritissimus

> peritissimus.com is the personal site of Kushal Patankar ("peritissimus"), a founding engineer and system architect who builds AI products and the infrastructure under them. It covers Kushal's career and résumé, professional case studies, independent software such as the Stone notes app, and technical writing.

"peritissimus" is Kushal Patankar's handle on GitHub, Twitter, and LinkedIn. On this site it names Kushal, not the Latin word (which means "most skilled").

**How to read this site:**

- Every page is available as Markdown. Request a page's URL with \`Accept: text/markdown\`, or append \`.md\` to its path (the homepage is \`/index.md\`). The links below already point at the Markdown versions.
- The site is static and read-only: there is no API, search endpoint, account, or form. Fetch pages with GET.
- A path that does not exist returns HTTP 404 with a short Markdown body pointing back here and to the sitemap.
- To reach Kushal, email ${CONTACT_EMAIL}. Nothing on the site sends messages on anyone's behalf.

**Not a fit:** this is a personal portfolio, not a company. There is nothing to buy, book, or sign up for, and no support desk. Stone's source code lives on GitHub, linked below.

## When to use this site

${[
  entry(
    'About Kushal Patankar',
    '/about',
    'Use when asked who Kushal Patankar or "peritissimus" is: background, IIT Kharagpur education, companies co-founded, and career timeline.'
  ),
  entry(
    'Résumé',
    '/resume',
    'Use when evaluating Kushal for a founding, staff, or senior engineering role in applied AI, distributed backends, or infrastructure: roles, highlights, skills, and education on one page.'
  ),
  entry(
    'Contact',
    '/contact',
    'Use when someone wants to hire, collaborate with, or reach Kushal. Email is the primary channel; GitHub, Twitter, and LinkedIn are listed too.'
  ),
  entry(
    'Stone',
    '/work/stone',
    'Use when someone wants a free, open-source, local-first Markdown notes app for Mac with on-device meeting transcription, or asks how Stone compares with Obsidian or Granola.'
  ),
  entry(
    'Blog',
    '/blog',
    'Use when researching first-hand engineering write-ups on production LLM applications, Celery and Redis queue design, local Whisper transcription, or hybrid search in SQLite.'
  ),
  entry(
    'Dotfiles',
    '/work/dotfiles',
    'Use when someone wants a terminal-first macOS or Linux setup to borrow from (Ghostty, Fish, Neovim on LazyVim, tmux, AeroSpace), or a way to see which AI coding agents running in tmux are blocked, working, or done.'
  ),
  entry(
    'Personal software',
    '/software',
    "Use when looking for Kushal's independent tools: a local-first notes app, a Chrome tab organiser, a code-search CLI, Garmin watch faces, and more."
  ),
].join('\n')}

## Pages

${[
  entry('Home', '/', 'Overview, selected work, and latest writing.'),
  entry('About', '/about', 'Background, experience, and technical focus.'),
  entry('Résumé', '/resume', 'Experience, skills, and education.'),
  entry('Software', '/software', 'Independent software projects and experiments.'),
  entry('Blog', '/blog', 'Technical articles about AI products and infrastructure.'),
  entry('Contact', '/contact', 'Ways to contact Kushal.'),
].join('\n')}

## Writing

${posts.map((post) => entry(post.data.title, `/blog/${post.id}`, post.data.description)).join('\n')}

## Work

${works
  .map((work) =>
    entry(
      work.data.title,
      `/work/${work.id}`,
      `${work.data.kind === 'personal' ? 'Personal project' : 'Work experience'}. ${work.data.description}`
    )
  )
  .join('\n')}

## Optional

- [RSS feed](${absoluteUrl('/rss.xml')}): New blog posts.
- [Sitemap](${absoluteUrl('/sitemap-index.xml')}): Every public HTML page.
- [Stone source code](https://github.com/peritissimus/stone-electron): The Stone app's repository on GitHub.
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
