import { chromium } from '@playwright/test';
import sparticuz from '@sparticuz/chromium';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { createAppServer } from '../start.mjs';
const server = createAppServer(8765);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || (await sparticuz.executablePath()),
  args: sparticuz.args,
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const paths = [
  '/',
  '/algorithms/logistic-regression/',
  '/algorithms/logistic-regression/formula/',
  '/algorithms/logistic-regression/worked/',
  '/measures/roc-auc-and-gini/',
  '/measure-picker/',
  '/labs/',
  '/instructor/',
  '/synthesis/',
  '/explorers/threshold-explorer/',
];
fs.mkdirSync('qa/screenshots', { recursive: true });
const results = [];
try {
  for (const p of paths) {
    await page.goto('http://127.0.0.1:8765' + p, { waitUntil: 'networkidle' });
    await page.screenshot({
      path:
        'qa/screenshots/' + (p === '/' ? 'home' : p.split('/').filter(Boolean).join('-')) + '.png',
      fullPage: false,
    });
    const axe = await new AxeBuilder({ page }).analyze();
    results.push({
      path: p,
      title: await page.title(),
      violations: axe.violations
        .filter((x) => ['serious', 'critical'].includes(x.impact))
        .map((x) => ({
          id: x.id,
          impact: x.impact,
          description: x.description,
          nodes: x.nodes.map((n) => n.target),
        })),
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    });
    console.log(JSON.stringify(results.at(-1)));
  }
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://127.0.0.1:8765/');
  await page.screenshot({ path: 'qa/screenshots/home-mobile.png', fullPage: false });
  console.log(
    'Mobile overflow',
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  );
  console.log('Page errors', errors);
  fs.writeFileSync('qa/quick-browser.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
  server.close();
}
