import { expect, test } from '@playwright/test';

test('agent scene renders with usable tweaks', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');

  const canvas = page.locator('#agent-canvas');
  await expect(canvas).toBeVisible();

  await expect
    .poll(async () =>
      canvas.evaluate((node) => {
        const el = node as HTMLCanvasElement;
        return { width: el.width, height: el.height };
      })
    )
    .toMatchObject({ width: expect.any(Number), height: expect.any(Number) });

  const canvasSize = await canvas.evaluate((node) => {
    const el = node as HTMLCanvasElement;
    return { width: el.width, height: el.height };
  });
  expect(canvasSize.width).toBeGreaterThan(0);
  expect(canvasSize.height).toBeGreaterThan(0);

  const panel = page.locator('#ctrl');
  await expect(panel).toBeVisible();
  await expect(page.locator('#ctrl-body')).toContainText('Bloom');

  await page.locator('#ctrl-toggle').click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#ctrl-open')).toBeVisible();

  await page.locator('#ctrl-open').click();
  await expect(panel).toBeVisible();

  await page.locator('input[data-key="bloom"]').evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = '0.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  expect(pageErrors).toEqual([]);
});
