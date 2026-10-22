#!/usr/bin/env python3
"""Daily editorial generator for MAINHALL (Moscow), stdlib only.

Adapted from north-cyprus/generate/generator.py (topics.json + done.json queue,
first unused slug, Claude Messages API, up to 3 attempts), with two hard changes:

* facts come exclusively from a verified source pack (--source-pack); a topic
  without usable sources is skipped, never invented;
* output is one JSON article per file in data/editorial/articles/<slug>.json
  (rendered by the Next.js static site), not HTML. Sitemap/JSON-LD are built
  by the site from these files, not by this script.

Without ANTHROPIC_API_KEY (or with --dry-run) nothing is written: the script
prints which topics would be generated and why others are skipped.

Usage:
  python3 scripts/generate-moscow-content.py --source-pack pack.json \
      --output data/editorial/articles --max-articles 2 [--dry-run]
  python3 scripts/generate-moscow-content.py --validate data/editorial/articles/*.json \
      [--source-pack pack.json]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOPICS = ROOT / 'data/editorial/topics.json'
DEFAULT_OUTPUT = ROOT / 'data/editorial/articles'
PROJECTS_TS = ROOT / 'src/lib/editorial-projects.ts'

AUTHOR = 'Редакция MAINHALL'
MSK = timezone(timedelta(hours=3))
SITE_HOSTS = {'main-hall.ru', 'www.main-hall.ru'}
CATEGORIES = {'Гид покупателя', 'Право', 'Аналитика', 'Рынок', 'Новости', 'Районы', 'Девелоперы'}
# Kinds whose claims (prices, legal norms, news) must be backed by source text.
DATA_KINDS = {'news', 'prices', 'law'}
KINDS = DATA_KINDS | {'evergreen'}
SOURCE_MAX_AGE_DAYS = {'news': 14, 'prices': 30, 'law': 365, 'evergreen': 730}
MAX_ATTEMPTS = 3
CLOCK_SKEW = timedelta(minutes=5)
DEFAULT_MODEL = 'claude-sonnet-5-5'

ARTICLE_KEYS = {'slug', 'title', 'description', 'category', 'image', 'related', 'publishedAt',
                'updatedAt', 'author', 'sections', 'sources'}
OPTIONAL_ARTICLE_KEYS = {'articleLinks'}
SLUG_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
RELATED_RE = re.compile(r'^(?:(developer|district):)?([a-z0-9]+(?:-[a-z0-9]+)*)$')
ISO_RE = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$')
HTML_RE = re.compile(r'<\s*/?\s*[a-zA-Z!?]|&lt;|&#|javascript:|data:text/html|\bon[a-z]+\s*=', re.I)
NUMBER_RE = re.compile(r'\d+(?:[.,]\d+)?')
# Outbound sales calls-to-action and unverifiable promises are never allowed.
FORBIDDEN_PATTERNS = [
    (re.compile(r'звоните|позвоните|оставьте заявку|забронируйте|бронируйте|успейте|переходите на сайт|на сайте застройщика|в отделе продаж застройщика', re.I), 'outbound developer CTA'),
    (re.compile(r'\+7[\s(-]*\d|8\s?\(?800', re.I), 'phone number'),
    (re.compile(r'гарантированн\w*\s+(доход|рост|прибыл)|без\s+риск|100\s*%\s*(доход|гарант)', re.I), 'unverifiable promise'),
    (re.compile(r'андре[йяюе]\b|непомнящ', re.I), 'unverified personal signature'),
    (re.compile(r'https?://|www\.', re.I), 'raw URL in text (use sources/articleLinks)'),
]


class ValidationError(ValueError):
    def __init__(self, errors):
        super().__init__('; '.join(errors))
        self.errors = errors


# ---------------------------------------------------------------- helpers

def now_msk():
    return datetime.now(MSK).replace(microsecond=0)


def parse_iso(value):
    if not isinstance(value, str) or not ISO_RE.match(value):
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def normalize(text):
    return ' '.join(re.findall(r'[0-9a-zа-яё]+', str(text).lower().replace('ё', 'е')))


def title_tokens(text):
    return {w for w in normalize(text).split() if len(w) > 3}


def similar_titles(a, b, threshold=0.6):
    ta, tb = title_tokens(a), title_tokens(b)
    if not ta or not tb:
        return normalize(a) == normalize(b)
    return len(ta & tb) / len(ta | tb) >= threshold


def is_https_url(url):
    if not isinstance(url, str):
        return False
    parsed = urllib.parse.urlparse(url)
    return parsed.scheme == 'https' and bool(parsed.hostname) and not parsed.username


def is_internal_link(url):
    if not isinstance(url, str):
        return False
    if url.startswith('/') and not url.startswith('//'):
        return True
    return is_https_url(url) and urllib.parse.urlparse(url).hostname in SITE_HOSTS


def iter_text(article):
    """Yield every human-visible string of an article."""
    yield article.get('title', '')
    yield article.get('description', '')
    for section in article.get('sections') or []:
        if not isinstance(section, dict):
            continue
        yield from _section_text(section)
        for sub in section.get('subsections') or []:
            if isinstance(sub, dict):
                yield from _section_text(sub)
    for link in article.get('articleLinks') or []:
        if isinstance(link, dict):
            yield link.get('name', '')


def _section_text(section):
    yield section.get('title', '')
    yield from (p for p in section.get('paragraphs') or [] if isinstance(p, str))
    yield from (p for p in section.get('points') or [] if isinstance(p, str))


def known_project_slugs(pack=None):
    slugs = set()
    if pack:
        slugs |= {p['slug'] for p in pack.get('projects') or [] if isinstance(p, dict) and p.get('slug')}
    if not slugs and PROJECTS_TS.exists():
        slugs = set(re.findall(r'slug:"([a-z0-9-]+)"', PROJECTS_TS.read_text(encoding='utf-8')))
    return slugs


def load_json(path):
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def load_existing(output_dir):
    articles = []
    for path in sorted(Path(output_dir).glob('*.json')) if Path(output_dir).is_dir() else []:
        try:
            data = load_json(path)
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(data, dict):
            articles.append(data)
    return articles


# ---------------------------------------------------------------- validation

def _check_block(block, where, errors, allow_sub):
    if not isinstance(block, dict):
        errors.append(f'{where}: must be an object')
        return
    allowed = {'title', 'paragraphs', 'points'} | ({'subsections'} if allow_sub else set())
    extra = set(block) - allowed
    if extra:
        errors.append(f'{where}: unexpected keys {sorted(extra)}')
    if not isinstance(block.get('title'), str) or not 3 <= len(block['title'].strip()) <= 120:
        errors.append(f'{where}.title: 3–120 chars required')
    paragraphs = block.get('paragraphs')
    if not isinstance(paragraphs, list) or not 1 <= len(paragraphs) <= 8 \
            or not all(isinstance(p, str) and len(p.strip()) >= 40 for p in paragraphs):
        errors.append(f'{where}.paragraphs: 1–8 paragraphs of ≥40 chars required')
    if 'points' in block:
        points = block['points']
        if not isinstance(points, list) or not 1 <= len(points) <= 10 \
                or not all(isinstance(p, str) and p.strip() for p in points):
            errors.append(f'{where}.points: 1–10 non-empty strings when present')
    if allow_sub and 'subsections' in block:
        subs = block['subsections']
        if not isinstance(subs, list) or not 1 <= len(subs) <= 6:
            errors.append(f'{where}.subsections: 1–6 items when present')
        else:
            for j, sub in enumerate(subs):
                _check_block(sub, f'{where}.subsections[{j}]', errors, allow_sub=False)


def validate_article(article, *, now=None, project_slugs=None, existing=(), topic=None, pack_sources=None):
    """Return a list of human-readable errors; empty list means the article is publishable.

    topic / pack_sources enable the source-pack checks (numbers must come from source
    text, sources must belong to the pack); they are always passed by the generator.
    """
    now = now or now_msk()
    errors = []
    if not isinstance(article, dict):
        return ['article must be a JSON object']
    missing = ARTICLE_KEYS - set(article)
    extra = set(article) - ARTICLE_KEYS - OPTIONAL_ARTICLE_KEYS
    if missing:
        errors.append(f'missing keys {sorted(missing)}')
    if extra:
        errors.append(f'unexpected keys {sorted(extra)}')

    slug = article.get('slug')
    if not isinstance(slug, str) or not SLUG_RE.match(slug) or len(slug) > 80:
        errors.append('slug: lowercase latin kebab-case, ≤80 chars')
    title = article.get('title')
    if not isinstance(title, str) or not 10 <= len(title.strip()) <= 120:
        errors.append('title: 10–120 chars')
    description = article.get('description')
    if not isinstance(description, str) or not 50 <= len(description.strip()) <= 220:
        errors.append('description: 50–220 chars')
    if article.get('category') not in CATEGORIES:
        errors.append(f'category: one of {sorted(CATEGORIES)}')
    if article.get('author') != AUTHOR:
        errors.append(f'author: must be exactly "{AUTHOR}"')

    if project_slugs is not None:
        if article.get('image') not in project_slugs:
            errors.append(f'image: must be an existing project slug, got {article.get("image")!r}')
    elif not isinstance(article.get('image'), str) or not SLUG_RE.match(article.get('image') or ''):
        errors.append('image: project slug required')
    related = article.get('related')
    if not isinstance(related, list) or len(related) > 8 or len(set(map(str, related))) != len(related):
        errors.append('related: list of ≤8 unique entries')
    else:
        for item in related:
            match = RELATED_RE.match(item) if isinstance(item, str) else None
            if not match:
                errors.append(f'related: bad entry {item!r}')
            elif match.group(1) is None and project_slugs is not None and item not in project_slugs:
                errors.append(f'related: unknown project slug {item!r}')

    published, updated = parse_iso(article.get('publishedAt')), parse_iso(article.get('updatedAt'))
    if not published:
        errors.append('publishedAt: ISO 8601 with timezone required')
    if not updated:
        errors.append('updatedAt: ISO 8601 with timezone required')
    if published and published > now + CLOCK_SKEW:
        errors.append('publishedAt: date in the future')
    if updated and updated > now + CLOCK_SKEW:
        errors.append('updatedAt: date in the future')
    if published and updated and updated < published:
        errors.append('updatedAt: earlier than publishedAt')

    sections = article.get('sections')
    if not isinstance(sections, list) or not 2 <= len(sections) <= 10:
        errors.append('sections: 2–10 sections required')
    else:
        for i, section in enumerate(sections):
            _check_block(section, f'sections[{i}]', errors, allow_sub=True)

    sources = article.get('sources')
    if not isinstance(sources, list) or not sources:
        errors.append('sources: at least one source required')
    else:
        urls = set()
        for i, src in enumerate(sources):
            if not isinstance(src, dict) or set(src) != {'name', 'url'}:
                errors.append(f'sources[{i}]: exactly {{name,url}}')
                continue
            if not isinstance(src['name'], str) or not src['name'].strip():
                errors.append(f'sources[{i}].name: required')
            if not is_https_url(src['url']):
                errors.append(f'sources[{i}].url: HTTPS URL required')
            if pack_sources is not None and src['url'] not in pack_sources:
                errors.append(f'sources[{i}].url: not present in source pack')
            if src['url'] in urls:
                errors.append(f'sources[{i}].url: duplicate')
            urls.add(src['url'])

    links = article.get('articleLinks')
    if links is not None:
        if not isinstance(links, list) or len(links) > 10:
            errors.append('articleLinks: list of ≤10 items')
        else:
            for i, link in enumerate(links):
                if not isinstance(link, dict) or set(link) != {'name', 'url'} \
                        or not isinstance(link.get('name'), str) or not link['name'].strip():
                    errors.append(f'articleLinks[{i}]: exactly {{name,url}}')
                elif not is_internal_link(link['url']):
                    errors.append(f'articleLinks[{i}].url: only internal MAINHALL links allowed')

    texts = [t for t in iter_text(article) if isinstance(t, str)]
    for text in texts + [str(s.get('name', '')) for s in sources or [] if isinstance(s, dict)]:
        if HTML_RE.search(text):
            errors.append(f'HTML/script markup is not allowed: {text[:60]!r}')
            break
    for pattern, label in FORBIDDEN_PATTERNS:
        if any(pattern.search(t) for t in texts):
            errors.append(f'forbidden content: {label}')

    if topic is not None and pack_sources is not None:
        # Every number in the article (prices, %, years, law numbers, areas) must
        # literally occur in the source texts or the topic title.
        haystack = ' '.join([topic.get('title', '')] + [s.get('text', '') for s in topic.get('sources', [])])
        allowed_numbers = {n.replace(',', '.') for n in NUMBER_RE.findall(haystack.replace(' ', ' '))}
        allowed_numbers |= {n.replace(' ', '') for n in re.findall(r'\d{1,3}(?: \d{3})+', haystack)}
        unsupported = sorted({n for t in texts for n in _numbers(t) if n not in allowed_numbers})
        if unsupported:
            errors.append(f'unsafe facts: numbers not found in source pack {unsupported[:8]}')

    if isinstance(slug, str) and isinstance(title, str):
        for other in existing:
            if not isinstance(other, dict) or other is article:
                continue
            if other.get('slug') == slug:
                errors.append(f'duplicate slug {slug!r}')
            elif similar_titles(other.get('title', ''), title):
                errors.append(f'duplicate topic: title too close to {other.get("slug")!r}')
    return errors


def _numbers(text):
    text = text.replace(' ', ' ')
    grouped = [n.replace(' ', '') for n in re.findall(r'\d{1,3}(?: \d{3})+', text)]
    rest = re.sub(r'\d{1,3}(?: \d{3})+', ' ', text)
    return grouped + [n.replace(',', '.') for n in NUMBER_RE.findall(rest)]


# ---------------------------------------------------------------- source pack

def load_source_pack(path, now=None):
    """Load and sanity-check a source pack. Returns (pack, problems)."""
    now = now or now_msk()
    pack = load_json(path)
    problems = []
    if not isinstance(pack, dict) or not isinstance(pack.get('topics'), list):
        raise ValidationError(['source pack: object with "topics" list required'])
    if not isinstance(pack.get('projects'), list) or not pack['projects']:
        raise ValidationError(['source pack: non-empty "projects" list (existing project slugs) required'])
    for topic in pack['topics']:
        clean = []
        for src in topic.get('sources') or []:
            reason = _source_problem(src, now)
            if reason:
                problems.append(f'{topic.get("slug")}: dropped source {src.get("url") if isinstance(src, dict) else src!r}: {reason}')
            else:
                clean.append(src)
        topic['sources'] = clean
    return pack, problems


def _source_problem(src, now):
    if not isinstance(src, dict):
        return 'not an object'
    if not is_https_url(src.get('url')):
        return 'URL must be HTTPS'
    if not isinstance(src.get('name'), str) or not src['name'].strip():
        return 'name required'
    checked = parse_iso(src.get('checkedAt'))
    if not checked:
        return 'checkedAt ISO timestamp required'
    if checked > now + CLOCK_SKEW:
        return 'checkedAt in the future'
    if not isinstance(src.get('text'), str) or len(src['text'].strip()) < 80:
        return 'verified excerpt "text" (≥80 chars) required'
    if HTML_RE.search(src['text']):
        return 'excerpt contains markup'
    return None


def build_candidates(queue_topics, pack, now):
    """Merge topics.json queue with pack topics by slug. Facts only from the pack."""
    by_slug = {}
    for topic in queue_topics:
        if isinstance(topic, dict) and topic.get('slug'):
            by_slug[topic['slug']] = dict(topic, sources=[])
    for topic in pack['topics']:
        if not isinstance(topic, dict) or not topic.get('slug'):
            continue
        merged = dict(by_slug.get(topic['slug'], {}))
        merged.update({k: v for k, v in topic.items() if v not in (None, '', [])})
        merged['sources'] = topic.get('sources') or []
        by_slug[topic['slug']] = merged
    return list(by_slug.values())


def topic_skip_reason(topic, now, project_slugs, existing):
    slug, kind = topic.get('slug'), topic.get('kind', 'evergreen')
    if not isinstance(slug, str) or not SLUG_RE.match(slug):
        return 'bad slug'
    if kind not in KINDS:
        return f'unknown kind {kind!r}'
    if topic.get('category') not in CATEGORIES:
        return f'unknown category {topic.get("category")!r}'
    if topic.get('image') not in project_slugs:
        return f'image {topic.get("image")!r} is not an existing project slug'
    for other in existing:
        if other.get('slug') == slug:
            return 'already published (slug)'
        if similar_titles(other.get('title', ''), topic.get('title', '')):
            return f'already published (topic close to {other.get("slug")!r})'
    sources = topic.get('sources') or []
    if not sources:
        return 'no verified sources in source pack'
    max_age = timedelta(days=SOURCE_MAX_AGE_DAYS[kind])
    fresh = [s for s in sources if now - parse_iso(s['checkedAt']) <= max_age]
    if kind in DATA_KINDS and not fresh:
        return f'{kind}: sources older than {max_age.days} days'
    return None


# ---------------------------------------------------------------- generation

PROMPT = """Ты — редактор MAINHALL, независимого гида по новостройкам Москвы.
Напиши полезную статью на русском языке по теме ниже.

