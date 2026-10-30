import { expect, test, type Page } from '@playwright/test';

// Expo Mode needs an API that's behind a flag, and a newer version of it than Playwright's bundled
// Chromium has. So these drive the installed Chrome, which CI machines can't be relied on to have.
test.skip(!!process.env.CI, 'Needs a desktop Chrome with HTML-in-Canvas.');
test.use({
  channel: 'chrome',
  launchOptions: { args: ['--enable-blink-features=CanvasDrawElement', '--ignore-gpu-blocklist'] },
  viewport: { width: 1440, height: 900 },
});

const enter = async (page: Page) => {
  await page.goto('/expo?expo-mode');
  const hasApi = await page.evaluate(() => 'requestPaint' in HTMLCanvasElement.prototype);
  test.skip(!hasApi, 'HTML-in-Canvas is not available in this browser build.');
  await expect(page.locator('body')).toHaveClass(/is-expo/, { timeout: 20_000 });
  // The entrance animation, then the pointer can be trusted.
  await page.waitForTimeout(2600);
};

/** Walk the real pointer over the world until the DOM under it matches. */
const findOnScreen = async (page: Page, selector: string) => {
  for (let y = 340; y < 880; y += 34) {
    for (let x = 120; x < 1340; x += 68) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(20);
      const hit = await page.evaluate(
        ([px, py, target]) => !!document.elementFromPoint(px, py)?.closest(target),
        [x, y, selector] as const
      );
      if (hit) return { x, y };
    }
  }
  throw new Error(`${selector} never came under the pointer`);
};

test('puts the page in a drawable canvas without moving it in the DOM', async ({ page }) => {
  await enter(page);
  const shape = await page.evaluate(() => {
    const host = document.querySelector('#expo-sheet')!;
    const canvas = host.shadowRoot!.querySelector('canvas')!;
    return {
      content: canvas.getAttribute('content'),
      rootIsDrawable: canvas.firstElementChild!.hasAttribute('drawable'),
      pavilionsStillInSheet: host.querySelectorAll(':scope > .pavilion').length,
      drawables: host.querySelectorAll('[drawable]').length,
    };
  });
  expect(shape).toEqual({
    content: 'drawable',
    rootIsDrawable: true,
    pavilionsStillInSheet: 11,
    drawables: 25,
  });
});

test('takes real clicks and typing on the warped surface', async ({ page }) => {
  await enter(page);
  const button = await findOnScreen(page, '[data-count]');
  await page.mouse.click(button.x, button.y);
  await expect(page.locator('[data-count-n]')).toHaveText('1');

  const input = await findOnScreen(page, '[data-echo-in]');
  await page.mouse.click(input.x, input.y);
  await page.locator('[data-echo-in]').fill('');
  await page.keyboard.type('On the curve');
  await expect(page.locator('[data-echo-out]')).toHaveText('On the curve');
});

test('selects real text on the warped surface', async ({ page }) => {
  await enter(page);
  const lede = await findOnScreen(page, '.gate-lede');
  await page.mouse.move(lede.x, lede.y);
  await page.mouse.down();
  await page.mouse.move(lede.x + 220, lede.y, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => getSelection()!.toString().length)).toBeGreaterThan(5);
});

test('gives the page back on the way out, and can go in again', async ({ page }) => {
  await enter(page);
  await page.keyboard.press('Backquote');
  await expect(page.locator('body')).not.toHaveClass(/is-expo/, { timeout: 5000 });
  await expect(page.locator('[drawable]')).toHaveCount(0);
  await expect(page.locator('.gate-title')).toBeVisible();

  await page.keyboard.press('Backquote');
  await expect(page.locator('body')).toHaveClass(/is-expo/);
  await expect(page.locator('[data-tele="fps"]')).toHaveText(/fps/, { timeout: 5000 });
});

test('plays the nib game on the real words of the page', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.keyboard.press('g');
  await expect(page.locator('[data-game-hud]')).toBeVisible();
  await expect(page.locator('#expo-sheet')).toHaveJSProperty('inert', true);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-game-hud]')).toBeHidden();
  await expect(page.locator('#expo-sheet')).toHaveJSProperty('inert', false);
  await expect(page.locator('body')).toHaveClass(/is-expo/);
});

test('escape closes the end of a run, not the whole expo', async ({ page }) => {
  await enter(page);
  // From the top of the page the gate is less than a second away.
  await page.keyboard.press('g');
  const dialog = page.locator('[data-game-end]');
  await expect(dialog).toBeVisible({ timeout: 8000 });

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-game-hud]')).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/is-expo/);
  await expect(page.locator('[data-expo-toggle]')).toBeVisible();
});
