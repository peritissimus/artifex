import { test, expect } from '@playwright/test';

test('SQLite demo searches, imports literal text, clears data, and works on mobile', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url() + (request.postData() || '')));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/notes-search');
  await page.getByRole('button', { name: 'Start search', exact: true }).click();
  await expect(page.locator('#note-count')).toContainText('6 notes', { timeout: 30000 });
  await expect(page.locator('#lab-results')).toContainText('A rebuildable notes index');
  await page.getByLabel('What are you looking for?').fill('absentword');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('0 matches');
  await page.getByText('Search your own files', { exact: true }).click();
  await page.locator('#note-files').setInputFiles([
    {
      name: 'private-test.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Uniquequartz\n<img src=x onerror=alert(1)>\nrelease checklist'),
    },
    {
      name: 'second.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('checklist before release'),
    },
  ]);
  await expect(page.locator('#note-count')).toContainText('2 notes');
  await page.getByLabel('What are you looking for?').fill('release checklist');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('2 matches');
  await page.getByLabel('Match an exact phrase').check();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('1 match');
  await expect(page.locator('#lab-results img')).toHaveCount(0);
  await page.getByLabel('What are you looking for?').fill('" OR *');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('0 matches');
  expect(requests.some((request) => /Uniquequartz|private-test|posthog/i.test(request))).toBe(
    false
  );
  await page.locator('#note-files').setInputFiles({
    name: 'too-large.md',
    mimeType: 'text/markdown',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('status')).toContainText('no more than 2 MB');
  await expect(page.locator('#note-count')).toContainText('2 notes');
  await page.getByRole('button', { name: 'Restore sample notes' }).click();
  await expect(page.locator('#note-count')).toContainText('6 notes');
  await expect(page.locator('#lab-results')).toContainText('A rebuildable notes index');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/notes-search-mobile.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start search', exact: true })).toBeVisible();
  await expect(page.locator('#lab-results')).toBeEmpty();
});

test('engine download failure gives a retry instead of a stuck loading state', async ({ page }) => {
  await page.route('**/*.wasm*', (route) => route.abort());
  await page.goto('/tools/notes-search');
  await page.getByRole('button', { name: 'Start search', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start search', exact: true })).toBeVisible({
    timeout: 35000,
  });
});
