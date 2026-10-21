#!/usr/bin/env python3
"""Collect public project evidence; not a partner inventory importer.

Usage: python3 scripts/collect-public-projects.py config.json --output data/public-projects.json
Optional: --download-images public/images/collected --max-images 4
Only JSON-LD offers supply numeric prices. Plain text never supplies prices.
"""
import argparse
import hashlib
import ipaddress
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
from pathlib import Path

PROJECT_TYPES = {"ApartmentComplex", "ResidentialComplex", "HousingProject", "RealEstateProject"}
UNIT_TYPES = {"Apartment", "Accommodation", "SingleFamilyResidence", "House"}
MAX_HTML_BYTES = 5 * 1024 * 1024
MAX_IMAGE_BYTES = 8 * 1024 * 1024
USER_AGENT = "MAINHALL-PublicProjectCollector/1.0 (+https://main-hall.ru)"


def safe_url(url, allowed_hosts):
    parsed = urllib.parse.urlsplit(url)
    host = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme not in {"https", "http"} or parsed.username or parsed.password:
        raise ValueError("Only public HTTP(S) URLs without credentials are accepted")
    if parsed.port not in {None, 80, 443}:
        raise ValueError("Unexpected port")
    allowed = {str(h).lower().rstrip(".") for h in allowed_hosts}
    if host not in allowed or not host or host == "localhost" or "." not in host:
        raise ValueError("Host is outside the configured allowlist: " + host)
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address and not address.is_global:
        raise ValueError("Private network address is not accepted")
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))


class RestrictedRedirect(urllib.request.HTTPRedirectHandler):
    def __init__(self, allowed_hosts):
        self.allowed_hosts = allowed_hosts

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        safe_url(newurl, self.allowed_hosts)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(url, allowed_hosts, max_bytes, timeout=20):
    url = safe_url(url, allowed_hosts)
    opener = urllib.request.build_opener(RestrictedRedirect(allowed_hosts))
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with opener.open(request, timeout=timeout) as response:
        final_url = safe_url(response.geturl(), allowed_hosts)
        declared = response.headers.get("Content-Length")
        if declared and int(declared) > max_bytes:
            raise ValueError("Response exceeds byte limit")
        body = response.read(max_bytes + 1)
        if len(body) > max_bytes:
            raise ValueError("Response exceeds byte limit")
        return body, final_url, response.headers.get_content_type(), response.headers.get_content_charset() or "utf-8"


class PageHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.ld = []
        self.errors = []
        self.in_ld = False
        self.ld_parts = []
        self.in_title = False
        self.title_parts = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "meta":
            name = (values.get("property") or values.get("name") or "").lower()
            if values.get("content"):
                self.meta.setdefault(name, []).append(values["content"].strip())
        if tag == "script" and (values.get("type") or "").lower().split(";")[0].strip() == "application/ld+json":
            self.in_ld = True
            self.ld_parts = []
        if tag == "title":
            self.in_title = True

    def handle_data(self, data):
        if self.in_ld:
            self.ld_parts.append(data)
        if self.in_title:
            self.title_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.in_ld:
            try:
                self.ld.append(json.loads("".join(self.ld_parts)))
            except (json.JSONDecodeError, ValueError):
                self.errors.append("Malformed JSON-LD block skipped")
            self.in_ld = False
        if tag == "title":
            self.in_title = False


def types(node):
    value = node.get("@type", [])
    return {str(t).rsplit("/", 1)[-1] for t in (value if isinstance(value, list) else [value])}


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


def rubles(value, currency):
    if str(currency).upper() not in {"RUB", "RUR", "643"} or isinstance(value, bool):
        return None
    try:
        # Deliberately reject ranges, grouped numbers, currency text, NaN and zero.
        if not re.fullmatch(r"\d+(?:\.\d+)?", str(value)):
            return None
        number = Decimal(str(value))
        if not number.is_finite() or number <= 0 or number != number.to_integral_value() or number > 10**13:
            return None
        return int(number)
    except (InvalidOperation, TypeError, ValueError):
        return None


