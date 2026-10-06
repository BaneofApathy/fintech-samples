import { test, expect, type Locator, type Page } from '@playwright/test';
import { financialCases, financialCaseHref } from '../../src/data/financial-cases';
import { algorithmTopics } from '../../src/data/algorithm-course';

async function authoredCheckpointReasoning(page: Page, slug: string, keyIdeas: RegExp[]) {
  const topic = algorithmTopics.find(topic => topic.slug === slug)!;
  await page.goto(`/algorithms/${slug}/defend/#checkpoint`);
  await page.locator('#activity-tab-checkpoint').click();
  const checkpoint = page.locator('#checkpoint .concept-practice');
  await checkpoint.scrollIntoViewIfNeeded();
  const sessionId = `${topic.id}:checkpoint`;
  const savedSession = () => page.evaluate(id => JSON.parse(localStorage.getItem('usf-fintech-progress-v1') || '{}').assessmentSessions?.[id], sessionId);
  await expect.poll(async () => (await savedSession())?.questionIds).toHaveLength(8);
  const ids: string[] = (await savedSession()).questionIds;
  expect(new Set(ids).size).toBe(8);
  for (const dimension of ['definition', 'mechanism', 'calculation', 'application']) {
    expect(ids.filter(id => topic.questions.find(question => question.id === id)?.dimension === dimension)).toHaveLength(2);
  }
  const feedbackText: string[] = [];
  for (const [index, id] of ids.entries()) {
    const question = topic.questions.find(question => question.id === id)!;
    expect(question.role).not.toBe('guided');
    await expect(checkpoint).toContainText(`Question ${index + 1} of 8`);
    await expect(checkpoint.locator('legend')).toHaveText(question.prompt);
    await expect(checkpoint.locator('input[type="radio"]')).toHaveCount(question.choices.length);
    await expect(checkpoint.locator('.practice-feedback')).toHaveCount(0);
    const misconception = question.choices.find(choice => choice.id !== question.correctChoiceId)!;
    await checkpoint.locator(`input[type="radio"][value="${misconception.id}"]`).check();
    await checkpoint.getByRole('button', { name: 'Check answer', exact: true }).click();
    const feedback = checkpoint.locator('.practice-feedback');
    await expect(feedback).toContainText(misconception.explanation);
    await expect(feedback).toContainText(question.explanation);
    await expect(feedback).toContainText(question.choices.find(choice => choice.id === question.correctChoiceId)!.text);
    await expect(feedback.getByRole('link', { name: 'Review this lesson →' })).toHaveAttribute('href', new RegExp(`#${encodeURIComponent(question.lessonId)}$`));
    await feedback.getByText('Understand the other choices', { exact: true }).click();
    for (const choice of question.choices) await expect(feedback).toContainText(choice.explanation);
    feedbackText.push(await feedback.innerText());
    await checkpoint.getByRole('button', { name: index === 7 ? 'See my results' : 'Next question →', exact: true }).click();
  }
  for (const idea of keyIdeas) expect(feedbackText.join(' ')).toMatch(idea);
  await expect(checkpoint).toContainText('0 of 8 first answers correct');
  await expect(checkpoint.locator('.dimension-results li')).toHaveCount(4);
}

// Retained explorers can be below detailed lessons or inside optional notes.
async function readyActivity(target: Locator) {
  const closed = target.locator('xpath=ancestor::details[not(@open)]');
  for (const disclosure of await closed.all()) await disclosure.locator(':scope > summary').click();
  await target.scrollIntoViewIfNeeded();
  const island = target.locator('xpath=ancestor::astro-island[1]');
  if (await island.count()) await expect(island).not.toHaveAttribute('ssr', '');
}


const exercises = [
  ['A01', 5, 3],
  ['A03', 8, 1],
  ['A05', 3, 1],
  ['A06', 8, 1],
  ['A07', 5, 1],
  ['A08', 5, 3],
  ['A09', 2, 3],
  ['A10', 6, 4],
  ['A11', 6, 2],
  ['A12', 6, 2],
  ['S03', 6, 2],
  ['S04', 6, 1],
  ['M04', 6, 2],
  ['M05', 7, 2],
  ['M06', 4, 2],
  ['M07', 3, 2],
] as const;

for (const [id, steps, formulas] of exercises) {
  test(`${id} renders authored step reasoning and one explanation with local symbols per formula`, async ({ page }) => {
    await page.goto(`/exercises/${id}/`);
    const worked = page.locator(`#exercise-${id}-worked`);
    await expect(worked).toBeVisible();
    await expect(worked.locator('.step-reason')).toHaveCount(steps);
    await expect(worked.locator('.step-reason').filter({ hasText: 'explanation pending' })).toHaveCount(0);
    const formulaBlocks = page.locator('.formula-block');
    await expect(formulaBlocks).toHaveCount(formulas);
    await expect(formulaBlocks.locator('.read-aloud')).toHaveCount(formulas);
    await expect(formulaBlocks.locator('.symbol-key')).toHaveCount(formulas);
    await expect(page.locator('.editorial-pending')).toHaveCount(0);
  });
}

for (const [slug, expected] of [['logistic-regression', 'At z = 0 the probability is 50%'], ['gradient-boosting', 'A smaller η makes this step more cautious.']] as const) {
  test(`${slug} presents its authored lesson formula and visible local symbol key`, async ({ page }) => {
    await page.goto(`/algorithms/${slug}/intuition/`);
    await page.getByText('Additional method notes', { exact: true }).click();
    const formulas = page.locator('.optional-exploration .lesson-section .formula-block');
    await expect(formulas).toHaveCount(1);
    await expect(formulas.locator('.read-aloud')).toBeVisible();
    await expect(formulas.locator('.symbol-key')).toBeVisible();
    await expect(formulas).toContainText(expected);
  });
}

test('A01 explains its real input units and worked loss reasoning', async ({ page }) => {
  await page.goto('/exercises/A01/');
  const worked = page.locator('#exercise-A01-worked');
  await expect(worked).toContainText('log-odds score');
  await expect(worked).toContainText('enter 35 for 35%');
  await expect(worked).toContainText('enter 60 for $60,000');
  await expect(worked.locator('.worked-reasoning')).toContainText('does not mean this applicant will cost exactly $399');
  await expect(worked.locator('.worked-arithmetic')).toContainText('The first number is conditional loss');
  await expect(worked.locator('.worked-arithmetic')).toContainText('Compare 9.975% with the 8% review cutoff');
});

