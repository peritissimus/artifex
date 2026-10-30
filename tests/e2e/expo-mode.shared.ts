import { expect, test, type Page } from '@playwright/test';

// Expo Mode needs an API that's behind a flag, and a newer version of it than Playwright's bundled
// Chromium has. So these drive the installed Chrome, which CI machines can't be relied on to have.
// Chrome has two modes with very different hit-testing, so each spec file runs this under one.
export const expoBrowser = (flags: string[]) => ({
  channel: 'chrome',
  launchOptions: { args: [...flags, '--ignore-gpu-blocklist'] },
  viewport: { width: 1440, height: 900 },
});

export function defineExpoModeTests() {
  test.skip(!!process.env.CI, 'Needs a desktop Chrome with HTML-in-Canvas.');
  // Walking a real pointer over the world takes a while.
  test.setTimeout(120_000);

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
    // Finer than the smallest control's height on screen, which is about 25 pixels.
    for (let y = 340; y < 880; y += 18) {
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
        drawablesInTheSheet: host.querySelectorAll('[drawable]').length,
      };
    });
    expect(shape).toEqual({
      content: 'drawable',
      rootIsDrawable: true,
      pavilionsStillInSheet: 11,
      drawablesInTheSheet: 0,
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

  /** The page point the ray hit, as reported in the exhibit's telemetry. */
  const pagePointUnderCursor = async (page: Page) => {
    const text = await page.locator('[data-tele="cursor"]').textContent();
    const match = text?.match(/(-?\d+), (-?\d+)/);
    return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
  };

  // The test that matters: what the pointer hits has to be what is drawn there. The ray finds a point
  // on the paper from the camera alone; the DOM under the pointer has to be the element at that point.
  test('the DOM under the pointer is what is drawn there, deep in the page', async ({ page }) => {
    await enter(page);
    await page.evaluate(() =>
      window.scrollTo({
        top: document.querySelector<HTMLElement>('#p-paperfolio')!.offsetTop + 300,
        behavior: 'instant',
      })
    );
    await page.waitForTimeout(1200);

    let checked = 0;
    for (const [x, y] of [
      [720, 500],
      [460, 640],
      [960, 620],
      [720, 760],
      [560, 420],
    ]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(520);
      const point = await pagePointUnderCursor(page);
      if (!point) continue;
      const box = await page.evaluate(
        ([px, py]) => {
          const hit = document.elementFromPoint(px, py)!;
          const origin = document.querySelector('#p-gate')!.getBoundingClientRect();
          const rect = hit.getBoundingClientRect();
          return {
            top: rect.top - origin.top,
            bottom: rect.bottom - origin.top,
            left: rect.left - origin.left,
            right: rect.right - origin.left,
            section: hit.closest('section')?.id,
          };
        },
        [x, y]
      );
      expect(box.section).not.toBe('p-gate');
      expect(point.y).toBeGreaterThanOrEqual(box.top - 6);
      expect(point.y).toBeLessThanOrEqual(box.bottom + 6);
      expect(point.x).toBeGreaterThanOrEqual(box.left - 6);
      expect(point.x).toBeLessThanOrEqual(box.right + 6);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });

  test('a slider deep in the page follows the pointer', async ({ page }) => {
    await enter(page);
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-turn-spin]')!.click();
      window.scrollTo({
        top: document.querySelector<HTMLElement>('#p-turntable')!.offsetTop - 200,
        behavior: 'instant',
      });
    });
    await page.waitForTimeout(1200);
    const thumb = await findOnScreen(page, '[data-turn-orbit]');
    const before = await page.locator('[data-turn-orbit]').inputValue();
    await page.mouse.move(thumb.x, thumb.y);
    await page.mouse.down();
    await page.mouse.move(thumb.x - 60, thumb.y, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('[data-turn-orbit]')).not.toHaveValue(before);
  });
}
