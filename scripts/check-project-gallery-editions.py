"""Compare the existing site photos with the published media on each developer's project page."""
import concurrent.futures as cf
from collections import defaultdict
from hashlib import sha256
from io import BytesIO
import html
import json
import os
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit, quote, urlunsplit

import cv2
import fitz
import numpy as np
from PIL import Image, ImageOps, ImageDraw
import requests
from bs4 import BeautifulSoup

cv2.setNumThreads(1)
base = Path('reports/photo-review-20261126')
pages = json.loads((base/os.environ.get('PAGES', 'official-pages.json')).read_text())
galleries = json.loads(Path('data/catalogue/nmarket-galleries.json').read_text())
galleries['nachalo'] = [{'category':'Проект','src':s} for s in ["/images/projects/collected/nachalo-1-8d3501882f96.jpg","/images/projects/collected/nachalo-2-f7d9801a2b3e.jpg"]]
prior = {r['target'] for r in json.loads((base/'matches.json').read_text())}
shard = int(os.environ['SHARD'])
out = Path('results')/str(shard)
out.mkdir(parents=True, exist_ok=True)
(out/'candidates').mkdir(exist_ok=True)
pairs = []
quick = []
stats = []
headers = {'User-Agent':'Mozilla/5.0 (compatible; Mainhall catalogue photography review)'}
def fetch(url, limit=15_000_000):
    with requests.get(url,headers=headers,timeout=(5,12),stream=True) as response:
        if response.status_code!=200 or int(response.headers.get('content-length') or 0)>limit:
            return None
        data=bytearray()
        for chunk in response.iter_content(100_000):
            data.extend(chunk)
            if len(data)>limit:
                return None
        return bytes(data)

def image_data(data):
    if not data:
        return None
    with Image.open(BytesIO(data)) as im:
        if min(im.size)<220 or max(im.size)<580 or im.width*im.height>45_000_000:
            return None
        im=ImageOps.exif_transpose(im).convert('RGB')
        im.thumbnail((2000,2000))
        buffer=BytesIO()
        im.save(buffer,'JPEG',quality=90,optimize=True)
        return buffer.getvalue()

def safe(fn,*args):
    try:
        return fn(*args)
    except (ValueError,RuntimeError, OSError, requests.RequestException, Image.DecompressionBombError):
        return None

def media_page(url):
    raw=fetch(url,60_000_000)
    if not raw:
        return []
    if raw.startswith(b'%PDF'):
        assets=[]
        with fitz.open(stream=raw,filetype='pdf') as doc:
            seen=set()
            for page in doc:
                for xref,*_ in page.get_images():
                    if xref in seen:
                        continue
                    seen.add(xref)
                    obj=doc.extract_image(xref)
                    if obj and min(obj['width'],obj['height'])>=220:
                        data=safe(image_data,obj['image'])
                        if data:
                            assets.append((url+'#image-'+str(xref),data))
        return assets
    markup=html.unescape(raw.decode('utf-8',errors='replace')).replace('\\/','/')
    soup=BeautifulSoup(markup,'html.parser')
    found=[]
    for tag in soup.select('img, source, meta[property="og:image"], [data-bg], [data-background-image], a[href]'):
        for attr in ('data-src','data-original','data-bg','data-background-image','data-lazy','src','content','href','data-srcset','srcset'):
            val=tag.get(attr)
            if isinstance(val,str):
                found.extend(u.strip().split(' ')[0] for u in val.split(','))
    found.extend(re.findall(r"""(?:["'(\s=])((?:https?://|//|/)[^"'<>\s)\\]{4,800}?\.(?:webp|jpe?g|png|avif)(?:\?[^"'<>\s)\\]{0,200})?)""",markup,re.I))
    urls=[]
    for v in found:
        if not re.search(r'\.(?:webp|jpe?g|png|avif)(?:[?#]|$)',v,re.I):
            continue
        dest=urljoin(url,v)
        if urlsplit(dest).scheme not in ('http','https'):
            continue
        if re.search(r'(?:favicon|logo[-./_]|/logos/|icon[-/_.]|1x1|/upload/resize_cache/.*?/80_80|static-maps|yandex\.ru/maps|\.facebook\.|tracking)', dest,re.I):
            continue
        if dest not in urls:
            urls.append(dest)
    return [(u,None) for u in urls[:130]]

def candidate(item):
    url,data=item
    return url,data if data else safe(image_data,safe(fetch,url))

def signature(data):
    grayscale=cv2.imdecode(np.frombuffer(data,np.uint8),cv2.IMREAD_GRAYSCALE)
    h,w=grayscale.shape
    if max(w,h)>720:
        grayscale=cv2.resize(grayscale,(round(w*720/max(h,w)),round(h*720/max(h,w))),interpolation=cv2.INTER_AREA)
    points,des=cv2.SIFT_create(nfeatures=650).detectAndCompute(grayscale,None)
    dw=cv2.resize(grayscale,(33,24),interpolation=cv2.INTER_AREA)
    dh=dw[:,1:]>dw[:,:-1]
    return dh,np.float32([p.pt for p in points]),des,np.float32(grayscale.shape[::-1])

