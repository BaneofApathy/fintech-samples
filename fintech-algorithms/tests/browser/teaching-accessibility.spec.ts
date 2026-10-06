import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { algorithmTopics } from '../../src/data/algorithm-course';
import { foundationTopics } from '../../src/data/foundation-course';
import { measureTopics } from '../../src/data/measure-course';
import type { PracticeQuestion } from '../../src/data/teaching-types';
import type { AssessmentSession } from '../../src/engine/assessment';

const questions = [...algorithmTopics, ...foundationTopics, ...measureTopics].flatMap(
  (topic) => topic.questions,
);
const errors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
});
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]));

async function activity(page: Page, path: string, guided = false) {
  await page.goto(path);
  const card = guided
    ? page.locator('.teaching-lesson .concept-practice').first()
    : page.locator('#concept-practice .concept-practice');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('input[type="radio"]').first()).toBeVisible();
  return card;
}

async function currentQuestion(page: Page, card: Locator): Promise<PracticeQuestion> {
  const sessionId = (await card.getAttribute('data-concept-practice'))!;
  const session = await page.evaluate((id) => {
    const saved = JSON.parse(localStorage.getItem('usf-fintech-progress-v1') || '{}');
    return saved.assessmentSessions[id] as AssessmentSession;
  }, sessionId);
  return questions.find((question) => question.id === session.questionIds[session.index])!;
}

