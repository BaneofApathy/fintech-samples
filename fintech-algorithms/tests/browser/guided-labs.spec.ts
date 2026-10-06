import { expect, test } from '@playwright/test';

test('real Python baseline and edited run retain comparison and edits after an error', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/algorithms/logistic-regression/defend/');
  await expect(page.getByRole('tab', { name: /Run & compare/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Python code for logistic-regression')).not.toBeVisible();
  const inputRows = await page.locator('.data-preview tbody').innerText();
  await page.getByRole('button', { name: 'Run baseline', exact: true }).click();
  await expect(page.locator('[data-run-state]')).toHaveAttribute('data-run-state', 'complete', {
    timeout: 65000,
  });
  expect(await page.locator('.data-preview tbody').innerText()).toBe(inputRows);
  const results = page.getByRole('region', { name: 'Lab results' });
  await expect(results).toContainText('ROC-AUC');
  await expect(page.locator('.preview-caption')).toContainText(
    'First 3 generated rows; showing 3 of 8 numerical features and the target.',
  );
  const baselineCells = await results
    .locator('.comparison-table tbody td:nth-child(2)')
    .allTextContents();
  await page.locator('.code-editor summary').click();
  const editor = page.getByLabel('Python code for logistic-regression');
  const original = await editor.inputValue();
  const edited = `${original}\nprint("Guided comparison marker")\n`;
  await editor.fill(edited);
  await page.getByRole('button', { name: 'Run your changes', exact: true }).click();
  await expect(page.locator('[data-run-state]')).toHaveAttribute('data-run-state', 'complete', {
    timeout: 65000,
  });
  await expect(
    results.locator('.comparison-table tbody td:nth-child(3)').first(),
  ).not.toContainText('Run your changes');
  expect(
    await results.locator('.comparison-table tbody td:nth-child(2)').allTextContents(),
  ).toEqual(baselineCells);
  const latestCells = await results
    .locator('.comparison-table tbody td:nth-child(3)')
    .allTextContents();
  const broken = `${edited}\nraise ValueError("Intentional regression-test error")\n`;
  await editor.fill(broken);
  await page.getByRole('button', { name: 'Run your changes', exact: true }).click();
  await expect(page.locator('[data-run-state]')).toHaveAttribute('data-run-state', 'failed', {
    timeout: 65000,
  });
  await expect(page.getByRole('alert')).toContainText('Intentional regression-test error');
  await expect(results.getByRole('heading', { name: 'Previous successful results' })).toBeVisible();
  expect(
    await results.locator('.comparison-table tbody td:nth-child(2)').allTextContents(),
  ).toEqual(baselineCells);
  expect(
    await results.locator('.comparison-table tbody td:nth-child(3)').allTextContents(),
  ).toEqual(latestCells);
  await expect(editor).toHaveValue(broken);
  await results.locator('summary').filter({ hasText: 'Full output' }).click();
  await expect(results).toContainText('Guided comparison marker');
  await page.getByRole('tab', { name: /Defend your decision/ }).click();
  await page.getByRole('tab', { name: /Run & compare/ }).click();
  await expect(editor).toHaveValue(broken);
  await expect(results).toContainText('Guided comparison marker');
  expect(errors).toEqual([]);
});

test('activity hashes, keyboard navigation and saved defense work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/algorithms/logistic-regression/defend/#defense-logistic-regression-0');
  const defense = page.getByRole('tab', { name: /Defend your decision/ });
  await expect(defense).toHaveAttribute('aria-selected', 'true');
  const answer = page.locator('#defense-logistic-regression-0');
  await expect(answer).toHaveValue('');
  await page.locator('.annotated-example > summary').click();
  await expect(answer).toHaveValue('');
  const response =
    'I would compare risk estimates against a constant-risk baseline before selecting a cost-based review threshold.';
  await answer.fill(response);
  await defense.focus();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: /Run & compare/ })).toBeFocused();
  await expect(page).toHaveURL(/#run$/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Check understanding/ })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Unit checkpoint', exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(defense).toBeFocused();
  await expect(answer).toHaveValue(response);
  await page.reload();
  await expect(defense).toHaveAttribute('aria-selected', 'true');
  await expect(answer).toHaveValue(response);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
});

test('stopping a loading worker preserves saved edits and ignores a late result', async ({
  page,
}) => {
  // A controlled slow worker makes cancellation and its late-message race reproducible.
  await page.addInitScript(() => {
    class SlowWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: unknown = null;
      postMessage() {
        this.onmessage?.({ data: { type: 'status', text: 'Loading the bundled Python runtime…' } });
      }
      terminate() {
        this.onmessage?.({
          data: { type: 'result', stdout: 'ROC-AUC: 999', stderr: '', figures: [] },
        });
      }
    }
    Object.defineProperty(window, 'Worker', { value: SlowWorker });
  });
  await page.goto('/algorithms/logistic-regression/defend/');
  await page.locator('.code-editor summary').click();
  const editor = page.getByLabel('Python code for logistic-regression');
  await editor.fill('print("saved code")');
  await page.getByRole('button', { name: 'Run baseline', exact: true }).click();
  await expect(page.locator('[data-run-state]')).toHaveAttribute('data-run-state', 'loading');
  await page.getByRole('button', { name: 'Stop run', exact: true }).click();
  await expect(page.locator('[data-run-state]')).toHaveAttribute('data-run-state', 'stopped');
  await expect(editor).toHaveValue('print("saved code")');
  await expect(page.getByRole('region', { name: 'Lab results' })).toHaveCount(0);
  await page.reload();
  await page.locator('.code-editor summary').click();
  await expect(editor).toHaveValue('print("saved code")');
});
