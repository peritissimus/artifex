import { expect, test } from '@playwright/test';

test('the homepage does not link to the interactive terminal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main a[href="/terminal"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Prefer a command line?');
});
