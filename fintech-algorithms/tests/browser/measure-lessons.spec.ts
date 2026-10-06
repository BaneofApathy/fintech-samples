import { expect, test } from '@playwright/test';

test('measure examples use readable tables and equations without duplicate slide records', async ({
  page,
}) => {
  await page.goto('/measures/confusion-matrix/');
  await page.locator('details > summary').filter({ hasText: /^Worked example$/ }).click();
  await expect(page.getByRole('heading', { name: 'Worked example', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'TP = 60', exact: true })).toBeVisible();
  await expect(page.locator('.lesson-section .katex').first()).toBeVisible();
  await expect(page.locator('.source-slide')).toHaveCount(0);
  await expect(page.getByText('Evaluation reminder', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Every classification measure on the next slides', { exact: false }),
  ).toHaveCount(0);

  await page.goto('/measures/mape-wape-mase/');
  await page.locator('details > summary').filter({ hasText: /^Worked example$/ }).click();
  await expect(
    page.getByText(
      'To see whether it beats a naive forecast on new data, compare both forecasts on the same test period.',
      { exact: false },
    ),
  ).toBeVisible();
  await page.goto('/measures/retrieval-recall-k-and-context-precision/');
  await page.locator('details > summary').filter({ hasText: /^Worked example$/ }).click();
  await expect(
    page.getByText('exactly one relevant passage in the corpus', { exact: false }),
  ).toBeVisible();
});

test('the first measure visuals explain their outcomes in text beside the diagram', async ({ page }) => {
  await page.goto('/exercises/M01/');
  await expect(page.locator('astro-island[client="load"][ssr]')).toHaveCount(0);
  await page.locator('#exercise-M01-worked .exercise-visual > summary').click();
  await expect(page.locator('.vm-description')).toContainText('A true positive is a fraud correctly flagged');
  await page.goto('/exercises/M02/');
  await expect(page.locator('astro-island[client="load"][ssr]')).toHaveCount(0);
  await page.locator('#exercise-M02-worked .exercise-visual > summary').click();
  await expect(page.locator('.vm-description')).toContainText(/a baseline that passes everyone/i);
  await page.goto('/exercises/M03/');
  await expect(page.locator('astro-island[client="load"][ssr]')).toHaveCount(0);
  await page.locator('#exercise-M03-worked .exercise-visual > summary').click();
  await expect(page.locator('.vm-description')).toContainText(/equal weighting is not the same as weighting errors by their dollar cost/i);
  await page.goto('/explorers/confusion-builder/');
  const widget = page.locator('[data-widget="confusion-builder"]');
  await expect(widget.locator('.live-interpretation')).toContainText('Precision is');
  await expect(widget.locator('.live-interpretation')).toContainText('of flagged transactions that were fraud');
});

test('tree examples explain what each changed case establishes', async ({ page }) => {
  await page.goto('/financial-problems/trees-and-forests/credit-underwriting/');
  await page.getByRole('button', { name: 'Higher DTI', exact: true }).click();
  await expect(page.locator('.case-caption')).toContainText('45% DTI');
  await expect(page.locator('.case-result')).toContainText('A review is a request for human assessment');
  await page.getByRole('button', { name: 'Higher DTI + missed payment', exact: true }).click();
  await expect(page.locator('.case-caption')).toContainText('credit-history review');

  await page.goto('/financial-problems/trees-and-forests/claims-fraud/');
  await page.getByRole('button', { name: 'Receipts checked', exact: true }).click();
  await expect(page.locator('.case-result')).toContainText('provider confirmation is still pending');
  await page.getByRole('button', { name: 'Hospital confirms treatment', exact: true }).click();
  await expect(page.locator('.case-data')).toContainText('Legitimate treatment confirmed');
});

test('contextual explorers remain available through related practice', async ({ page }) => {
  const examples = [
    ['macro-f1-micro-f1-weighted-f1', 'confusion-builder'],
    ['faithfulness-citation-correctness-numerical-accuracy', 'retrieval-rank'],
    ['sharpe-and-sortino-ratios', 'portfolio-feasible'],
    ['maximum-drawdown-turnover-tracking-error', 'portfolio-feasible'],
    ['var-exception-rate', 'monte-carlo-loss'],
    ['cumulative-reward-and-regret', 'execution-update'],
    ['task-success-verification-unsafe-actions', 'ops-budget'],
  ];
  for (const [measure, explorer] of examples) {
    await page.goto(`/measures/${measure}/`);
    const related = page.getByRole('complementary', { name: 'Related practice' });
    await expect(related).toBeVisible();
    await expect(related.locator('a')).toHaveAttribute('href', `/explorers/${explorer}/`);
    await expect(page.locator('[data-widget]')).toHaveCount(0);
  }
});

test('glossary repairs keep definitions complete and exercise links grouped', async ({ page }) => {
  await page.goto('/glossary/');
  await expect(page.getByRole('heading', { name: 'point', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Basis point; percentage point', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'One basis point is 0.01 percentage point. A rise from 50% to 55% is five percentage points.',
      { exact: true },
    ),
  ).toBeVisible();
  const tp = page
    .locator('.glossary-meaning')
    .filter({ hasText: 'True positives: actual frauds correctly flagged.' });
  await expect(tp).toHaveCount(1);
  await expect(tp.locator('a')).toHaveText(['M01', 'M02', 'M03', 'M08']);
  await page.getByRole('textbox', { name: 'Search symbols and meanings' }).fill('M08');
  await expect(tp).toBeVisible();

  await page.goto('/exercises/M06/');
  await expect(
    page
      .getByRole('button', { name: 'Meaning of 1 in Specificity + FPR = 1', exact: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText('e population; the equivalent percentage is 100%.', { exact: true }),
  ).toHaveCount(0);
  await page.goto('/exercises/M32b/');
  await page.getByText('All symbols and terms in this exercise', { exact: true }).click();
  await expect(
    page.locator('#exercise-symbols').getByRole('cell', { name: 'Basis point; percentage point', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meaning of point', exact: true })).toHaveCount(0);
});

test('explorer explanations follow edited values and state comparison scope', async ({ page }) => {
  await page.goto('/explorers/sigmoid-el/');
  await page.getByText('More settings', { exact: true }).click();
  await page.locator('#sigmoid-el-loan').fill('20000');
  await expect(page.locator('.widget-notice')).toContainText('$798');
  await expect(page.locator('.widget-notice')).not.toContainText('$399');

  await page.goto('/explorers/calibration-lab/');
  await page.getByText('More settings', { exact: true }).click();
  await page.locator('#calibration-lab-predicted').fill('0.05, 0.1, 0.4');
  await page.locator('#calibration-lab-predicted').press('Tab');
  await expect(page.locator('.widget-notice')).toContainText('10 percentage points above');
  await page.getByRole('checkbox').check();
  await expect(page.locator('.widget-notice')).toContainText('69 percentage points above');
  await expect(page.locator('.widget-notice')).toContainText(
    'expected counts, expected loss, Brier score, log loss, and ECE from the same active probabilities',
  );

  await page.goto('/explorers/boosting-steps/');
  await expect(page.locator('[data-readout="F1"]')).toHaveText('-1.6');
  await expect(page.locator('[data-readout="F1"]')).not.toContainText('%');
});
