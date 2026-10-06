import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const base = ('/' + (process.env.BASE_PATH || '/').replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const hash = createHash('sha256');
const assets = walk('dist').filter(f => !f.endsWith('.map') && !/\/(sw\.js|offline-manifest\.json)$/.test(f)).map(f => {
  const data = fs.readFileSync(f), url = base + path.relative('dist', f).split(path.sep).join('/');
  hash.update(url); hash.update(data); return { url, bytes: data.length };
});
const manifest = { version: hash.digest('hex').slice(0, 12), totalBytes: assets.reduce((n, a) => n + a.bytes, 0), assets };
fs.writeFileSync('dist/offline-manifest.json', JSON.stringify(manifest));
fs.writeFileSync('dist/sw.js', fs.readFileSync('scripts/offline-worker.js', 'utf8').replace('/* MANIFEST */ null', JSON.stringify(manifest)).replace('/* BASE */ "/"', JSON.stringify(base)));
console.log(`Optional offline download: ${assets.length} assets, ${(manifest.totalBytes / 1048576).toFixed(1)} MiB, version ${manifest.version}.`);
