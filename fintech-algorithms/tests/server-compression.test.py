"""HTTP regression tests for the portable Python launcher (requires a build)."""
import gzip
import http.client
import importlib.util
from pathlib import Path
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('course_start', ROOT / 'start.py')
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class CompressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = launcher.ThreadingHTTPServer(('127.0.0.1', 0), launcher.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path='/', encoding='gzip', method='GET', headers=None):
        connection = http.client.HTTPConnection(*self.server.server_address)
        connection.request(method, path, headers={'Accept-Encoding': encoding, **(headers or {})})
        response = connection.getresponse()
        result = response.status, {key.lower(): value for key, value in response.getheaders()}, response.read()
        connection.close()
        return result

    def test_negotiation_and_identical_html(self):
        status, headers, body = self.request()
        self.assertEqual(status, 200)
        self.assertEqual(headers['content-encoding'], 'gzip')
        self.assertEqual(headers['content-type'], 'text/html')
        self.assertEqual(headers['vary'], 'Accept-Encoding')
        self.assertEqual(headers['x-content-type-options'], 'nosniff')
        original = (ROOT / 'dist/index.html').read_bytes()
        self.assertEqual(gzip.decompress(body), original)
        self.assertLess(len(body), len(original) / 2)
        for encoding in ('identity', 'gzip;q=0, *;q=1', 'gzip;q=invalid'):
            with self.subTest(encoding=encoding):
                _, plain_headers, plain_body = self.request(encoding=encoding)
                self.assertNotIn('content-encoding', plain_headers)
                self.assertEqual(plain_body, original)
        self.assertTrue(launcher.accepts_gzip('*;q=.5'))
        self.assertTrue(launcher.accepts_gzip('GZIP; q=1'))
        self.assertFalse(launcher.accepts_gzip())

    def test_all_financial_routes_and_capstone_json(self):
        pages = sorted((ROOT / 'dist/financial-problems').glob('*/*/index.html'))
        payloads = sorted((ROOT / 'dist/visual-data').glob('*.json'))
        self.assertEqual(len(pages), 96)
        self.assertEqual(len(payloads), 96)
        for file in pages + payloads:
            relative = str(file.relative_to(ROOT / 'dist'))
            url = '/' + relative.removesuffix('index.html')
            with self.subTest(url=url):
                status, headers, body = self.request(url + '?audit=1')
                self.assertEqual(status, 200)
                self.assertEqual(headers['content-encoding'], 'gzip')
                self.assertEqual(headers['content-type'], 'application/json' if file.suffix == '.json' else 'text/html')
                self.assertEqual(gzip.decompress(body), file.read_bytes())

    def test_head_redirect_and_conditionals(self):
        _, headers, _ = self.request()
        status, head_headers, body = self.request(method='HEAD')
        self.assertEqual(status, 200)
        self.assertEqual(head_headers['content-encoding'], 'gzip')
        self.assertEqual(head_headers['content-length'], headers['content-length'])
        self.assertEqual(body, b'')
        status, _, body = self.request(headers={'If-Modified-Since': headers['last-modified']})
        self.assertEqual(status, 304)
        self.assertEqual(body, b'')
        status, redirect_headers, _ = self.request('/measures?mode=print')
        self.assertEqual(status, 301)
        self.assertEqual(redirect_headers['location'], '/measures/?mode=print')

    def test_svg_and_unchanged_binary(self):
        status, headers, body = self.request('/favicon.svg')
        self.assertEqual(status, 200)
        self.assertEqual(headers['content-type'], 'image/svg+xml')
        self.assertEqual(gzip.decompress(body), (ROOT / 'public/favicon.svg').read_bytes())
        wheel = min((ROOT / 'public/python').glob('*.whl'), key=lambda p: p.stat().st_size)
        status, headers, body = self.request('/' + str(wheel.relative_to(ROOT / 'public')))
        self.assertEqual(status, 200)
        self.assertEqual(headers['content-type'], 'application/octet-stream')
        self.assertNotIn('content-encoding', headers)
        self.assertEqual(body, wheel.read_bytes())

    def test_missing_and_traversal_paths(self):
        for url in ('/missing-application-file', '/%2e%2e/package.json', '/../package.json'):
            with self.subTest(url=url):
                self.assertEqual(self.request(url)[0], 404)
        status, _, body = self.request('/missing-application-file', method='HEAD')
        self.assertEqual(status, 404)
        self.assertEqual(body, b'')


if __name__ == '__main__':
    unittest.main()
