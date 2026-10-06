import { expect, test, type Page } from '@playwright/test';

async function explorer(page: Page, id: string) {
  await page.goto(`/explorers/${id}/`);
  const widget = page.locator(`[data-widget="${id}"]`);
  await expect(widget).toBeVisible();
  await expect(page.locator('astro-island[component-url*="Widget"][ssr]')).toHaveCount(0);
  return widget;
}

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]));

test('review threshold changes the decision while applicant risk and loss stay fixed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const widget = await explorer(page, 'sigmoid-el');
  const risk = widget.locator('[data-readout="p"]');
  const loss = widget.locator('[data-readout="EL"]');
  const initialRisk = await risk.innerText();
  const initialLoss = await loss.innerText();
  await expect(widget.locator('#sigmoid-el-threshold')).toHaveValue('0.08');
  await expect(widget.locator('[data-readout="decision"]')).toHaveText('Review');
  await widget.locator('#sigmoid-el-threshold').fill('0.12');
  await expect(widget.locator('[data-readout="decision"]')).toHaveText('Below threshold');
  await expect(risk).toHaveText(initialRisk);
  await expect(loss).toHaveText(initialLoss);
  await expect(widget.locator('.live-interpretation')).toContainText(
    'Changing only the threshold changes the action',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('wider forecast intervals visibly expand and improve coverage without changing point error', async ({
  page,
}) => {
  const widget = await explorer(page, 'forecast-eval');
  const width = widget.locator('#width-slider-number');
  const band = widget.locator('[data-forecast-interval]');
  await expect(band).toBeVisible();
  await width.fill('5');
  await expect(widget.locator('[data-readout="intervalWidth"]')).toHaveText('10');
  const narrowPath = await band.getAttribute('d');
  const narrowCoverage = await widget.locator('[data-readout="coverage"]').innerText();
  const pointError = await widget.locator('[data-readout="MAE"]').innerText();
  await width.fill('60');
  await expect(widget.locator('[data-readout="intervalWidth"]')).toHaveText('120');
  await expect(widget.locator('[data-readout="coverage"]')).not.toHaveText(narrowCoverage);
  await expect(widget.locator('[data-readout="MAE"]')).toHaveText(pointError);
  await expect(band).not.toHaveAttribute('d', narrowPath!);
  await expect(widget.locator('.chart-legend')).toContainText('Shaded: forecast interval');
});

test('negative Q-values extend below the zero baseline', async ({ page }) => {
  const widget = await explorer(page, 'execution-update');
  const chart = widget.locator('.widget-chart svg');
  const baseline = chart.locator('.zero-axis');
  // A horizontal SVG line has a zero-height bounding box despite its visible stroke.
  await expect(chart).toBeVisible();
  await expect(baseline).toBeAttached();
  await expect(baseline).not.toHaveCSS('stroke', 'none');
  await expect(baseline).toHaveCSS('stroke-width', '1px');
  const zeroY = Number(await baseline.getAttribute('y1'));
  const bars = await chart.locator('rect').evaluateAll((rects) =>
    rects.map((rect) => ({
      y: Number(rect.getAttribute('y')),
      height: Number(rect.getAttribute('height')),
    })),
  );
  expect(bars).toHaveLength(4);
  for (const bar of bars) {
    expect(bar.y).toBeCloseTo(zeroY);
    expect(bar.height).toBeGreaterThan(0);
  }
  await expect(widget.locator('[data-readout="updated"]')).toContainText('-');
  await expect(widget.locator('.live-interpretation')).toContainText(
    'including when both values are negative',
  );
});

test('API and analyst capacity use separate charts and separate queues', async ({ page }) => {
  const widget = await explorer(page, 'ops-budget');
  await expect(
    widget.getByRole('img', { name: 'API requests per second', exact: true }),
  ).toBeVisible();
  await expect(
    widget.getByRole('img', { name: 'Human reviews per day', exact: true }),
  ).toBeVisible();
  const apiBacklog = await widget.locator('[data-readout="requestBacklog"]').innerText();
  const reviewBacklog = await widget.locator('[data-readout="dailyBacklog"]').innerText();
  await widget.locator('#ops-budget-analysts').fill('25');
  await expect(widget.locator('[data-readout="requestBacklog"]')).toHaveText(apiBacklog);
  await expect(widget.locator('[data-readout="dailyBacklog"]')).not.toHaveText(reviewBacklog);
  await expect(widget.locator('[data-readout="dailyBacklog"]')).toHaveText('0 alerts/day');
});

test('advanced inputs are available on demand and reset restores the original comparison', async ({
  page,
}) => {
  const widget = await explorer(page, 'sigmoid-el');
  const risk = widget.locator('[data-readout="p"]');
  const baseline = widget.locator('.readout:has([data-readout="p"]) .readout-baseline');
  const initialRisk = await risk.innerText();
  const initialBaseline = await baseline.innerText();
  await expect(widget.locator('#sigmoid-el-DTI')).toBeHidden();
  await widget.getByText('More settings', { exact: true }).click();
  await widget.locator('#sigmoid-el-DTI').fill('45');
  await expect(risk).not.toHaveText(initialRisk);
  await expect(baseline).toHaveText(initialBaseline);
  await widget.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(widget.locator('#sigmoid-el-DTI')).toHaveValue('35');
  await expect(risk).toHaveText(initialRisk);
  await expect(baseline).toHaveText(initialBaseline);
});

test('retrieval controls change the visible ranking and selected evidence', async ({ page }) => {
  const widget = await explorer(page, 'retrieval-rank');
  const bars = widget.locator('.widget-chart svg rect');
  await widget.locator('#retrieval-k-number').fill('1');
  await expect(bars.nth(0)).toHaveAttribute('opacity', '1');
  await expect(bars.nth(1)).toHaveAttribute('opacity', '0.25');
  await expect(widget.locator('.live-interpretation')).toContainText(
    'Retrieve the missing revenue evidence',
  );
  await widget.locator('#retrieval-k-number').fill('2');
  await expect(widget.locator('.live-interpretation')).toContainText(
    'Both revenue figures are available',
  );
  await widget
    .getByRole('button', { name: 'Put the irrelevant passage first', exact: true })
    .click();
  await expect(widget.locator('.live-interpretation')).toContainText(
    'Retrieve the missing revenue evidence',
  );
  await expect(widget.locator('[data-readout="MRR"]')).toHaveText('0.5');
});