async function keyboardAnswer(page: Page, card: Locator, correct: boolean) {
  const question = await currentQuestion(page, card);
  const choice = correct
    ? question.correctChoiceId
    : question.choices.find((choice) => choice.id !== question.correctChoiceId)!.id;
  // Enter the radio group, then use native keyboard selection and tab to its next action.
  const radio = card.locator(`input[type="radio"][value="${choice}"]`);
  await radio.focus();
  await page.keyboard.press('Space');
  await expect(radio).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(card.getByRole('button', { name: 'Check answer', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const feedback = card.locator('.practice-feedback');
  await expect(feedback).toBeFocused();
  await expect(feedback).toHaveAttribute('role', 'status');
  await expect(feedback).toHaveAttribute('aria-live', 'polite');
  await expect(feedback).toHaveAttribute('aria-atomic', 'true');
  await expect(feedback).toContainText(question.explanation);
  await expect(feedback).toHaveAccessibleName(
    correct ? 'Correct' : 'Incorrect',
  );
  return question;
}

for (const path of [
  '/foundations/probability/',
  '/measures/precision/',
  '/algorithms/logistic-regression/practice/',
]) {
  test(`keyboard feedback, retry, and next question ${path}`, async ({ page }) => {
    const card = await activity(page, path);
    const question = await keyboardAnswer(page, card, false);
    await page.keyboard.press('Tab');
    await expect(card.getByRole('link', { name: 'Review this lesson →' })).toBeFocused();
    await page.keyboard.press('Tab');
    const otherChoices = card.getByText('Understand the other choices', { exact: true });
    await expect(otherChoices).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.locator('details')).toHaveAttribute('open', '');
    for (const choice of question.choices) {
      await expect(card.locator('details')).toContainText(choice.explanation);
    }
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Try this question again' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.locator('legend')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(card.locator('input[type="radio"]').first()).toBeFocused();
    await keyboardAnswer(page, card, true);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(card.getByRole('button', { name: 'Next question →' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.locator('legend')).toBeFocused();
    await expect(card.locator('.practice-position')).toContainText('Question 2 of');
    await page.keyboard.press('Tab');
    await expect(card.locator('input[type="radio"]').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(card.locator('input[type="radio"]').nth(1)).toBeFocused();
    await expect(card.locator('input[type="radio"]').nth(1)).toBeChecked();
  });
}

test('a guided question focuses its completed results and starts again by keyboard', async ({
  page,
}) => {
  const card = await activity(page, '/foundations/probability/', true);
  await keyboardAnswer(page, card, true);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(card.getByRole('button', { name: 'See my results' })).toBeFocused();
  await page.keyboard.press('Enter');
  const result = card.locator('.practice-result');
  await expect(result).toBeFocused();
  await expect(result).toHaveAccessibleName('Practice complete');
  await expect(result).toHaveAttribute('role', 'status');
  await expect(result).toHaveAttribute('aria-live', 'polite');
  await expect(result).toHaveAttribute('aria-atomic', 'true');
  await expect(result).toContainText('1 of 1 first answers correct');
  await page.keyboard.press('Tab');
  await expect(card.getByRole('button', { name: 'Start another practice session' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card.locator('legend')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card.locator('input[type="radio"]').first()).toBeFocused();
});

test('hints and explanations receive focus and polite live announcements', async ({ page }) => {
  const card = await activity(page, '/measures/precision/');
  await card.locator('input[type="radio"]').first().focus();
  await page.keyboard.press('Tab');
  await expect(card.getByRole('button', { name: 'Get a hint', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const hint = card.locator('.hint');
  await expect(hint).toBeFocused();
  await expect(hint).toHaveAttribute('role', 'status');
  await expect(hint).toHaveAttribute('aria-live', 'polite');
  await expect(hint).toHaveAttribute('aria-atomic', 'true');
  await expect(hint).toContainText((await currentQuestion(page, card)).hint);
  await page.keyboard.press('Shift+Tab');
  await expect(card.getByRole('button', { name: 'Show explanation', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card.locator('.practice-feedback')).toBeFocused();
  await expect(card.locator('.practice-feedback')).toHaveAccessibleName('Worked explanation');
  await expect(card.locator('.practice-feedback')).toContainText(
    (await currentQuestion(page, card)).explanation,
  );
});

const layouts = [
  { name: '320px', width: 320, textScale: 1 },
  { name: '200% text', width: 1280, textScale: 2 },
  { name: '320px and 200% text', width: 320, textScale: 2 },
];
for (const path of [
  '/foundations/vectors/',
  '/measures/precision/',
  '/measures/fairness-measures/',
]) {
  for (const layout of layouts) {
    test(`teaching content reflows at ${layout.name} ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: layout.width, height: 900 });
      await page.goto(path);
      const definition = page.locator('.teaching-definition');
      const original = await definition.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      if (layout.textScale === 2) {
        await page.evaluate(() => {
          const root = document.documentElement;
          root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * 2}px`;
        });
        const resized = await definition.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        );
        expect(resized).toBeCloseTo(original * 2, 1);
      }
      const additionalTerms = page.locator('.topic-vocabulary summary');
      if (await additionalTerms.count()) await additionalTerms.click();
      for (const terms of await page.locator('.teaching-terms').all()) {
        await expect(terms).toBeVisible();
      }
      const card = page.locator('#concept-practice .concept-practice');
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('input[type="radio"]').first()).toBeVisible();
      await keyboardAnswer(page, card, false);
      await card.locator('.practice-feedback summary').click();
      // Formulas/tables may scroll inside their dedicated wrappers; the page and question text may not.
      const pageLayout = await page.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
        overflowing: [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && (box.right > innerWidth + 1 || box.left < -1);
          })
          .slice(0, 30)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.slice(0, 80),
            width: el.getBoundingClientRect().width,
            right: el.getBoundingClientRect().right,
            overflow: getComputedStyle(el).overflowX,
          })),
      }));
      expect(pageLayout.width, JSON.stringify(pageLayout)).toBeLessThanOrEqual(
        pageLayout.viewport + 1,
      );
      const headerControls = await page.locator('.header-controls').evaluate((el) => {
        const box = el.getBoundingClientRect();
        return { left: box.left, right: box.right, viewport: innerWidth };
      });
      expect(headerControls.left).toBeGreaterThanOrEqual(0);
      expect(headerControls.right).toBeLessThanOrEqual(headerControls.viewport);
      const clipped = await page
        .locator('.practice-choice span, .practice-feedback, .teaching-definition')
        .evaluateAll((elements) =>
          elements
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => ({
              text: el.textContent?.slice(0, 100),
              width: el.clientWidth,
              scroll: el.scrollWidth,
            })),
        );
      expect(clipped).toEqual([]);
      await expect(card.getByRole('button', { name: 'Try this question again' })).toBeEnabled();
      await expect(card.getByRole('button', { name: 'Next question →' })).toBeEnabled();
    });
  }
}

for (const path of [
  '/foundations/logarithms/',
  '/measures/precision/',
  '/measures/fairness-measures/',
  '/algorithms/logistic-regression/practice/',
]) {
  test(`dark teaching and feedback accessibility ${path}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('course-theme', 'dark'));
    const card = await activity(page, path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await keyboardAnswer(page, card, false);
    await card.locator('.practice-feedback summary').click();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
    const focus = await card
      .locator('input[type="radio"]')
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el.closest('label')!);
        return style.color;
      });
    expect(focus).not.toBe('rgba(0, 0, 0, 0)');
  });
}