test('logistic-regression worked example distinguishes estimate, action, and assumptions', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/worked/');
  await expect(page.locator('main')).toContainText('42% of their available revolving credit');
  await expect(page.locator('main')).toContainText('this example’s policy sends the application to a person for review');
  await expect(page.locator('main')).toContainText('not universal lending rules');
});

test('logistic-regression cost lesson explains its counts, review band, and held-out test set', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/measures/');
  await expect(page.locator('main')).toContainText('A threshold t is a chosen probability cutoff');
  await expect(page.locator('main')).toContainText('Nreview is the number of applications in that middle range');
  await expect(page.locator('main')).toContainText('leave the separate test set untouched');
});

test('sigmoid explorer isolates threshold effects while applicant inputs stay fixed', async ({ page }) => {
  await page.goto('/explorers/sigmoid-el/');
  const widget = page.locator('[data-widget="sigmoid-el"]');
  await readyActivity(widget);
  await expect(widget).toContainText('If the applicant stays the same');
  await expect(widget).toContainText('Keep every applicant detail fixed');
  await expect(widget).toContainText('probability estimate, expected loss, review decision');
  const riskBefore = await widget.locator('[data-readout="p"]').innerText();
  const lossBefore = await widget.locator('[data-readout="EL"]').innerText();
  await widget.locator('input[type="range"][aria-label*="Review cutoff"]').evaluate((input: HTMLInputElement) => {
    input.value = '0.12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(widget.locator('.live-interpretation')).toContainText('Changing only the threshold');
  await expect(widget.locator('[data-readout="p"]')).toHaveText(riskBefore);
  await expect(widget.locator('[data-readout="EL"]')).toHaveText(lossBefore);
});

test('logistic-regression walkthrough explains each stage and advances the same applicant', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/intuition/');
  const visual = page.locator('[data-visual-id="algorithm-logistic-regression"]');
  await readyActivity(visual);
  await expect(visual).toContainText('DTI is entered in percentage points');
  await expect(visual).toContainText('The score can be negative; it is not yet a probability');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('zero becomes 0.50 (a 50% chance)');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('does not include how likely default is');
});

test('logistic-regression checkpoints explain their answer and time boundary', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'logistic-regression', [/log-odds/i, /training/i, /Calibration/]);
});

test('A03 distinguishes fixed-tree arithmetic from retraining and teaches its units', async ({ page }) => {
  await page.goto('/exercises/A03/');
  const worked = page.locator('#exercise-A03-worked');
  await expect(worked).toContainText('already-fitted tree corrections');
  await expect(worked).toContainText('0.18 (18%) review cutoff');
  await expect(worked).toContainText('Starting log-odds score (before either tree)');
  await expect(worked).toContainText('fraction of each tree correction added');
  await expect(worked).toContainText('Review cutoff (probability from 0 to 1; 0.18 = 18%)');
  await expect(worked).toContainText('the same score correction can move probabilities by different amounts');
  await expect(worked.locator('.worked-arithmetic')).toContainText('The trees contribute in sequence');
  await expect(worked.locator('.worked-arithmetic')).toContainText('The lower cutoff outcome does not prove that 0.25 is the best training choice');
});

test('portfolio walkthrough explains feasibility before risk and the explorer responds to allocation changes', async ({ page }) => {
  await page.goto('/algorithms/optimization/intuition/');
  const visual = page.locator('[data-visual-id="algorithm-optimization"]');
  await readyActivity(visual);
  await expect(visual).toContainText('Each point is one of the stock shares allowed');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('Multiply each asset’s estimated return by its share');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('miss the required estimated return');

  await page.goto('/explorers/portfolio-feasible/');
  const widget = page.locator('[data-widget="portfolio-feasible"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The bond share automatically becomes the remainder');
  const point = widget.locator('svg[aria-label*="Expected portfolio return"] circle');
  const before = await point.getAttribute('cx');
  const slider = widget.locator('#stock-weight');
  await slider.evaluate((input: HTMLInputElement) => {
    input.value = '0.6';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(point).not.toHaveAttribute('cx', before ?? '');
});

test('reinforcement-learning walkthrough and execution supplements explain update and tail controls', async ({ page }) => {
  await page.goto('/algorithms/reinforcement-learning/intuition/');
  const visual = page.locator('[data-visual-id="algorithm-reinforcement-learning"]');
  await readyActivity(visual);
  await expect(visual).toContainText('Compare the next actions’ estimated values');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('discount factor');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('temporal-difference error');

  for (const [id, expected] of [['S03', 'that amount is a comparison, not a cash fee'], ['S04', 'does not change any order’s cost']] as const) {
    await page.goto(`/exercises/${id}/`);
    const supplement = page.locator(`[data-supplement-visual="${id}"]`);
    await expect(supplement).toContainText(expected);
    if (id === 'S03') {
      const before = await supplement.locator('.visual-readouts').innerText();
      await supplement.locator('input[type="number"]').fill('50.4');
      await expect(supplement.locator('.visual-readouts')).not.toHaveText(before);
    } else {
      const before = await supplement.locator('.visual-readouts').innerText();
      await supplement.locator('select').selectOption('0.3');
      await expect(supplement.locator('.visual-readouts')).not.toHaveText(before);
    }
    await supplement.getByRole('button', { name: 'Explain the change' }).click();
    await expect(supplement.locator('.visual-feedback')).toBeVisible();
  }
});

test('execution-update explorer explains reward units and recalculates when reward changes', async ({ page }) => {
  await page.goto('/explorers/execution-update/');
  const widget = page.locator('[data-widget="execution-update"]');
  await readyActivity(widget);
  await expect(widget).toContainText('Change the immediate reward to change the target');
  await expect(widget).toContainText('reward units');
  const before = await widget.locator('[data-readout="updated"]').innerText();
  await widget.locator('input[type="number"][aria-label="Immediate reward"]').fill('-5');
  await expect(widget.locator('[data-readout="updated"]')).not.toHaveText(before);
});

test('U02-B tree and forest cases explain all applicant, timing, and forest-score states', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'trees-and-forests').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await expect(page.locator('.visual-takeaway')).toContainText('does not prove fraud');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Exactly 0.60');
});

