import { chromium, expect } from '@playwright/test';
import sparticuz from '@sparticuz/chromium';
import fs from 'node:fs';
import { createAppServer } from '../start.mjs';
const server = createAppServer(8767);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || chromium.executablePath(),
  args:
    process.env.CHROMIUM_EXECUTABLE && process.platform !== 'linux'
      ? []
      : sparticuz.args.filter((arg) => arg !== '--single-process'),
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on('console', (m) => {
  console.log(m.type(), m.text().slice(0, 2500));
});
page.on('pageerror', (e) => console.log('PAGE ERROR', String(e), e.name, e.message, e.stack));
page.on('requestfailed', (r) => console.log('FAILED REQUEST', r.url(), r.failure()));
page.on('response', (r) => {
  if (r.status() >= 400) console.log('HTTP ERROR', r.status(), r.url());
});
await page.addInitScript(() => {
  window.addEventListener('unhandledrejection', (e) =>
    console.log('REJECTION', String(e.reason), e.reason?.stack),
  );
});
try {
  await page.goto('http://127.0.0.1:8767/');
  await page.locator("[data-offline-prepare]").click();
  await expect(page.locator("[data-offline-message]")).toContainText("Offline copy complete", { timeout: 120000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 90000 })
    .toBe(true);
  await page.goto('http://127.0.0.1:8767/labs/lab/index.html?path=logistic-regression.ipynb');
  await page
    .locator('.jp-CodeCell .cm-content')
    .first()
    .waitFor({ state: 'visible', timeout: 60000 });
  await page.locator('.jp-CodeCell .cm-content').first().click();
  await page.keyboard.press('Shift+Enter');
  await page
    .locator('.jp-OutputArea-output')
    .filter({ hasText: 'ROC-AUC:' })
    .first()
    .waitFor({ state: 'visible', timeout: 60000 });
  const output = await page.locator('.jp-OutputArea-output').allTextContents();
  fs.mkdirSync('qa/screenshots', { recursive: true });
  await page.screenshot({ path: 'qa/screenshots/notebook-logistic.png' });
  const results = [{ notebook: 'logistic-regression.ipynb', offline: false, output }];
  await page.context().setOffline(true);
  const labs = JSON.parse(fs.readFileSync('src/data/labs.json', 'utf8'));
  let execution = 1;
  for (const [slug, lab] of Object.entries(labs)) {
    const notebook = JSON.parse(fs.readFileSync(`labs/${slug}.ipynb`, 'utf8'));
    const code = notebook.cells
      .filter((c) => c.cell_type === 'code')
      .map((c) => c.source.join(''))
      .join('\n\n');
    const cell = page.locator('.jp-CodeCell .cm-content').first();
    await cell.scrollIntoViewIfNeeded();
    await cell.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(code);
    const started = Date.now();
    await page.keyboard.press('Shift+Enter');
    execution++;
    await expect(page.locator('.jp-CodeCell .jp-InputPrompt').first()).toHaveText(
      new RegExp('\\[\\s*' + execution + '\\s*\\]:'),
      { timeout: 60000 },
    );
    const text = await page.locator('.jp-OutputArea-output').allTextContents();
    if (
      !text.join('\n').toLowerCase().includes(lab.metric.toLowerCase()) ||
      /Traceback|Error:/.test(text.join('\n'))
    )
      throw new Error(slug + ' did not print its primary metric');
    results.push({
      notebook: slug + '.ipynb',
      offline: true,
      seconds: (Date.now() - started) / 1000,
      output: text,
    });
    console.log('OFFLINE NOTEBOOK', slug, results.at(-1).seconds + 's');
  }

  await page.keyboard.press('ControlOrMeta+S');
  await page.reload();
  await page
    .locator('.jp-CodeCell .cm-content')
    .first()
    .waitFor({ state: 'visible', timeout: 60000 });
  results.push({ offline: true, reload: 'passed' });
  await page.goto('http://127.0.0.1:8767/algorithms/logistic-regression/worked/');
  await expect(page.locator('#exercise-A01-worked')).toBeVisible();
  results.push({ offline: true, returnToCourse: 'passed' });
  console.log('NOTEBOOK PASS', output);
  fs.writeFileSync(
    'qa/notebook-results.json',
    JSON.stringify({ status: 'passed', results }, null, 2),
  );
} catch (e) {
  process.exitCode = 1;
  fs.writeFileSync(
    'qa/notebook-results.json',
    JSON.stringify({ status: 'failed', error: e.message }, null, 2),
  );
  console.log('NOTEBOOK FAIL', e.message);
  console.log((await page.locator('body').innerText()).slice(-6000));
  await page.screenshot({ path: 'qa/screenshots/notebook-error.png' });
} finally {
  await browser.close();
  server.close();
}
