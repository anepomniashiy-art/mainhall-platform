# Moscow editorial pipeline (daily articles)

Status: the generator, validator and tests are in place. **The scheduled run is not set up yet.**
Codex wires the workflow after review. Nothing here publishes anything by itself.

## Origin: how north-cyprus does it

`north-cyprus` is not readable with this repo's Action token. Codex read it and verified the mechanism:

- `.github/workflows/daily-content.yml`: cron `0 6 * * *`, Python 3.11, `pip install anthropic`,
  runs `generate/generator.py`, commits new articles.
- `generator.py`: loads `topics.json` + `done.json`, picks the first unused slug, calls
  `anthropic.messages.create(model="claude-sonnet-4-6", max_tokens=4000)`, makes up to 3 attempts,
  builds HTML (H1/H2/H3, JSON-LD with author/date, breadcrumbs) and updates the sitemap.

Weakness carried over from Cyprus: the model writes from a topic title alone, so facts come from
model memory and can't be checked.

## What changed for MAINHALL

| Cyprus | Moscow (`scripts/generate-moscow-content.py`) |
|---|---|
| `done.json` | dedup against existing `data/editorial/articles/*.json` (slug + title similarity) |
| topic → model memory | topic → **source pack** only; no usable sources ⇒ `skip` |
| HTML + sitemap writes | one JSON file per article; the Next.js site renders it and builds the sitemap/JSON-LD |
| `anthropic` SDK | stdlib `urllib` → `POST /v1/messages`, `max_tokens=4000` |
| 3 attempts | 3 attempts; validator errors go back to the model each time; still invalid ⇒ skip, nothing written |
| author from template | always `Редакция MAINHALL`; personal signatures are rejected |

## CLI

```bash
# plan only (also automatic when ANTHROPIC_API_KEY is unset)
python3 scripts/generate-moscow-content.py --source-pack pack.json --dry-run

# generate 1–3 articles
ANTHROPIC_API_KEY=... python3 scripts/generate-moscow-content.py \
  --source-pack pack.json --output data/editorial/articles --max-articles 2

# validate existing files (add --source-pack to also check numbers/sources against it)
python3 scripts/generate-moscow-content.py --validate data/editorial/articles/*.json

python3 -m unittest tests/test_moscow_content.py
```

Optional: `--topics` (default `data/editorial/topics.json`) and `--model`
(env `MAINHALL_CONTENT_MODEL`, default `claude-sonnet-4-6`).
Exit codes: `0` for ok, skip or dry-run; `1` when validation fails; `2` for a bad source pack or bad usage.

## Inputs

`data/editorial/topics.json` is the topic queue: `slug, title, category, kind, angle, image, related`.
It holds wording only, with no facts. The test enforces that titles and angles contain no digits.

The source pack is built by a person or collector before the run and is not committed:

```json
{
  "packId": "2026-10-22",
  "projects": [{"slug": "high-life", "name": "HIGH LIFE"}],
  "topics": [{
    "slug": "escrow-schet-pri-pokupke-novostroyki",
    "title": "…optional, overrides the queue…", "kind": "law", "category": "Право",
    "image": "high-life", "related": ["high-life"],
    "sources": [{"name": "КонсультантПлюс: 214-ФЗ", "url": "https://…",
                 "checkedAt": "2026-10-21T10:00:00+03:00", "text": "verified excerpt ≥80 chars"}]
  }]
}
```

- `projects` lists the existing project slugs that `image` and `related` may use.
- A pack topic can add a new topic (for example a news item) or attach sources to a topic from the queue.
- A source is dropped if it is not HTTPS, has a future `checkedAt` or no `checkedAt`, has an excerpt
  under 80 characters, or contains markup.
- `kind` controls how fresh the sources must be: `news` ≤14 days, `prices` ≤30, `law` ≤365, `evergreen` ≤730.
  For `news`/`prices`/`law`, a topic with no fresh source is skipped.

## Output: `data/editorial/articles/<slug>.json`

```json
{
  "slug": "…", "title": "…", "description": "50–220 chars", "category": "Право",
  "image": "high-life", "related": ["high-life", "developer:pioneer", "district:arbat"],
  "publishedAt": "2026-10-22T09:00:00+03:00", "updatedAt": "2026-10-22T09:00:00+03:00",
  "author": "Редакция MAINHALL",
  "sections": [{"title": "H2", "paragraphs": ["…"], "points": ["…"],
                "subheadings": [{"title": "H3", "paragraphs": ["…"], "points": ["…"]}]}],
  "sources": [{"name": "…", "url": "https://…"}],
  "links": [{"name": "Проект в каталоге MAINHALL", "url": "/projects/high-life"}]
}
```

- `points`, `subheadings` (H3) and `links` are optional.
- Plain `related` entries must be existing project slugs. The `developer:` and `district:` prefixes
  only get a format check, because those pages are Codex's area.
- Dates are set to the run time in Moscow time (UTC+3). Existing files are never overwritten.

## What the validator rejects automatically

- Missing or extra keys, a bad slug, a category not on the list, an `image`/`related` slug that doesn't exist.
- Any author other than `Редакция MAINHALL`; any mention of "Андрей"/"Непомнящий".
- A `publishedAt`/`updatedAt` in the future, or `updatedAt < publishedAt`.
- A source that is not HTTPS, not from the pack, or a duplicate.
- HTML tags, entities, `javascript:`, `on*=` handlers; raw URLs in the text.
- Outbound developer CTAs ("звоните", "забронируйте", "на сайте застройщика", …), phone numbers,
  "гарантированный доход/рост", "без риска".
- `links` pointing outside MAINHALL (only `/…` or `https://main-hall.ru/…` are allowed).
- **Unsafe facts**: any number in the text (price, %, year, law number, area, deadline) that does
  not literally appear in the source excerpts or the topic title.
- Duplicates: the same slug, or a title with ≥60% word overlap with an existing article.

## Not checked automatically (needs an editor before merge)

1. **Meaning of claims.** The number check passes if the number appears in a source, even when the
   sentence misreads it (wrong year, wrong building, "from" read as "average").
2. **Claims without numbers** ("the developer has changed its terms", "the law now requires") are not
   matched against the excerpts.
3. **Paraphrased content.** Only titles are compared. Two articles with different titles and
   overlapping body text both pass.
4. **Whether the source pack is true.** `checkedAt` and `text` are taken on trust. Whoever builds the
   pack is responsible for the excerpt really being on the page at `url`.
5. **Fit between `image`/`related` and the content.** The script only checks that the project exists.
6. **Legal wording.** Excerpts from laws must come from official or reference publications
   (consultant.ru, garant.ru, pravo.gov.ru). The validator does not tell an official source from a blog.
7. **Numbers written in words** ("шесть месяцев") are not caught by the number check.

Recommendation: articles go out as a PR from the scheduled run (not a direct commit to `main`), and
an editor reviews items 1–7.

## Not part of this change

Pages, CSS, catalogue data, developer data, workflows, DNS/SSL/secrets. The site keeps running on
main-hall.ru (Beget, HTTPS) and the domain does not change.
