import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
export function pageJsBudget(url) {
  const html = fs.readFileSync(path.join('dist', url, 'index.html'), 'utf8');
  const queued = [
    ...html.matchAll(/(?:src|component-url|renderer-url)="(\/_astro\/[^"?]+\.js)/g),
  ].map((m) => path.resolve('dist' + m[1]));
  const seen = new Set();
  while (queued.length) {
    const file = queued.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /(?:\bfrom\s*|\bimport\s*|\bimport\(\s*)["'](\.\.?\/[^"']+\.js)["']/g,
    ))
      queued.push(path.resolve(path.dirname(file), match[1]));
  }
  return {
    initialJsGzip: [...seen].reduce(
      (total, file) => total + zlib.gzipSync(fs.readFileSync(file)).byteLength,
      0,
    ),
    jsFiles: seen.size,
  };
}
if (process.argv[1] && path.basename(process.argv[1]) === 'js-budget.mjs') {
  const report = JSON.parse(fs.readFileSync('qa/performance.json', 'utf8')).map((p) => ({
    ...p,
    ...pageJsBudget(p.path),
  }));
  fs.writeFileSync('qa/performance.json', JSON.stringify(report, null, 2));
  report.forEach((r) =>
    console.log(r.path, r.initialJsGzip + ' bytes gzip', r.jsFiles + ' modules'),
  );
  if (report.some((r) => r.initialJsGzip > 150000)) process.exitCode = 1;
}