test('U02-C tree and forest cases explain queue capacity, review evidence, and feature quality', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'trees-and-forests').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await expect(page.locator('.visual-takeaway')).toContainText('Expected receipts are estimates');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('A tree only directs the claim to review');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('small supplied example');
});

test('U02-D forest lab and defense explain ranking, rare outcomes, and evidence limits', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ has: page.getByRole('heading', { name: 'Decision trees and random forests' }) });
  await expect(card).toContainText('about 3 in every 100 rows');
  await expect(card).toContainText('Twenty cases make a small sample');
  await expect(card).toContainText('test-set positive share as a reference');
  await page.goto('/algorithms/trees-and-forests/defend/');
  await expect(page.locator('main')).toContainText('What evidence would show that this makes the ranking more dependable');
  await expect(page.locator('main')).toContainText('accidentally reveals a later outcome');
});

test('U03-B boosting cases explain later periods, unknown outcomes, ranking, and calibration gaps', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'gradient-boosting').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('misses 2 more defaults');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('ties A');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('8 percentage points');
});

test('U03-C boosting cases explain collection objectives, group limits, prices, and cash-flow timing', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'gradient-boosting').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await expect(page.locator('.visual-takeaway')).toContainText('payment chance');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('does not change the claim-risk estimate');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('later receipt cannot be used');
});

test('U03-D boosting lab and defense distinguish ranking, probability error, and action costs', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ has: page.getByRole('heading', { name: 'Gradient-Boosted Trees' }) });
  await expect(card).toContainText('About 8 in every 100 outcomes are positive');
  await expect(card).toContainText('these measures answer different questions');
  await page.goto('/algorithms/gradient-boosting/defend/');
  await expect(page.locator('main')).toContainText('What does that change not tell you about the accuracy of each borrower’s chance');
  await expect(page.locator('main')).toContainText('what extra operating work does boosting add');
});

test('U04-B K-means cases explain scaling, feature choice, portfolio shares, and row order', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'k-means').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('all four nearest neighbors change');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('60% of the whole portfolio');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await expect(page.locator('.visual-takeaway')).toContainText('adjacency count is only a visual aid');
});

test('U04-C K-means cases explain time profiles, normalization, transfer motifs, and peer distances', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'k-means').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('tenfold difference in dollars');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('needs an explanation from records');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('differ by 1');
});

test('U04-D K-means lab and defense explain scale, stability, and customer value', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ has: page.getByRole('heading', { name: 'Clustering / K-Means' }) });
  await expect(card).toContainText('five numeric dimensions');
  await expect(card).toContainText('Silhouette compares how close each row is to its own group');
  await expect(card).toContainText('lower always improves as groups are added');
  await page.goto('/algorithms/k-means/defend/');
  await expect(page.locator('main')).toContainText('What later-data or controlled test would show whether the proposed service still helps');
  await expect(page.locator('main')).toContainText('What customer need or measurable benefit would make this grouping worth maintaining');
});

test('U05-B anomaly cases explain isolation, fair references, and investigative limits', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'isolation-forest').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('not a probability of fraud');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$12,000');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('not proof someone took over');
});

test('U05-C anomaly cases explain documentation, refund rates, event context, and ledger evidence', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'isolation-forest').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('10.0 percentage points');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('2 of two context records');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('duplicated by $300');
});

test('U05-D Isolation Forest lab and defense distinguish synthetic flags from fraud evidence', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ has: page.getByRole('heading', { name: 'Isolation Forest' }) });
  await expect(card).toContainText('five rows designed to look unusual');
  await expect(card).toContainText('not confirmed fraud cases');
  await expect(card).toContainText('Both methods select ten rows');
  await page.goto('/algorithms/isolation-forest/defend/');
  await expect(page.locator('main')).toContainText('what evidence tells you the score is an unusualness ranking rather than a fraud chance');
  await expect(page.locator('main')).toContainText('ordinary financial activities that could look unusual');
  await expect(page.locator('main')).toContainText('which outcomes and error costs you would need to compare');
});

test('U06-B time-series cases explain cash buffers, backlogs, liquidity flows, and roll rates', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'time-series').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('positive result means cash remains unused');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('end-of-hour backlog is 0, 40, 60 requests');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$30k cash shortfall');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$200k moves into the 60-day bucket');
});

test('U06-C time-series cases explain workload timing, fee mix, ATM replenishment, and volatility', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'time-series').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('no queue remains');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('500 × $0.20 + 500 × $0.80 = $500');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('−$40k represents unmet demand');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('volatility falls more slowly');
});

test('U06-D time-series lab and defense explain held-back dates, forecast error, and interval limits', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'fictional daily values beginning January 1, 2025' });
  await expect(card).toContainText('first 337 days are training history');
  await expect(card).toContainText('MAE (mean absolute error) averages the size of the forecast misses');
  await expect(card).toContainText('repeat the last seven values observed during training');
  await page.goto('/algorithms/time-series/defend/');
  await expect(page.locator('main')).toContainText('what limits a check based on only 28 days');
  await expect(page.locator('main')).toContainText('assign extra cost to under-forecasting');
});

test('U07-B graph cases explain directed transfers, conflicting identity clues, and shared hubs', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'graph-methods').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('5 recorded transfers');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('1980 versus 1995');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$90 on A–B–D plus $180 on A–C–D is $270');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('do not establish account takeover');
});

test('U07-D graph lab and defense explain what links show and when they can be used', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'This teaching graph is written by hand' });
  await expect(card).toContainText('no transaction outcomes, dates, or fraud labels');
  await expect(card).toContainText('filter links by their recorded time');
  await page.goto('/algorithms/graph-methods/defend/');
  await expect(page.locator('main')).toContainText('Show which recorded relationship adds useful evidence');
  await expect(page.locator('main')).toContainText('Name one ordinary reason people could share that device');
  await expect(page.locator('main')).toContainText('two accounts connect to the same people or devices');
});

test('U07-C graph cases explain event windows, exposure stress, routes, and match cutoffs', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'graph-methods').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('25% of A’s $60m exposure is $15m');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('zero paths reach the destination');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('The true 0.60 pair is still missed');
});