Жёсткие правила:
- Используй ТОЛЬКО факты из блока ИСТОЧНИКИ. Никаких цен, процентов, дат, номеров законов,
  сроков, новостей и названий, которых нет в источниках. Любое число в тексте должно
  буквально присутствовать в источниках. Если фактов мало — пиши методику и вопросы
  для проверки, а не выдуманные данные.
- Не пересказывай другие статьи и не повторяй одно и то же разными словами.
- Без призывов звонить/бронировать/переходить на сайт застройщика, без телефонов и URL в тексте.
- Без HTML и markdown. Без подписи конкретного автора.
- Ответ — только JSON-объект без пояснений:
  {{"title": str (10–120 симв.), "description": str (50–220 симв.),
    "sections": [{{"title": str, "paragraphs": [str, ...], "points": [str, ...] (необязательно),
                   "subsections": [{{"title": str, "paragraphs": [str]}}] (необязательно)}}, ...] (3–6 разделов),
    "sourceIndexes": [номера использованных источников, начиная с 1]}}

ТЕМА: {title}
РАКУРС: {angle}
РУБРИКА: {category}
СВЯЗАННЫЕ ПРОЕКТЫ: {related}

ИСТОЧНИКИ:
{sources}
{feedback}"""


def build_prompt(topic, projects_by_slug, feedback=''):
    related = ', '.join(projects_by_slug.get(s, {}).get('name', s) for s in topic.get('related') or []) or '—'
    sources = '\n\n'.join(
        f'[{i}] {s["name"]} ({s["url"]}, проверено {s["checkedAt"]}):\n{s["text"].strip()}'
        for i, s in enumerate(topic['sources'], 1))
    if feedback:
        feedback = f'\nПРЕДЫДУЩАЯ ПОПЫТКА ОТКЛОНЕНА ВАЛИДАТОРОМ, исправь:\n{feedback}\n'
    return PROMPT.format(title=topic['title'], angle=topic.get('angle') or topic['title'],
                         category=topic['category'], related=related, sources=sources, feedback=feedback)


def anthropic_complete(prompt, *, api_key, model, max_tokens=4000, timeout=120):
    body = json.dumps({'model': model, 'max_tokens': max_tokens,
                       'messages': [{'role': 'user', 'content': prompt}]}).encode()
    request = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
        'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.load(response)
    return ''.join(block.get('text', '') for block in payload.get('content', []) if block.get('type') == 'text')


def parse_model_json(text):
    match = re.search(r'\{.*\}', text or '', re.S)
    if not match:
        raise ValueError('no JSON object in model output')
    return json.loads(match.group(0))


def assemble_article(topic, draft, now):
    indexes = draft.get('sourceIndexes') or list(range(1, len(topic['sources']) + 1))
    chosen = [topic['sources'][i - 1] for i in indexes
              if isinstance(i, int) and 1 <= i <= len(topic['sources'])] or topic['sources']
    seen, sources = set(), []
    for src in chosen:
        if src['url'] not in seen:
            seen.add(src['url'])
            sources.append({'name': src['name'], 'url': src['url']})
    stamp = now.isoformat()
    article = {
        'slug': topic['slug'], 'title': draft.get('title'), 'description': draft.get('description'),
        'category': topic['category'], 'image': topic['image'], 'related': list(topic.get('related') or []),
        'publishedAt': stamp, 'updatedAt': stamp, 'author': AUTHOR,
        'sections': draft.get('sections'), 'sources': sources,
    }
    links = [{'name': 'Проект в каталоге MAINHALL', 'url': f'/projects/{s}'}
             for s in article['related'] if RELATED_RE.match(s) and ':' not in s]
    if links:
        article['articleLinks'] = links
    return article


def generate(*, pack, queue_topics, output_dir, max_articles, complete=None, now=None, log=print):
    """Generate up to max_articles. complete=None means dry-run (nothing written).

    Returns a list of (status, slug, detail) tuples.
    """
    now = now or now_msk()
    project_slugs = known_project_slugs(pack)
    projects_by_slug = {p['slug']: p for p in pack['projects'] if isinstance(p, dict) and p.get('slug')}
    existing = load_existing(output_dir)
    results = []
    for topic in build_candidates(queue_topics, pack, now):
        if sum(1 for r in results if r[0] in {'written', 'planned'}) >= max_articles:
            break
        reason = topic_skip_reason(topic, now, project_slugs, existing)
        if reason:
            results.append(('skip', topic.get('slug'), reason))
            continue
        if complete is None:
            results.append(('planned', topic['slug'], f'{len(topic["sources"])} source(s)'))
            continue
        pack_sources = {s['url'] for s in topic['sources']}
        feedback, article = '', None
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                draft = parse_model_json(complete(build_prompt(topic, projects_by_slug, feedback)))
                candidate = assemble_article(topic, draft, now)
            except (ValueError, KeyError, TypeError, urllib.error.URLError) as exc:
                feedback = f'- {exc}'
                log(f'  {topic["slug"]}: attempt {attempt} failed: {exc}')
                continue
            errors = validate_article(candidate, now=now, project_slugs=project_slugs, existing=existing,
                                      topic=topic, pack_sources=pack_sources)
            if not errors:
                article = candidate
                break
            feedback = '\n'.join(f'- {e}' for e in errors)
            log(f'  {topic["slug"]}: attempt {attempt} rejected: {"; ".join(errors)}')
        if article is None:
            results.append(('skip', topic['slug'], f'rejected after {MAX_ATTEMPTS} attempts'))
            continue
        write_article(article, output_dir)
        existing.append(article)
        results.append(('written', topic['slug'], str(Path(output_dir) / f'{topic["slug"]}.json')))
    return results


def write_article(article, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f'{article["slug"]}.json'
    if target.exists():
        raise FileExistsError(target)
    tmp = target.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(article, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(target)


# ---------------------------------------------------------------- CLI

def validate_files(paths, pack=None, now=None):
    project_slugs = known_project_slugs(pack)
    articles = []
    failed = 0
    for path in paths:
        try:
            articles.append((path, load_json(path)))
        except (OSError, json.JSONDecodeError) as exc:
            print(f'FAIL {path}: {exc}')
            failed += 1
    others = [a for _, a in articles]
    for path, article in articles:
        topic = pack_sources = None
        if pack:
            topic = next((t for t in pack['topics'] if t.get('slug') == article.get('slug')), None)
            pack_sources = {s['url'] for t in pack['topics'] for s in t.get('sources') or []}
        errors = validate_article(article, now=now, project_slugs=project_slugs, existing=others,
                                  topic=topic, pack_sources=pack_sources)
        print(('FAIL ' if errors else 'OK   ') + str(path))
        for error in errors:
            print(f'     - {error}')
        failed += bool(errors)
    return failed


def max_articles_arg(value):
    number = int(value)
    if not 1 <= number <= 3:
        raise argparse.ArgumentTypeError('must be between 1 and 3')
    return number


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source-pack', type=Path, help='verified source pack JSON (required to generate)')
    parser.add_argument('--topics', type=Path, default=DEFAULT_TOPICS)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--max-articles', type=max_articles_arg, default=1)
    parser.add_argument('--dry-run', action='store_true', help='plan only, write nothing')
    parser.add_argument('--model', default=os.environ.get('MAINHALL_CONTENT_MODEL', DEFAULT_MODEL))
    parser.add_argument('--validate', nargs='+', type=Path, metavar='ARTICLE', help='validate article files and exit')
    args = parser.parse_args(argv)
    now = now_msk()

    pack = None
    if args.source_pack:
        try:
            pack, problems = load_source_pack(args.source_pack, now)
        except (OSError, json.JSONDecodeError, ValidationError) as exc:
            print(f'error: source pack: {exc}', file=sys.stderr)
            return 2
        for problem in problems:
            print(f'warn: {problem}')

    if args.validate:
        return 1 if validate_files(args.validate, pack, now) else 0
    if pack is None:
        parser.error('--source-pack is required: articles are generated only from a verified source pack')

    queue = load_json(args.topics).get('topics', []) if args.topics.exists() else []
    api_key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    complete = None
    if args.dry_run:
        print('DRY-RUN (--dry-run): nothing will be written')
    elif not api_key:
        print('DRY-RUN: ANTHROPIC_API_KEY is not set — nothing will be written, nothing is published')
    else:
        def complete(prompt):
            return anthropic_complete(prompt, api_key=api_key, model=args.model)

    results = generate(pack=pack, queue_topics=queue, output_dir=args.output,
                       max_articles=args.max_articles, complete=complete, now=now)
    for status, slug, detail in results:
        print(f'{status:8} {slug}: {detail}')
    if not any(status in {'written', 'planned'} for status, _, _ in results):
        print('SKIP: no topic has enough verified material today; nothing generated')
    return 0


if __name__ == '__main__':
    sys.exit(main())
