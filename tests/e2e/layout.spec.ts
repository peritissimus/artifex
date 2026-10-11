import { expect, test } from '@playwright/test';

test('shared site chrome stays fixed while navigating between page widths', async ({ page }) => {
  await page.goto('/');

  const homeLogoX = (await page.locator('.header .logo').boundingBox())!.x;
  const homeFooterX = (await page.locator('.footer').boundingBox())!.x;

  await page.locator('.header a[href="/about"]').click();
  await expect(page).toHaveURL(/\/about$/);

  const aboutLogoX = (await page.locator('.header .logo').boundingBox())!.x;
  const aboutFooterX = (await page.locator('.footer').boundingBox())!.x;

  expect(aboutLogoX).toBe(homeLogoX);
  expect(aboutFooterX).toBe(homeFooterX);
});
