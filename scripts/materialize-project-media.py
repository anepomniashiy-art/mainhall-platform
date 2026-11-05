#!/usr/bin/env python3
"""Materialize only visually approved project media; never discover or select assets.

The private provenance manifest contains exact source URLs, dimensions and local
paths approved during visual review. Failed downloads are fatal; a placeholder,
plan, logo or alternate source is never substituted.
"""
import argparse
import concurrent.futures
import io
import json
import os
from pathlib import Path
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'data/provenance/new-project-photo-completion-2026-11-05.json'
MAX_BYTES = 16_000_000
MAX_SIZE = (1800, 1400)

def materialize(row, check_only=False):
    local = row['localSrc']
    if not local.startswith('/images/projects/collected/'):
        raise ValueError('Unexpected project image destination')
    target = (ROOT / 'public' / local.lstrip('/')).resolve()
    if not target.is_relative_to((ROOT / 'public/images/projects/collected').resolve()):
        raise ValueError('Image destination escapes project media directory')
    expected = (row['width'], row['height'])
    if target.exists():
        with Image.open(target) as image:
            image.load()
            if image.size != expected or image.format != 'WEBP':
                raise ValueError('Existing media dimensions or format mismatch: '+target.name)
        return 'existing'
    if check_only:
        raise ValueError('Approved project image is missing: '+target.name)
    parsed = urllib.parse.urlsplit(row['url'])
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Expected public HTTPS image URL')
    url = urllib.parse.quote(row['url'], safe=':/?=&%+;,()@')
    request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0', 'Referer':row['source']})
    with urllib.request.urlopen(request, timeout=30) as response:
        if urllib.parse.urlsplit(response.url).scheme != 'https':
            raise ValueError('Unexpected non-HTTPS image redirect')
        data = response.read(MAX_BYTES+1)
    if len(data) > MAX_BYTES:
        raise ValueError('Image response exceeds size limit')
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
    image.load()
    if min(image.size) < 350:
        raise ValueError('Image is smaller than approved minimum')
    image.thumbnail(MAX_SIZE)
    image = image.convert('RGB')
    if image.size != expected:
        raise ValueError('Downloaded media dimensions changed: '+target.name)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp')
    image.save(temporary, 'WEBP', quality=85)
    os.replace(temporary,target)
    return 'downloaded'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--workers', type=int, default=8)
    args = parser.parse_args()
    rows = json.loads(MANIFEST.read_text())
    unique = {row['localSrc']:row for row in rows}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(12,args.workers))) as executor:
        results = list(executor.map(lambda row:materialize(row,args.check_only), unique.values()))
    print('Approved project media:',len(unique),'· downloaded:',results.count('downloaded'),'· verified existing:',results.count('existing'))

if __name__ == '__main__':
    main()
