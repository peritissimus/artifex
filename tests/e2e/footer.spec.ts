import { expect, test } from '@playwright/test';

test('the footer adds profile links without repeating the header navigation', async ({ page }) => {
  await page.goto('/about');

  const headerLinks = await page
    .locator('header.header nav a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const footerLinks = await page
    .locator('footer.footer a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

  expect(headerLinks.length).toBeGreaterThan(0);
  expect(footerLinks.filter((href) => headerLinks.includes(href))).toEqual([]);
  expect(footerLinks).toEqual([
    'https://github.com/peritissimus',
    'https://linkedin.com/in/peritissimus',
  ]);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the footer fits without scrolling the page sideways', async ({ page }) => {
    await page.goto('/about');
    const lastLink = await page.locator('footer.footer a').last().boundingBox();
    expect(lastLink!.x + lastLink!.width).toBeLessThanOrEqual(390);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});
