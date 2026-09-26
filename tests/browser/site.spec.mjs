import { test, expect } from '@playwright/test';

// Keep regression tests deterministic and avoid sending test traffic to analytics.
test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({body:'',contentType:'text/javascript'}));
  await page.route('https://www.youtube.com/**', route => route.fulfill({body:'<html><body>Video fixture</body></html>',contentType:'text/html'}));
});

test('all pages load without script errors or CSP violations', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /Content Security Policy|Refused to/i.test(message.text())) errors.push(message.text());
  });
  for (const path of ['/', '/about.html', '/art.html', '/music.html', '/projects.html', '/thoughts.html', '/missing/nested/page']) {
    const response = await page.goto(path);
    expect(response.status()).toBe(path.startsWith('/missing') ? 404 : 200);
    await expect(page.getByRole('button', {name:'Toggle menu'})).toBeVisible();
    await expect(page.getByRole('button', {name:'Toggle theme'})).toBeVisible();
    await expect(page.locator('#gravity-background-canvas')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test('keyboard menu is visible, retains sections, and closes with Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', {name:'Toggle menu'});
  await trigger.press('Enter');
  const portfolio = page.locator('.submenu-toggle').nth(0);
  const random = page.locator('.submenu-toggle').nth(1);
  await expect(portfolio).toBeVisible();
  await expect(page.locator('#navMenu > ul')).toHaveCSS('opacity','1');
  await portfolio.press('Space');
  await random.press('Enter');
  await expect(portfolio).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('link',{name:'art',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'thoughts',exact:true})).toBeVisible();
  await random.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await expect(trigger).toBeFocused();
});

test('hover transition between sections does not collapse either section', async ({ page }) => {
  await page.goto('/');
  await page.locator('#menuToggle').hover();
  await page.locator('.submenu-toggle').nth(0).hover();
  await page.locator('.submenu-toggle').nth(1).hover();
  await expect(page.getByRole('link',{name:'art',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'thoughts',exact:true})).toBeVisible();
  await page.locator('.hero-name').hover();
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded','false');
  await page.locator('#menuToggle').hover();
  await expect(page.locator('.submenu-toggle').nth(0)).toHaveAttribute('aria-expanded','false');
});

test('reduced motion keeps content still and theme usable', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const canvas = page.locator('canvas');
  const before = await canvas.evaluate(element => element.toDataURL());
  await expect(page.locator('.hero-image')).toHaveCSS('animation-name','none');
  await expect(page.locator('#cyclingText')).toHaveText('physicist');
  expect(await canvas.evaluate(element => element.toDataURL())).toBe(before);
  await page.getByRole('button',{name:'Toggle theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await expect(page.locator('.theme-transition-overlay')).toHaveCount(0);
});

test('CSP blocks an injected inline script', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = "document.documentElement.dataset.injected = 'yes'";
    document.body.appendChild(script);
  });
  await expect(page.locator('html')).not.toHaveAttribute('data-injected','yes');
});

test.describe('touch viewport', () => {
  test.use({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
  test('tap navigation reaches a page and stays inside the viewport', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button',{name:'Toggle menu'}).tap();
    await page.locator('.submenu-toggle').nth(0).tap();
    await page.locator('.submenu-toggle').nth(1).tap();
    const bounds = await page.locator('#navMenu').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    await page.getByRole('link',{name:'art',exact:true}).tap();
    await expect(page).toHaveURL(/art\.html$/);
  });
});