test('U08-B text cases explain supplied sentiment, routing cutoffs, missing evidence, and exceptions', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'transformers').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('The word “not” reverses the meaning');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('below the 80% cutoff');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('classification does not verify identity');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Extract threshold, dates, and exception conditions together');
});

test('U08-C text cases distinguish guidance, topics, policy edits, and supported claims', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'transformers').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('a summary that drops that condition changes the claim');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await expect(page.locator('.case-result')).toContainText('More than one topic can fit an article');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Only the $12,000 external transfer remains covered: 1 of 3');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('($120m − $100m) ÷ $100m = 20%');
});

test('U08-D text lab separates its browser comparison model from native FinBERT', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'There are 12 hand-written training sentences' });
  await expect(card).toContainText('practice numbers, not evidence that the model understands finance');
  await expect(card).toContainText('Macro-F1 averages the F1 score for positive, neutral, and negative separately');
  await expect(card).toContainText('It does not download or run FinBERT');
  await page.goto('/algorithms/transformers/defend/');
  await expect(page.locator('main')).toContainText('classifier chooses a label');
  await expect(page.locator('main')).toContainText('loss narrowed');
  await expect(page.locator('main')).toContainText('test the mistake');
});

test('U09-B retrieval cases explain missing periods, dated policy versions, and evidence gaps', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'rag').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Do not calculate growth from one period');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('report the missing evidence');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('similar card procedure is not enough');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('does not replace the missing checklist item');
});

test('U09-C retrieval cases explain conflicting facts, prerequisites, amendments, and version consistency', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'rag').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('conflicting evidence');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('or authorize execution');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('three required pieces');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('version consistency');
});

test('U09-D retrieval lab defines its metrics and separates search from answer writing', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'The notebook uses four hand-written passages' });
  await expect(card).toContainText('TF-IDF gives more weight to words that help distinguish one passage');
  await expect(card).toContainText('relevant passages found divided by all relevant passages');
  await expect(card).toContainText('it does not generate an answer');
  await page.goto('/algorithms/rag/defend/');
  await expect(page.locator('main')).toContainText('point to the passage that supports it');
  await expect(page.locator('main')).toContainText('the answer invents a number');
});

test('U10-B optimization cases explain feasibility, cash floors, marginal returns, and route costs', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'optimization').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('report that the requirement is infeasible');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('floored at zero');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Marginal benefit curves');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('higher-cost feasible alternative');
});

test('U10-C optimization cases calculate haircuts, aggregate caps, funding cost, and skilled capacity', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'optimization').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('the shortfall is $10m');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$120k');
  await expect(page.locator('.case-result')).toContainText('$20k over');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Annual interest is $4.6m');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Two cases remain unassigned');
});

test('U10-D optimization lab explains assumptions, feasible weights, and input sensitivity', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'The four expected returns are assumed annual rates' });
  await expect(card).toContainText('not estimated from historical returns');
  await expect(card).toContainText('weights that add to 100%');
  await expect(card).toContainText('volatility, its square root');
  await expect(card).toContainText('Four 20% caps can add to only 80%');
  await page.goto('/algorithms/optimization/defend/');
  await expect(page.locator('main')).toContainText('quantity this allocation tries to minimize');
  await expect(page.locator('main')).toContainText('small change in an estimated return');
});

test('U11-B reinforcement cases explain execution cost, cash shocks, action limits, and expected reward', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'reinforcement-learning').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Total: $5.00');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('short by $10m');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('one blocked attempt');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('0.15 × $10 − $1 = $0.50');
});

test('U11-C reinforcement cases explain follow-up costs, blocked proposals, inventory, and timing cash', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'reinforcement-learning').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('Challenge costs $1 and manual review costs $5, for $6 total');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('request exceeds the $50k cap');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('2 + 1 − 0');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('a $5k shortfall');
});

test('U11-D reinforcement lab explains training, remaining inventory, comparison, and risk limits', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: '2,000 simulated practice episodes' });
  await expect(card).toContainText('Seed 5 fixes the random price changes');
  await expect(card).toContainText('Q-learning stores a score for each time and remaining-inventory situation');
  await expect(card).toContainText('TWAP (time-weighted average price), a simple rule');
  await expect(card).toContainText('A zero-noise evaluation is not a test of performance across real market conditions');
  await page.goto('/algorithms/reinforcement-learning/defend/');
  await expect(page.locator('main')).toContainText('Does the learning score count trading costs');
  await expect(page.locator('main')).toContainText('occasionally leave many shares unfilled');
});

test('U12-B Monte Carlo cases distinguish unchanged means, tail averages, payoffs, and paired deficits', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'monte-carlo').slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('2 ÷ 10 = 20%');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('averages the 2 losses beyond that cutoff');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('payoffs 0, 10, 30');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[1].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('2 of 3 scenarios have assets below liabilities (66.7%)');
});

