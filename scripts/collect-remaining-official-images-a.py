#!/usr/bin/env python3
"""Localise a reviewed batch of official project imagery.

The URL list is deliberately explicit: every page and asset was reviewed on
2026-11-06.  This script is reproducible and refuses non-image responses,
small assets and duplicate bytes.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/projects/collected"
CHECKED_AT = "2026-11-06T15:20:00Z"

SOURCES = {
    "admiral": ("Адмирал", "https://admiral-moscow.com/", [
        ("https://admiral-moscow.com/imgs/about.jpg", "exterior", "архитектура жилого квартала"),
        ("https://admiral-moscow.com/imgs/arch.jpg", "exterior", "архитектурная концепция"),
        ("https://admiral-moscow.com/imgs/lobby.jpg", "lobby", "лобби"),
        ("https://admiral-moscow.com/imgs/dvor.jpg", "courtyard", "благоустройство двора"),
    ]),
    "aristarkhovskiy": ("Дом на Аристарховском", "https://aristarhovskiy.ru/", [
        ("https://m-files.cdn1.cc/lpfile/c/f/0/cf03a01f03114e304bc210a3f2b7d805/-/crop/0x60x960x1161/-/resize/463/-/scale/x3/f.webp?30017446", "exterior", "фасад и историческое окружение"),
        ("https://m-files.cdn1.cc/lpfile/d/d/8/dd8a8ef77d05508b7ca91cc012f22f64/-/crop/0x277x960x887/-/resize/540/-/scale/x3/f.webp?18010461", "interior", "вариант отделки резиденции"),
        ("https://m-files.cdn1.cc/lpfile/e/6/7/e67132470042b21410ca332cf41901e3/-/crop/0x38x960x1204/-/resize/544/-/scale/x3/f.webp?77936822", "exterior", "архитектурная деталь"),
    ]),
    "belyy-grad": ("Белый Град", "https://belyigrad.ru/", [
        ("https://belyigrad.ru/upload/iblock/60b/fifedyn3pdq01m6wcgqi3xhxe7r31dvo.jpg", "exterior", "архитектура жилого квартала"),
        ("https://belyigrad.ru/upload/iblock/9fe/1x9zgxzoaqaz4rmwchnvqo9v6wz1wihw.jpg", "exterior", "панорама жилого квартала"),
        ("https://belyigrad.ru/upload/iblock/2fa/se32f3rpbne52h4coz0bxcbvawiggsa2.jpg", "courtyard", "благоустройство территории"),
        ("https://belyigrad.ru/upload/iblock/2c2/tlgprfz9gebnc30hspl7rm642use7xbx.jpg", "infrastructure", "парковый маршрут"),
    ]),
    "beregovoy-2": ("Береговой 2", "https://beregovoy-kvartal.ru/progress", [
        ("https://beregovoy-kvartal.ru/images/graph/poster.jpg", "exterior", "панорама квартала на набережной"),
        ("https://storage.yandexcloud.net/beregovoy-dev/c/pg/pi/c3fa6bdc6b2523d4da815a243487770167146bfa77e8b648cb30f0cb23ffb67a/347e56c431774a7e316045069e24261c.jpg", "construction", "ход строительства, вид на корпуса"),
        ("https://storage.yandexcloud.net/beregovoy-dev/c/pg/pi/2c3eae86f398f0f5c317455f873bdf7110348f620590db02f45144f9a8be5584/271050ae2a15a923336d0763f9609091.jpg", "construction", "ход строительства, панорама"),
    ]),
    "c5": ("C5", "https://c5dom.ru/", [
        ("https://c5dom.ru/upload/iblock/3e6/febh5622ngal3tif3pa4j9g2gy4vj3dk.webp", "exterior", "архитектура жилого комплекса"),
        ("https://c5dom.ru/upload/iblock/d6d/6pmwlpjypxbehwjxp7tlqukg1ksdwqls.webp", "exterior", "архитектурная деталь"),
        ("https://c5dom.ru/upload/iblock/c36/0amds4oc1r1rlk91acizcr9n97seogj4.webp", "exterior", "панорама проекта"),
        ("https://c5dom.ru/upload/iblock/115/65gp0prbztesdlq5ysxv9rssphhwi0wy.webp", "courtyard", "приватный двор-парк"),
    ]),
    "city-bay": ("City Bay", "https://city-bay.com/", [
        ("https://city-bay.com/imgs/about.jpg", "exterior", "архитектура жилого квартала"),
        ("https://city-bay.com/imgs/arch.jpg", "exterior", "архитектура на первой линии"),
        ("https://city-bay.com/imgs/lobby.jpg", "lobby", "лобби"),
        ("https://city-bay.com/imgs/dvor.jpg", "courtyard", "благоустройство двора"),
    ]),
    "evopark-izmaylovo": ("EvoPark Измайлово", "https://gk-osnova.ru/evoizmaylovo", [
        ("https://api.gkosnova.tech/public/storage/media/2026/4/H1CB5T2D67ezwEQO0hoaP4Y7ZJxgUcmsBBFfsVQR.jpg", "exterior", "современная архитектура"),
        ("https://api.gkosnova.tech/public/storage/media/2024/5/cdlqAb50isi0jv3Adw2kYpJ1jZUysFevn6e4UqW2.jpg", "exterior", "панорамное остекление"),
        ("https://api.gkosnova.tech/public/storage/media/2024/1/UvZ3pi2VgR7lwVMk4UcLxdWEwcyIQVW90LMaGGy4.jpg", "lobby", "дизайнерское лобби"),
        ("https://api.gkosnova.tech/public/storage/media/2024/5/rIeTysKCcqoaE9hPl3z5kFtT2PO4E52IAdKuiO2G.jpg", "courtyard", "благоустроенный двор"),
    ]),
    "muza": ("МУЗА", "https://xn--80aaijj0ai2m.xn--p1ai/projects/muza", [
        ("https://xn--h1ana.xn--80aaijj0ai2m.xn--p1ai/media/projects/05.webp", "exterior", "архитектура премиального проекта"),
        ("https://xn--h1ana.xn--80aaijj0ai2m.xn--p1ai/media/projects/%D0%9C%D0%A3%D0%97%D0%90_CSCkioB_fpjbE4K.jpg", "exterior", "авторская коллекция резиденций"),
        ("https://xn--h1ana.xn--80aaijj0ai2m.xn--p1ai/media/projects/arch.webp", "exterior", "архитектурная концепция"),
        ("https://xn--h1ana.xn--80aaijj0ai2m.xn--p1ai/media/projects/image_19.png", "lobby", "гранд-лобби"),
    ]),
}


def fetch(url: str) -> tuple[bytes, str, int]:
    response = urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0 MAINHALL editorial image audit"}), timeout=45)
    body = response.read()
    ctype = response.headers.get_content_type()
    if response.status != 200 or not ctype.startswith("image/"):
        raise RuntimeError(f"bad response {response.status} {ctype}: {url}")
    return body, ctype, response.status


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    existing = json.loads((ROOT / "data/provenance/official-project-images-2026-11-06.json").read_text())
    known = {item["sha256"] for item in existing["images"]}
    galleries = json.loads((ROOT / "data/catalogue/project-galleries.json").read_text())
    covers = json.loads((ROOT / "data/catalogue/collected-project-images.json").read_text())
    records = []
    for slug, (name, page, assets) in SOURCES.items():
        gallery = []
        for index, (url, category, label) in enumerate(assets, 1):
            body, source_type, status = fetch(url)
            im = Image.open(io.BytesIO(body)).convert("RGB")
            if im.width < 700 or im.height < 450:
                raise RuntimeError(f"image too small {im.size}: {url}")
            im.thumbnail((2200, 1600), Image.Resampling.LANCZOS)
            encoded = io.BytesIO()
            im.save(encoded, "WEBP", quality=84, method=6)
            data = encoded.getvalue()
            digest = hashlib.sha256(data).hexdigest()
            if digest in known:
                raise RuntimeError(f"duplicate local image: {url}")
            known.add(digest)
            filename = f"{slug}-{index}-{digest[:12]}.webp"
            (OUT / filename).write_bytes(data)
            local = f"/images/projects/collected/{filename}"
            caption = f"{name} · {label} · официальный материал проекта"
            gallery.append({"src": local, "caption": caption, "width": im.width, "height": im.height})
            records.append({
                "slug": slug, "src": local, "sourceAssetUrl": url, "sourcePageUrl": page,
                "category": category, "caption": caption, "checkedAt": CHECKED_AT,
                "status": "verified", "httpStatus": status, "contentType": source_type,
                "width": im.width, "height": im.height, "sha256": digest,
            })
        galleries[slug] = gallery
        covers[slug] = {"src": gallery[0]["src"], "caption": gallery[0]["caption"]}
    existing["checkedAt"] = CHECKED_AT
    existing["images"].extend(records)
    (ROOT / "data/provenance/official-project-images-2026-11-06.json").write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "data/catalogue/project-galleries.json").write_text(json.dumps(galleries, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "data/catalogue/collected-project-images.json").write_text(json.dumps(covers, ensure_ascii=False, indent=2) + "\n")
    print(f"added {len(records)} verified images for {len(SOURCES)} projects")


if __name__ == "__main__":
    main()
