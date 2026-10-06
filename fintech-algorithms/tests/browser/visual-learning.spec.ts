import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { financialCases, financialCaseHref } from '../../src/data/financial-cases';
const course = JSON.parse(
  readFileSync(new URL('../../src/data/course.json', import.meta.url), 'utf8'),
);

for (const measure of course.measures) {
  test(`M${measure.number}: dedicated concept, interaction and reset`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/measures/${measure.slug}/`);
    const visual = page.locator(`[data-measure-visual="${measure.number}"]`);
    await visual.scrollIntoViewIfNeeded();
    await expect(visual.locator('xpath=ancestor::astro-island[1]')).not.toHaveAttribute('ssr', '');
    await expect(visual).toBeVisible();
    await expect(
      visual.locator('svg, .visual-readouts, .vm-equation, table, .vm-tiles, .vm-matrix, .vm-tray').first(),
    ).toBeVisible();
    const before = await visual.innerHTML();
    const ranges = visual.locator('input[type=range]');
    const input = (await ranges.count())
      ? ranges.first()
      : visual.locator('select,input[type=checkbox]').first();
    if (await input.count()) {
      const tag = await input.evaluate((e) => e.tagName),
        type = await input.getAttribute('type');
      if (tag === 'SELECT') {
        await input.selectOption({
          index:
            (await input.evaluate((e) => (e as HTMLSelectElement).selectedIndex)) === 0 ? 1 : 0,
        });
      } else if (type === 'checkbox') {
        await input.setChecked(!(await input.isChecked()));
      } else {
        await input.focus();
        await input.press(
          Number(await input.inputValue()) === Number(await input.getAttribute('min'))
            ? 'End'
            : 'Home',
        );
      }
      await expect.poll(() => visual.innerHTML()).not.toBe(before);
    }
    const tabs = visual.locator('.visual-tabs button');
    for (let i = 0; i < (await tabs.count()); i++) {
      await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-pressed', 'true');
    }
    await visual.getByRole('button', { name: 'Reset starting example' }).click();
    await expect(visual).not.toContainText('NaN');
    expect(errors).toEqual([]);
  });
}

for (const algorithm of course.algorithms) {
  test(`${algorithm.title}: all eight financial case routes change and reset`, async ({ page }) => {
    for (const scenario of financialCases.filter((c) => c.algorithmSlug === algorithm.slug)) {
      const response = await page.goto(financialCaseHref(scenario, '/'));
      expect(response?.status(), scenario.title).toBe(200);
      const svg = page.locator('svg.case-scene');
      await svg.scrollIntoViewIfNeeded();
      const diagram = () =>
        svg.evaluate((el) =>
          Array.from(el.querySelectorAll('*')).map((child) => ({
            tag: child.tagName,
            attributes: Array.from(child.attributes)
              .map((a) => [a.name, a.value])
              .sort((a, b) => a[0].localeCompare(b[0])),
            text: child.children.length ? '' : child.textContent,
          })),
        );
      const initial = await diagram();
      const choices = page.locator('.case-options button');
      await choices.nth(1).click();
      await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await choices.nth(2).click();
      await expect(choices.nth(2)).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(diagram, { message: scenario.title }).not.toEqual(initial);
      await page.getByRole('button', { name: 'Reset example', exact: true }).click();
      await expect.poll(diagram).toEqual(initial);
      if ((await page.locator('.case-data').getAttribute('open')) === null)
        await page.getByText('Read the diagram as data', { exact: true }).click();
      await expect(page.locator('.case-data table')).toBeVisible();
    }
  });
}

test('financial search, library category and original exercise links', async ({ page }) => {
  await page.goto('/financial-problems/');
  await expect(page.locator('[data-financial-case]')).toHaveCount(96);
  await page.getByRole('searchbox', { name: 'Find a financial problem' }).fill('collateral');
  await expect(page.locator('[data-financial-case]:visible')).toHaveCount(1);
  await page.goto('/library/');
  await expect(page.locator('option[value="financial"]')).toHaveCount(1);
  await page.goto('/exercises/S03/');
  await expect(page.locator('[data-supplement-visual="S03"]')).toBeVisible();
  const price = page.locator('[data-supplement-visual="S03"]').getByRole('spinbutton');
  await price.fill('51');
  await expect(page.locator('[data-supplement-visual="S03"]')).toContainText('$340');
});

test('practice illustration counts as help and closes for a new seed', async ({ page }) => {
  await page.goto('/exercises/A01/');
  const practice = page.locator('#exercise-A01-practice');
  await practice.scrollIntoViewIfNeeded();
  await practice.getByText('Illustrate these exact givens', { exact: true }).click();
  await expect(practice.locator('[data-algorithm-visual]')).toBeVisible();
  const helped = await page.evaluate(() =>
    Object.values(
      JSON.parse(localStorage.getItem('fintech-course-progress') || '{}').helpUsed || {},
    ),
  );
  // Existing progress key is discovered by shape to avoid coupling to its versioned name.
  const notes = await page.evaluate(() =>
    Object.values(localStorage).some((raw) => {
      try {
        return Object.keys(JSON.parse(raw).helpUsed || {}).length > 0;
      } catch {
        return false;
      }
    }),
  );
  expect(notes).toBe(true);
  void helped;
  await practice.getByRole('button', { name: 'New numbers', exact: true }).click();
  await expect(practice.locator('.exercise-visual')).not.toHaveAttribute('open', '');
});

test('representative diagrams support narrow layouts, dark mode and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of [
    '/foundations/',
    '/measures/confusion-matrix/',
    '/measures/root-mean-squared-error/',
    '/measures/faithfulness-citation-correctness-numerical-accuracy/',
    '/synthesis/',
    financialCaseHref(financialCases[48], '/'),
  ]) {
    await page.goto(path);
    await page.locator('.visual-frame').first().scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      path,
    ).toBe(true);
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    const results = await new AxeBuilder({ page })
      .include('.visual-frame')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join('; ')}`),
      path,
    ).toEqual([]);
  }
});

