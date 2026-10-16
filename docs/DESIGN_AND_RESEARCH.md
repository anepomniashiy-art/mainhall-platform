# MAINHALL — Design and research system v1
Updated: 2026-10-16

## Positioning
Investment research first, property brokerage second. Do not imply guaranteed returns, proven availability, partnerships, total inventory or monthly update cadence without evidence.

## Competitor benchmark (editorial, not copied)
- Whitewill: curated high-end residential listings and lifestyle-oriented pages. Our difference: explicit investment methodology and provenance.
- Intermark: extensive navigation, filters and real estate content. Our difference: investment thesis per asset and scenario comparison.
- Kalinka: luxury positioning and concierge experience. Our difference: decision support, value sensitivity and transparency.
Compare against the live sites again before implementation of SEO and data integrations.

## Visual rules
1. Architectural editorial minimalism, spacious typography, confident asymmetric grids.
2. Forest charcoal #14241B, muted sage #C1D0B8, off-white #F8F7F4, gray-green supporting text. Avoid generic black/gold stock luxury treatment.
3. Headings serif with restrained contrast, body sans-serif, short lines (max 65–75 chars).
4. No fake imagery; actual architecture renders require provenance, republication permission and an unwatermarked source.
5. Never imply a named project is available for purchase without confirmed unit-level inventory and timestamp.
6. Responsive: mobile first, visible focus, keyboard navigation, accessible labels, sufficient contrast.
7. Motion should be optional, subtle and respect reduced-motion preference.

## Project template content fields
Confirmed: developer, project, official URL, district/address, project type, construction status, source and checked_at.
Research/editorial: architectural concept, neighborhood, transit, family infrastructure, competitors, demand drivers, supply risks, liquidity, fees.
Verified per unit: number / source ID, area, price, rub/sqm, floors, finish, view, available status, discounts + compatibility, source checked_at.
Scenario: entry + expenses + holding horizon + cashflows + realistic exit assumptions + downside; never claim assured yield.
If an item lacks verification, display "Проверяется" instead of inventing.

## Acceptance before launch
- CI build and tests green on staging
- DB migration documented and working
- minimum 3 permitted primary data imports with provenance and freshness monitoring
- catalog filters and accurate project/unit details
- commercial direction preserved under /commercial
- privacy, lead consents and risk disclosure
- sign-off before touching main-hall.ru/Tilda/DNS
