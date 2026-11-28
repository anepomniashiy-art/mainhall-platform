"""Collect OpenStreetMap points used by the location criterion of the Mainhall rating.

One Overpass request per category and per tile of the Moscow bounding box. Every category is
written to its own file as soon as it is complete, so a partial run still leaves usable data.
Output: out/<category>.json.gz with [category, lat, lon, name, tags, bbox] rows.
Data (c) OpenStreetMap contributors, ODbL.
"""
import gzip, json, os, sys, time, urllib.parse, urllib.request

S, W, N, E = 55.40, 36.80, 56.10, 38.20
ENDPOINTS = ["https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"]
QUERIES = {
    "station": 'nwr["railway"~"^(station|halt)$"]({b});nwr["station"="subway"]({b});',
    "station_future": 'nwr["railway"~"^(construction|proposed)$"]["construction"~"station|subway"]({b});nwr["construction:railway"~"station|subway"]({b});nwr["proposed:railway"~"station|subway"]({b});nwr["railway"~"^(construction|proposed)$"]["station"]({b});nwr["construction:station"]({b});nwr["proposed:station"]({b});nwr["public_transport"="station"]["construction"]({b});',
    "school": 'nwr["amenity"="school"]({b});',
    "kindergarten": 'nwr["amenity"="kindergarten"]({b});',
    "clinic": 'nwr["amenity"~"^(clinic|hospital|doctors)$"]({b});',
    "shop": 'nwr["shop"~"^(supermarket|convenience)$"]({b});',
    "park": 'wr["leisure"~"^(park|garden|nature_reserve)$"]({b});wr["landuse"="forest"]["name"]({b});',
}
KEEP = ("station", "subway", "network", "operator", "railway", "construction", "proposed", "opening_date", "start_date", "line", "colour", "leisure", "shop", "amenity", "transport", "train", "public_transport", "construction:railway", "proposed:railway", "construction:station", "proposed:station")


def run(q, box):
    b = ",".join(f"{v:.4f}" for v in box)
    body = urllib.parse.urlencode({"data": f"[out:json][timeout:90];({q.format(b=b)});out center bb tags;"}).encode()
    last = None
    for attempt in range(8):
        url = ENDPOINTS[attempt % len(ENDPOINTS)]
        try:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": "mainhall-rating/1.0 (+https://main-hall.ru)"})
            data = json.loads(urllib.request.urlopen(req, timeout=120).read().decode("utf-8"))
            if "elements" in data and not str(data.get("remark", "")).startswith("runtime error"):
                return data["elements"]
            last = data.get("remark")
        except Exception as e:  # noqa: BLE001
            last = e
        print("retry", url.split("/")[2], str(last)[:90], flush=True); time.sleep(6 + 6 * attempt)
    raise RuntimeError(f"overpass failed: {last}")


def tiles(n):
    for i in range(n):
        for j in range(n):
            yield (S + (N - S) * i / n, W + (E - W) * j / n, S + (N - S) * (i + 1) / n, W + (E - W) * (j + 1) / n)


os.makedirs("out", exist_ok=True)
failed = []
for cat in (sys.argv[1:] or list(QUERIES)):
    q = QUERIES[cat]; els = None
    for n in (1, 3):
        try:
            got = {}
            for box in tiles(n):
                for e in run(q, box): got[(e["type"], e["id"])] = e
                time.sleep(3)
            els = list(got.values()); break
        except RuntimeError as e:
            print(cat, "tiles", n, "failed:", str(e)[:120], flush=True)
    if els is None:
        failed.append(cat); continue
    rows = []
    for e in els:
        lat = e.get("lat") or (e.get("center") or {}).get("lat"); lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if lat is None: continue
        t = e.get("tags") or {}; b = e.get("bounds") or {}
        rows.append([cat, round(lat, 6), round(lon, 6), t.get("name") or "", {k: t[k] for k in KEEP if k in t}, [b.get("minlat"), b.get("minlon"), b.get("maxlat"), b.get("maxlon")] if b else None])
    with gzip.open(f"out/{cat}.json.gz", "wt", encoding="utf-8") as f:
        json.dump({"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "bbox": [S, W, N, E], "rows": rows}, f, ensure_ascii=False)
    print(cat, len(rows), flush=True)
print("failed", failed, flush=True)
