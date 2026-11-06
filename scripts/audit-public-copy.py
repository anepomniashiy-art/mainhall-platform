#!/usr/bin/env python3
"""Extract the complete Russian public-copy corpus from a static MAINHALL build.

The script intentionally uses only the Python standard library.  It verifies that
every URL in ``out/sitemap.xml`` has a generated HTML file, extracts visible text,
deduplicates repeated navigation and unit-card strings, and records the source
files that can supply public copy.  Corpora are written outside the repository by
default; the compact JSON summary is suitable for CI evidence.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


CYRILLIC = re.compile(r"[А-Яа-яЁё]")
SPACE = re.compile(r"\s+")
SOURCE_SUFFIXES = {".ts", ".tsx", ".json"}
SKIP_TAGS = {"script", "style", "noscript", "template", "svg"}


class VisibleText(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in SKIP_TAGS:
            self.skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            value = SPACE.sub(" ", data).strip()
            if value and CYRILLIC.search(value):
                self.parts.append(value)


def sitemap_urls(build_root: Path) -> list[str]:
    return [node.text or "" for node in ET.parse(build_root / "sitemap.xml").findall("{*}url/{*}loc")]


def html_for_url(build_root: Path, url: str) -> Path | None:
    path = urlparse(url).path.strip("/")
    candidates = [build_root / "index.html"] if not path else [build_root / path / "index.html", build_root / f"{path}.html"]
    return next((candidate for candidate in candidates if candidate.exists()), None)


def production_corpus(build_root: Path) -> tuple[dict, list[str]]:
    urls = sitemap_urls(build_root)
    all_blocks: list[str] = []
    missing: list[str] = []
    empty: list[str] = []
    for url in urls:
        html = html_for_url(build_root, url)
        if html is None:
            missing.append(url)
            continue
        parser = VisibleText()
        parser.feed(html.read_text(encoding="utf-8", errors="ignore"))
        if not parser.parts:
            empty.append(url)
        all_blocks.extend(parser.parts)
    unique = list(dict.fromkeys(all_blocks))
    return {
        "sitemapUrls": len(urls),
        "htmlRead": len(urls) - len(missing),
        "missingHtml": missing,
        "pagesWithoutRussianText": empty,
        "visibleBlocks": len(all_blocks),
        "uniqueVisibleBlocks": len(unique),
        "visibleWordsIncludingRepeatedLayout": sum(len(x.split()) for x in all_blocks),
        "uniqueVisibleWords": sum(len(x.split()) for x in unique),
    }, unique


def source_files(repo_root: Path) -> list[Path]:
    roots = [repo_root / "src", repo_root / "data" / "editorial" / "articles"]
    selected = [
        repo_root / "data" / "catalogue" / "sminex-feed-project-editorial.json",
        repo_root / "data" / "catalogue" / "sminex-portfolio.json",
        repo_root / "data" / "catalogue" / "research-projects-2026-10-26.json",
        repo_root / "data" / "catalogue" / "research-additional-projects-2026-10-29.json",
        repo_root / "data" / "catalogue" / "investment-archive.json",
    ]
    files: list[Path] = []
    for root in roots:
        if root.exists():
            files.extend(p for p in root.rglob("*") if p.suffix in SOURCE_SUFFIXES)
    files.extend(p for p in selected if p.exists())
    return sorted(set(files))


def source_corpus(repo_root: Path, public_text: str) -> tuple[dict, list[str]]:
    # Quoted strings and template fragments are enough for a reproducible source
    # cross-check. The generated HTML remains the authority for what users see.
    quoted = re.compile(r'''(?s)(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`((?:\\.|[^`\\])*)`)''')
    blocks: list[str] = []
    counts: Counter[str] = Counter()
    for path in source_files(repo_root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in quoted.finditer(text):
            raw = next(part for part in match.groups() if part is not None)
            value = SPACE.sub(" ", raw.replace("\\n", " ").replace("\\\"", '"')).strip()
            if CYRILLIC.search(value):
                blocks.append(value)
                counts[str(path.relative_to(repo_root))] += 1
    candidate_unique = list(dict.fromkeys(blocks))
    # Only source literals present in the exported public text belong to the
    # public-copy audit. This removes comments, upstream SEO metadata and dormant
    # fallback strings without maintaining a fragile list of JSON field names.
    unique = [value for value in candidate_unique if value in public_text]
    return {
        "filesRead": len(source_files(repo_root)),
        "filesWithRussianStrings": len(counts),
        "sourceBlocks": len(blocks),
        "uniqueCandidateSourceBlocks": len(candidate_unique),
        "uniqueSourceBlocks": len(unique),
        "uniqueSourceWords": sum(len(x.split()) for x in unique),
        "blocksByFile": dict(sorted(counts.items())),
        "scope": ["src/**/*.{ts,tsx,json}", "data/editorial/articles/*.json", "selected catalogue editorial JSON"],
        "excluded": ["source packs and provenance", "raw developer feeds", "source strings absent from the sitemap export (comments, upstream metadata and dormant fallbacks)", "generated HTML outside sitemap", "third-party legacy assets"],
    }, unique


def run_scanner(scanner: Path, corpus: Path, report: Path) -> dict:
    # The scanner returns 1 when it finds review markers; that is a valid audit
    # result rather than an execution failure.
    result = subprocess.run([sys.executable, str(scanner), str(corpus), "--json"], check=False, text=True, capture_output=True)
    if result.returncode not in (0, 1) or not result.stdout.strip():
        raise RuntimeError(f"humanizer scanner failed ({result.returncode}): {result.stderr.strip()}")
    report.write_text(result.stdout, encoding="utf-8")
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--build-root", type=Path, default=Path("out"))
    parser.add_argument("--output", type=Path, default=Path("/tmp/mainhall-public-copy-audit"))
    parser.add_argument("--summary", type=Path)
    parser.add_argument("--scanner", type=Path, help="humanizer-ru skills/humanizer-ru/scripts/scan.py")
    parser.add_argument("--check", action="store_true", help="fail on missing sitemap HTML")
    args = parser.parse_args()
    repo_root = args.repo_root.resolve()
    build_root = (repo_root / args.build_root).resolve() if not args.build_root.is_absolute() else args.build_root
    args.output.mkdir(parents=True, exist_ok=True)

    production, production_blocks = production_corpus(build_root)
    source, source_blocks = source_corpus(repo_root, "\n".join(production_blocks))
    production_path = args.output / "production-unique-corpus.txt"
    source_path = args.output / "source-unique-corpus.txt"
    production_path.write_text("\n".join(production_blocks) + "\n", encoding="utf-8")
    source_path.write_text("\n".join(source_blocks) + "\n", encoding="utf-8")

    summary = {
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "commit": subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_root, text=True, capture_output=True, check=True).stdout.strip(),
        "production": production,
        "source": source,
    }
    if args.scanner:
        summary["humanizer"] = {
            "versionCommit": subprocess.run(["git", "rev-parse", "HEAD"], cwd=args.scanner.parents[3], text=True, capture_output=True, check=True).stdout.strip(),
            "productionReport": run_scanner(args.scanner, production_path, args.output / "production-humanizer.json"),
            "sourceReport": run_scanner(args.scanner, source_path, args.output / "source-humanizer.json"),
        }
    target = args.summary or args.output / "coverage.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))
    if args.check and production["missingHtml"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
