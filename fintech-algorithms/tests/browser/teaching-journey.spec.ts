import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a learner reviews a prerequisite, checks a lesson, and returns from a measure', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/algorithms/logistic-regression/intuition/');
  await expect(page.locator('.topic-introduction')).toContainText('Technical definition');
  expect(
    await page
      .locator('.topic-introduction')
      .evaluate(
        (el) =>
          !!(
            el.compareDocumentPosition(document.getElementById('algorithm-visual')!) &
            Node.DOCUMENT_POSITION_FOLLOWING
          ),
      ),
  ).toBe(true);
  await page.locator('.prerequisite-links a').filter({ hasText: /Logs/ }).click();
  await expect(page).toHaveURL(/\/foundations\/logarithms\//);
  await expect(page.locator('.teaching-lesson')).toHaveCount(4);
  await page.locator('.teaching-lesson').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.teaching-lesson').first().locator('input[type=radio]')).toHaveCount(
    3,
  );
  await page.goto('/algorithms/logistic-regression/measures/');
  await page.locator('.measure-link[href*="/measures/precision/"]').click();
  await expect(page).toHaveURL(/\/measures\/precision\/\?from=logistic-regression/);
  await expect(page.getByRole('navigation', { name: 'Measure learning stages' })).toBeVisible();
  await expect(page.locator('.teaching-lesson')).toHaveCount(5);
  await page
    .locator('.mini-lesson-navigation')
    .first()
    .getByRole('link', { name: /^Next:/ })
    .click();
  await expect(page).toHaveURL(/\/measures\/precision\/\?from=logistic-regression#/);
  await page.getByRole('link', { name: /Return to Logistic Regression/ }).click();
  await expect(page).toHaveURL('/algorithms/logistic-regression/measures/');
  expect(errors).toEqual([]);
});

test('an exact lesson and conceptual practice appear in home and progress', async ({ page }) => {
  await page.goto('/foundations/variance/#variance:worked');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('usf-fintech-progress-v1') || '{}').learningActivity?.id,
      ),
    )
    .toContain('variance:worked');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Continue learning →' })).toHaveAttribute(
    'href',
    '/foundations/variance/#variance:worked',
  );
  await page.goto('/progress/');
  await expect(
    page
      .getByRole('region', { name: 'Conceptual learning progress' })
      .or(page.locator('[aria-label="Conceptual learning progress"]')),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export conceptual attempts CSV' })).toBeVisible();
});

test('concept glossary supplies definitions, examples and direct lesson links', async ({
  page,
}) => {
  await page.goto('/glossary/');
  await page.getByLabel('Search concepts, definitions, and examples').fill('log-odds');
  await expect(page.locator('.concept-glossary-entry:visible').first()).toContainText('Example:');
  await expect(
    page.locator('.concept-glossary-entry:visible').first().getByRole('link'),
  ).toHaveAttribute('href', /\/algorithms\/|\/foundations\//);
  await expect(page.locator('#concept-count')).toContainText('matching definitions');
});

test('mobile course navigation moves focus into the drawer and restores it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/foundations/vectors/');
  const button = page.getByRole('button', { name: 'Open course navigation', exact: true });
  await button.click();
  await expect(page.locator('#course-navigation a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('new teaching and practice templates have no serious automated accessibility findings', async ({
  page,
}) => {
  for (const path of [
    '/algorithms/logistic-regression/intuition/',
    '/algorithms/logistic-regression/practice/',
    '/measures/precision/',
    '/foundations/logarithms/',
    '/progress/',
  ]) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')),
      path,
    ).toEqual([]);
  }
});

test.describe('offline teaching', () => {
  test.use({ serviceWorkers: 'allow' });
  test('a cached lesson, question selection, refresh and export work without network access', async ({
    page,
    context,
  }) => {
    test.setTimeout(180000);
    await page.goto('/foundations/probability/');
    await page.locator('[data-offline-prepare]').click();
    await expect(page.locator('[data-offline-message]')).toContainText('Offline copy complete', { timeout: 120000 });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect
      .poll(
        () =>
          page.evaluate(
            async () => (await navigator.serviceWorker.getRegistration())?.active?.state,
          ),
        { timeout: 120000 },
      )
      .toBe('activated');
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
      .toBe('activated');
    await context.setOffline(true);
    await page.goto('/algorithms/logistic-regression/practice/');
    const card = page.locator('#concept-practice .concept-practice');
    await expect(card.locator('input[type=radio]')).toHaveCount(3);
    await card.locator('input[type=radio]').first().check();
    await page.reload();
    await expect(card.locator('input[type=radio]:checked')).toHaveCount(1);
    await page.goto('/progress/');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export progress JSON' }).click();
    expect((await download).suggestedFilename()).toBe('fintech-progress.json');
  });
});
