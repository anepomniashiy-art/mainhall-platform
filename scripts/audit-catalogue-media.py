"""Inspect served catalogue images and locate matching frames in official galleries."""
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
from urllib.parse import urljoin

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps

cv2.setNumThreads(1)
root = Path("public")
out = Path("photo-review")
cache = Path(".photo-review-cache")
out.mkdir(exist_ok=True)
cache.mkdir(exist_ok=True)

def read(path):
    return json.loads(Path(path).read_text())

def download(url):
    import time
    for attempt in range(2):
        try:
            request = Request(url, headers={"User-Agent": "Mainhall project image review/1.0"})
            with urlopen(request, timeout=16) as response:
                data = response.read(25_000_001)
            if len(data) > 25_000_000:
                raise ValueError("oversize")
            return data
        except Exception:
            if attempt:
                raise
            time.sleep(0.4)

def filename(src):
    return cache / sha256(src.encode()).hexdigest()

def load_image(src):
    with Image.open(filename(src)) as photo:
        return ImageOps.exif_transpose(photo).convert("RGB")

def collect(src):
    try:
        path = filename(src)
        local = root / src.lstrip("/")
        if not path.exists():
            if src.startswith("/") and local.is_file() and not src.startswith("/images/nmarket/"):
                data = local.read_bytes()
            else:
                url = urljoin("https://main-hall.ru/", src)
                data = download(url)
            path.write_bytes(data)
        with Image.open(path) as im:
            im.verify()
        return src, None
    except Exception as error:
        return src, str(error)[:140]

def downloaded(src):
    return src in valid

def make_sheet(rows, file):
    w, h = 212, 153
    canvas = Image.new("RGB", (w * 5, h * ((len(rows) + 4) // 5)), "#151515")
    pen = ImageDraw.Draw(canvas)
    for i, (label, src) in enumerate(rows):
        thumb = load_image(src)
        thumb.thumbnail((w - 4, h - 18))
        x, y = (i % 5) * w, (i // 5) * h
        canvas.paste(thumb, (x + (w - thumb.width)//2, y))
        pen.text((x+2, y+h-16), label[:35], fill="white")
    canvas.save(file, quality=86)

galleries = read("data/catalogue/nmarket-galleries.json")
official = {slug: [x["src"] for x in entries] for slug, entries in read("data/catalogue/project-galleries.json").items()}
for slug, entry in read("data/catalogue/collected-project-images.json").items():
    official.setdefault(slug, []).append(entry["src"])
for entry in read("scripts/public-project-sources.json"):
    official.setdefault(entry["slug"], []).extend(entry.get("mediaUrls", []))
lime_gallery = "https://lime-dom.ru/gallery/"
try:
    lime_html = download(lime_gallery).decode()
except Exception as error:
    lime_html = ""
    print("Official gallery unavailable:", str(error)[:120], flush=True)
official["laym"] = sorted(set(urljoin(lime_gallery, path) for path in re.findall(r"""["']([^"']*/upload/iblock/[^"'<>]+?\.(?:jpg|jpeg|webp))["']""", lime_html, re.I) if "/upload/iblock/" in path))
print("Lime official gallery candidates", len(official["laym"]), flush=True)
groups = {row["src"]:slug for slug, rows in galleries.items() for row in rows}
tracked = sorted("/" + p.relative_to(root).as_posix() for p in root.rglob("*") if p.suffix.lower() in {".jpg",".jpeg",".webp",".png",".avif",".gif"})
wanted = set(groups) | set(tracked)
for slug in galleries:
    wanted.update(official.get(slug, []))
with ThreadPoolExecutor(max_workers=8) as pool:
    result = dict(pool.map(collect, sorted(wanted)))
valid = {src for src, error in result.items() if error is None}
errors = {src:error for src,error in result.items() if error}
(out/"unavailable.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2))
print("Loaded",len(valid),"of",len(wanted),"errors", list(errors.items())[:5], flush=True)

@lru_cache(maxsize=48)
def features(src):
    im = load_image(src).convert("L")
    im.thumbnail((900,900))
    gray = np.asarray(im)
    points, descriptors = cv2.SIFT_create(nfeatures=1000).detectAndCompute(gray, None)
    return np.float32([p.pt for p in points]), descriptors, np.float32(im.size)

def compare(a, b):
    pa, da, size_a = features(a)
    pb, db, size_b = features(b)
    if da is None or db is None or min(len(da),len(db))<28:
        return None
    neighbors = cv2.BFMatcher().knnMatch(da,db,k=2)
    good = [m for m,n in neighbors if m.distance < 0.70*n.distance]
    if len(good)<25:
        return None
    xa = np.float32([pa[m.queryIdx] for m in good])
    xb = np.float32([pb[m.trainIdx] for m in good])
    matrix, mask = cv2.estimateAffinePartial2D(xa, xb, method=cv2.RANSAC, ransacReprojThreshold=3.0)
    if mask is None:
        return None
    mask = mask.ravel().astype(bool)
    if sum(mask)<25 or mask.mean()<0.55:
        return None
    xa,xb = xa[mask],xb[mask]
    def coverage(points,size):
        return cv2.contourArea(cv2.convexHull(points)) / float(np.prod(size))
    if min(coverage(xa,size_a),coverage(xb,size_b)) < 0.20:
        return None
    return int(sum(mask))

matches = []
for slug, rows in galleries.items():
    sources = [s for s in dict.fromkeys(official.get(slug, [])) if downloaded(s) and not s.startswith("/images/nmarket/")]
    if not sources:
        continue
    for row in rows:
        target = row["src"]
        if not downloaded(target) or row["category"]!="Проект":
            continue
        best = None
        for source in sources:
            count = compare(target, source)
            if count and (best is None or count > best[0]):
                best = count,source
        if best:
            count,src = best
            matches.append(dict(slug=slug,target=target,source=src,inliers=count))
print("Frame matches",len(matches),Counter(r["slug"] for r in matches),flush=True)
(out/"matches.json").write_text(json.dumps(matches, ensure_ascii=False, indent=2))
review = [(str(i),src) for i,src in enumerate(sorted(valid))]
(out/"index.json").write_text(json.dumps([src for _,src in review],ensure_ascii=False))
for offset in range(0,len(review),40):
    make_sheet(review[offset:offset+40],out/("sheet-%04d.jpg"%offset))
if matches:
    for offset in range(0,len(matches),15):
        sample=matches[offset:offset+15]
        make_sheet([(str(i)+suffix,r[key]) for i,r in enumerate(sample,offset) for suffix,key in [(" site","target"),(" official","source")]],out/("matches-%04d.jpg"%offset))
for group,sources in [("laym-site",[r["src"] for r in galleries["laym"]]),("laym-official",official["laym"])]:
    sample=[s for s in sources if downloaded(s)]
    if sample:
        make_sheet([(str(i),s) for i,s in enumerate(sample)],out/(group+".jpg"))
        (out/(group+".json")).write_text(json.dumps(sample,indent=2))
print("Contact sheets",len(list(out.glob("sheet*"))))
