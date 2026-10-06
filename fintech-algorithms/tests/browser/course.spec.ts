import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { widgets } from '../../src/components/widgets/catalog';
import { algorithmTopics } from '../../src/data/algorithm-course';
import course from '../../src/data/course.json' with { type: 'json' };
import labs from '../../src/data/labs.json' with { type: 'json' };
const notebookLabs = Object.fromEntries(
  Object.entries(labs).map(([slug, lab]) => {
    const notebook = JSON.parse(fs.readFileSync(`labs/${slug}.ipynb`, 'utf8'));
    const code = notebook.cells
      .filter((cell: { cell_type: string }) => cell.cell_type === 'code')
      .map((cell: { source: string[] }) => cell.source.join(''))
      .join('\n\n');
    return [slug, { ...lab, code }];
  }),
);
const errors = new WeakMap<object, string[]>();
test.beforeEach(async ({ page }) => {
  const all: string[] = [];
  errors.set(page, all);
  page.on('pageerror', (e) => all.push(e.message));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});
const templates = [
  '/',
  '/library/',
  '/progress/',
  '/foundations/',
  '/algorithms/logistic-regression/',
  '/algorithms/logistic-regression/intuition/',
  '/algorithms/logistic-regression/formula/',
  '/algorithms/logistic-regression/worked/',
  '/algorithms/logistic-regression/practice/',
  '/algorithms/logistic-regression/measures/',
  '/algorithms/logistic-regression/defend/',
  '/measures/',
  '/measures/roc-auc-and-gini/',
  '/exercises/M01/',
  '/measure-picker/',
  '/labs/',
  '/glossary/',
  '/instructor/',
  '/synthesis/',
  '/explorers/threshold-explorer/',
];
for (const path of templates)
  test('accessible template ' + path, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || '')),
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  });
test('A01 checks, hints, reveal and refresh persistence', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/worked/');
  const exercise = page.locator('#exercise-A01-worked');
  await exercise.scrollIntoViewIfNeeded();
  await expect(exercise).toBeVisible();
  await expect(page.locator('astro-island[component-url*="Exercise"][ssr]')).toHaveCount(0);
  await expect(
    exercise.getByRole('heading', { name: 'Worked arithmetic', exact: true }),
  ).toBeVisible();
  await exercise.getByRole('button', { name: 'Try this example', exact: true }).click();
  await exercise.locator('#A01-w-z').fill('-3.586');
  await exercise.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(exercise.getByRole('status').last()).toContainText('percentage points');
  await exercise.locator('#A01-w-z').fill('0');
  await exercise.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(exercise.getByRole('button', { name: 'Show solution' })).toBeVisible();
  await exercise.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(exercise.locator('.hint')).toBeVisible();
  const e = course.exercises.find((e) => e.id === 'A01')!;
  for (const s of e.steps) {
    const value = e.deckSolution[s.id as keyof typeof e.deckSolution];
    const input = exercise.locator('#A01-w-' + s.id);
    if (typeof value === 'boolean') await input.selectOption(value ? 'Yes' : 'No');
    else await input.fill(String(value));
    await exercise.getByRole('button', { name: 'Check answer', exact: true }).click();
  }
  await expect(exercise.locator('.exercise-complete')).toContainText('Calculation complete');
  await page.reload();
  await exercise.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="Exercise"][ssr]')).toHaveCount(0);
  await exercise.getByRole('button', { name: 'Try this example', exact: true }).click();
  await expect(exercise.locator('.exercise-complete')).toContainText('Calculation complete');
  await expect(exercise.locator('.revealed').first()).toContainText('With help');
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await expect(page.getByRole('button', { name: /Read/ }).first()).toBeVisible();
  await page.goto('/instructor/');
  await expect(page.getByText('Correct steps', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress JSON' }).click();
  expect((await download).suggestedFilename()).toBe('fintech-progress.json');
});
test('cell checking and instructor reveal', async ({ page }) => {
  await page.goto('/exercises/M01/?instructor=1');
  const exercise = page.locator('#exercise-M01-worked');
  await expect(exercise.getByRole('button', { name: 'Reveal solutions' })).toBeVisible();
  await expect(exercise.getByRole('button', { name: 'Show worked steps' })).toBeDisabled();
  await exercise.getByRole('button', { name: 'Reveal solutions' }).click();
  await exercise.getByRole('button', { name: 'Show worked steps' }).click();
  await expect(exercise.locator('.revealed').first()).toBeVisible();
  await exercise.getByRole('button', { name: 'Hide solutions' }).click();
  await expect(exercise.locator('.revealed')).toHaveCount(0);
});
test('search, symbol keyboard tooltip, and theme', async ({ page }) => {
  await page.goto('/foundations/');
  await page.locator('.optional-exploration > summary').click();
  await page.getByRole('button', { name: 'Meaning of p', exact: true }).first().press('Enter');
  await expect(page.locator('.symbol-tip.is-open .symbol-explanation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.symbol-tip.is-open')).toHaveCount(0);
  await page.locator('.utility-menu > summary').click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Search the course', exact: true }).click();
  await page.locator('.pagefind-ui__search-input').fill('isolation forest');
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible();
});
test('published course copy has no lecture archive or page citations', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText(/Source:\s|lecture page|p\.\s*\d+/i);
  await expect(page.locator('a[href*="/source/"], a[href$=".pdf"]')).toHaveCount(0);
  expect((await request.get('/source/')).status()).toBe(404);
  expect((await request.get('/source/deck.pdf')).status()).toBe(404);
});
for (const widget of widgets)
  test('keyboard explorer ' + widget.id, async ({ page }) => {
    await page.goto('/explorers/' + widget.id + '/');
    const block = page.locator('[data-widget="' + widget.id + '"]');
    await expect(block).toBeVisible();
    await expect(page.locator('astro-island[component-url*="Widget"][ssr]')).toHaveCount(0);
    const values = block.locator('.widget-readouts').first();
    const before = (await values.textContent()) || '';
    const inputs = block.locator('.widget-controls input[type="number"]:visible');
    const sliders = block.locator('.widget-controls input[type="range"]:visible');
    if (widget.id === 'entity-graph') {
      await block.locator('select').selectOption('1');
    } else if (widget.id === 'calibration-lab') {
      await block.getByRole('checkbox').focus();
      await page.keyboard.press('Space');
    } else if (widget.id === 'kmeans-anim') {
      // A one-point change preserves the nearest group; cross the boundary deliberately.
      await block.locator('#kmeans-anim-newPoint').fill('65');
    } else if (widget.id === 'psi-drift') {
      const input = block.locator('.widget-controls input[type="text"]:visible').first();
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type('0.3, 0.7');
      await page.keyboard.press('Tab');
    } else if (['gini-split', 'attention-mini'].includes(widget.id)) {
      const input = block.locator('.widget-controls input[type="text"]:visible').first();
      const v = (await input.inputValue()).split(',').map(Number);
      v[0] += widget.id === 'gini-split' ? 1 : 0.1;
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(v.join(', '));
      await page.keyboard.press('Tab');
    } else if (widget.id === 'sigmoid-el') {
      await block.locator('#sigmoid-el-threshold').fill('0.12');
    } else if (widget.id === 'forecast-eval') {
      await block.getByRole('spinbutton', { name: /Interval half-width/ }).fill('5');
    } else if (await inputs.count()) {
      const input = inputs.first();
      await input.focus();
      await page.keyboard.press('ArrowUp');
    } else if (await sliders.count()) {
      await sliders.first().focus();
      await page.keyboard.press('ArrowRight');
    } else {
      const input = block.locator('.widget-controls input[type="text"]:visible').first();
      const v = (await input.inputValue()).split(',').map(Number);
      v[0] += 0.1;
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(v.join(', '));
      await page.keyboard.press('Tab');
    }
    await expect(values).not.toHaveText(before);
    await block.getByRole('button', { name: 'Reset example' }).click();
    await expect(values).toHaveText(before);
    await page.setViewportSize({ width: 360, height: 780 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await block.screenshot({ path: 'qa/screenshots/mobile-' + widget.id + '.png' });
  });
for (const algorithm of course.algorithms)
  test('checkpoint size ' + algorithm.slug, async ({ page }) => {
    await page.goto('/algorithms/' + algorithm.slug + '/defend/');
    const checkpoint = page.locator('#checkpoint .concept-practice');
    await page.getByRole('tab', { name: /Check understanding/ }).click();
    await checkpoint.scrollIntoViewIfNeeded();
    await expect(checkpoint.locator('input[type="radio"]')).toHaveCount(3);
    const topic = algorithmTopics.find(topic => topic.slug === algorithm.slug)!;
    const sessionId = `${topic.id}:checkpoint`;
    const savedSession = () => page.evaluate(id => JSON.parse(localStorage.getItem('usf-fintech-progress-v1') || '{}').assessmentSessions?.[id], sessionId);
    await expect.poll(async () => (await savedSession())?.questionIds).toHaveLength(8);
    const ids: string[] = (await savedSession()).questionIds;
    expect(new Set(ids).size).toBe(8);
    for (const dimension of ['definition', 'mechanism', 'calculation', 'application']) {
      expect(ids.filter(id => topic.questions.find(question => question.id === id)?.dimension === dimension)).toHaveLength(2);
    }
    for (const [index, id] of ids.entries()) {
      const question = topic.questions.find(question => question.id === id)!;
      await expect(checkpoint).toContainText(`Question ${index + 1} of 8`);
      await expect(checkpoint.locator('input[type="radio"]')).toHaveCount(3);
      await checkpoint.locator(`input[type="radio"][value="${question.correctChoiceId}"]`).check();
      await checkpoint.getByRole('button', { name: 'Check answer', exact: true }).click();
      await checkpoint.getByRole('button', { name: index === 7 ? 'See my results' : 'Next question →', exact: true }).click();
    }
    await expect(checkpoint).toContainText('Checkpoint passed');
    await expect(checkpoint).toContainText('8 of 8 first answers correct');
  });
test('invalid matrix counts and drift distributions explain the problem', async ({ page }) => {
  await page.goto('/explorers/confusion-builder/');
  const block = page.locator('[data-widget="confusion-builder"]');
  const before = await block.locator('.widget-readouts').first().textContent();
  await block.locator('#confusion-builder-caught').fill('999999');
  await expect(block).toContainText('Caught fraud cannot exceed');
  await expect(block.locator('.widget-readouts').first()).toHaveText(before || '');
  await page.goto('/explorers/psi-drift/');
  const drift = page.locator('[data-widget="psi-drift"]');
  await drift.locator('input[type="text"]').first().fill('0, 1');
  await page.keyboard.press('Tab');
  await expect(drift).toContainText('positive shares that sum to 1');
});
test('all 12 Python examples complete offline and support rerun', async ({ browser }) => {
  test.setTimeout(300000);
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  const allErrors: string[] = [];
  page.on('pageerror', (e) => allErrors.push(e.message));
  const baseURL = String(test.info().project.use.baseURL);
  await page.goto(baseURL + '/');
  await page.locator("[data-offline-prepare]").click();
  await expect(page.locator("[data-offline-message]")).toContainText("Offline copy complete", { timeout: 120000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 90000 })
    .toBe(true);
  await context.setOffline(true);
  await page.goto(baseURL + '/algorithms/logistic-regression/defend/');
  await expect(page.getByRole('button', { name: 'Run baseline', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run baseline', exact: true }).click();
  await expect(page.locator('.code-output')).toContainText('ROC-AUC', { timeout: 60000 });
  const results = await page.evaluate(async (entries) => {
    const worker = new Worker('/python/runner-worker.js');
    const out = [];
    for (const [slug, lab] of entries) {
      const start = performance.now();
      const result = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(slug + ' exceeded 60 seconds')), 60000);
        worker.onerror = (e) => {
          clearTimeout(timer);
          reject(new Error(e.message));
        };
        worker.onmessage = (e) => {
          if (e.data.type === 'result') {
            clearTimeout(timer);
            resolve(e.data);
          }
        };
        worker.postMessage({ code: lab.code });
      });
      out.push({
        slug,
        seconds: (performance.now() - start) / 1000,
        stdout: result.stdout,
        stderr: result.stderr,
        metric: lab.metric,
      });
    }
    worker.terminate();
    return out;
  }, Object.entries(labs));
  for (const result of results) {
    expect(result.stdout.toLowerCase()).toContain(result.metric.toLowerCase());
    expect(result.stderr).not.toMatch(/PythonError|Traceback|Error:/);
    expect(result.seconds).toBeLessThan(60);
    console.log('OFFLINE PYTHON', result.slug, result.seconds.toFixed(2) + 's');
  }
  expect(allErrors).toEqual([]);
  await context.close();
});
