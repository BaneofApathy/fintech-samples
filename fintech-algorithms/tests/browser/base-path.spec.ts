import { expect, test, type Locator, type Page } from '@playwright/test';
import { algorithmTopics } from '../../src/data/algorithm-course';
import { foundationTopics } from '../../src/data/foundation-course';
import { measureTopics } from '../../src/data/measure-course';
import type { TeachingTopic } from '../../src/data/teaching-types';
import type { Progress } from '../../src/engine/progress';

// The same smoke test runs at / normally and at /course/ against an isolated build.
const base = (process.env.COURSE_TEST_BASE_PATH ?? '/').replace(/\/$/, '') + '/';
const route = (path = '') => base + path.replace(/^\//, '');
const storageKey = 'usf-fintech-progress-v1';
const saved = (page: Page): Promise<Progress> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);

async function checkWrong(page: Page, card: Locator, topic: TeachingTopic) {
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('input[type="radio"]')).toHaveCount(3);
  const sessionId = (await card.getAttribute('data-concept-practice'))!;
  await expect.poll(async () => (await saved(page)).assessmentSessions?.[sessionId]?.index).toBe(0);
  const session = (await saved(page)).assessmentSessions![sessionId];
  const question = topic.questions.find((item) => item.id === session.questionIds[0])!;
  const choice = question.choices.find((item) => item.id !== question.correctChoiceId)!;
  await card.locator(`input[value="${choice.id}"]`).check();
  await card.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(card).toContainText(choice.explanation);
  await expect(card).toContainText(question.explanation);
  return { sessionId, question };
}