test('capstone changes its case diagram, opens saved responses, and exports evidence', async ({
  page,
}) => {
  await page.goto('/synthesis/');
  const tool = page.locator('[data-synthesis-visual]');
  await tool.scrollIntoViewIfNeeded();
  await tool.getByRole('button', { name: /Monte Carlo/ }).click();
  await expect(tool.locator('.selected-case svg')).toBeVisible();
  await expect(tool.locator('.selected-case')).toContainText(/reserve|Credit.loss/i);
  await tool.locator('.evidence-chain button').first().click();
  await tool.getByRole('button', { name: 'Write or edit this response' }).click();
  await expect(page.locator('#defense-capstone-0')).toBeFocused();
  await page.locator('#defense-capstone-0').fill('Investigate the defined credit portfolio.');
  const downloaded = page.waitForEvent('download');
  await tool.getByRole('button', { name: 'Download diagram and saved evidence' }).click();
  expect((await downloaded).suggestedFilename()).toBe('fintech-visual-defense.html');
  await page.emulateMedia({ media: 'print' });
  await expect(tool.locator('.print-evidence')).toBeVisible();
});

test('new visual pages and case data work without a network after offline preparation', async ({ browser }) => {
  test.setTimeout(120000);
  const base=String(test.info().project.use.baseURL);
  const context=await browser.newContext({serviceWorkers:'allow'});
  const page=await context.newPage();
  await page.goto(base+'/');
  await page.locator("[data-offline-prepare]").click();
  await expect(page.locator("[data-offline-message]")).toContainText("Offline copy complete", { timeout: 120000 });
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:90000}).toBe(true);
  await context.setOffline(true);
  await page.goto(base+financialCaseHref(financialCases[72],'/'));
  await page.locator('.case-scene').scrollIntoViewIfNeeded();
  await page.locator('.case-options button').nth(1).click();
  await expect(page.locator('.case-options button').nth(1)).toHaveAttribute('aria-pressed','true');
  await page.goto(base+'/synthesis/');
  await page.locator('[data-synthesis-visual]').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:/Monte Carlo/}).click();
  await expect(page.locator('.selected-case svg')).toBeVisible();
  await expect(page.locator('.selected-case')).toContainText(/reserve|Credit.loss/i);
  await page.goto(base+'/measures/population-stability-index/');
  await expect(page.locator('[data-measure-visual="38"]')).toBeVisible();
  await context.close();
});

test('the initial diagrams and explanations are useful before hydration',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  const base=String(test.info().project.use.baseURL);
  for(const path of ['/foundations/','/measures/mean-absolute-error/','/algorithms/graph-methods/intuition/',financialCaseHref(financialCases[80],'/')]){
    await page.goto(base+path);
    if(path==='/foundations/') await page.locator('.optional-exploration > summary').click();
    await expect(page.locator('.visual-frame').first()).toBeVisible();
    await expect(page.locator('.visual-takeaway').first()).not.toBeEmpty();
    await expect(page.locator('.visual-frame svg,.visual-frame .visual-node').first()).toBeVisible();
  }
  await context.close();
});
