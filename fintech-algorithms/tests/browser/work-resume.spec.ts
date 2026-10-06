import { expect, test, type Locator, type Page } from '@playwright/test';
import course from '../../src/data/course.json' with { type: 'json' };
import type { Givens } from '../../src/engine/types';
import type { Progress } from '../../src/engine/progress';
import { solve } from '../../src/engine/solve/core';
import { variant } from '../../src/engine/variants';

const base = (process.env.COURSE_TEST_BASE_PATH ?? '/').replace(/\/$/, '') + '/';
const route = (path = '') => base + path.replace(/^\//, '');
const storageKey = 'usf-fintech-progress-v1';
const saved = (page: Page): Promise<Progress> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);

// A visible SSR input is not yet ready to persist edits. Wait for its island's
// client hydration before interacting, especially with client:visible exercises.
async function ready(target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  await expect(target.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute('ssr', '');
}

async function locationIs(page: Page, href: string) {
  await expect
    .poll(() => page.evaluate(() => location.pathname + location.search + location.hash))
    .toBe(href);
}

async function continueFromHome(page: Page, activity: NonNullable<Progress['learningActivity']>) {
  await page.goto(route());
  const card = page.locator('.continue-learning');
  await ready(card);
  await expect(card.getByRole('heading', { level: 2 })).toHaveText(activity.title);
  const link = card.getByRole('link', { name: 'Continue learning →', exact: true });
  await expect(link).toHaveAttribute('href', activity.href);
  // Reading the home page must preserve the student's last actual action.
  expect((await saved(page)).learningActivity).toEqual(activity);
  await link.click();
  await locationIs(page, activity.href);
}

test('a calculation resumes its pending step and partial draft without completing the draft', async ({
  page,
}) => {
  const exercise = course.exercises.find((item) => item.id === 'A01')!;
  const href = route('exercises/A01/') + '?from=practice#exercise-A01-practice';
  await page.goto(route('exercises/A01/') + '?from=practice');
  let card = page.locator('#exercise-A01-practice');
  await ready(card);
  await expect.poll(async () => (await saved(page)).seeds?.['A01:practice']).toBe(1);
  expect((await saved(page)).learningActivity).toBeUndefined();
  const seed = (await saved(page)).seeds['A01:practice'];
  const solution = solve('A01', variant('A01', exercise.givens as unknown as Givens, seed));
  const [first, second] = exercise.steps;
  const firstInput = card.locator(`#A01-p-${first.id}`);
  await firstInput.fill(String(solution[first.id]));
  await firstInput
    .locator('xpath=ancestor::form[1]')
    .getByRole('button', { name: 'Check answer', exact: true })
    .click();
  await expect(card.locator('.step-track')).toHaveAttribute('aria-label', '1 of 5 steps complete');
  const partial = '0.1/';
  await card.locator(`#A01-p-${second.id}`).fill(partial);
  const draftKey = `A01:practice:${seed}`;
  await expect
    .poll(async () => (await saved(page)).exerciseDrafts?.[draftKey]?.answers[second.id])
    .toBe(partial);
  await expect.poll(async () => (await saved(page)).learningActivity?.href).toBe(href);
  const progress = await saved(page);
  expect(progress.exerciseSteps[`A01:${seed}`]).toEqual([first.id]);
  expect(progress.attempts).toHaveLength(1);
  expect(progress.attempts[0]).toMatchObject({
    id: 'A01',
    step: first.id,
    status: 'correct',
    seed,
  });
  const activity = progress.learningActivity!;
  expect(activity.title).toContain(second.title);

  await continueFromHome(page, activity);
  card = page.locator('#exercise-A01-practice');
  await ready(card);
  await expect(card.locator(`#A01-p-${second.id}`)).toHaveValue(partial);
  await expect(card.locator('.step-track')).toHaveAttribute('aria-label', '1 of 5 steps complete');
  await expect(card.locator('.exercise-complete')).toHaveCount(0);
  const resumed = await saved(page);
  expect(resumed.learningActivity).toEqual(activity);
  expect(resumed.exerciseSteps[`A01:${seed}`]).toEqual([first.id]);
  expect(resumed.attempts).toEqual(progress.attempts);
  expect(resumed.exerciseDrafts?.[draftKey]?.answers[second.id]).toBe(partial);
});

test('edited Python code resumes in the run tab with the exact query and saved source', async ({
  page,
}) => {
  const path = route('algorithms/logistic-regression/defend/') + '?from=practice';
  await page.goto(path);
  const runTab = page.getByRole('tab', { name: /Run & compare/ });
  await ready(runTab);
  await runTab.click();
  let panel = page.locator('#run');
  await expect(runTab).toHaveAttribute('aria-selected', 'true');
  await panel.locator('.code-editor summary').click();
  let code = panel.getByRole('textbox', {
    name: 'Python code for logistic-regression',
    exact: true,
  });
  const starter = await code.inputValue();
  const edited = starter + '\n# Saved experiment: keep the split fixed while comparing recall.\n';
  await code.fill(edited);
  await expect
    .poll(async () => (await saved(page)).answers?.['logistic-regression:code'])
    .toBe(edited);
  await expect.poll(async () => (await saved(page)).learningActivity?.href).toBe(path + '#run');
  const activity = (await saved(page)).learningActivity!;
  expect(activity.title).toMatch(/run|Python|lab|experiment/i);

  await continueFromHome(page, activity);
  await ready(page.getByRole('tab', { name: /Run & compare/ }));
  await expect(page.getByRole('tab', { name: /Run & compare/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  panel = page.locator('#run');
  await expect(panel).toBeVisible();
  await expect(page.locator('#checkpoint')).toBeHidden();
  await expect(page.locator('#defense')).toBeHidden();
  await panel.locator('.code-editor summary').click();
  code = panel.getByRole('textbox', { name: 'Python code for logistic-regression', exact: true });
  await expect(code).toHaveValue(edited);
  expect((await saved(page)).learningActivity).toEqual(activity);
});

test('an unfinished original worked example resumes in answer mode at its saved pending step', async ({
  page,
}) => {
  const exercise = course.exercises.find((item) => item.id === 'A01')!;
  await page.goto(route('exercises/A01/') + '?from=worked');
  let card = page.locator('#exercise-A01-worked');
  await ready(card);
  await card.getByRole('button', { name: 'Try this example', exact: true }).click();
  const [first, second] = exercise.steps;
  await card
    .locator(`#A01-w-${first.id}`)
    .fill(String(solve('A01', exercise.givens as unknown as Givens)[first.id]));
  await card.getByRole('button', { name: 'Check answer', exact: true }).click();
  await card.locator(`#A01-w-${second.id}`).fill('0.2/');
  const activity = (await saved(page)).learningActivity!;
  expect(activity.href).toBe(route('exercises/A01/') + '?from=worked#exercise-A01-worked');
  expect(activity.title).toContain(second.title);
  await continueFromHome(page, activity);
  card = page.locator('#exercise-A01-worked');
  await ready(card);
  await expect(card.getByRole('button', { name: 'Show worked steps', exact: true })).toBeVisible();
  await expect(card.locator(`#A01-w-${second.id}`)).toHaveValue('0.2/');
  expect((await saved(page)).exerciseSteps['A01:0']).toEqual([first.id]);
  expect((await saved(page)).learningActivity).toEqual(activity);
});

test('a unit defense resumes its written response and self-review in the defense tab', async ({
  page,
}) => {
  const path = route('algorithms/logistic-regression/defend/') + '?from=practice';
  await page.goto(path);
  const tab = page.getByRole('tab', { name: /Defend your decision/ });
  await ready(tab);
  await tab.click();
  let panel = page.locator('#defense');
  const response =
    'Review loans above the chosen probability threshold; compare missed defaults and review capacity on the same held-out applications.';
  await panel.locator('#defense-logistic-regression-0').fill(response);
  await panel.getByRole('checkbox', { name: 'State the financial decision.', exact: true }).check();
  await expect
    .poll(async () => (await saved(page)).answers?.['logistic-regression:defense:0'])
    .toBe(response);
  await expect
    .poll(async () => (await saved(page)).answers?.['logistic-regression:rubric:0'])
    .toBe('true');
  await expect.poll(async () => (await saved(page)).learningActivity?.href).toBe(path + '#defense');
  const progress = await saved(page);
  const activity = progress.learningActivity!;
  expect(activity.title).toMatch(/defen|decision/i);
  expect(progress.conceptCheckpoints?.['algorithm:logistic-regression']).toBeUndefined();

  await continueFromHome(page, activity);
  await ready(page.getByRole('tab', { name: /Defend your decision/ }));
  await expect(page.getByRole('tab', { name: /Defend your decision/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  panel = page.locator('#defense');
  await expect(panel.locator('#defense-logistic-regression-0')).toHaveValue(response);
  await expect(
    panel.getByRole('checkbox', { name: 'State the financial decision.', exact: true }),
  ).toBeChecked();
  await expect(page.locator('#run')).toBeHidden();
  await expect(page.locator('#checkpoint')).toBeHidden();
  expect((await saved(page)).learningActivity).toEqual(activity);
});

test('a capstone response resumes at the actual defense anchor with its self-review', async ({
  page,
}) => {
  const path = route('synthesis/') + '?from=course';
  await page.goto(path);
  let panel = page.locator('#defense');
  const answer = panel.locator('#defense-capstone-0');
  await ready(answer);
  const response =
    'A lender decides which applications need manual review. Evaluate expected credit loss and missed defaults against a fixed review rule before a limited pilot.';
  await answer.fill(response);
  await panel.getByRole('checkbox', { name: 'State the financial decision.', exact: true }).check();
  await expect.poll(async () => (await saved(page)).answers?.['capstone:defense:0']).toBe(response);
  await expect.poll(async () => (await saved(page)).answers?.['capstone:rubric:0']).toBe('true');
  await expect.poll(async () => (await saved(page)).learningActivity?.href).toBe(path + '#defense');
  const activity = (await saved(page)).learningActivity!;
  expect(activity.title).toMatch(/capstone|defen/i);

  await continueFromHome(page, activity);
  panel = page.locator('#defense');
  await ready(panel.locator('#defense-capstone-0'));
  await expect(panel.getByRole('heading', { name: 'Capstone defense', exact: true })).toBeVisible();
  await expect(panel.locator('#defense-capstone-0')).toHaveValue(response);
  await expect(
    panel.getByRole('checkbox', { name: 'State the financial decision.', exact: true }),
  ).toBeChecked();
  expect((await saved(page)).learningActivity).toEqual(activity);
});
