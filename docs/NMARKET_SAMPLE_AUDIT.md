# Nmarket.PRO sample XML — measured audit (2026-10-16)

Owner reports provider access agreed and hosting offline for approximately a week. This outage/restoration estimate is **owner-reported, not independently verified**.

## Observed sample facts
- Input: owner-uploaded `feed-example.xml` (17 MB). XML namespace: `http://webmaster.yandex.ru/schemas/feed/realty/2010-06`
- Timestamp in feed: `2021-06-09T21:00:39+00:00`.
- Actual `offer` nodes: **2,005**; price populated: **2,005**; image URL element: **2,005**.
- Region: Санкт-Петербург **1,427** offers; Ленинградская область **578** offers.
- Distinct (region, building-name) combinations: **34**.
- Moscow offers: **0**.
- Images are vendor-hosted HTTP links; link presence != verified access/permission.
- This file contains historical evidence and **must not populate current Moscow inventory**.

## Executed local check
`python scripts/audit-nmarket-xml.py feed-example.xml --region Москва`
Auditor ran against actual uploaded file in the assistant working environment and returned the above counts. Only script committed; the user-provided XML is NOT committed, to avoid accidental publication of historical prices or phone/contact data.

## Catalogue currently in main
`src/lib/editorial-projects.ts` contains **17 editorial Moscow entries**:
HIGH LIFE, OPUS, Бадаевский, Vesper Кутузовский, Шагал, Level Южнопортовая,
Symphony 34, Николь, LUMIN, Lunar, STONE Сокольники, STONE Блик,
KING & SONS, Stories на Мосфильмовской, Дом 7 Даниловский,
Upside Towers, Энигмия.

Those are **editorial profiles**, not verified live stock. We can use them for initial public catalogue, displaying "Цена уточняется" and neutral placeholders; no 2021 XML prices/imagery.

## Implementation required from Claude Code
1. Build unit-level XML adapter for Yandex Realty schema: offer `internal-id`, building-name, region, price/value+currency, area/value, floor, rooms, images, update timestamp. Group offers into projects using reliable external provider IDs; `building-name` alone may collide. Do not assume `offer` is AVAILABLE merely because it appears in sample.
2. Reject/hold out-of-region or stale data; run audited dry-run against this sample and assert `Moscow units == 0`.
3. When Nmarket feed comes online, record fresh sampled response, rights, region, pricing and image license before any live import; then import into PostgreSQL with dedup/history/metrics.
4. Site should display the 17 Moscow editorial projects now, not wait for the feed to recover. Never claim actual prices or availability until verified.