test('U12-C Monte Carlo cases explain path minimums, capital floors, withdrawal outcomes, and drawdown', async ({ page }) => {
  test.setTimeout(60000);
  const cases = financialCases.filter((item) => item.algorithmSlug === 'monte-carlo').slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    await expect(page.locator('.visual-question')).toContainText(item.question);
    for (const frame of item.frames) {
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
  await page.goto(financialCaseHref(cases[0], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[0].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('The lowest is $30m, so compared with the $50m minimum the cushion is −$20m');
  await page.goto(financialCaseHref(cases[1], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[1].frames[0].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('2 of 4 fall below the fictional $10m minimum');
  await page.goto(financialCaseHref(cases[2], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[2].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('$20, 40, 70k');
  await expect(page.locator('.case-result')).toContainText('66.7%');
  await page.goto(financialCaseHref(cases[3], '/'));
  await readyActivity(page.locator('svg.case-scene'));
  await page.getByRole('button', { name: cases[3].frames[2].label, exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('70 → 90 → 120 gives 50%');
});

test('U12-D Monte Carlo lab distinguishes simulation wobble from assumption uncertainty', async ({ page }) => {
  await page.goto('/labs/');
  const card = page.locator('.lab-card').filter({ hasText: 'There are 1,000 equal loans and 2,500 simulated scenarios' });
  await expect(card).toContainText('default chance (PD) is 2.5%');
  await expect(card).toContainText('amount owed (EAD) is $10,000');
  await expect(card).toContainText('lost share after default (LGD) is 45%');
  await expect(card).toContainText('Standard error describes how much the fraction may wobble');
  await expect(card).toContainText('cannot validate the 2.5% default chance');
  await page.goto('/algorithms/monte-carlo/defend/');
  await expect(page.locator('main')).toContainText('random sampling wobble');
  await expect(page.locator('main')).toContainText('one million simulations');
});

test('Monte Carlo explorer separates changed assumptions from more simulation trials', async ({ page }) => {
  await page.goto('/explorers/monte-carlo-loss/');
  const widget = page.locator('[data-widget="monte-carlo-loss"]');
  await readyActivity(widget);
  await expect(widget).toContainText('while the balances, loss fractions, reserve, and number of trials stay fixed');
  await expect(widget).toContainText('without changing those assumptions');
  const before = await widget.locator('[data-readout="analytical"]').innerText();
  await widget.locator('input[type="number"][aria-label="Default probability per loan"]').fill('0.4');
  await expect(widget.locator('[data-readout="analytical"]')).not.toHaveText(before);
});

test('gradient-boosting walkthrough explains sequential updates and probability conversion', async ({ page }) => {
  await page.goto('/algorithms/gradient-boosting/intuition/');
  const visual = page.locator('[data-visual-id="algorithm-gradient-boosting"]');
  await readyActivity(visual);
  await expect(visual).toContainText('A smaller learning rate shrinks each fixed correction');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('adds only part of the proposed change');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('The first tree stays in the running total');
  await visual.getByRole('button', { name: 'Next →' }).click();
  await expect(visual).toContainText('negative scores to below 50%');
  await visual.locator('details.av-comparisons summary').click();
  const modes = visual.getByLabel('Build a prediction one correction at a time comparison');
  for (const mode of ['0', '1', '2', '3']) {
    await modes.selectOption(mode);
    await expect(modes).toHaveValue(mode);
  }
});

test('boosting explorer explains the fixed-output experiment and responds to a changed learning rate', async ({ page }) => {
  await page.goto('/explorers/boosting-steps/');
  const widget = page.locator('[data-widget="boosting-steps"]');
  await readyActivity(widget);
  await expect(widget).toContainText('How does changing the learning rate change the total correction');
  await expect(widget).toContainText('leaving the starting score and both supplied tree outputs fixed');
  await expect(widget).toContainText('a full retraining could also change what later trees learn');
  const before = await widget.locator('[data-readout="F2"]').innerText();
  await widget.locator('input[type="number"][aria-label*="Learning rate for the first"]').fill('0.25');
  await expect(widget.locator('[data-readout="F2"]')).not.toHaveText(before);
});

test('logistic-regression and boosting problem pages define inputs, costs, and intended action', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/');
  await expect(page.locator('main')).toContainText('details known when the application is made');
  await expect(page.locator('main')).toContainText('costs staff time and can delay the decision');
  await expect(page.locator('main')).toContainText('how many applications staff can review');
  await page.goto('/algorithms/logistic-regression/defend/');
  await page.locator('#activity-tab-defense').click();
  await page.locator('details.method-guidance summary').click();
  await expect(page.locator('main')).toContainText('The outcome is binary and measured over a defined period');
  await expect(page.locator('main')).toContainText('The available features have little predictive signal');
  await page.goto('/algorithms/gradient-boosting/');
  await expect(page.locator('main')).toContainText('later default outcomes used as training labels');
  await expect(page.locator('main')).toContainText('takes time to tune, explain, and monitor');
  await expect(page.locator('main')).toContainText('choose an action cutoff using the costs of mistakes');
  await page.goto('/algorithms/gradient-boosting/defend/');
  await page.locator('#activity-tab-defense').click();
  await page.locator('details.method-guidance summary').click();
  await expect(page.locator('main')).toContainText('A held-back validation period is large enough');
  await expect(page.locator('main')).toContainText('The held-back data are too small to distinguish real improvement');
});

test('gradient-boosting lesson teaches training, model comparison, and explanation limits', async ({ page }) => {
  await page.goto('/algorithms/gradient-boosting/intuition/');
  await expect(page.locator('main')).toContainText('A smaller rate takes a shorter step');
  await expect(page.locator('main')).toContainText('Other objectives use a loss-specific correction');
  await expect(page.locator('main')).toContainText('How many split decisions a tree can make');
  await page.goto('/algorithms/gradient-boosting/worked/');
  await expect(page.locator('main')).toContainText('Learn cleaning or scaling rules from training loans only');
  await expect(page.locator('main')).toContainText('Fit logistic regression and boosted trees using the same training loans');
  await expect(page.locator('main')).toContainText('Record the settings you tried');
  await expect(page.locator('main')).toContainText('same cutoff costs and staff review limit');
  await expect(page.locator('main')).toContainText('0.7 percentage points on the 0-to-1 AUC scale');
  await page.goto('/algorithms/gradient-boosting/measures/');
  await expect(page.locator('main')).toContainText('These describe how this model behaves; they do not prove that a feature caused default');
  await expect(page.locator('main')).toContainText('at least one case the model handled poorly');
});

test('gradient-boosting checkpoint explains metric trade-offs after submission', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'gradient-boosting', [/gradient/i, /held-back/i, /different properties/i]);
});

test('A05 explains path averages, score direction, and why the top case still needs investigation', async ({ page }) => {
  await page.goto('/exercises/A05/');
  const worked = page.locator('#exercise-A05-worked');
  await expect(worked).toContainText('Average paths for A, B and C: 2, 4, 6');
  await expect(worked).toContainText('anomaly scores: 0.70711, 0.5, 0.35355');
  await expect(worked).toContainText('does not mean there is a 70.71% chance of fraud');
  await expect(worked.locator('.step-reason')).toHaveCount(3);
  await expect(worked.locator('.step-reason').filter({ hasText: 'explanation pending' })).toHaveCount(0);
  await page.goto('/algorithms/isolation-forest/intuition/');
  const lessonFormula = page.locator('.lesson-section .formula-block');
  await expect(lessonFormula).toHaveCount(1);
  await expect(lessonFormula.locator('.read-aloud')).toContainText('A shorter average path makes the exponent less negative');
  await expect(lessonFormula.locator('.symbol-key')).toContainText('normalization value');
});

test('isolation-path explorer explains what stays fixed and how a changed path affects ranking', async ({ page }) => {
  await page.goto('/explorers/isolation-paths/');
  const widget = page.locator('[data-widget="isolation-paths"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The listed path lengths and normalization value stay fixed');
  await expect(widget).toContainText('not the probability of fraud');
  const before = await widget.locator('[data-readout="scores"]').innerText();
  const paths = widget.locator('input[type="text"][id="isolation-paths-paths"]');
  await paths.evaluate((input: HTMLInputElement) => { input.value = '1, 1, 1, 4, 5, 3, 6, 5, 7'; input.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect(widget.locator('[data-readout="scores"]')).not.toHaveText(before);
});

test('Isolation Forest checkpoint feedback appears after submission and explains the inference boundary', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'isolation-forest', [/higher scores to smaller/i, /fitted partitions/i, /rather than proving/i]);
});

test('A06 explains forecast changes, forecast levels, and later evaluation separately', async ({ page }) => {
  await page.goto('/exercises/A06/');
  const worked = page.locator('#exercise-A06-worked');
  await expect(worked.locator('.step-reason')).toHaveCount(8);
  await expect(worked).toContainText('The latest change is a $6 million increase');
  await expect(worked).toContainText('first forecast is $119 million');
  await expect(worked).toContainText('one day does not establish which method will work better');
  await page.goto('/algorithms/time-series/intuition/');
  await page.getByText('Additional method notes', { exact: true }).click();
    const formulas = page.locator('.optional-exploration .lesson-section .formula-block');
  await expect(formulas).toHaveCount(1);
  await expect(formulas.locator('.read-aloud')).toContainText('operator B means');
  await expect(formulas.locator('.symbol-key')).toContainText('forecast errors');
  await page.goto('/algorithms/time-series/worked/');
  await expect(page.locator('main')).toContainText('day 8 uses the matching weekday from the last observed week');
});

test('forecast explorer says the actuals and point forecasts stay fixed when interval width changes', async ({ page }) => {
  await page.goto('/explorers/forecast-eval/');
  const widget = page.locator('[data-widget="forecast-eval"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The actual outflows and point forecasts stay fixed');
  await expect(widget).toContainText('without changing the forecast line');
  const before = await widget.locator('[data-readout="intervalWidth"]').innerText();
  await widget.locator('input[type="number"]').first().fill('25');
  await expect(widget.locator('[data-readout="intervalWidth"]')).not.toHaveText(before);
});

test('time-series checkpoint teaches chronological evaluation and a fair forecast comparison after submission', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'time-series', [/known by this historical/i, /later actuals/i, /too low/i]);
});

test('A07 distinguishes network links, paths, direct neighbors, and evidence of fraud', async ({ page }) => {
  await page.goto('/exercises/A07/');
  const worked = page.locator('#exercise-A07-worked');
  await expect(worked.locator('.step-reason')).toHaveCount(5);
  await expect(worked).toContainText('A, B, and C belong to one five-node component');
  await expect(worked).toContainText('The shortest A-to-C route uses four links');
  await expect(worked).toContainText('They do not say that money moved along every link');
  await page.goto('/algorithms/graph-methods/intuition/');
  await page.getByText('Additional method notes', { exact: true }).click();
    const formulas = page.locator('.optional-exploration .lesson-section .formula-block');
  await expect(formulas).toHaveCount(1);
  await expect(formulas.locator('.read-aloud')).toContainText('one more link');
  await expect(formulas.locator('.symbol-key')).toContainText('direct neighbors');
});

test('entity graph explorer explains its selected account and its relationship limit', async ({ page }) => {
  await page.goto('/explorers/entity-graph/');
  const widget = page.locator('[data-widget="entity-graph"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The graph and its links stay fixed');
  await expect(widget).toContainText('does not show that money moved or prove misconduct');
  const component = await widget.locator('[data-readout="selectedComponent"]').innerText();
  await widget.getByLabel('Account to inspect').selectOption('3');
  await expect(widget.locator('[data-readout="selectedComponent"]')).not.toHaveText(component);
});

test('graph-method checkpoint explains relationship meaning, time cutoffs, and matched comparisons', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'graph-methods', [/actual neighbors/i, /historical alert/i, /evidence/i]);
});

test('A08 separates attention shares, combined representations, class probabilities, and review policy', async ({ page }) => {
  await page.goto('/exercises/A08/');
  const worked = page.locator('#exercise-A08-worked');
  await expect(worked.locator('.step-reason')).toHaveCount(5);
  await expect(worked).toContainText('not a 50% sentiment probability');
  await expect(worked).toContainText('sends the result to a person');
  await expect(page.locator('.formula-block')).toHaveCount(3);
  await expect(page.locator('.symbol-key')).toHaveCount(3);
  await page.goto('/algorithms/transformers/intuition/');
  const formula = page.locator('.lesson-section .formula-block');
  await expect(formula.locator('.read-aloud')).toContainText('Softmax converts the scores into weights that sum to one');
  await expect(formula.locator('.symbol-key')).toContainText('query vectors');
});

test('attention explorer distinguishes token mixing from label probability', async ({ page }) => {
  await page.goto('/explorers/attention-mini/');
  const widget = page.locator('[data-widget="attention-mini"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The two token values and the teaching classifier stay fixed');
  await expect(widget).toContainText('Attention weights describe token mixing');
  const weights = await widget.locator('[data-readout="weights"]').innerText();
  await widget.locator('#attention-mini-logits').evaluate((input: HTMLInputElement) => { input.value = '0, 2'; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect(widget.locator('[data-readout="weights"]')).not.toHaveText(weights);
});

test('transformer checkpoint explains contrastive labels and the limits of the browser baseline', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'transformers', [/Queries and keys/i, /Training updates/i, /Macro averaging/i]);
});

test('A09 explains similarity ranking, both required revenue figures, and the growth denominator', async ({ page }) => {
  await page.goto('/exercises/A09/');
  const worked = page.locator('#exercise-A09-worked');
  await expect(worked.locator('.step-reason')).toHaveCount(2);
  await expect(worked).toContainText('not an 80% chance that an answer is correct');
  await expect(worked).toContainText('20 ÷ 100 = 0.20, or 20%');
  await expect(page.locator('.formula-block')).toHaveCount(3);
  await expect(page.locator('.symbol-key')).toHaveCount(3);
  await page.goto('/algorithms/rag/intuition/');
  const formula = page.locator('.lesson-section .formula-block');
  await expect(formula.locator('.read-aloud')).toContainText('Cosine similarity compares the directions');
  await expect(formula.locator('.symbol-key')).toContainText('document passage');
});

test('RAG explorer distinguishes ranking from evidence and responds when K changes', async ({ page }) => {
  await page.goto('/explorers/retrieval-rank/');
  const widget = page.locator('[data-widget="retrieval-rank"]');
  await readyActivity(widget);
  await expect(widget).toContainText('The query and the three source passages stay fixed');
  await expect(widget).toContainText('a similarity score alone cannot support either figure');
  const before = await widget.locator('[data-readout="recallAtK"]').innerText();
  await widget.locator('input[type="number"]').first().fill('1');
  await expect(widget.locator('[data-readout="recallAtK"]')).not.toHaveText(before);
});

test('RAG checkpoint separates retrieval, answer support, and citation correctness after submission', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'rag', [/cited content/i, /missing factual input/i, /unsupported claim/i]);
});

