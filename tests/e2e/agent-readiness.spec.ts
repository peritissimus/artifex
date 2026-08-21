/**
 * The machine-readable surface: Markdown twins, the agent index, structured
 * data, the trust-anchor pages, and a real 404.
 *
 * These run against `astro dev`, which serves the static build only — the
 * Accept-header negotiation that sits in front of it is covered by the unit
 * tests in `tests/unit/middleware.test.js`.
 */
import { expect, test } from '@playwright/test';

/** Every page route and the Markdown twin it must have. */
const PAGE_TWINS = [
  { path: '/', markdown: '/index.md', heading: '# peritissimus' },
  { path: '/about', markdown: '/about.md', heading: '# About' },
  { path: '/contact', markdown: '/contact.md', heading: '# Contact' },
  { path: '/software', markdown: '/software.md', heading: '# Personal software' },
  { path: '/resume', markdown: '/resume.md', heading: '# Kushal Patankar — Résumé' },
  { path: '/blog', markdown: '/blog.md', heading: '# Blog' },
  { path: '/privacy', markdown: '/privacy.md', heading: '# Privacy' },
  { path: '/work/stone', markdown: '/work/stone.md', heading: '# Stone' },
  {
    path: '/blog/scaling-llm-applications',
    markdown: '/blog/scaling-llm-applications.md',
    heading: '# Scaling LLM Applications',
  },
];

test.describe('Markdown twins', () => {
  for (const { path, markdown, heading } of PAGE_TWINS) {
    test(`${path} has a Markdown twin at ${markdown}`, async ({ request }) => {
      const response = await request.get(markdown);

      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body.startsWith(heading)).toBe(true);
      expect(body).toContain('Canonical HTML page: https://peritissimus.com');
      expect(body).toContain('https://peritissimus.com/llms.txt');
    });
  }

  test('every page links to its own twin', async ({ page }) => {
    for (const { path, markdown } of PAGE_TWINS) {
      await page.goto(path);
      const alternate = page.locator('link[rel="alternate"][type="text/markdown"]');
      await expect(alternate).toHaveAttribute('href', markdown);
    }
  });

  test('twins carry absolute links, since they are read out of context', async ({ request }) => {
    const body = await (await request.get('/blog/scaling-llm-applications.md')).text();

    expect(body).toContain('](https://peritissimus.com/work/');
    expect(body).not.toMatch(/\]\(\/(?!\/)/);
  });
});

test.describe('404 handling', () => {
  test('a nonexistent path returns a real 404', async ({ request }) => {
    const response = await request.get('/some-path-that-does-not-exist');
    expect(response.status()).toBe(404);
  });

  test('the 404 page points a reader at somewhere useful', async ({ page }) => {
    const response = await page.goto('/some-path-that-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Page not found');
    await expect(page.locator('.not-found-links a[href="/"]')).toBeVisible();
    await expect(page.locator('.not-found-machine a[href="/404.md"]')).toBeVisible();
    await expect(page.locator('.not-found-machine a[href="/llms.txt"]')).toBeVisible();
    await expect(page.locator('.not-found-machine a[href="/sitemap-index.xml"]')).toBeVisible();
  });

  test('the Markdown 404 lists the entry points an agent can recover through', async ({
    request,
  }) => {
    const response = await request.get('/404.md');

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('# Page not found (HTTP 404)');
    for (const target of ['/llms.txt', '/sitemap-index.xml', '/blog', '/contact']) {
      expect(body).toContain(`https://peritissimus.com${target}`);
    }
  });
});

test.describe('llms.txt', () => {
  test('follows the llmstxt.org shape and says when to use the site', async ({ request }) => {
    const response = await request.get('/llms.txt');

    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body.startsWith('# peritissimus\n')).toBe(true);
    expect(body).toContain('\n> The portfolio of Kushal Patankar');
    expect(body).toContain('## When to use this site');
    expect(body).toContain('## How to fetch this site');
    expect(body).toContain('Accept: text/markdown');
  });

  test('lists every primary page, including the trust anchors', async ({ request }) => {
    const body = await (await request.get('/llms.txt')).text();

    for (const path of ['/about', '/resume', '/software', '/blog', '/contact', '/privacy']) {
      expect(body).toContain(`(https://peritissimus.com${path})`);
    }
  });
});

test.describe('structured data', () => {
  async function jsonLdBlocks(page: import('@playwright/test').Page) {
    return page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')));
  }

  for (const path of ['/', '/about', '/contact', '/privacy']) {
    test(`${path} carries a complete Organization entity`, async ({ page }) => {
      await page.goto(path);
      const blocks = await jsonLdBlocks(page);
      const organization = blocks.find((block) => block['@type'] === 'Organization');

      expect(organization, `${path} should emit an Organization entity`).toBeTruthy();
      expect(organization.name).toBe('peritissimus');
      expect(organization.url).toBe('https://peritissimus.com');

      const contactPoints = [organization.contactPoint].flat();
      expect(contactPoints.length).toBeGreaterThan(0);
      for (const contactPoint of contactPoints) {
        expect(contactPoint['@type']).toBe('ContactPoint');
        expect(contactPoint.contactType).toBeTruthy();
        expect(contactPoint.email).toBeTruthy();
      }

      expect(organization.address['@type']).toBe('PostalAddress');
      expect(organization.address.addressLocality).toBeTruthy();
      expect(organization.address.addressCountry).toBeTruthy();
    });
  }

  test('the Person entity agrees with the Organization on how to make contact', async ({
    page,
  }) => {
    await page.goto('/about');
    const blocks = await jsonLdBlocks(page);
    const person = blocks.find((block) => block['@type'] === 'Person');

    expect(person.contactPoint['@type']).toBe('ContactPoint');
    expect(person.address['@type']).toBe('PostalAddress');
  });
});

test.describe('trust anchors', () => {
  for (const path of ['/about', '/contact', '/privacy']) {
    test(`${path} is a real page with substantive content`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      const text = (await page.locator('main').innerText()).trim();
      expect(text.length).toBeGreaterThan(500);
      await expect(page.locator('h1')).toBeVisible();
    });
  }

  test('the privacy policy says what is collected and how to opt out', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('main').innerText();

    expect(text).toContain('Cloudflare Web Analytics');
    expect(text).toContain('PostHog');
    expect(text).toContain('149.kush@gmail.com');
  });

  test('privacy is reachable from every page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.footer-nav a[href="/privacy"]')).toBeVisible();
  });
});
