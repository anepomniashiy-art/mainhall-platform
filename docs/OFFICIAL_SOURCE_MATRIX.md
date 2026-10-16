# MAINHALL — first-party source matrix (2026-10-16)

Scope: primary Moscow residential projects **business+ / premium / luxury**. The public search defaults to **600,000 RUB/m²**; once a project qualifies, **every unit** from that project is retained, including cheaper units. This is a discovery and permissions register, **not** a record of successfully imported stock.

| Developer | Verified official public entry point | Public unit-level page | Approved machine-readable price/availability feed | Data republication rights | Image republication rights | Status |
|---|---|---|---|---|---|---|
| PIONEER | https://pioneer.ru/ | Project selection visible on official site; unit-level coverage not independently audited | Not obtained | Not confirmed | Not confirmed | DISCOVERY_ONLY |
| Level Group | https://level.ru/premium-kvartiry/ | Official page visibly lists individual units, areas, prices and reservation labels; completeness not verified | Not obtained | Not confirmed | Not confirmed | DISCOVERY_ONLY |
| MR Group | Not independently verified in this pass | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Capital Group | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Sminex | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Vesper | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Эталон | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| A101 | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| STONE | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Hutton | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |
| Coldy | Not independently verified | Unknown | Not obtained | Not confirmed | Not confirmed | PENDING_DISCOVERY |

## Evidence and strict limits

- PIONEER official projects and premium/business classification: https://pioneer.ru/ (reviewed 2026-10-16).
- Level official catalogue and visible per-unit price/status examples: https://level.ru/premium-kvartiry/ (reviewed 2026-10-16). A public webpage is **not** a licensed reusable API/feed.
- No developer has yet provided an authorised feed URL, machine-readable schema, written data-use permission, or media licence to this project.
- **Actual imported projects/buildings/units: 0 / 0 / 0 confirmed.** No live PostgreSQL connection or executed import run was demonstrated in this review.
- Images must remain placeholders unless publication rights are independently confirmed. Never equate discoverability with permission.
- Next: secure first authorised JSON/XML/CSV feed and separate media rights; configure staging DATABASE_URL; run migrations and import; record exact counts, null-price ratio, UNKNOWN-status ratio, fetchedAt and workflow job logs.
- An operator's `permission.evidence` field is a **declaration** and does not prove that the claimed permission exists. Require independent human/legal confirmation before live import.

This file intentionally contains no scraped apartment prices, availability or fabricated performance numbers.