test('RAG source-quality supplements explain independent audit units and answer completeness measures', async ({ page }) => {
  for (const [id, count, formulas] of [['S01', 4, 2], ['S02', 5, 1]] as const) {
    await page.goto(`/exercises/${id}/`);
    const worked = page.locator(`#exercise-${id}-worked`);
    await expect(worked.locator('.step-reason')).toHaveCount(count);
    await expect(worked.locator('.step-reason').filter({ hasText: 'explanation pending' })).toHaveCount(0);
    await expect(page.locator('.formula-block')).toHaveCount(formulas);
    await expect(page.locator('.symbol-key')).toHaveCount(formulas);
  }
  await page.goto('/exercises/S01/');
  await expect(page.locator('#exercise-S01-worked')).toContainText('hide an error in a critical debt figure');
  await page.goto('/exercises/S02/');
  await expect(page.locator('#exercise-S02-worked')).toContainText('Each question gets one equal vote');
});

test('RAG supplementary parsing diagrams explain what changes when a source table or answer is incomplete', async ({ page }) => {
  for (const id of ['S01', 'S02']) {
    await page.goto(`/exercises/${id}/`);
    const visual = page.locator(`[data-supplement-visual="${id}"]`);
    await readyActivity(visual);
    await expect(visual).toBeVisible();
    const before = await visual.innerText();
    await visual.getByRole('checkbox').last().check();
    await expect(visual).not.toHaveText(before);
  }
});

