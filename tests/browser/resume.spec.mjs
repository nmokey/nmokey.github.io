import { test, expect } from '@playwright/test';

// Full Chromium includes the PDF viewer; the headless shell downloads PDFs.
test.use({ channel: 'chromium' });

test('resume opens the PDF in a new tab without downloading', async ({ page, request }) => {
  await page.goto('/');
  const downloads = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', {name:'Open resume in a new tab'}).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(/\/assets\/resume\.pdf$/);
  const response = await request.get('/assets/resume.pdf');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(response.headers()['content-disposition'] || '').not.toContain('attachment');
  expect(downloads).toEqual([]);
});
