import { expect, test } from '@playwright/test';
import { algorithmVisualCatalog } from '../../src/data/algorithm-visuals';

test.describe('Algorithm concept walkthroughs', () => {
  for (const visual of algorithmVisualCatalog) {
    test(`${visual.slug}: steps, controls, comparisons, prediction, and narrow screen`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/algorithms/${visual.slug}/intuition/`);
      const diagram = page.locator(`[data-algorithm-visual="${visual.slug}"]`).first();
      await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-ready', 'true');
      await expect(diagram).toBeVisible();
      await expect(diagram.locator('svg').first()).toBeVisible();
      for (let i = 1; i < visual.steps.length; i++) {
        await diagram.getByRole('button', { name: 'Next →', exact: true }).click();
        await expect(diagram).toHaveAttribute('data-step', String(i));
        await expect(diagram.locator('.av-step-heading h4')).toHaveText(visual.steps[i].title);
      }
      await diagram.getByRole('button', { name: '← Back', exact: true }).click();
      await expect(diagram).toHaveAttribute('data-step', String(visual.steps.length - 2));
      await diagram.locator('.av-comparisons summary').click();
      const comparison = diagram.locator('.av-comparisons select');
      for (let method = 0; method < visual.methods.length; method++) {
        await comparison.selectOption(String(method));
        const control = diagram.locator('.av-controls input[type="range"]').first();
        if (await control.count()) {
          await control.focus();
          await control.press('ArrowRight');
        }
        const select = diagram.locator('.av-controls select').first();
        if (await select.count()) {
          const options = await select
            .locator('option')
            .evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptionElement).value));
          await select.selectOption(options.at(-1)!);
        }
        await expect(diagram.locator('.algorithm-diagram')).not.toContainText(
          /NaN|undefined|Infinity/,
        );
        expect(
          await diagram
            .locator('svg [x],svg [y],svg [cx],svg [cy],svg [d]')
            .evaluateAll((nodes) =>
              nodes.some((n) => Array.from(n.attributes).some((a) => /NaN|Infinity/.test(a.value))),
            ),
        ).toBe(false);
      }
      await diagram.locator('.av-prediction summary').click();
      await diagram.getByRole('radio').first().check();
      await diagram.getByRole('button', { name: 'Reveal explanation', exact: true }).click();
      await expect(diagram.locator('.av-feedback')).toContainText(visual.prediction.explanation);
      await diagram.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(diagram).toHaveAttribute('data-step', '0');
      await page.setViewportSize({ width: 320, height: 740 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-ready', 'true');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      await diagram.getByRole('button', { name: 'Next →', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(diagram).toHaveAttribute('data-step', '1');
      expect(errors).toEqual([]);
    });
  }

  test('parent formula focus highlights the matching logistic quantity without changing the example', async ({
    page,
  }) => {
    await page.goto('/algorithms/logistic-regression/formula/');
    const diagram = page.locator('[data-algorithm-visual="logistic-regression"]').first();
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent('course-formula-focus', { detail: { symbol: 'DTI' } })),
    );
    await expect(diagram.locator('.av-term-note')).toContainText('DTI');
    expect(await diagram.locator('svg .selected').count()).toBeGreaterThan(0);
  });

  test('loan risk changes with DTI while changing only the review policy preserves risk', async ({
    page,
  }) => {
    await page.goto('/algorithms/logistic-regression/intuition/');
    const diagram = page.locator('[data-algorithm-visual="logistic-regression"]').first();
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-ready', 'true');
    const risk = diagram.locator('.diagram-metrics > span').first();
    const before = (await risk.textContent())!;
    await diagram.getByRole('slider', { name: 'Walkthrough review threshold' }).fill('0.5');
    await expect(risk).toHaveText(before);
    await diagram.getByRole('slider', { name: 'Walkthrough debt-to-income ratio' }).fill('60');
    await expect(risk).not.toHaveText(before);
  });
});