test('M04–M07 exercises explain their denominators, units, and financial limits', async ({ page }) => {
  await page.goto('/exercises/M04/');
  let worked = page.locator('#exercise-M04-worked');
  await expect(worked).toContainText('drawn from the same transaction population');
  await expect(worked).toContainText('Cost per review ($)');
  await expect(worked.locator('.worked-arithmetic')).toContainText('Precision uses all reviewed alerts as the denominator');
  await expect(worked.locator('.worked-reasoning')).toContainText('The numbers do not say what those extra cases cost');
  await page.goto('/exercises/M05/');
  worked = page.locator('#exercise-M05-worked');
  await expect(worked).toContainText('same batch of 20 confirmed fraud cases');
  await expect(worked.locator('.worked-arithmetic')).toContainText('The difference is $24,000 − $10,000 = $14,000');
  await expect(worked.locator('.worked-reasoning')).toContainText('extra alerts, review expense');
  await page.goto('/exercises/M06/');
  worked = page.locator('#exercise-M06-worked');
  await expect(worked).toContainText('980 legitimate transactions');
  await expect(worked.locator('.worked-arithmetic')).toContainText('35 ÷ 980');
  await expect(worked.locator('.worked-reasoning')).toContainText('actual counts depend on the future population');
  await page.goto('/exercises/M07/');
  worked = page.locator('#exercise-M07-worked');
  await expect(worked).toContainText('F-beta with beta set to 2');
  await expect(worked.locator('.worked-reasoning')).toContainText('The detector and its alerts are unchanged');
});

test('precision, recall, specificity, and F-scores explain their local denominators', async ({ page }) => {
  for (const [slug, numerator, denominator] of [
    ['precision', '60 flagged transactions', 'all 200 flagged transactions'],
    ['recall', '60 frauds caught', 'all 100 actual frauds'],
    ['specificity-and-false-positive-rate', '9,760 legitimate transactions correctly passed', 'all 9,900 legitimate transactions'],
    ['f1-and-f-beta', 'Precision asks how many flagged transactions really are fraud', 'Recall asks how much of the actual fraud was caught'],
  ] as const) {
    await page.goto(`/measures/${slug}/`);
    await expect(page.locator('main')).toContainText(numerator);
    await expect(page.locator('main')).toContainText(denominator);
  }
});

