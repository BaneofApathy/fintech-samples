import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { createAppServer, acceptsGzip } from '../start.mjs';

let server: ReturnType<typeof createAppServer>;
let port: number;
const root = process.cwd();
function request(url: string, encoding?: string, method = 'GET') {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>(
    (resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: url,
          method,
          headers: encoding ? { 'Accept-Encoding': encoding } : {},
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () =>
            resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }),
          );
        },
      );
      req.on('error', reject);
      req.end();
    },
  );
}
beforeAll(async () => {
  server = createAppServer(0);
  await once(server, 'listening');
  port = (server.address() as { port: number }).port;
});
afterAll(async () => {
  if (!server?.listening) return;
  await new Promise<void>((resolve, reject) =>
    server.close((error?: Error) => (error ? reject(error) : resolve())),
  );
});
describe('static server transfer encoding', () => {
  it('honors gzip, wildcard, and explicit rejection quality values', () => {
    expect(acceptsGzip('br, gzip, deflate')).toBe(true);
    expect(acceptsGzip('*;q=0.5')).toBe(true);
    expect(acceptsGzip('gzip;q=0, *;q=1')).toBe(false);
    expect(acceptsGzip('gzip;q=0.2, identity;q=1')).toBe(true);
    expect(acceptsGzip('GZIP; q=1')).toBe(true);
    expect(acceptsGzip('gzip;q=not-a-number')).toBe(false);
    expect(acceptsGzip('identity')).toBe(false);
    expect(acceptsGzip()).toBe(false);
  });
  it('serves compressed HTML with byte-identical decoded content and original MIME', async () => {
    const compressed = await request('/', 'gzip'),
      identity = await request('/', 'identity');
    expect(compressed.status).toBe(200);
    expect(compressed.headers['content-encoding']).toBe('gzip');
    expect(compressed.headers.vary).toBe('Accept-Encoding');
    expect(identity.headers.vary).toBe('Accept-Encoding');
    expect(compressed.headers['content-type']).toBe('text/html');
    expect(compressed.headers['x-content-type-options']).toBe('nosniff');
    expect(gunzipSync(compressed.body)).toEqual(identity.body);
    expect(identity.body).toEqual(fs.readFileSync(path.join(root, 'dist/index.html')));
    expect(compressed.body.length).toBeLessThan(identity.body.length / 2);
    expect(identity.headers['content-encoding']).toBeUndefined();
    expect(Number(identity.headers['content-length'])).toBe(identity.body.length);
  });
  it('preserves algorithm paths, query strings, and explicit identity requests', async () => {
    const url = '/algorithms/logistic-regression/formula/?print=1';
    const res = await request(url, 'gzip;q=0, identity');
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.body).toEqual(
      fs.readFileSync(path.join(root, 'dist/algorithms/logistic-regression/formula/index.html')),
    );
  });
  it('serves every financial case and its capstone JSON with gzip and unchanged content', async () => {
    const directory = path.join(root, 'dist/financial-problems');
    const pages = fs
      .readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((algorithm) =>
        fs
          .readdirSync(path.join(directory, algorithm.name), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => `${algorithm.name}/${entry.name}`),
      );
    expect(pages).toHaveLength(96);
    for (const page of pages) {
      const res = await request(`/financial-problems/${page}/`, 'gzip');
      expect(res.status, page).toBe(200);
      expect(res.headers['content-encoding'], page).toBe('gzip');
      expect(gunzipSync(res.body)).toEqual(
        fs.readFileSync(path.join(directory, page, 'index.html')),
      );
    }
    const payloads = fs
      .readdirSync(path.join(root, 'dist/visual-data'))
      .filter((file) => file.endsWith('.json'));
    expect(payloads).toHaveLength(96);
    for (const payload of payloads) {
      const res = await request(`/visual-data/${payload}`, 'gzip');
      expect(res.status, payload).toBe(200);
      expect(res.headers['content-type']).toBe('application/json');
      expect(res.headers['content-encoding'], payload).toBe('gzip');
      expect(gunzipSync(res.body)).toEqual(
        fs.readFileSync(path.join(root, 'dist/visual-data', payload)),
      );
    }
  });
  it('compresses SVG assets but leaves binary Python wheels unchanged', async () => {
    const svg = await request('/favicon.svg', 'gzip');
    expect(svg.headers['content-type']).toBe('image/svg+xml');
    expect(gunzipSync(svg.body)).toEqual(fs.readFileSync(path.join(root, 'public/favicon.svg')));
    const walk = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory()
            ? walk(path.join(dir, e.name))
            : e.name.endsWith('.whl')
              ? [path.join(dir, e.name)]
              : [],
        );
    const wheel = walk(path.join(root, 'public')).sort(
      (a, b) => fs.statSync(a).size - fs.statSync(b).size,
    )[0];
    expect(wheel).toBeDefined();
    const url =
      '/' +
      path
        .relative(path.join(root, 'public'), wheel)
        .split(path.sep)
        .map(encodeURIComponent)
        .join('/');
    const res = await request(url, 'gzip');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/octet-stream');
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.body).toEqual(fs.readFileSync(wheel));
  });
  it('answers HEAD without a body while retaining representation metadata', async () => {
    const compressed = await request('/', 'gzip', 'HEAD'),
      identity = await request('/', 'identity', 'HEAD');
    expect(compressed.status).toBe(200);
    expect(compressed.headers['content-encoding']).toBe('gzip');
    expect(compressed.body.length).toBe(0);
    expect(identity.body.length).toBe(0);
    expect(Number(identity.headers['content-length'])).toBe(
      fs.statSync(path.join(root, 'dist/index.html')).size,
    );
  });
  it('keeps 404 and malformed-path behavior and cannot escape the asset roots', async () => {
    expect((await request('/definitely-absent-file', 'gzip')).status).toBe(404);
    expect((await request('/%2e%2e/package.json', 'gzip')).status).toBe(404);
    expect((await request('/%E0%A4%A', 'gzip')).status).toBe(400);
    const head = await request('/definitely-absent-file', 'gzip', 'HEAD');
    expect(head.status).toBe(404);
    expect(head.body.length).toBe(0);
  });
});
