import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

const storageKey = 'usf-fintech-progress-v1';
const sections = [
  ['problem', 'Problem'],
  ['intuition', 'Intuition'],
  ['formula', 'Formula'],
  ['worked', 'Worked example'],
  ['practice', 'Practice'],
  ['measures', 'Measures'],
  ['defend', 'Build & defend'],
] as const;
const lessonPath = (section: string) =>
  `/algorithms/logistic-regression/${section === 'problem' ? '' : section + '/'}`;
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

async function waitForProgress(page: Page) {
  await expect(page.locator('astro-island[component-url*="LearnerProgress"][ssr]')).toHaveCount(0);
}

async function importFile(page: Page, progress: unknown) {
  await page.locator('.import-progress > summary').click();
  await page.getByLabel('Choose a progress JSON file').setInputFiles({
    name: 'previous-progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(progress)),
  });
  await expect(page.locator('.import-message')).toContainText('Progress imported');
}

test('Learn starts a new learner and resumes the exact lesson activity', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start learning →', exact: true }).click();
  await expect(page).toHaveURL(lessonPath('problem'));
  await page
    .locator('.unit-outline')
    .getByRole('link', { name: '2 Intuition', exact: true })
    .click();
  await expect(page).toHaveURL(lessonPath('intuition'));
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').resume?.section,
        storageKey,
      ),
    )
    .toBe('intuition');
  const activityPath = `${lessonPath('intuition')}#logistic-regression:mechanism`;
  await page
    .getByRole('navigation', { name: 'Lessons in this section' })
    .getByRole('link', { name: 'Follow the mechanism: learning and using it', exact: true })
    .click();
  await expect(page).toHaveURL(activityPath);
  // Ensure the selected lesson is in the reading area before leaving it;
  // resume should follow the lesson being viewed, including its exact anchor.
  await page.locator('[id="logistic-regression:mechanism"]').scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? '{}').learningActivity?.href,
        storageKey,
      ),
    )
    .toBe(activityPath);
  const activityTitle = await page
    .locator('[id="logistic-regression:mechanism"]')
    .getAttribute('data-learning-title');
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Learn', exact: true })
    .click();
  const continueLink = page.getByRole('link', { name: 'Continue learning →', exact: true });
  await expect(continueLink).toHaveAttribute('href', activityPath);
  await expect(page.locator('.continue-learning h2')).toHaveText(activityTitle!);
  await continueLink.click();
  await expect(page).toHaveURL(activityPath);
  await expect(page.getByRole('button', { name: 'Mark as read', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.screenshot({ path: 'qa/screenshots/guided-lesson-desktop.png' });
});

test('desktop outline exposes all seven sections and clearly names adjacent sections', async ({
  page,
}) => {
  await page.goto(lessonPath('formula'));
  const outline = page.locator('.unit-outline');
  await expect(outline.getByRole('link')).toHaveCount(7);
  for (const [section, label] of sections) {
    await expect(outline.getByRole('link', { name: new RegExp(label) })).toHaveAttribute(
      'href',
      lessonPath(section),
    );
  }
  await expect(outline.locator('[aria-current="page"]')).toContainText('Formula');
  await expect(page.getByRole('combobox', { name: 'Switch unit' })).toBeVisible();
  await expect(page.locator('#unit-switcher option')).toHaveCount(12);
  await expect(page.getByRole('link', { name: '← Intuition', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Continue to Worked example →', exact: true }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Switch unit' }).selectOption('/algorithms/k-means/');
  await expect(page).toHaveURL('/algorithms/k-means/');
  await expect(page.locator('.unit-outline [aria-current="page"]')).toContainText('Problem');
});

test('390px lessons retain the active section and fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(lessonPath('problem'));
  for (const [index, [section, label]] of sections.entries()) {
    if (index > 0)
      await page
        .getByRole('combobox', { name: 'Choose unit section' })
        .selectOption(lessonPath(section));
    await expect(page).toHaveURL(lessonPath(section));
    const selector = page.getByRole('combobox', { name: 'Choose unit section' });
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue(lessonPath(section));
    await expect(selector.locator('option:checked')).toHaveText(`${index + 1} of 7 · ${label}`);
    await expect(selector.locator('option')).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const box = await selector.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
    if (section === 'intuition')
      await page.screenshot({ path: 'qa/screenshots/guided-lesson-mobile.png', fullPage: true });
  }
  await page.getByRole('button', { name: 'Open course navigation', exact: true }).click();
  const menu = page.getByRole('navigation', { name: 'Course navigation', exact: true });
  await expect(menu.getByRole('link', { name: 'Library', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open course navigation', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
});

test('fresh learners get light mode and saved dark mode survives navigation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.utility-menu > summary').click();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('course-theme')))
    .toBe('dark');
  await page.goto('/library/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.utility-menu > summary').click();
  await expect(
    page.getByRole('button', { name: 'Switch to light theme', exact: true }),
  ).toBeVisible();
});