def offer_values(parent):
    offers = parent.get("offers", [])
    if isinstance(offers, dict):
        offers = [offers]
    if not isinstance(offers, list):
        return
    for offer in offers:
        if not isinstance(offer, dict):
            continue
        kind = types(offer)
        if "AggregateOffer" in kind:
            price = rubles(offer.get("lowPrice"), offer.get("priceCurrency"))
            if price:
                yield price, "aggregate_low_price", offer
        elif "Offer" in kind:
            price = rubles(offer.get("price"), offer.get("priceCurrency"))
            if price:
                yield price, "offer_price", offer


def area_sqm(node):
    size = node.get("floorSize")
    if not isinstance(size, dict):
        return None
    unit = str(size.get("unitCode") or size.get("unitText") or "").strip().lower()
    if unit not in {"mtk", "m2", "m²", "sqm", "sq m", "кв.м", "м²", "м2"}:
        return None
    try:
        area = float(size["value"])
        return area if 1 <= area <= 10000 else None
    except (ValueError, TypeError, KeyError):
        return None


def identifier(node):
    value = node.get("identifier") or node.get("sku") or node.get("@id")
    if isinstance(value, dict):
        value = value.get("value")
    return str(value).strip() if value is not None and str(value).strip() else None


def image_urls(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from image_urls(item)
    elif isinstance(value, dict):
        for key in ["contentUrl", "url"]:
            if isinstance(value.get(key), str):
                yield value[key]
                break


def parse_page(html, config, final_url=None, collected_at=None):
    page = PageHTML()
    page.feed(html)
    source = final_url or config["url"]
    nodes = [node for document in page.ld for node in objects(document)]
    projects = [node for node in nodes if types(node) & PROJECT_TYPES]
    title = next(iter(page.meta.get("og:title", [])), "".join(page.title_parts).strip())
    description = next(iter(page.meta.get("description", []) or page.meta.get("og:description", [])), None)
    if not description:
        description = next((node["description"] for node in projects if isinstance(node.get("description"), str)), None)
    price_evidence = []
    for node in projects:
        for price, basis, offer in offer_values(node):
            price_evidence.append({"valueRub": price, "basis": basis, "scope": "project", "sourceUrl": source})
    units = []
    seen_units = set()
    for node in nodes:
        if not types(node) & UNIT_TYPES:
            continue
        unit_id, area = identifier(node), area_sqm(node)
        if not unit_id or area is None or unit_id in seen_units:
            continue
        # AggregateOffer is never an individual apartment price.
        offers = [(price, offer) for price, basis, offer in offer_values(node) if basis == "offer_price"]
        if len(offers) != 1:
            continue
        price, offer = offers[0]
        seen_units.add(unit_id)
        units.append({"sourceId": unit_id, "areaSqm": area, "priceRub": price,
                      "availabilityRaw": offer.get("availability"), "salesStatus": "UNKNOWN",
                      "sourceUrl": source, "priceEvidence": "JSON-LD Apartment.offers.Offer.price"})
    raw_images = list(config.get("mediaUrls", [])) + list(page.meta.get("og:image", []))
    for node in projects + [node for node in nodes if types(node) & UNIT_TYPES]:
        raw_images.extend(image_urls(node.get("image")))
    media = []
    seen_images = set()
    allowed_media = config.get("allowedMediaHosts") or config.get("allowedHosts") or [urllib.parse.urlsplit(config["url"]).hostname]
    for raw_url in raw_images:
        try:
            image_url = safe_url(urllib.parse.urljoin(source, raw_url), allowed_media)
        except ValueError:
            continue
        if image_url in seen_images:
            continue
        seen_images.add(image_url)
        media.append({"url": image_url, "sourceUrl": source, "creditSource": "official_project_site", "rightsStatus": "not_asserted"})
        if len(media) >= 12:
            break
    return {"slug": config["slug"], "sourceType": "public_site", "recordScope": "project",
            "sourceUrl": source, "collectedAt": collected_at or datetime.now(timezone.utc).isoformat(),
            "status": "collected", "title": title[:1000], "description": description[:4000] if description else None,
            "projectPriceFromRub": min((x["valueRub"] for x in price_evidence), default=None),
            "projectPriceEvidence": price_evidence, "units": units, "media": media,
            "warnings": page.errors + ([] if price_evidence else ["No structured project price found"])}


def download_images(record, config, directory, limit):
    allowed = config.get("allowedMediaHosts") or config.get("allowedHosts") or [urllib.parse.urlsplit(config["url"]).hostname]
    for media in record["media"][:limit]:
        try:
            body, final_url, content_type, _ = fetch(media["url"], allowed, MAX_IMAGE_BYTES)
            if content_type == "image/jpeg" and body.startswith(b"\xff\xd8") and body.endswith(b"\xff\xd9"):
                extension = ".jpg"
            elif content_type == "image/png" and body.startswith(b"\x89PNG\r\n\x1a\n"):
                extension = ".png"
            elif content_type == "image/webp" and body.startswith(b"RIFF") and body[8:12] == b"WEBP":
                extension = ".webp"
            else:
                raise ValueError("Unsupported or incomplete raster image")
            name = hashlib.sha256(body).hexdigest()[:20] + extension
            target = directory / record["slug"] / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
            media.update({"localPath": target.as_posix(), "sha256": hashlib.sha256(body).hexdigest(), "resolvedUrl": final_url})
        except Exception as error:
            media["downloadError"] = type(error).__name__ + ": " + str(error)[:300]
        time.sleep(0.5)


def main():
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("config", type=Path)
    arguments.add_argument("--output", type=Path, required=True)
    arguments.add_argument("--download-images", type=Path)
    arguments.add_argument("--raw-dir", type=Path, help="Save original HTML evidence outside the public site")
    arguments.add_argument("--max-images", type=int, default=3)
    args = arguments.parse_args()
    entries = json.loads(args.config.read_text())
    if not isinstance(entries, list) or len(entries) > 100:
        raise SystemExit("Config must be a list of at most 100 project sources")
    records = []
    for config in entries:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", config.get("slug", "")):
            raise SystemExit("Invalid project slug")
        allowed = config.get("allowedHosts") or [urllib.parse.urlsplit(config["url"]).hostname]
        now = datetime.now(timezone.utc).isoformat()
        try:
            body, final_url, content_type, encoding = fetch(config["url"], allowed, MAX_HTML_BYTES)
            if args.raw_dir:
                args.raw_dir.mkdir(parents=True, exist_ok=True)
                (args.raw_dir / (config["slug"] + ".html")).write_bytes(body)
            if content_type not in {"text/html", "application/xhtml+xml"}:
                raise ValueError("Source did not return HTML")
            record = parse_page(body.decode(encoding, errors="replace"), config, final_url, now)
            if args.raw_dir:
                record["rawHtmlPath"] = (args.raw_dir / (config["slug"] + ".html")).as_posix()
            if args.download_images:
                download_images(record, config, args.download_images, max(0, min(args.max_images, 12)))
        except Exception as error:
            record = {"slug": config["slug"], "sourceType": "public_site", "recordScope": "project", "sourceUrl": config["url"],
                      "collectedAt": now, "status": "failed", "error": type(error).__name__ + ": " + str(error)[:500],
                      "projectPriceFromRub": None, "units": [], "media": []}
        records.append(record)
        print(config["slug"], record["status"], "units=" + str(len(record["units"])), "images=" + str(len(record["media"])), flush=True)
        time.sleep(1)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"schemaVersion": 1, "sourcePriority": ["nmarket", "partner_feed", "public_site"],
                                      "projects": records}, ensure_ascii=False, indent=2) + "\n")
    return 0 if any(r["status"] == "collected" for r in records) else 1


if __name__ == "__main__":
    raise SystemExit(main())
