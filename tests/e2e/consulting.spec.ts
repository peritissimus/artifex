import { expect, test } from '@playwright/test';

test('a service-specific inquiry retains its context on the contact page', async ({ page }) => {
  await page.goto('/consulting/applied-ai-engineering');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Applied AI Engineering Consulting'
  );
  await page.getByRole('link', { name: 'Other ways to get in touch →', exact: true }).click();
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

test.describe('consulting on a narrow phone', () => {
  test.use({ viewport: { width: 360, height: 800 } });
  for (const path of [
    '/consulting',
    '/consulting/applied-ai-engineering',
    '/consulting/scalable-ai-infrastructure',
    '/consulting/distributed-systems-reliability',
    '/contact',
  ]) {
    test(`${path} stays within the viewport`, async ({ page }) => {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        )
      ).toBe(0);
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});
