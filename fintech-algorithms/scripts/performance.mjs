import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import sparticuz from '@sparticuz/chromium';
import { createAppServer } from '../start.mjs';
import { pageJsBudget } from './js-budget.mjs';
const server = createAppServer(8768);
const chrome = await launch({
  chromePath: process.env.CHROMIUM_EXECUTABLE,
  chromeFlags: process.platform === 'linux'
    ? sparticuz.args.filter((a) => a !== '--single-process')
    : ['--headless=new', '--no-first-run', '--disable-dev-shm-usage'],
});
const pages = [
  '/',
  '/algorithms/logistic-regression/',
  '/algorithms/logistic-regression/formula/',
  '/measures/',
  '/measures/precision/',
  '/financial-problems/logistic-regression/probability-of-default-and-delinquency/',
  '/synthesis/',
];
const report = [];
try {
  for (const url of pages) {
    const result = await lighthouse('http://127.0.0.1:8768' + url, {
      port: chrome.port,
      onlyCategories: ['performance'],
      output: 'json',
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 360,
        height: 780,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttlingMethod: 'simulate',
    });
    const { initialJsGzip, jsFiles } = pageJsBudget(url);
    const item = {
      path: url,
      performance: Math.round(result.lhr.categories.performance.score * 100),
      initialJsGzip,
      jsFiles,
      metrics: {
        fcp: result.lhr.audits['first-contentful-paint'].numericValue,
        lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
        tbt: result.lhr.audits['total-blocking-time'].numericValue,
        cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
      },
    };
    report.push(item);
    console.log(JSON.stringify(item));
  }
  fs.writeFileSync('qa/performance.json', JSON.stringify(report, null, 2));
  if (report.some((p) => p.performance < 90 || p.initialJsGzip > 150000)) process.exitCode = 1;
} finally {
  await chrome.kill();
  server.close();
}
