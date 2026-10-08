import { expect, test } from '@playwright/test';

test('the footer is only the copyright line, with no links', async ({ page }) => {
  await page.goto('/about');
  const footer = page.locator('footer.footer');
  await expect(footer).toHaveText(/^\s*Kushal Patankar © \d{4}\s*$/);
  await expect(footer.locator('a')).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('pages do not scroll sideways', async ({ page }) => {
    await page.goto('/about');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});
