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
GEOM = {
    "park_geom": 'way["leisure"~"^(park|garden|nature_reserve)$"]({b});way["landuse"="forest"]["name"]({b});',
    # relations need the full body: with "out tags" their member ways come without geometry
    "park_rel": 'rel["leisure"~"^(park|garden|nature_reserve)$"]({b});rel["landuse"="forest"]["name"]({b});',
}
KEEP = ("station", "subway", "network", "operator", "railway", "construction", "proposed", "opening_date", "start_date", "line", "colour", "leisure", "shop", "amenity", "transport", "train", "public_transport", "construction:railway", "proposed:railway", "construction:station", "proposed:station")


def run(q, box, out="center bb tags"):
    b = ",".join(f"{v:.4f}" for v in box)
    body = urllib.parse.urlencode({"data": f"[out:json][timeout:90];({q.format(b=b)});out {out};"}).encode()
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


def ring(points, full=False):
    points = [p for p in points if p]
    step = 1 if full else max(1, len(points) // 240)
    out = [[round(p["lat"], 5), round(p["lon"], 5)] for p in points[::step]]
    if full and points and out[-1] != [round(points[-1]["lat"], 5), round(points[-1]["lon"], 5)]: out.append([round(points[-1]["lat"], 5), round(points[-1]["lon"], 5)])
    return out


os.makedirs("out", exist_ok=True)
failed = []
for cat in (sys.argv[1:] or list(QUERIES)):
    geom = cat in GEOM
    q = GEOM[cat] if geom else QUERIES[cat]; els = None
    for n in ((3, 5) if geom else (1, 3)):
        try:
            got = {}
            for box in tiles(n):
                for e in run(q, box, ("geom" if cat == "park_rel" else "geom tags") if geom else "center bb tags"): got[(e["type"], e["id"])] = e
                time.sleep(3)
            els = list(got.values()); break
        except RuntimeError as e:
            print(cat, "tiles", n, "failed:", str(e)[:120], flush=True)
    if els is None:
        failed.append(cat); continue
    if geom:  # outlines of parks: [name, kind, [ring, ...]] with ring = [[lat, lon], ...]
        rows = []
        for e in els:
            t = e.get("tags") or {}
            rings = [ring(e["geometry"])] if e.get("geometry") else [ring(m["geometry"], True) for m in e.get("members", []) if m.get("type") == "way" and m.get("geometry") and m.get("role") != "inner"]
            rings = [r for r in rings if len(r) >= (3 if e.get("geometry") else 2)]
            if rings: rows.append([t.get("name") or "", t.get("leisure") or t.get("landuse") or "", rings])
        with gzip.open(f"out/{cat}.json.gz", "wt", encoding="utf-8") as f:
            json.dump({"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "bbox": [S, W, N, E], "rows": rows}, f, ensure_ascii=False, separators=(",", ":"))
        print(cat, len(rows), flush=True); continue
    rows = []
    for e in els:
        t = e.get("tags") or {}; b = e.get("bounds") or {}
        lat = e.get("lat") or (e.get("center") or {}).get("lat"); lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if lat is None and b:  # ways and relations come with a bounding box only
            lat = (b["minlat"] + b["maxlat"]) / 2; lon = (b["minlon"] + b["maxlon"]) / 2
        if lat is None: continue
        rows.append([cat, round(lat, 6), round(lon, 6), t.get("name") or "", {k: t[k] for k in KEEP if k in t}, [b.get("minlat"), b.get("minlon"), b.get("maxlat"), b.get("maxlon")] if b else None])
    with gzip.open(f"out/{cat}.json.gz", "wt", encoding="utf-8") as f:
        json.dump({"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "bbox": [S, W, N, E], "rows": rows}, f, ensure_ascii=False)
    print(cat, len(rows), flush=True)
print("failed", failed, flush=True)
