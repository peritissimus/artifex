import { expect, test } from '@playwright/test';

for (const view of [
  { name: 'desktop', width: 1280, height: 900, colorScheme: 'light' as const },
  { name: 'mobile', width: 375, height: 812, colorScheme: 'dark' as const },
]) {
  test(`blog list keeps complete, uncluttered entries on ${view.name}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.emulateMedia({ colorScheme: view.colorScheme });
    await page.goto('/blog');

    const cards = page.locator('.blog-card');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(
      cards.locator('.blog-tag, .blog-card-footer, .blog-topics, .read-time, .blog-card-cta')
    ).toHaveCount(0);

    const dates: string[] = [];
    for (const card of await cards.all()) {
      const title = (await card.locator('h2').innerText()).trim();
      const description = (await card.locator('.blog-excerpt').innerText()).trim();
      const date = await card.locator('time').getAttribute('datetime');
      const link = card.getByRole('link', { name: title, exact: true });

      await expect(link).toHaveAccessibleDescription(description);
      await expect(link).toHaveAttribute('href', /^\/blog\/[^/]+$/);
      await expect(card.locator('time')).toHaveText(date!);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      dates.push(date!);

      const excerpt = await card.locator('.blog-excerpt').evaluate((element) => {
        const style = getComputedStyle(element);
        return { overflow: style.overflow, lineClamp: style.webkitLineClamp };
      });
      expect(excerpt).toEqual({ overflow: 'visible', lineClamp: 'none' });

      const bounds = (await card.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(view.width);
    }
    expect(dates).toEqual([...dates].sort().reverse());
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath(`blog-clean-${view.name}.png`) });

    const firstLink = cards.first().getByRole('link');
    const destination = await firstLink.getAttribute('href');
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.locator('main h1')).toBeVisible();
  });
}

test('blog entries have visible keyboard focus and native navigation', async ({ page }) => {
  await page.goto('/blog');
  const firstLink = page.locator('.blog-card-link').first();
  const destination = await firstLink.getAttribute('href');

  for (let step = 0; step < 15; step += 1) {
    await page.keyboard.press('Tab');
    if (await firstLink.evaluate((element) => element === document.activeElement)) break;
  }

  await expect(firstLink).toBeFocused();
  await expect(firstLink).toHaveCSS('outline-style', 'solid');
  await expect(firstLink).toHaveCSS('outline-width', '2px');
  const title = firstLink.locator('h2');
  await expect(title).toHaveCSS(
    'text-decoration-color',
    await title.evaluate((element) => getComputedStyle(element).color)
  );
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
});
