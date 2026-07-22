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