test('progress import and export preserve responses and distinguish assisted answers', async ({
  page,
}) => {
  const time = '2026-10-01T12:00:00.000Z';
  const attempt = (step: string, status: 'correct' | 'incorrect' | 'shown', pattern?: string) => ({
    id: 'A01',
    step,
    status,
    seed: 1,
    time,
    ...(pattern ? { pattern } : {}),
  });
  const saved = {
    version: 1,
    sections: { 'logistic-regression:problem': true, 'logistic-regression:intuition': true },
    answers: {
      'logistic-regression:defense:0':
        'Review the expected loss against the cost and capacity of manual review.',
    },
    seeds: { A01: 1 },
    attempts: [
      attempt('z', 'correct'),
      attempt('z', 'correct'),
      attempt('p', 'shown'),
      attempt('p', 'correct'),
      attempt('EL', 'correct', 'hint-used'),
      attempt('decision', 'correct'),
      attempt('lossOnDefault', 'incorrect'),
    ],
    checkpoints: { 'logistic-regression': 0.8 },
    exerciseSteps: { 'A01:1': ['z', 'p', 'EL', 'decision'] },
    helpUsed: { 'A01:1': ['decision'] },
    resume: { slug: 'logistic-regression', section: 'practice', time },
  };
  await page.goto('/progress/');
  await waitForProgress(page);
  await importFile(page, saved);
  const stats = page.locator('.learner-statistics');
  await expect(
    stats.locator('div').filter({ hasText: 'Independent calculations' }).locator('strong'),
  ).toHaveText('1');
  await expect(
    stats.locator('div').filter({ hasText: 'Calculations completed with help' }).locator('strong'),
  ).toHaveText('3');
  await expect(
    stats.locator('div').filter({ hasText: 'Sections marked read' }).locator('strong'),
  ).toHaveText(/2\s*\/\s*84/);
  const unit = page
    .locator('.learner-unit')
    .filter({ has: page.getByRole('link', { name: 'Logistic regression', exact: true }) });
  await expect(unit).toContainText('1 independent · 3 assisted');
  await expect(unit).toContainText('Legacy numerical checkpoint: 80%');
  await expect(unit).toContainText('Concept checkpoint: Not attempted');
  const concepts = page.locator('[aria-label="Conceptual learning progress"]');
  await expect(
    concepts.locator('div').filter({ hasText: 'Independent conceptual answers' }).locator('strong'),
  ).toHaveText('0');
  await expect(
    concepts
      .locator('div')
      .filter({ hasText: 'Distinct conceptual questions checked' })
      .locator('strong'),
  ).toHaveText('0');
  await expect(
    page.getByRole('link', { name: 'Continue learning →', exact: true }),
  ).toHaveAttribute('href', lessonPath('practice'));
  await page.reload();
  await waitForProgress(page);
  await expect(
    stats.locator('div').filter({ hasText: 'Calculations completed with help' }).locator('strong'),
  ).toHaveText('3');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress JSON', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('fintech-progress.json');
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported).toEqual(saved);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('old version 1 progress imports without resume or help fields', async ({ page }) => {
  const legacy = {
    version: 1,
    sections: { 'logistic-regression:problem': true },
    answers: { 'logistic-regression:defense:0': 'My original response remains available.' },
    seeds: {},
    attempts: [],
    checkpoints: {},
    exerciseSteps: {},
  };
  await page.goto('/progress/');
  await waitForProgress(page);
  await importFile(page, legacy);
  await expect(
    page.getByRole('link', { name: 'Continue learning →', exact: true }),
  ).toHaveAttribute('href', lessonPath('intuition'));
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(stored).toEqual(legacy);
});

test('library filters resources and reports empty searches clearly', async ({ page }) => {
  await page.goto('/library/');
  await page.getByRole('combobox', { name: 'Resource type' }).selectOption('explorer');
  await expect(page.locator('.library-resource:visible')).toHaveCount(18);
  await page.getByRole('searchbox', { name: 'Search resources' }).fill('isolation');
  await expect(page.locator('.library-resource:visible')).toHaveCount(1);
  await expect(page.locator('.library-resource:visible')).toContainText('Isolation paths');
  await page.getByRole('searchbox', { name: 'Search resources' }).fill('nothing-matches-this-term');
  await expect(page.locator('#library-empty')).toBeVisible();
  await expect(page.locator('#library-count')).toHaveText('0 resources found');
});
