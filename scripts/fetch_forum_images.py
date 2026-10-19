#!/usr/bin/env python3
"""Fetch render/photo images from the official FORUM (MR Group) microsite on a
clean-internet runner. Renders with Playwright (JS site), collects every image it
loads (network + DOM + CSS backgrounds), downloads the large ones, and saves a
full-page screenshot + manifest. For picking a bright exterior/courtyard hero."""
import os, re, json, hashlib, pathlib, urllib.request, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("FORUM_URL", "https://forum.mr-group.ru/")
OUT = pathlib.Path("_forum"); OUT.mkdir(exist_ok=True)
seen, saved = set(), []

def save(url, data, kind):
    if not data or len(data) < 40_000:   # skip icons/thumbs
        return
    h = hashlib.sha1(url.encode()).hexdigest()[:10]
    ext = ".jpg"
    for e in (".jpg", ".jpeg", ".png", ".webp", ".avif"):
        if e in url.lower(): ext = e; break
    name = f"{len(saved):02d}_{kind}_{h}{ext}"
    (OUT / name).write_bytes(data)
    saved.append({"file": name, "bytes": len(data), "url": url})
    print(f"  saved {name}  {len(data)//1024}KB  {url[:110]}")

with sync_playwright() as p:
    br = p.chromium.launch(headless=True)
    pg = br.new_page(viewport={"width": 1600, "height": 1000})
    imgs = []
    def on_resp(r):
        ct = (r.headers or {}).get("content-type", "")
        if ct.startswith("image/") and r.url not in seen:
            seen.add(r.url)
            try:
                b = r.body()
                save(r.url, b, "net")
            except Exception:
                pass
    pg.on("response", on_resp)
    print("GOTO", URL)
    pg.goto(URL, wait_until="networkidle", timeout=90_000)
    pg.wait_for_timeout(2500)
    # scroll to trigger lazy-load of galleries
    for i in range(14):
        pg.mouse.wheel(0, 1400); pg.wait_for_timeout(700)
    pg.wait_for_timeout(2500)
    # DOM images + srcset + CSS backgrounds not caught by network
    dom = pg.eval_on_selector_all("img", "els => els.flatMap(e => [e.currentSrc, e.src, ...(e.srcset||'').split(',').map(s=>s.trim().split(' ')[0])])")
    bgs = pg.evaluate("""() => Array.from(document.querySelectorAll('*')).map(e=>getComputedStyle(e).backgroundImage).filter(v=>v&&v.includes('url(')).map(v=>v.match(/url\\(["']?([^"')]+)/)[1])""")
    title = pg.title()
    pg.screenshot(path=str(OUT / "_fullpage.png"), full_page=True)
    for u in set([x for x in dom + bgs if x and x.startswith("http")]):
        if u in seen: continue
        seen.add(u)
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Referer": URL})
            save(u, urllib.request.urlopen(req, timeout=40).read(), "dom")
        except Exception as e:
            print("  dom fail", u[:80], e)
    br.close()

(OUT / "manifest.json").write_text(json.dumps({"url": URL, "title": title, "saved": saved}, ensure_ascii=False, indent=2))
print(f"\nTITLE: {title}\nSAVED {len(saved)} images to _forum/  (+ _fullpage.png)")
