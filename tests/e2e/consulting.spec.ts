import { expect, test } from '@playwright/test';

const services = [
  'applied-ai-engineering',
  'scalable-ai-infrastructure',
  'distributed-systems-reliability',
];

test('Contact is the single place to discuss a project', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header nav a')).toHaveText([
    'Software',
    'Blog',
    'About',
    'Résumé',
    'Contact',
  ]);
  await expect(page.locator('a[href^="/consulting"]')).toHaveCount(0);
  await expect(page.locator('.home-consulting')).toHaveCount(0);
  await page.locator('header').getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contact');
});

test('service details can be opened by pointer and closed by keyboard', async ({ page }) => {
  await page.goto('/contact');
  for (const slug of services) {
    const details = page.locator(`details#${slug}`);
    const summary = details.locator('summary').first();
    await expect(summary).toBeVisible();
    await expect(details).toHaveJSProperty('open', false);
    await summary.click();
    await expect(details).toHaveJSProperty('open', true);
    await expect(details.locator('a[href^="/work/"]').first()).toBeVisible();
    await expect(details.locator('a[href^="/blog/"]').first()).toBeVisible();
    await summary.focus();
    await summary.press('Enter');
    await expect(details).toHaveJSProperty('open', false);
  }
});

test('a service query preselects the contact draft and the picker can change it', async ({
  page,
}) => {
  await page.goto('/contact?service=applied-ai-engineering');
  await expect(page.locator('#consulting-service')).toHaveValue('applied-ai-engineering');
  const email = page.locator('#contact-project-email');
  await expect(email).toHaveAttribute('data-consulting-service', 'applied-ai-engineering');
  expect(new URL((await email.getAttribute('href'))!).searchParams.get('subject')).toContain(
    'Applied AI engineering'
  );
  await page
    .getByLabel('What would you like to discuss?', { exact: true })
    .selectOption('scalable-ai-infrastructure');
  await expect(email).toHaveAttribute('data-consulting-service', 'scalable-ai-infrastructure');
  expect(new URL((await email.getAttribute('href'))!).searchParams.get('subject')).toContain(
    'Scalable AI infrastructure'
  );
});

test('unknown inquiry topics fall back to the general draft', async ({ page }) => {
  await page.goto('/contact?service=unknown');
  await expect(page.locator('#consulting-service')).toHaveValue('general');
  await expect(page.locator('#contact-project-email')).toHaveAttribute(
    'data-consulting-service',
    'general'
  );
});

test.describe('Contact and the homepage on a narrow phone', () => {
  test.use({ viewport: { width: 360, height: 800 } });
  for (const path of ['/', '/contact']) {
    test(`${path} stays within the viewport`, async ({ page }) => {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        )
      ).toBe(0);
      await expect(page.locator('h1')).toBeVisible();
      if (path === '/contact') {
        for (const slug of services) {
          await page.locator(`details#${slug} > summary`).click();
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
          )
        ).toBe(0);
      }
    });
  }
});
