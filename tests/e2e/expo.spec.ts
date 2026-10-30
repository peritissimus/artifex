import { expect, test } from '@playwright/test';

// The flat page is what most browsers get, so it has to stand on its own.
test.describe('the flat page', () => {
  test('lists every pavilion with a working exhibit', async ({ page }) => {
    await page.goto('/expo?flat');
    await expect(page.locator('h1')).toHaveText('Expo 149');
    await expect(page.locator('.pavilion')).toHaveCount(11);
    await expect(page.locator('.pavilion .plinth')).toHaveCount(11);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    for (const pavilion of await page.locator('.pavilion').all()) {
      await expect(pavilion.locator('.pav-link')).toHaveAttribute('href', /^\/work\//);
    }
  });

  test('redacts what you type into Strid', async ({ page }) => {
    await page.goto('/expo?flat');
    const input = page.locator('[data-strid-in]');
    await input.fill('PAN ABCDE1234F belongs to nobody.');
    await expect(page.locator('[data-strid-out]')).not.toContainText('ABCDE1234F');
    await expect(page.locator('[data-strid-counts]')).toContainText('PAN × 1');

    await page.locator('[data-strid-style="label"]').click();
    await expect(page.locator('[data-strid-out] mark')).toHaveText('PAN');
  });

  test('keeps the Stone note across a reload, in this browser only', async ({ page }) => {
    await page.goto('/expo?flat');
    await page.locator('[data-note]').fill('# Still here\n\nA **real** note');
    await expect(page.locator('[data-note-preview] h4')).toHaveText('Still here');
    await expect(page.locator('[data-note-words]')).toHaveText('6 words');

    await page.reload();
    await expect(page.locator('[data-note]')).toHaveValue('# Still here\n\nA **real** note');
  });

  test('computes daylight that changes with the season', async ({ page }) => {
    await page.goto('/expo?flat');
    const altitude = page.locator('[data-plan-alt]');
    const march = await altitude.textContent();
    await page.locator('[data-season="-23.44"]').click();
    await expect(altitude).not.toHaveText(march!);

    // December noon over Bengaluru: the sun is high, but well short of overhead.
    await page.locator('[data-plan-range]').fill('12');
    await expect(altitude).toHaveText(/^[3-9]\d\.\d°$/);
  });

  test('runs the other exhibits', async ({ page }) => {
    await page.goto('/expo?flat');

    await page.locator('[data-fit-a-range]').fill('60');
    await expect(page.locator('[data-fit-diff]')).toHaveText('Exactly the same height');

    await page.locator('[data-kaze-in]').fill('euler spiral');
    await expect(page.locator('[data-kaze-out] li').first()).toContainText('mode/curve.ts');

    await page.locator('[data-bird-topic="AI"]').click();
    await expect(page.locator('[data-bird-count]')).toHaveText('2');

    const before = await page.locator('[data-paper-cash]').textContent();
    await page.locator('[data-paper-ticker="RULE"]').click();
    await page.locator('[data-paper-buy]').click();
    await expect(page.locator('[data-paper-cash]')).not.toHaveText(before!);

    await page.locator('[data-term-in]').fill('whoami');
    await page.locator('[data-term-in]').press('Enter');
    await expect(page.locator('[data-term-out]')).toContainText('peritissimus');

    await page.locator('[data-watch-thesis="orbit"]').click();
    await expect(page.locator('[data-watch-face] .w-planet')).toHaveCount(3);
  });

  test('explains itself in a browser without the API', async ({ page }) => {
    await page.goto('/expo');
    const hasApi = await page.evaluate(() => 'requestPaint' in HTMLCanvasElement.prototype);
    test.skip(hasApi, 'This browser has HTML-in-Canvas.');
    await expect(page.locator('[data-expo-unsupported]')).toBeVisible();
    await expect(page.locator('[data-expo-toggle]')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/is-expo/);
  });
});