def match(a,b):
    pa,da,sa=a[1:];pb,db,sb=b[1:]
    if da is None or db is None or min(len(da),len(db))<26:
        return 0
    matches=cv2.BFMatcher().knnMatch(da,db,k=2)
    good=[m for m,n in matches if m.distance<.69*n.distance]
    if len(good)<25:
        return 0
    xa,xb=np.float32([pa[m.queryIdx] for m in good]),np.float32([pb[m.trainIdx] for m in good])
    mat,mask=cv2.estimateAffinePartial2D(xa,xb,method=cv2.RANSAC,ransacReprojThreshold=2.7)
    if mask is None:
        return 0
    mask=mask.ravel().astype(bool)
    if mask.sum()<25 or mask.mean()<.59:
        return 0
    def coverage(points,sz):
        return cv2.contourArea(cv2.convexHull(points))/float(np.prod(sz))
    if min(coverage(xa[mask],sa),coverage(xb[mask],sb))<.23:
        return 0
    return int(mask.sum())

def thumbnail(data):
    im=Image.open(BytesIO(data));im.thumbnail((208,132));return im.copy()

def flush():
    (out/'matches.json').write_text(json.dumps(pairs,ensure_ascii=False,indent=2))
    (out/'sources.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
    for start in range(0,len(quick),16):
        chunk=quick[start:start+16]
        sheet=Image.new('RGB',(840,((len(chunk)+1)//2)*156),'#151515');pen=ImageDraw.Draw(sheet)
        for i,(label,site,original) in enumerate(chunk):
            x=(i%2)*420;y=(i//2)*156
            sheet.paste(site,(x,y));sheet.paste(original,(x+210,y))
            pen.text((x+2,y+134),label,fill='white')
        sheet.save(out/('proof-%03d.jpg'%start),quality=88)

for slug in sorted(pages)[shard::int(os.environ.get('GROUPS_COUNT','8'))]:
    flags=[r['src'] for r in galleries.get(slug,[]) if r['category']=='Проект' and r['src'] not in prior]
    if not flags:
        continue
    raw_candidates={}
    for page in pages[slug][:3]:
        for url,data in safe(media_page,page) or []:
            raw_candidates.setdefault(url,(page,data))
    sources=list(raw_candidates)
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        site_data=dict(pool.map(lambda p:(p,safe(fetch,'https://main-hall.ru'+p)),flags))
        cdata=dict(pool.map(candidate,[(url,raw_candidates[url][1]) for url in sources]))
    sigs={}
    unique={}
    for url,raw in cdata.items():
        if not raw:
            continue
        key=sha256(raw).digest()
        if key in unique:
            continue
        unique[key]=url
        s=safe(signature,raw)
        if s is not None:
            sigs[url]=s
    if slug in ('nachalo','shagal','yuzhnaya-dolina'):
        coverage=out/'covers'/slug
        coverage.mkdir(exist_ok=True,parents=True)
        catalogue=[]
        for i,(url,sig) in enumerate(sigs.items()):
            data=cdata[url]
            catalogue.append({'id':i,'source':url,'page':raw_candidates[url][0],'sha256':sha256(data).hexdigest()})
            (coverage/('%03d.jpg'%i)).write_bytes(data)
        for start in range(0,len(catalogue),35):
            group=catalogue[start:start+35]
            sheet=Image.new('RGB',(1000,((len(group)+4)//5)*146),'#141414')
            pen=ImageDraw.Draw(sheet)
            for index,entry in enumerate(group):
                x=(index%5)*200;y=(index//5)*146
                photo=Image.open(BytesIO(cdata[entry['source']]))
                photo.thumbnail((196,127))
                sheet.paste(photo,(x,y));pen.text((x+2,y+129),str(entry['id']),fill='white')
            sheet.save(coverage/('index-%03d.jpg'%start),quality=85)
        (coverage/'index.json').write_text(json.dumps(catalogue,ensure_ascii=False))
    stats.append({'project':slug,'sourcePages':pages[slug],'candidates':len(sources),'decoded':len(sigs),'publishedPhotos':len(flags)})
    for path,data in site_data.items():
        if not data:
            continue
        a=safe(signature,data)
        if a is None:
            continue
        nearest=sorted(sigs,key=lambda u:np.count_nonzero(a[0]!=sigs[u][0]))[:10]
        scores=[(safe(match,a,sigs[u]) or 0,u) for u in nearest]
        if not scores:
            continue
        count,url=max(scores)
        if count==0:
            continue
        new=cdata[url];name=Path(path).name
        (out/'candidates'/name).write_bytes(new)
        pairs.append({'slug':slug,'target':path,'source':url,'page':raw_candidates[url][0],'inliers':count,'oldSha256':sha256(data).hexdigest(),'sha256':sha256(new).hexdigest()})
        quick.append((slug+' '+name[:8],thumbnail(data),thumbnail(new)))
    flush()
    print(slug, len(sigs),'official images;',len(pairs),'cumulative matches',flush=True)
flush()
