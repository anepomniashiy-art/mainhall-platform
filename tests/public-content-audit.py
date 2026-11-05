"""Check every exported page for source credits, external sales links and missing assets."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.text = []
        self.links = []
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style', 'head'):
            self.hidden += 1
        if self.hidden:
            return
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag == 'img':
            self.images.append(attrs.get('src', ''))

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head') and self.hidden:
            self.hidden -= 1

    def handle_data(self, data):
        if not self.hidden:
            self.text.append(data)


root = Path('out')
assert root.is_dir(), 'Build the site first'
errors = []
pages = list(root.rglob('*.html'))
allowed = {'main-hall.ru', 'www.main-hall.ru', 't.me', 'wa.me'}
# Financial references to the source of a final payment are legitimate buyer information.
for path in pages:
    page = Page()
    page.feed(path.read_text())
    text = ' '.join(page.text)
    if re.search(r'прайс[\w-]*|официальн\w*\s+фид|выгрузк\w*|по данным девелопера|источники исследования', text, re.I):
        errors.append(f'{path}: internal sourcing text is visible')
    for href in page.links:
        url = urlsplit(href)
        if url.scheme in ('http', 'https') and url.hostname not in allowed:
            errors.append(f'{path}: external link {href}')
        elif href.startswith('/') and not href.startswith('//'):
            target = root / unquote(url.path).lstrip('/')
            if url.path.endswith('/'):
                target /= 'index.html'
            if not target.exists():
                errors.append(f'{path}: missing internal target {href}')
    for src in page.images:
        if src.startswith('/') and not (root / unquote(urlsplit(src).path).lstrip('/')).is_file():
            errors.append(f'{path}: missing image {src}')

assert not errors, '\n'.join(errors[:40])
print(f'Public content audit PASS: {len(pages)} pages; no source credits, external sales links or missing local assets.')
