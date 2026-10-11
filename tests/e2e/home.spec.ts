import { expect, test } from '@playwright/test';

test('the homepage describes its search topic clearly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(
    'Kushal Patankar — Applied AI & Distributed Systems Engineer'
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Kushal Patankar builds scalable AI infrastructure, applied AI products, distributed systems, and local-first personal software.'
  );
  await expect(page.locator('h1')).toHaveText(
    'I build AI products and the systems that make them scale.'
  );
  await expect(page.locator('.home-intro')).toContainText('applied AI engineering');
  await expect(page.locator('.home-intro')).toContainText('scalable AI infrastructure');
  await expect(page.locator('.home-intro')).toContainText('distributed systems');
  await expect(page.locator('.home-intro')).toContainText('local-first personal software');
});

test('the homepage does not link to the interactive terminal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main a[href="/terminal"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Prefer a command line?');
});
