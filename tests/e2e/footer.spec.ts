import { expect, test } from '@playwright/test';

test('the footer links to Software, Blog, About, and Contact only', async ({ page }) => {
  await page.goto('/about');
  const links = page.locator('footer.footer a');

  await expect(links).toHaveText(['Software', 'Blog', 'About', 'Contact']);
  expect(
    await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')))
  ).toEqual(['/software', '/blog', '/about', '/contact']);
  await expect(page.locator('footer.footer')).toContainText(/Kushal Patankar © \d{4}/);
});

test('the footer highlights the section being read', async ({ page }) => {
  await page.goto('/blog/scaling-llm-applications');
  await expect(page.locator('footer.footer a.active')).toHaveText(['Blog']);
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
