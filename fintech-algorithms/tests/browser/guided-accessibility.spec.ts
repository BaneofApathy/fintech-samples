import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]));

async function darkTheme(page: Page) {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.setItem('course-theme', 'dark'));
}

for (const path of [
  '/',
  '/library/',
  '/progress/',
  '/algorithms/logistic-regression/intuition/',
  '/algorithms/logistic-regression/defend/',
]) {
  test(`dark theme accessibility ${path}`, async ({ page }) => {
    await darkTheme(page);
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('h1')).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
    if (path.endsWith('/defend/')) {
      // Check the other two activities too: hidden panels are excluded from the initial scan.
      for (const activity of [/Check understanding/, /Defend your decision/]) {
        await page.getByRole('tab', { name: activity }).click();
        const activityResult = await new AxeBuilder({ page }).analyze();
        expect(
          activityResult.violations.filter((violation) =>
            ['serious', 'critical'].includes(violation.impact ?? ''),
          ),
        ).toEqual([]);
      }
    }
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`primary learning action has a visible keyboard focus in ${theme} theme`, async ({
    page,
  }) => {
    if (theme === 'dark') await darkTheme(page);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const start = page.getByRole('link', { name: 'Start learning →', exact: true });
    for (let step = 0; step < 30; step++) {
      await page.keyboard.press('Tab');
      if (await start.evaluate((element) => element === document.activeElement)) break;
    }
    await expect(start).toBeFocused();
    const focus = await start.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        visible: element.matches(':focus-visible'),
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        color: style.outlineColor,
      };
    });
    expect(focus.visible).toBe(true);
    expect(focus.style).not.toBe('none');
    expect(focus.width).toBeGreaterThanOrEqual(2);
    expect(focus.color).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/algorithms/logistic-regression/');
  });
}

async function touchTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

test('primary mobile actions and section controls provide 44px targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await touchTarget(page.getByRole('link', { name: 'Start learning →', exact: true }));
  await touchTarget(page.getByRole('button', { name: 'Open course navigation', exact: true }));
  await touchTarget(page.getByRole('button', { name: 'Search the course', exact: true }));
  await page.goto('/algorithms/logistic-regression/intuition/');
  await touchTarget(page.getByRole('combobox', { name: 'Choose unit section' }));
  await touchTarget(page.getByRole('link', { name: 'Continue to Formula →', exact: true }));
  await page.goto('/algorithms/logistic-regression/defend/');
  await touchTarget(page.getByRole('button', { name: 'Run baseline', exact: true }));
  await page.goto('/library/');
  await touchTarget(page.getByRole('searchbox', { name: 'Search resources' }));
  await touchTarget(page.getByRole('combobox', { name: 'Resource type' }));
});
