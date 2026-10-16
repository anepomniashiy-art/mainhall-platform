# MAINHALL — verified data sources research
Date: 2026-10-16. Evidence here is vendor documentation, NOT a live feed/account test.

| Priority | Provider | Primary evidence | Verified capability | Critical unknown / next step |
|---|---|---|---|---|
| P0 | Nmarket.PRO База.ПРО | https://ecatalog-service.nmarket.pro/bazapro | XML feeds intended to integrate in agents' OWN sites and CRM; descriptions, pictures, floor plans, unit numbers, areas, daily updates incl prices; vendor asks application, access via Nmarket agent cabinet | Price for Moscow/premium subset, exact rights to cache/display images, sample feed, filtering and stable unit IDs; REGISTER/QUOTE REQUIRED |
| P0 | bnMAP.pro | https://docs.bnmap.pro/api-docs/api-methods/api-get-building | Documented authenticated JSON API for project data, unit-level exposition and remaining inventory; personal token pbi and pagination. Docs also list GET Прайсы, GET Сделки | Commercial subscription and price, live response, rights for publishing, date consistency; TOKEN/QUOTE REQUIRED |
| P1 | TrendAgent | https://trendagent.ru/ | Agent marketplace, listings, regular updates, free agent access on stated conditions | Whether external machine API and onward republication exists — NOT VERIFIED |
| P1 | Profitbase | https://profitbase.ru/solutions/export | Developer-controlled feed exporter; XML/YML/CSV and status, prices, promotions, media | Not a common incoming multi-developer feed; permission from each provider/developer required |
| P1 | Dataflat | https://dataflat.ru/ | Commercial market sales/price datasets with monthly updates; enquiries client@dataflat.ru | Not confirmed near-real-time unit inventory; cost/licence unknown |
| P2 | Cian API | https://public-api.cian.ru/docs/latest | Authenticated account API; request key at import@cian.ru | NOT confirmed as a mass read API for all newbuild units, permission not granted |
| P2 | Yandex Realty | https://realty.yandex.ru/promotion/newbuildings/ | Accepts developer feeds and Excel from developers | Inbound publishing not outbound data licence |
| P2 | DOM.RF EISJS | https://наш.дом.рф | Developer/building official registry; documented ecosystem API integrations | Public commercial bulk access and live individual unit prices NOT verified |

## Immediate execution instructions to Claude Code
1. Make `scripts/connectors/nmarket-xml.mjs` and `scripts/connectors/bnmap-api.mjs` input adapters with *fixture-only tests*, following official documented schemas. Do not call credentialed URLs until vendor-authorized.
2. Provide `docs/PROVIDER_ACCESS_CHECKLIST.md` stating exact registration/quote items and cost upon confirmation; sample response and rights for pictures.
3. When owner connects partner feed, run a real dry-run, write count/coverage/source date from actual payload. On staging DB, import via existing official-feed importer; never infer available inventory from a missing status.
4. Source matrix must preserve `verified_vendor_documentation`, `verified_live_data`, `licensed_for_republication` as distinct states. A vendor webpage is not a live integration.
5. Check premium Moscow coverage before paying. Never claim guaranteed returns or data freshness beyond observed timestamp.

## Decision
Request quotes and sample credentials for **Nmarket.PRO База.ПРО** and **bnMAP.pro** first. Do not pay or register a plan solely on marketing statements.
