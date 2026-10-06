import { expect, test } from '@playwright/test';
import { financialCases, financialCaseHref } from '../../src/data/financial-cases';

const removedBoilerplate =
  /Fixed, locally bundled classroom scenario|all amounts and policies are illustrative|Locally bundled teaching example|Foundations · fixed, illustrative classroom examples|See it · change it · explain it|Ready for offline use|Preparing offline|Local progress · no account required|Learn one idea at a time|Learn over several sessions|Progress saved on this device|Your practice is saved on this device|Saved on this device|Your progress stays on this device|Responses are stored on this device|Your recommendation is stored on this device|Original numerical explorer|First, understand the concept|Take your time: explanations and practice are always available|Calculation hint · explanation pending|Supplied teaching extensions are labeled where introduced|Changing a control explores a clearly indicated comparison|\bAuthored\s+(?:M\d+|tiny|lending|financial|loan|customer|payments|settlement|investigation|two-token|sentiment|vector|fictional|investment|first|second|buy-order|exact|hand|lesson)\b/i;

const examples = [
  { path: financialCaseHref(financialCases[0], '/'), target: 'svg.case-scene' },
  {
    path: '/algorithms/logistic-regression/intuition/',
    target: '[data-algorithm-visual="logistic-regression"]',
    reference: 'A01',
  },
  { path: '/measures/confusion-matrix/', target: '[data-measure-visual="1"]', reference: 'M01' },
  { path: '/foundations/', target: '[data-foundation-visual="features"]' },
  { path: '/algorithms/logistic-regression/defend/', target: '.guided-lab' },
  { path: '/algorithms/transformers/defend/', target: '.guided-lab' },
];

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`course copy stays concise after hydration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const example of examples) {
      await page.goto(example.path);
      if (example.path === '/foundations/')
        await page.locator('.optional-exploration > summary').click();
      const target = page.locator(example.target).first();
      await target.scrollIntoViewIfNeeded();
      await expect(target.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute(
        'ssr',
        '',
      );
      await expect(target).toBeVisible();
      await expect(page.locator('#offline-status')).toHaveCount(0);
      await expect(page.locator('body'), example.path).not.toContainText(removedBoilerplate, {
        useInnerText: true,
      });
      const accessibilityText = await page
        .locator('[aria-label], [aria-description], [alt], [title]')
        .evaluateAll((nodes) =>
          nodes
            .flatMap((node) =>
              ['aria-label', 'aria-description', 'alt', 'title'].map(
                (attr) => node.getAttribute(attr) ?? '',
              ),
            )
            .join(' '),
        );
      expect(accessibilityText, example.path).not.toMatch(removedBoilerplate);
      if (example.reference)
        await expect(page.locator('.visual-source').first()).toContainText(example.reference);
      else if (example.path === '/foundations/' || example.path.startsWith('/financial-problems/'))
        await expect(page.locator('.visual-source')).toHaveCount(0);
      if (example.path === '/algorithms/transformers/defend/') {
        await expect(page.locator('.native-disclosure')).toContainText(
          'TF-IDF linear sentiment baseline',
        );
        await expect(page.locator('.native-disclosure')).toContainText('pretrained FinBERT');
      }
    }
    expect(errors).toEqual([]);
  });
}
