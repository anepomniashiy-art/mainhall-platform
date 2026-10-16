# MAINHALL — data pipeline status, 2026-10-16

This is a local patch, NOT deployed or merged to GitHub. No live import confirmed.

- Added a first-party/partner-authorised JSON feed validator, a PostgreSQL Prisma importer, unit tests and CI workflow.
- Run tests: `node --test tests/official-feed.test.mjs`.
- Run validation: `node scripts/import-official-feed.mjs <approved-feed.json> --dry-run`.
- Real import: configure DATABASE_URL, apply Prisma migrations, obtain real approved feed and run the same command without --dry-run.
- Input JSON: permission {dataProcessingAllowed:true,evidence:"written agreement reference"}, generatedAt ISO, developer {slug,name,officialUrl}, project {slug,name,officialUrl,district?,projectClass?}, units [{sourceId,sourceUrl,areaSqm,priceRub?,salesStatus?,buildingName?,unitNumber?,floor?,rooms?,finish?}].
- Status UNKNOWN is never inferred as AVAILABLE. Missing units are not inferred SOLD. Unknown prices stay null. All units from a qualifying project are imported, even below 600K RUB/m2.
- Permission evidence is an operator declaration, not independently verified by the importer.
- Images are not imported without verified publication rights.

Blockers: No actual authorised developer feed, no verified running PostgreSQL connection/migrations, no executed production import, no real unit coverage evidence. Existing Prisma building identity is not unique, so run imports serially until a migration adds uniqueness. Existing project slug is global and may collide; reconcile naming conventions before production rollout. The sequential importer is a pilot, not a scale-optimised ETL.
