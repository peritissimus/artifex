import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 412, height: 823 } });

test('mobile project deck stays still until the user interacts', async ({ page }) => {
  await page.goto('/');

  const topCard = page.locator('.project-card').first();
  await expect(topCard).toHaveCSS('transform', /matrix/);

  const initialTransform = await topCard.evaluate((card) => getComputedStyle(card).transform);
  await page.waitForTimeout(1_600);
  const settledTransform = await topCard.evaluate((card) => getComputedStyle(card).transform);

  expect(settledTransform).toBe(initialTransform);
});

test('mobile project deck still responds after interaction', async ({ page }) => {
  await page.goto('/');

  const deck = page.locator('.project-deck');
  await deck.scrollIntoViewIfNeeded();

  const topCard = page.locator('.project-card').first();
  const box = await topCard.boundingBox();
  expect(box).not.toBeNull();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 90, startY, { steps: 5 });
  await page.mouse.up();

  await expect
    .poll(() => topCard.evaluate((card) => card.style.getPropertyValue('--tx')))
    .not.toBe('0px');
});

test('mobile project deck visibly tucks a released card behind the stack', async ({ page }) => {
  await page.goto('/');

  const deck = page.locator('.project-deck');
  await deck.scrollIntoViewIfNeeded();

  const topCard = page.locator('.project-card').first();
  const box = await topCard.boundingBox();
  expect(box).not.toBeNull();

  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 100, startY - 8, { steps: 6 });
  await page.mouse.up();

  // The released card changes depth immediately, then remains visible while
  // travelling directly back beneath the promoted cards.
  await expect.poll(() => topCard.evaluate((card) => card.style.zIndex)).toBe('0');
  await expect
    .poll(
      () =>
        topCard.evaluate((card) => {
          const x = Math.abs(Number.parseFloat(card.style.getPropertyValue('--tx')));
          const scale = Number.parseFloat(card.style.getPropertyValue('--sc'));
          const opacity = Number.parseFloat(card.style.opacity);
          return x > 10 && x < 95 && scale < 0.96 && opacity > 0.7 && opacity < 1;
        }),
      { intervals: [16, 16, 32, 48] }
    )
    .toBe(true);

  await expect
    .poll(() =>
      topCard.evaluate(
        (card) => Math.abs(Number.parseFloat(card.style.getPropertyValue('--tx'))) < 10
      )
    )
    .toBe(true);

  await page.waitForTimeout(600);

  const settledTransform = await topCard.evaluate((card) => getComputedStyle(card).transform);
  await page.waitForTimeout(1_800);
  expect(await topCard.evaluate((card) => getComputedStyle(card).transform)).toBe(settledTransform);
});
