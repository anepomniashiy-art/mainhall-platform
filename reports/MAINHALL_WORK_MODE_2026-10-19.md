# MAINHALL — Work Mode execution report, 2026-10-19

## Verified delivery
- GPT API → Claude Code produced PR #11: https://github.com/anepomniashiy-art/mainhall-platform/pull/11
- Executor run: https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39282321779
- Head: 10a6795889d6462f0e03d1c956abbbc0a8fa5302. Diff inspected: one project page, editorial metadata only.
- Machine-generated issue report independently lists PR #11 and coordinator/executor success. This is not an invented agent reply.
- Workflow fixes in main: bb2565c (correlation/tool access), 4ca20f4 (CI feedback), eaa7946 (executor tools), 99d006d (feedback association/debug).
- CI final status is NOT confirmed. REST metadata continues to report queued, although job logs contain completed build and 5/5 tests. Re-run request was refused with “workflow run ... already running”. Do not label the checks green based only on logs.
- CI-result feedback workflow executes, but a correlated success comment has NOT been independently observed. Automatic PR-delivery feedback IS observed.

## Code ready for review
- PR #12: https://github.com/anepomniashiy-art/mainhall-platform/pull/12 — fix missing Tailwind PostCSS compilation. Head 0219a04c38072c24edbc46936ed846606dc20354.
- Before: compiled CSS 900 bytes, unprocessed @theme. After: 28,753 bytes, flex/grid rules, no unprocessed @theme.
- PR #13: https://github.com/anepomniashiy-art/mainhall-platform/pull/13 — legacy commercial document, 70 local resources, canonical/OG migration, sitemap/robots, static route export correction and CI checks.
- Latest head: 18750e896b9aef9c69c890a5c0bcaadef02c6b9f. Includes #12; merge #12 first.
- Exact published legacy content is retained; its historical promotional claims are not new verified investment forecasts.
- Neither PR is represented here as merged or published.

## Preservation and validation
- Original live HTTP HTML: 49,663 bytes. All 70 identified CDN dependencies downloaded successfully, including CSS font dependencies.
- Original response bytes and SHA256 manifest retained separately from restored decoded resources.
- Durable private archive: MAINHALL_legacy_snapshot_2026-10-19.zip, 18,266,994 bytes.
- Archive SHA256: fd90d8b2c39797bbf2d7348faf697b1653c58074b02365ae9ae271e0f1653ac4.
- Local restored HTTP tests: commercial HTML plus 45 direct asset references HTTP 200; no missing HTML/CSS file references; decoded resources contain no gzip payload under CSS/JS filenames.
- Static build: 17 project pages; sitemap 20 URLs; preview robots disallows indexing. Commercial canonical points to https://main-hall.ru/commercial/.
- npm run build:static passes, data-contract tests 5/5.
- GitHub CI #13 job logs independently show normal build, static build, 45 asset checks and 5/5 tests:
  https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39283841480/job/118164141970
- #11 CI logs: https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39282521906/job/118159431839
- #12 CI logs: https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39282816289/job/118160383710
- Visual browser check not completed: Chromium download failed. A public snapshot is not a Tilda editor/project export.

## URL checks
- https://main-hall.ru/ — HTTP 200, old commercial document, Tilda headers.
- https://main-hall.ru/commercial/ — HTTP 404 (new route is only in PR).
- https://legacy.main-hall.ru/ — HTTP 503 from this environment; NOT a verified backup.
- https://anepomniashiy-art.github.io/mainhall-platform/ — HTTP 200, residential MAINHALL tagline. This existing staging is not proof that PR #12/#13 are deployed.

## Exact release blocker
DNS is delegated to ns1.tildadns.com / ns2.tildadns.com; observed old A record 176.57.67.199; registrar REGRU-RU. Live HTML identifies Tilda project22535556/page122450506.
No authenticated Tilda/DNS panel access is available in this session. Need authorized Tilda access to this project and domain zone. REG.RU access is only needed if Tilda zone management cannot supply the required records. No registration or payment has been performed.

Do not change the root domain until: backup deployed to legacy subdomain, HTTPS and visual/function tests pass, new release is verified on staging, and prior DNS/Tilda settings and rollback are captured. No root/domain change was performed. Root SEO ranking preservation cannot be guaranteed by a content migration; no root→commercial redirect or bot-specific content is implemented.

## Remaining work
Confirm final CI conclusions and correlated CI feedback; merge reviewed PRs; publish and visually verify new staging; restore legacy subdomain over HTTPS; authenticated DNS cutover and rollback test; continue source-backed editorial enrichment and licensed project imagery. Fresh Nmarket XML/prices remain outside this release.
