import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// An explicit gzip preference overrides the wildcard, including gzip;q=0.
export function acceptsGzip(header = '') {
  const encodings = new Map(
    header.split(',').map((entry) => {
      const [name, ...parameters] = entry.trim().toLowerCase().split(';');
      const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
      return [name, quality ? Number(quality.trim().slice(2)) : 1];
    }),
  );
  return (encodings.get('gzip') ?? encodings.get('*') ?? 0) > 0;
}

export function createAppServer(port = 8000) {
  const server = createServer((req, res) => {
    let relative;
    try {
      relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(
        /^\/+/,
        '',
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    let file;
    for (const dir of ['dist', 'public']) {
      const base = path.join(root, dir);
      const candidate = path.resolve(base, relative);
      if (!candidate.startsWith(base + path.sep) && candidate !== base) continue;
      if (fs.existsSync(candidate)) {
        file = fs.statSync(candidate).isDirectory()
          ? path.join(candidate, 'index.html')
          : candidate;
        if (fs.existsSync(file)) break;
        file = undefined;
      }
    }
    if (!file) {
      res.writeHead(404).end(req.method === 'HEAD' ? undefined : 'Page not found');
      return;
    }
    const contentType = mime[path.extname(file)] || 'application/octet-stream';
    const compressible = /^(text\/|application\/(javascript|json)|image\/svg\+xml)/.test(
      contentType,
    );
    const compressed = compressible && acceptsGzip(req.headers['accept-encoding']);
    const headers = { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' };
    if (compressible) headers.Vary = 'Accept-Encoding';
    if (compressed) headers['Content-Encoding'] = 'gzip';
    else headers['Content-Length'] = fs.statSync(file).size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const done = (error) => {
      if (error) res.destroy(error);
    };
    if (compressed) pipeline(fs.createReadStream(file), createGzip(), res, done);
    else pipeline(fs.createReadStream(file), res, done);
  });
  server.listen(port, '127.0.0.1');
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8000);
  createAppServer(port);
  console.log(
    `Fintech Algorithms: http://localhost:${port}\nKeep this window open. Press Ctrl+C to stop.`,
  );
}
