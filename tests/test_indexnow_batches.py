import contextlib
import io
import json
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]

class Response(io.BytesIO):
    status = 200

class IndexNowBatchTest(unittest.TestCase):
    def test_large_catalogue_is_submitted_completely_with_projects_first(self):
        key = (ROOT/'_seo/indexnow-key.txt').read_text().strip()
        urls = ['https://main-hall.ru/units/test-'+str(i)+'/' for i in range(20001)]
        urls += ['https://main-hall.ru/projects/example/']
        batches = []
        sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+u+'</loc></url>' for u in urls)+'</urlset>'
        def respond(request, **kwargs):
            if isinstance(request, str):
                if request.endswith('/'+key+'.txt'): return Response(key.encode())
                if request.endswith('/robots.txt'): return Response(b'User-agent: *\nAllow: /\n')
                if request.endswith('/sitemap.xml'): return Response(sitemap.encode())
                raise AssertionError('Unexpected origin request')
            self.assertEqual('https://yandex.com/indexnow', request.full_url)
            batches.append(json.loads(request.data)['urlList'])
            return Response(b'')
        with patch('urllib.request.urlopen', side_effect=respond), contextlib.redirect_stdout(io.StringIO()):
            runpy.run_path(str(ROOT/'scripts/notify-indexnow.py'))
        self.assertEqual([10000,10000,2], [len(b) for b in batches])
        submitted = [u for b in batches for u in b]
        self.assertEqual(len(urls), len(submitted))
        self.assertEqual(set(urls), set(submitted))
        self.assertEqual('https://main-hall.ru/projects/example/', submitted[0])
