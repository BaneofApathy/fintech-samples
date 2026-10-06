import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { algorithmTopics } from '../../src/data/algorithm-course';
import type { AssessmentSession } from '../../src/engine/assessment';
import type { Progress } from '../../src/engine/progress';

const storageKey = 'usf-fintech-progress-v1';
const topic = algorithmTopics.find((topic) => topic.slug === 'logistic-regression')!;
const saved = (page: Page): Promise<Progress> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);
async function practice(page: Page) {
  await page.goto('/algorithms/logistic-regression/practice/');
  const card = page.locator('.concept-practice').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('input[type="radio"]')).toHaveCount(3);
  return card;
}
async function current(
  page: Page,
  card: Locator,
): Promise<{ id: string; session: AssessmentSession }> {
  const id = (await card.getAttribute('data-concept-practice'))!;
  await expect
    .poll(async () => (await saved(page)).assessmentSessions?.[id]?.questionIds.length)
    .toBeGreaterThan(0);
  return { id, session: (await saved(page)).assessmentSessions![id] };
}
async function answer(page: Page, card: Locator, correct = true) {
  const { session } = await current(page, card);
  const question = topic.questions.find(
    (question) => question.id === session.questionIds[session.index],
  )!;
  const choice = correct
    ? question.correctChoiceId
    : question.choices.find((choice) => choice.id !== question.correctChoiceId)!.id;
  await card.locator(`input[type="radio"][value="${choice}"]`).check();
  await card.getByRole('button', { name: 'Check answer', exact: true }).click();
  return question;
}

test('a missed choice receives specific feedback, resumes after refresh and cannot inflate independent progress', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let card = await practice(page);
  const { id, session } = await current(page, card);
  const question = await answer(page, card, false);
  await expect(card).toContainText('Incorrect');
  const attempt = (await saved(page)).conceptAttempts![0];
  await expect(card).toContainText(
    question.choices.find((choice) => choice.id === attempt.selectedChoiceId)!.explanation,
  );
  await page.setViewportSize({ width: 1440, height: 1400 });
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: 'qa/screenshots/course-practice-desktop.png' });
  await card.locator('form').evaluate((form) => (form as HTMLFormElement).requestSubmit());
  expect((await saved(page)).conceptAttempts).toHaveLength(1);
  expect((await saved(page)).learningActivity).toMatchObject({
    id,
    href: '/algorithms/logistic-regression/practice/#concept-practice',
  });
  await page.reload();
  card = page.locator(`[data-concept-practice="${id}"]`);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toContainText('Incorrect');
  expect((await saved(page)).assessmentSessions![id].choiceOrders).toEqual(session.choiceOrders);
  await card.getByRole('button', { name: 'Try this question again' }).click();
  await answer(page, card, true);
  await expect(card).toContainText('Correct with help or prior practice');
  const progress = await saved(page);
  expect(progress.conceptAttempts).toHaveLength(2);
  expect(progress.conceptAttempts![1]).toMatchObject({
    status: 'correct',
    independent: false,
    firstSubmission: false,
  });
  expect(progress.assessmentSessions![id].items[question.id].firstCorrect).toBe(false);
  await card.getByRole('button', { name: 'Next question →' }).click();
  await expect(card).toContainText('Question 2 of');
  expect((await saved(page)).learningActivity?.title).toContain('Question 2');
  expect(errors).toEqual([]);
});

test('a hint remains recorded when the learner refreshes before answering', async ({ page }) => {
  let card = await practice(page);
  const { id } = await current(page, card);
  await card.getByRole('button', { name: 'Get a hint', exact: true }).click();
  await expect(card.locator('.hint')).toBeVisible();
  await page.reload();
  card = page.locator(`[data-concept-practice="${id}"]`);
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.hint')).toBeVisible();
  await answer(page, card, true);
  await expect(card).toContainText('Correct with help or prior practice');
  expect(
    (await saved(page)).conceptAttempts!.find((attempt) => attempt.status === 'correct')
      ?.independent,
  ).toBe(false);
});

test('checkpoints balance all four dimensions and save the score after eight sequential answers', async ({
  page,
}) => {
  await page.goto('/algorithms/logistic-regression/defend/#checkpoint');
  await page.getByRole('tab', { name: /Check understanding/ }).click();
  const card = page.locator('#checkpoint .concept-practice');
  await card.scrollIntoViewIfNeeded();
  const { id, session } = await current(page, card);
  expect(session.questionIds).toHaveLength(8);
  for (const dimension of ['definition', 'mechanism', 'calculation', 'application']) {
    expect(
      session.questionIds.filter(
        (id) => topic.questions.find((question) => question.id === id)?.dimension === dimension,
      ),
    ).toHaveLength(2);
  }
  for (let i = 0; i < 8; i++) {
    await answer(page, card, true);
    await card
      .getByRole('button', { name: i === 7 ? 'See my results' : 'Next question →', exact: true })
      .click();
  }
  await expect(card).toContainText('Checkpoint passed');
  await expect(card).toContainText('8 of 8 first answers correct');
  expect((await saved(page)).conceptCheckpoints?.[topic.id].score).toBe(1);
  expect((await saved(page)).checkpoints['logistic-regression']).toBeUndefined();
  expect((await saved(page)).assessmentSessions![id].score).toBe(1);
  expect((await saved(page)).learningActivity?.href).toBe(
    '/algorithms/logistic-regression/defend/#checkpoint',
  );
  await expect(card.locator('.dimension-results li')).toHaveCount(4);
});

test('partial calculation and cell drafts survive refresh without marking answers complete', async ({
  page,
}) => {
  await page.goto('/exercises/A01/');
  let card = page.locator('#exercise-A01-practice');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute('ssr', '');
  await card.locator('input').first().fill('12/');
  await expect
    .poll(async () => (await saved(page)).exerciseDrafts?.['A01:practice:1']?.answers.z)
    .toBe('12/');
  await page.reload();
  card = page.locator('#exercise-A01-practice');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('input').first()).toHaveValue('12/');
  expect((await saved(page)).exerciseSteps['A01:1']).toBeUndefined();
  await page.goto('/exercises/M01/');
  card = page.locator('#exercise-M01-practice');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute('ssr', '');
  await card.locator('.cell-input').nth(2).fill('20');
  await page.reload();
  card = page.locator('#exercise-M01-practice');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.cell-input').nth(2)).toHaveValue('20');
  await expect(card.locator('.cell-input').nth(1)).toHaveValue('');
  expect((await saved(page)).exerciseSteps['M01:1']).toBeUndefined();
});

test('choices and feedback fit a phone and support keyboard selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const card = await practice(page);
  await card.locator('input[type="radio"]').first().focus();
  await page.keyboard.press('Space');
  await card.getByRole('button', { name: 'Check answer', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(card.locator('.practice-feedback[role="status"]')).toBeVisible();
  await card.screenshot({ path: 'qa/screenshots/course-practice-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('storage failure leaves practice usable and exports the in-memory answers', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('Storage is full');
    };
  });
  const card = await practice(page);
  await expect(card).toContainText('could not save practice');
  const selected = card.locator('input[type="radio"]').first();
  await selected.check();
  await card.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(card.locator('.practice-feedback')).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await card.getByRole('button', { name: 'Export this practice', exact: true }).click();
  const file = await downloaded;
  const backup = JSON.parse(await readFile((await file.path())!, 'utf8')) as Progress;
  expect(backup.version).toBe(1);
  expect(backup.conceptAttempts).toHaveLength(1);
  expect(
    Object.values(backup.assessmentSessions!)[0].items[backup.conceptAttempts![0].questionId]
      .checked,
  ).toBe(true);
});
