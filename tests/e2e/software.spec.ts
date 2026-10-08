import { expect, test } from '@playwright/test';

test('the dotfiles project is listed on /software and links to its repository', async ({
  page,
}) => {
  await page.goto('/software');
  const card = page.locator('a.software-card[href="/work/dotfiles"]');
  await expect(card).toContainText('Dotfiles');
  await expect(card.locator('.project-artwork--dotfiles svg')).toBeVisible();

  await card.click();
  await expect(page).toHaveURL(/\/work\/dotfiles$/);
  await expect(page.locator('h1')).toHaveText('Dotfiles');
  await expect(page.locator('a.work-link')).toHaveAttribute(
    'href',
    'https://github.com/peritissimus/dotfiles'
  );
  await expect(page.locator('.project-blueprint--dotfiles svg')).toBeVisible();
  await expect(page.locator('.achievement-list')).not.toContainText('`');
});
