import { readFile } from 'node:fs/promises';
import { test, expect, type Download, type Locator, type Page } from '@playwright/test';
import course from '../../src/data/course.json' with { type: 'json' };
import { variant } from '../../src/engine/variants';
import { format } from '../../src/engine/check';
import type { Givens } from '../../src/engine/types';

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

async function downloadText(download: Download): Promise<string> {
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path!, 'utf8');
}

async function exportedDefense(page: Page, section: Locator, name: string) {
  const pending = page.waitForEvent('download');
  await section.getByRole('button', { name: 'Export written responses', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(name);
  const text = await downloadText(download);
  expect(text).not.toMatch(
    /Source:\s|\bp\.\s*\d+|Can the student|Read the local definition|\/source\//i,
  );
  return text;
}

async function completeA01Practice(page: Page, seed: number) {
  const base = course.exercises.find((exercise) => exercise.id === 'A01')!
    .givens as unknown as Givens;
  const givens = variant('A01', base, seed);
  // Calculate independently of the application's summary and solver functions.
  const z = -3 + 0.04 * Number(givens.DTI) + 1.2 * Number(givens.D) - 0.03 * Number(givens.I);
  const p = 1 / (1 + Math.exp(-z));
  const lossOnDefault = Number(givens.loan) * Number(givens.LGD);
  const EL = p * lossOnDefault;
  const decision = p >= Number(givens.threshold);
  const exercise = page.locator('#exercise-A01-practice');
  await expect(exercise.locator('.exercise-head')).toContainText(`Practice · seed ${seed}`);
  for (const [id, answer] of Object.entries({ z, p, lossOnDefault, EL, decision })) {
    const input = exercise.locator(`#A01-p-${id}`);
    if (typeof answer === 'boolean') await input.selectOption(answer ? 'Yes' : 'No');
    else await input.fill(String(answer));
    await exercise.getByRole('button', { name: 'Check answer', exact: true }).click();
  }
  const summary = `Default probability: ${format(p, 'proportion')}. Expected loss: ${format(EL, '$')}. Send to review: ${format(decision)}.`;
  await expect(exercise.locator('.exercise-complete')).toContainText(summary);
  await expect(exercise.locator('.exercise-complete')).not.toContainText('about $399');
  await expect(exercise.getByText('A closer look', { exact: true })).toHaveCount(0);
  return { summary, EL };
}

test('practice explanations use the active values after new numbers and a refresh', async ({
  page,
}) => {
  await page.goto('/algorithms/logistic-regression/practice/');
  const exercise = page.locator('#exercise-A01-practice');
  await exercise.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="Exercise"][ssr]')).toHaveCount(0);
  const initial = await completeA01Practice(page, 1);
  await exercise.getByRole('button', { name: 'New numbers', exact: true }).click();
  await expect(exercise.locator('.exercise-complete')).toHaveCount(0);
  const renewed = await completeA01Practice(page, 2);
  expect(renewed.EL).not.toBe(initial.EL);
  await expect(exercise.locator('.exercise-complete')).not.toContainText(initial.summary);
  await page.reload();
  await exercise.scrollIntoViewIfNeeded();
  await expect(exercise.locator('.exercise-head')).toContainText('Practice · seed 2');
  await expect(exercise.locator('.exercise-complete')).toContainText(renewed.summary);
});

test('unit defense saves responses and exports the educational questions', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/defend/');
  await page.getByRole('tab', { name: /Defend your decision/ }).click();
  const response = page.locator('#defense-logistic-regression-0');
  await response.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="Defense"][ssr]')).toHaveCount(0);
  const section = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Defend your decision', exact: true }),
  });
  const answer =
    'Default probability estimates risk. I would compare the expected loss and review cost of each policy on the same validation applications.';
  await response.fill(answer);
  await expect(section.locator('.saved-note')).toHaveCount(1);
  await expect(section.locator('.saved-note')).toHaveText('Saved.');
  await page.reload();
  await response.scrollIntoViewIfNeeded();
  await expect(response).toHaveValue(answer);
  const question = await section.locator('label[for="defense-logistic-regression-0"]').innerText();
  const exported = await exportedDefense(page, section, 'logistic-regression-defense.md');
  expect(exported).toContain(`## ${question}\n\n${answer}`);
  expect(exported.match(/^## \d+\./gm)).toHaveLength(4);
});

test('capstone starts with a blank recommendation and preserves both written exports', async ({
  page,
}) => {
  await page.goto('/synthesis/');
  const recommendation = page.locator('#recommendation');
  await recommendation.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="Recommendation"][ssr]')).toHaveCount(0);
  await expect(recommendation).toHaveValue('');
  const recommendationText =
    'Pilot the review queue for new applications. Compare its precision and review cost with the existing rule, investigate missed defaults, and pause if the daily queue exceeds analyst capacity.';
  await recommendation.fill(recommendationText);
  const defense = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Capstone defense', exact: true }),
  });
  const response = page.locator('#defense-capstone-0');
  await response.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island[component-url*="Defense"][ssr]')).toHaveCount(0);
  const defenseText =
    'The credit team decides which applications to send to manual review within its daily capacity.';
  await response.fill(defenseText);
  await expect(defense.locator('textarea')).toHaveCount(8);
  await expect(defense.locator('.saved-note')).toHaveCount(1);
  await page.reload();
  await response.scrollIntoViewIfNeeded();
  await expect(response).toHaveValue(defenseText);
  const markdown = await exportedDefense(page, defense, 'capstone-defense.md');
  expect(markdown).toContain(
    `## 1. What financial decision does the system support?\n\n${defenseText}`,
  );
  expect(markdown.match(/^## \d+\./gm)).toHaveLength(8);
  await recommendation.scrollIntoViewIfNeeded();
  await expect(recommendation).toHaveValue(recommendationText);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recommendation', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('deployment-recommendation.txt');
  expect(await downloadText(download)).toBe(recommendationText);
});

test('instructor presentation navigates readable tables and formulas', async ({ page }) => {
  await page.goto('/instructor/present/logistic-regression/');
  const slides = page.locator('.reveal .slides > section');
  await expect(slides.first()).toHaveClass(/\bpresent\b/);
  await expect(
    slides.first().getByRole('heading', { name: 'Logistic Regression', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.slides pre, .slides .katex-error')).toHaveCount(0);
  const targets = await slides.evaluateAll((nodes) => [
    nodes.findIndex((node) => node.querySelector('.katex')),
    nodes.findIndex((node) => node.querySelector('table')),
  ]);
  expect(targets.every((index) => index > 0)).toBe(true);
  let current = 0;
  for (const target of [...new Set(targets)].sort((a, b) => a - b)) {
    while (current < target) {
      await page.keyboard.press('ArrowRight');
      current += 1;
      await expect(slides.nth(current)).toHaveClass(/\bpresent\b/);
    }
    const currentSlide = slides.nth(current);
    if (target === targets[0]) await expect(currentSlide.locator('.katex').first()).toBeVisible();
    if (target === targets[1]) {
      await expect(currentSlide.locator('table').first()).toBeVisible();
      expect(await currentSlide.locator('table tbody tr').count()).toBeGreaterThan(0);
    }
  }
  await page.keyboard.press('ArrowLeft');
  await expect(slides.nth(current - 1)).toHaveClass(/\bpresent\b/);
  await page.getByRole('link', { name: 'Exit presentation', exact: true }).click();
  await expect(page).toHaveURL(/\/instructor\/$/);
  await expect(
    page.getByRole('heading', { name: 'Instructor & progress tools', exact: true }),
  ).toBeVisible();
});
