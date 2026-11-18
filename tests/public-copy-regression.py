#!/usr/bin/env python3
"""Issue #31 regression: public MAINHALL output must not expose data-gathering jargon.

Scans a static export (default ``out/``): visible HTML text, the serialised React
payload inside HTML/RSC files and the client JS chunks. Internal provenance in
data/ and docs/ is intentionally NOT scanned: it must be preserved for QA.

Usage: python3 tests/public-copy-regression.py [out]
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# Visible-copy markers (case-insensitive). Ordinary finance usage such as
# "источник средств" is allowed; only data-gathering phrasing is banned.
VISIBLE = [
    r"bnmap", r"прайс[- ]?лист", r"выгрузк", r"сбор данных", r"источник исследования",
    r"источники и состав", r"в выборке", r"архивной выборки", r"ДДУ за", r"изменение прайса",
    r"в прайсе", r"агрегированн\w+ показател", r"аналитическ\w+ отч[её]т\w* по",
    r"исходн\w+ разбор", r"исходная выгрузка", r"парсинг", r"скрейп",
]
# Anything shipped to the browser (HTML payload, RSC .txt, JS chunks).
SHIPPED = [r"bnmap", r"прайс-лист", r"github\.com/anepomniashiy-art", r"feeds\.sminex\.com/xml"]
SKIP = {"script", "style", "noscript", "template", "svg"}


class Visible(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.text: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in SKIP and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if not self.depth and data.strip():
            self.text.append(data.strip())


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "out")
    if not (root / "sitemap.xml").exists():
        print(f"no static export at {root}; run npm run build:host first", file=sys.stderr)
        return 2
    failures: list[str] = []
    html_files = sorted(root.rglob("*.html"))
    for f in html_files:
        raw = f.read_text(encoding="utf-8", errors="ignore")
        parser = Visible()
        parser.feed(raw)
        visible = "\n".join(parser.text)
        for pat in VISIBLE:
            m = re.search(pat, visible, re.I)
            if m:
                failures.append(f"visible  {f.relative_to(root)}: /{pat}/ -> {visible[max(0, m.start()-40):m.end()+40]!r}")
    shipped = [*html_files, *root.rglob("*.txt"), *(root / "_next").rglob("*.js")]
    for f in shipped:
        raw = f.read_text(encoding="utf-8", errors="ignore")
        for pat in SHIPPED:
            m = re.search(pat, raw, re.I)
            if m:
                failures.append(f"shipped  {f.relative_to(root)}: /{pat}/ -> {raw[max(0, m.start()-60):m.end()+40]!r}")
    print(f"scanned {len(html_files)} HTML files and {len(shipped) - len(html_files)} payload/JS files")
    for line in failures[:60]:
        print("FAIL", line)
    if failures:
        print(f"{len(failures)} violation(s)")
        return 1
    print("OK: no technical-source wording in public output")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
