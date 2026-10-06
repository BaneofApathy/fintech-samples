#!/usr/bin/env python3
"""Serve the ready-built application and its shared local assets."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import datetime
import email.utils
import gzip
import io
import webbrowser

ROOT = Path(__file__).resolve().parent


def accepts_gzip(header=''):
    """An explicit gzip preference, including q=0, overrides the wildcard."""
    encodings = {}
    for entry in header.lower().split(','):
        name, *parameters = entry.strip().split(';')
        quality = next((p.strip()[2:] for p in parameters if p.strip().startswith('q=')), '1')
        try:
            encodings[name] = float(quality)
        except ValueError:
            encodings[name] = 0
    return encodings.get('gzip', encodings.get('*', 0)) > 0


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.mjs': 'application/javascript',
        '.wasm': 'application/wasm',
        '.whl': 'application/octet-stream',
    }

    def translate_path(self, path):
        relative = unquote(urlsplit(path).path).lstrip('/')
        for folder in ('dist', 'public'):
            root = ROOT / folder
            candidate = (root / relative).resolve()
            if candidate.is_relative_to(root) and candidate.is_file():
                return str(candidate)
            if candidate.is_relative_to(root) and candidate.is_dir() and (candidate / 'index.html').is_file():
                return str(candidate)
        return str(ROOT / 'dist' / '__page_not_found__')

    def send_head(self):
        self._vary_accept_encoding = False
        target = Path(self.translate_path(self.path))
        if target.is_dir():
            # Preserve the standard server's canonical-directory redirect.
            if not urlsplit(self.path).path.endswith('/'):
                return super().send_head()
            target = target / 'index.html'
        if not target.is_file():
            return super().send_head()
        content_type = self.guess_type(str(target))
        self._vary_accept_encoding = (
            content_type.startswith('text/')
            or content_type in ('application/javascript', 'application/json', 'image/svg+xml')
        )
        if not self._vary_accept_encoding or not accepts_gzip(self.headers.get('Accept-Encoding', '')):
            return super().send_head()
        try:
            with target.open('rb') as source:
                stat = target.stat()
                # Retain the standard handler's conditional-request behavior.
                if 'If-Modified-Since' in self.headers and 'If-None-Match' not in self.headers:
                    try:
                        modified_since = email.utils.parsedate_to_datetime(self.headers['If-Modified-Since'])
                        if modified_since.tzinfo is None:
                            modified_since = modified_since.replace(tzinfo=datetime.timezone.utc)
                        modified_at = datetime.datetime.fromtimestamp(stat.st_mtime, datetime.timezone.utc).replace(microsecond=0)
                        if modified_at <= modified_since:
                            return super().send_head()
                    except (TypeError, ValueError, OverflowError):
                        pass
                content = gzip.compress(source.read(), mtime=0)
        except OSError:
            return super().send_head()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Last-Modified', self.date_time_string(stat.st_mtime))
        self.end_headers()
        return io.BytesIO(content)

    def log_message(self, format, *args):
        pass

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        if getattr(self, '_vary_accept_encoding', False):
            self.send_header('Vary', 'Accept-Encoding')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    if not (ROOT / 'dist/index.html').exists():
        raise SystemExit('Build the app first with pnpm install && pnpm build.')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    url = f'http://localhost:{args.port}'
    print(f'Fintech Algorithms: {url}\nKeep this window open. Press Ctrl+C to stop.', flush=True)
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