test('representative course pages keep navigation, island scripts, and loaded assets within the deployment path', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  const failed: string[] = [];
  const outside: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (new URL(response.url()).origin === new URL(page.url()).origin && response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' && !url.pathname.startsWith(base)) outside.push(url.pathname);
  });
  for (const path of [
    '',
    'algorithms/logistic-regression/intuition/',
    'algorithms/logistic-regression/practice/',
    'measures/recall/',
    'foundations/notation/',
    'glossary/',
    'progress/',
  ]) {
    const response = await page.goto(route(path));
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1').first()).toBeVisible();
    const bad = await page.locator('[href], [src], astro-island').evaluateAll(
      (elements, prefix) =>
        elements.flatMap((element) =>
          ['href', 'src', 'component-url', 'renderer-url'].flatMap((key) => {
            const value = element.getAttribute(key);
            return value?.startsWith('/') && !value.startsWith(prefix) ? [`${key}=${value}`] : [];
          }),
        ),
      base,
    );
    expect(bad, path || 'home').toEqual([]);
    await expect(page.locator('astro-island[client="load"][ssr]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(outside).toEqual([]);
  // A strict mount catches accidental /_astro or /foundations links.
  if (base !== '/') expect((await request.get('/')).status()).toBe(404);
});

test('algorithm prerequisites and guided explanation review links resolve under the deployment path', async ({
  page,
}) => {
  const topic = algorithmTopics.find((item) => item.slug === 'logistic-regression')!;
  await page.goto(route('algorithms/logistic-regression/intuition/'));
  const prerequisite = page.locator('.prerequisite-links a').first();
  const prerequisiteHref = (await prerequisite.getAttribute('href'))!;
  expect(prerequisiteHref).toMatch(new RegExp(`^${base}foundations/`));
  await prerequisite.click();
  await expect(page).toHaveURL(new RegExp(prerequisiteHref + '$'));
  await expect(page.locator('.teaching-lesson')).toHaveCount(4);
  await page.goto(route('algorithms/logistic-regression/intuition/'));
  const card = page.locator('.teaching-lesson .concept-practice').first();
  const { sessionId, question } = await checkWrong(page, card, topic);
  const review = card.getByRole('link', { name: 'Review this lesson →' });
  const reviewHref = (await review.getAttribute('href'))!;
  expect(reviewHref).toBe(
    route('algorithms/logistic-regression/intuition/') +
      '#' +
      encodeURIComponent(question.lessonId),
  );
  const activity = (await saved(page)).learningActivity;
  // The feedback focus may scroll the lesson into the reading position. Both
  // the question session and reading activity resume at this same lesson URL.
  expect([sessionId, `${topic.id}:${question.lessonId}`]).toContain(activity?.id);
  expect(activity).toMatchObject({
    href: route('algorithms/logistic-regression/intuition/') + '#' + question.lessonId,
  });
  await review.click();
  await expect(page.locator(`[id="${question.lessonId}"]`)).toBeVisible();
  await expect.poll(async () => (await saved(page)).learningActivity?.id).toBe(
    `${topic.id}:${question.lessonId}`,
  );
});

for (const kind of ['algorithm', 'measure', 'foundation'] as const) {
  test(`${kind} practice saves and follows a prefixed exact resume URL with its query and explanation anchor`, async ({
    page,
  }) => {
    const topic =
      kind === 'algorithm'
        ? algorithmTopics.find((item) => item.slug === 'logistic-regression')!
        : kind === 'measure'
          ? measureTopics.find((item) => item.slug === 'recall')!
          : foundationTopics.find((item) => item.slug === 'notation')!;
    const path =
      kind === 'algorithm'
        ? 'algorithms/logistic-regression/practice/'
        : `${kind === 'measure' ? 'measures' : 'foundations'}/${topic.slug}/`;
    const anchor = kind === 'measure' ? 'practice' : 'concept-practice';
    const practiceUrl = route(path) + '?from=logistic-regression';
    await page.goto(practiceUrl);
    let card = page.locator('#concept-practice .concept-practice');
    const { sessionId, question } = await checkWrong(page, card, topic);
    const resumeHref = practiceUrl + '#' + anchor;
    expect((await saved(page)).learningActivity).toMatchObject({ id: sessionId, href: resumeHref });
    const reviewHref = (await card
      .getByRole('link', { name: 'Review this lesson →' })
      .getAttribute('href'))!;
    expect(reviewHref.startsWith(base)).toBe(true);
    expect(decodeURIComponent(reviewHref.split('#')[1])).toBe(question.lessonId);
    const lessonResponse = await page.request.get(reviewHref.split('#')[0]);
    expect(lessonResponse.status()).toBe(200);
    expect(await lessonResponse.text()).toContain(`id="${question.lessonId}"`);

    for (const destination of ['progress/', '']) {
      await page.goto(route(destination));
      const resume = page.getByRole('link', { name: 'Continue learning →', exact: true });
      await expect(resume).toHaveAttribute('href', resumeHref);
      const review = page.locator('.next-reviews a').first();
      const objectiveReviewHref = (await review.getAttribute('href'))!;
      expect(objectiveReviewHref.startsWith(base)).toBe(true);
      expect(decodeURIComponent(objectiveReviewHref.split('#')[1])).toBe(question.lessonId);
      await resume.click();
      await expect(page).toHaveURL(new RegExp(`\\?from=logistic-regression#${anchor}$`));
      card = page.locator(`[data-concept-practice="${sessionId}"]`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toContainText('Incorrect');
      expect((await saved(page)).assessmentSessions![sessionId].items[question.id].checked).toBe(
        true,
      );
    }
  });
}

test('glossary filtering keeps explanatory lesson links under the deployment path', async ({
  page,
}) => {
  await page.goto(route('glossary/'));
  await page.locator('#concept-filter').fill('sigmoid');
  const visible = page.locator('.concept-glossary-entry:visible');
  await expect(visible.first()).toBeVisible();
  const link = visible.first().getByRole('link');
  const href = (await link.getAttribute('href'))!;
  expect(href.startsWith(route('algorithms/'))).toBe(true);
  const lessonId = decodeURIComponent(href.split('#')[1]);
  await link.click();
  await expect(page.locator(`[id="${lessonId}"]`)).toBeVisible();
});