test('all final-merged financial visuals linked to M02 expose each frame and accessible result', async ({ page }) => {
  test.setTimeout(120000);
  const slugs = new Set(['precision', 'recall', 'specificity-and-false-positive-rate', 'f1-and-f-beta']);
  const cases = financialCases.filter((item) => item.measureSlugs.some((slug) => slugs.has(slug)));
  expect(cases).toHaveLength(11);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    const visual = page.locator('.case-controls').first();
    await readyActivity(visual);
    const stateButtons = visual.locator('button:not(.case-reset)');
    await expect(stateButtons).toHaveCount(3);
    for (let i = 0; i < item.frames.length; i++) {
      const frame = item.frames[i];
      await stateButtons.nth(i).click();
      await expect(stateButtons.nth(i)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('U01-B logistic-regression cases expose every merged frame, denominator, and accessible result', async ({ page }) => {
  test.setTimeout(120000);
  const cases = financialCases
    .filter((item) => item.algorithmSlug === 'logistic-regression')
    .slice(0, 4);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    for (let i = 0; i < item.frames.length; i++) {
      const frame = item.frames[i];
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.getByRole('button', { name: frame.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('U01-C logistic-regression cases expose every merged frame, denominator, and accessible result', async ({ page }) => {
  test.setTimeout(120000);
  const cases = financialCases
    .filter((item) => item.algorithmSlug === 'logistic-regression')
    .slice(4, 8);
  expect(cases).toHaveLength(4);
  for (const item of cases) {
    await page.goto(financialCaseHref(item, '/'));
    await readyActivity(page.locator('svg.case-scene'));
    for (let i = 0; i < item.frames.length; i++) {
      const frame = item.frames[i];
      await page.getByRole('button', { name: frame.label, exact: true }).click();
      await expect(page.getByRole('button', { name: frame.label, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.case-caption')).toHaveText(frame.caption);
      await expect(page.locator('.case-result')).toContainText(frame.metric.denominator);
      await expect(page.locator('.case-result')).toContainText(frame.result);
      await expect(page.locator('.case-scene')).toHaveAttribute('aria-label', new RegExp(frame.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  }
});

test('U01-D lab guidance, generated notebook, and defense prompts explain logistic regression in context', async ({ page }) => {
  await page.goto('/algorithms/logistic-regression/defend/#run');
  const context = page.locator('.lab-context');
  await context.locator('summary').click();
  await expect(context).toContainText('5,000 fictional examples');
  await expect(context).toContainText('A stratified split puts 70% of examples in the training set');
  await expect(context).toContainText('simple reference that predicts the training-set default share');
  await expect(context).toContainText('does not supply those policy assumptions');
  await page.getByRole('tab', { name: /Defend your decision/ }).click();
  const defense = page.locator('#defense');
  await expect(defense).toContainText('why the cheaper cutoff in one sample may not be the right policy for future applicants');
  await expect(defense).toContainText('which arrive only later');
  await expect(defense).toContainText('about 10 of 100 similar loans would default');
  await expect(defense).toContainText('its probabilities are less trustworthy');
});

test('U02-A tree lesson, Gini calculations, and formula keys explain the supplied sample', async ({ page }) => {
  await page.goto('/algorithms/trees-and-forests/');
  await expect(page.locator('main')).toContainText('including it as an input would reveal the answer');
  await page.goto('/algorithms/trees-and-forests/intuition/');
  await expect(page.locator('main')).toContainText('The leaf often supplies a class fraction, rather than a certain outcome');
  await page.goto('/exercises/A02/');
  const worked = page.locator('#exercise-A02-worked');
  await expect(worked).toContainText('A positive difference means the groups are less mixed after the split');
  await expect(worked.locator('.worked-arithmetic')).toContainText('The scores are supplied for arithmetic practice and are not confirmed probabilities');
  await page.goto('/algorithms/trees-and-forests/formula/');
  await expect(page.locator('.original-course-formulas .formula-block')).toHaveCount(3);
  await expect(page.locator('.original-course-formulas .formula-block').nth(0).locator('.symbol-key')).toContainText('Gini impurity');
  await expect(page.locator('.original-course-formulas .formula-block').nth(1).locator('.read-aloud')).toContainText('positive gain means the split made the training groups more uniform');
  await expect(page.locator('.original-course-formulas .formula-block').nth(2).locator('.symbol-key')).toContainText('Number of trees');
});

test('U02-A Gini explorer explains the child-size comparison as counts change', async ({ page }) => {
  await page.goto('/explorers/gini-split/');
  const widget = page.locator('[data-widget="gini-split"]');
  await readyActivity(widget);
  await expect(widget).toContainText('Does separating new-device and trusted-device payments make the groups less mixed?');
  await expect(widget).toContainText('very small group becomes pure');
  const output = widget.locator('.live-interpretation');
  const before = await output.innerText();
  const counts = widget.locator('input[type="text"]').first();
  await counts.fill('4, 0, 1, 5');
  await counts.press('Tab');
  await expect(output).not.toHaveText(before);
  await expect(output).toContainText('Larger child groups count more because they contain more transactions');
  await expect(output).toContainText('not how well the split predicts future payments');
});

test('U02-A checkpoint explains impurity, tree averaging, and a fixed review queue after submission', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'trees-and-forests', [/weighted impurity/i, /diversify trees/i, /first 100 reviews/i]);
});

test('U04-A K-means lesson and exercise explain the distance and averaging steps', async ({ page }) => {
  await page.goto('/algorithms/k-means/');
  await expect(page.locator('main')).toContainText('a cluster number does not say whether someone is creditworthy');
  await page.goto('/algorithms/k-means/intuition/');
  await expect(page.locator('main')).toContainText('K-means repeatedly assigns each example to a nearby average center');
  await expect(page.locator('main')).toContainText('K-means compares distances, so units matter');
  await page.goto('/exercises/A04/');
  const worked = page.locator('#exercise-A04-worked');
  await expect(worked).toContainText('A center is the average behavior of the customers currently in its group');
  await expect(worked.locator('.worked-arithmetic')).toContainText('Compare each rate with centers 10 and 60 percentage points');
  await expect(worked.locator('.worked-arithmetic')).toContainText('This is a similarity assignment, not a judgment about the customer');
  await page.goto('/algorithms/k-means/formula/');
  await expect(page.locator('.original-course-formulas .formula-block').first().locator('.read-aloud')).toContainText('Move center j to the arithmetic average');
  await expect(page.locator('.original-course-formulas .formula-block').last().locator('.symbol-key')).toContainText('Distance from example i to center j');
  await page.goto('/algorithms/k-means/intuition/');
  await page.getByText('Additional method notes', {exact:true}).click();
  await expect(page.locator('.optional-exploration .formula-block').first().locator('.read-aloud')).toContainText('For a chosen number k of groups');
});

test('U04-A customer-group explorer keeps the sample fixed and changes only the selected rate', async ({ page }) => {
  await page.goto('/explorers/kmeans-anim/');
  const widget = page.locator('[data-widget="kmeans-anim"]');
  await readyActivity(widget);
  await expect(widget).toContainText('Which group is closest after the savings-rate centers move?');
  await expect(widget).toContainText('Keep the listed customers and their savings rates fixed');
  const group = widget.locator('[data-readout="group"]');
  const before = await group.innerText();
  await widget.locator('#kmeans-anim-newPoint').fill('65');
  await expect(group).not.toHaveText(before);
  await expect(widget.locator('.live-interpretation')).toContainText('not a creditworthiness label');
});

test('U04-A checkpoints explain feature scale, arbitrary group labels, and the limit of inertia', async ({ page }) => {
  await authoredCheckpointReasoning(page, 'k-means', [/squared distance/i, /converged/i, /100²/i]);
});
