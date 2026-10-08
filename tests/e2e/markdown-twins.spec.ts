import { expect, test, type Page } from '@playwright/test';

/**
 * The markdown twins of the hand-written pages repeat their copy (see
 * src/pages/*.md.ts). These checks fail when the HTML changes and the twin
 * doesn't: every heading, paragraph, and internal link on the page must also
 * be in its markdown.
 */
const pages = [
  { path: '/', twin: '/index.md' },
  { path: '/about', twin: '/about.md' },
  { path: '/contact', twin: '/contact.md' },
  { path: '/software', twin: '/software.md' },
  { path: '/resume', twin: '/resume.md' },
  { path: '/blog', twin: '/blog.md' },
];

/** Page furniture with no place in a markdown document. */
const SKIPPED = ['.page-kicker', '.resume-hint', '.resume-contact', '.home-terminal-link'];
const SKIPPED_LINKS = ['/terminal'];

/**
 * Lowercase text with markdown syntax and all whitespace removed. Whitespace
 * is dropped rather than collapsed because Astro's HTML compression can eat
 * the space before an inline element that starts a source line.
 */
function plain(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

async function pageCopy(page: Page): Promise<string[]> {
  const copy = page.locator(`main :is(h1, h2, h3, p):not(${SKIPPED.join(', ')})`);
  return (await copy.allTextContents()).map(plain).filter(Boolean);
}

async function internalLinks(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator('main a[href^="/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
  return [...new Set(hrefs)].filter((href) => !SKIPPED_LINKS.includes(href));
}

for (const { path, twin } of pages) {
  test(`${twin} carries the copy and links of ${path}`, async ({ page, request }) => {
    const response = await request.get(twin);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('text/markdown; charset=utf-8');
    const markdown = await response.text();

    await page.goto(path);
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      'href',
      `https://peritissimus.com${twin}`
    );

    const text = plain(markdown);
    for (const line of await pageCopy(page)) {
      expect(text, `"${line}" is missing from ${twin}`).toContain(line);
    }
    for (const href of await internalLinks(page)) {
      expect(markdown, `${href} is missing from ${twin}`).toContain(
        `](https://peritissimus.com${href})`
      );
    }
  });
}

test('collection twins carry the source markdown with absolute links', async ({ request }) => {
  const post = await (await request.get('/blog/stone-vs-obsidian-vs-granola.md')).text();
  expect(post).toMatch(/^# Stone vs Obsidian vs Granola/);
  expect(post).toContain('I build [Stone](https://peritissimus.com/work/stone)');
  expect(post).not.toMatch(/\]\(\/[^/]/);

  const work = await (await request.get('/work/stone.md')).text();
  expect(work).toContain('## Key achievements');
  expect(work).toContain('- Link: https://github.com/peritissimus/stone-electron');
  expect(work).not.toMatch(/\]\(\/[^/]/);
});

test('the 404 page points visitors and agents at the site indexes', async ({ page, request }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.locator('main a[href="/sitemap-index.xml"]')).toBeVisible();
  await expect(page.locator('main a[href="/llms.txt"]')).toBeVisible();

  const markdown = await (await request.get('/404.md')).text();
  expect(markdown).toContain('(https://peritissimus.com/llms.txt)');
  expect(markdown).toContain('(https://peritissimus.com/sitemap-index.xml)');
});
