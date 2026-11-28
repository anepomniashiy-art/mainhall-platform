"""Collect OpenStreetMap points used by the location criterion of the Mainhall rating.

One Overpass request per category for the Moscow bounding box. Output: out/osm_moscow.json.gz
with [category, lat, lon, name, extra] rows. Data (c) OpenStreetMap contributors, ODbL.
"""
import gzip, json, os, sys, time, urllib.parse, urllib.request

BBOX = "55.40,36.80,56.10,38.20"
ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
QUERIES = {
    "school": f'nwr["amenity"="school"]({BBOX});',
    "kindergarten": f'nwr["amenity"="kindergarten"]({BBOX});',
    "clinic": f'nwr["amenity"~"^(clinic|hospital|doctors)$"]({BBOX});',
    "shop": f'nwr["shop"~"^(supermarket|convenience)$"]({BBOX});',
    "park": f'wr["leisure"~"^(park|garden|nature_reserve)$"]({BBOX});wr["landuse"="forest"]["name"]({BBOX});',
    "station": f'nwr["railway"~"^(station|halt)$"]({BBOX});nwr["station"="subway"]({BBOX});',
    "station_future": f'nwr["railway"~"^(construction|proposed)$"]["construction"~"station|subway"]({BBOX});nwr["construction:railway"~"station|subway"]({BBOX});nwr["proposed:railway"~"station|subway"]({BBOX});nwr["railway"~"^(construction|proposed)$"]["station"]({BBOX});nwr["construction:station"]({BBOX});nwr["proposed:station"]({BBOX});nwr["public_transport"="station"]["construction"]({BBOX});',
}


def run(q):
    body = urllib.parse.urlencode({"data": f"[out:json][timeout:240];({q});out center bb tags;"}).encode()
    last = None
    for attempt in range(6):
        url = ENDPOINTS[attempt % len(ENDPOINTS)]
        try:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": "mainhall-rating/1.0 (+https://main-hall.ru)"})
            return json.loads(urllib.request.urlopen(req, timeout=300).read().decode("utf-8"))["elements"]
        except Exception as e:  # noqa: BLE001
            last = e; print("retry", url, str(e)[:80], flush=True); time.sleep(20 + 20 * attempt)
    raise SystemExit(f"overpass failed: {last}")


rows = []
for cat, q in QUERIES.items():
    els = run(q)
    for e in els:
        lat = e.get("lat") or (e.get("center") or {}).get("lat"); lon = e.get("lon") or (e.get("center") or {}).get("lon")
        if lat is None: continue
        t = e.get("tags") or {}; b = e.get("bounds") or {}
        keep = {k: t[k] for k in ("station", "subway", "network", "operator", "railway", "construction", "proposed", "opening_date", "start_date", "line", "colour", "leisure", "shop", "amenity", "transport", "train", "public_transport", "construction:railway", "proposed:railway", "construction:station", "proposed:station") if k in t}
        rows.append([cat, round(lat, 6), round(lon, 6), t.get("name") or "", keep, [b.get("minlat"), b.get("minlon"), b.get("maxlat"), b.get("maxlon")] if b else None])
    print(cat, len(els), flush=True); time.sleep(8)
os.makedirs("out", exist_ok=True)
with gzip.open("out/osm_moscow.json.gz", "wt", encoding="utf-8") as f:
    json.dump({"fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "bbox": BBOX, "rows": rows}, f, ensure_ascii=False)
print("rows", len(rows))
