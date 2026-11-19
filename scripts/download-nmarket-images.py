"""Download every unique original in a local XML feed, with resumable verification.

No credentials are accepted, logged or retained by this script.
"""
import argparse
import gzip
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import time
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from PIL import Image

def main():
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument('--xml', type=Path)
    source.add_argument('--source-manifest', type=Path)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=16)
    args = parser.parse_args()
    target = Path(__file__).resolve().parents[1]/'public/images/nmarket'
    target.mkdir(parents=True, exist_ok=True)
    urls = set(); expected = {}
    if args.source_manifest:
        saved = json.loads(gzip.decompress(args.source_manifest.read_bytes()).decode() if args.source_manifest.suffix=='.gz' else args.source_manifest.read_text())
        expected = {row['url']:row for row in saved['images']}
        urls.update(expected)
    else:
        for _, el in ET.iterparse(args.xml, events=['end']):
            if el.tag.split('}')[-1] == 'image':
                urls.add((el.text or '').strip().replace('http://', 'https://', 1))
            if el.tag.split('}')[-1] == 'offer': el.clear()
    if not all(url.startswith('https://img.nmarket.pro/') for url in urls):
        raise ValueError('Unexpected media host; review the feed before downloading')

    def record(url, file):
        with Image.open(file) as image:
            width, height = image.size; image.verify()
        with file.open('rb') as source:
            digest = hashlib.file_digest(source,'sha256').hexdigest()
        if url in expected and digest != expected[url]['sha256']:
            raise ValueError('Image differs from the verified snapshot')
        return {'url':url,'src':'/images/nmarket/'+file.name,'bytes':file.stat().st_size,
                'width':width,'height':height,'sha256':digest}

    existing_files = {file.stem:file for file in target.iterdir() if file.suffix != '.partial'}

    def download(url):
        key = hashlib.sha256(url.encode()).hexdigest()[:24]
        for file in ([existing_files[key]] if key in existing_files else []):
            if file.suffix == '.partial': continue
            try: return record(url, file)
            except Exception: pass
        for attempt in range(5):
            try:
                request = Request(url, headers={'User-Agent':'MAINHALL catalogue media import'})
                with urlopen(request, timeout=45) as response: data = response.read()
                with Image.open(io.BytesIO(data)) as image:
                    format_ = image.format; image.verify()
                ext = {'JPEG':'jpg','PNG':'png','WEBP':'webp','GIF':'gif','AVIF':'avif'}.get(format_)
                if not ext: raise ValueError('Unsupported media format')
                file = target/(key+'.'+ext)
                with tempfile.NamedTemporaryFile(dir=target,prefix=key+'.',suffix='.partial',delete=False) as temp:
                    temp.write(data); pending = temp.name
                os.replace(pending,file)
                return record(url,file)
            except Exception as error:
                if attempt == 4: return {'url':url,'error':type(error).__name__}
                time.sleep(min(2**attempt, 8))

    records = []
    args.manifest.parent.mkdir(parents=True,exist_ok=True)
    def checkpoint():
        pending = args.manifest.with_suffix(args.manifest.suffix+'.partial')
        pending.write_text(json.dumps(records,ensure_ascii=False,separators=(',',':')))
        os.replace(pending,args.manifest)
    with ThreadPoolExecutor(max_workers=max(1,min(args.workers,128))) as pool:
        for i, row in enumerate(pool.map(download,sorted(urls)),1):
            records.append(row)
            if i % 200 == 0:
                checkpoint()
                print(json.dumps({'completed':i,'total':len(urls),'errors':sum('error' in r for r in records)}),flush=True)
    checkpoint()
    failures = sum('error' in row for row in records)
    print(json.dumps({'completed':len(records),'total':len(urls),'errors':failures}))
    if failures: raise SystemExit('Media is incomplete; rerun to retry failed originals')

if __name__ == '__main__': main()
