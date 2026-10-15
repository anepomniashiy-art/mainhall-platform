CLAUDE CODE — MASTER HANDOFF / MOSCOW PRIME REAL ESTATE

Version: 1.0 • Date: 2026-10-15 • Prepared by: GPT for the owner and Claude Code.

0. Read this first

You are joining a collaboration with the owner (Andrey) and GPT to develop a production-quality investment real estate agency website focused exclusively on NEW-BUILD primary residential property in Moscow, targeting properties priced from RUB 800,000 per m². A previous website already exists and Claude Code reportedly has access to it. DO NOT rebuild from scratch before auditing it. Reuse existing code, hosting, data and design where sound. Do not assume this repository is anepomniashiy-art/north-cyprus: that repository was used for a separate conversation; verify the actual site repo. Never overwrite production data or deploy without clear approval and rollback.

Notion board: https://app.notion.com/p/3a06cdccb5c64a758a595ef8ed5736bf
Existing coordination candidate: GitHub anepomniashiy-art/north-cyprus issue #93 — check whether appropriate, then propose a project-specific issue/repo for this site. Do not post unrelated changes there without confirmation.

Working language: Russian for owner-facing reports and tickets; English acceptable in code/documentation.

1. Product vision

Build a premium, fast, credible website for a Moscow investment real estate agency, displaying all discoverable, verifiable Moscow new-build residential projects within the target segment, with actual unit availability and prices when the developer explicitly publishes or shares them, high-quality legitimately usable renders / floor plans, detailed filters, price history, investment comparison, lead capture, and a private analytics interface.

Not a classifieds scraper. Priority data sources are developer-owned official project sites, permitted data feeds, and partner/broker exports. Listings portals (Avito/Cian/etc.) must not become the canonical source of available developer stock. Supplementary links may be included only if explicitly labeled.

Target filter: 800,000 RUB/m² and above, applied preferably at the UNIT level. A project qualifies when at least one verifiable relevant primary-market unit meets the price threshold or verified project pricing supports it; include below-threshold units within a qualifying development internally for comparison. Luxury projects with unpublished prices remain visible as price on request / unverified, not falsely excluded. Keep track of target geography: Moscow City federal subject; Moscow Oblast as separately toggleable, NOT silently mixed in.

2. Immediate assignment: discovery and written response FIRST

Before significant implementation, inspect current accessible source code, docs, deployment and credentials without displaying secrets. Reply with docs/CLAUDE_HANDOFF_TO_GPT.md, commit it, and provide owner a downloadable/accessible Markdown file and its repository link. If GitHub coordination is agreed, post concise findings as [CLAUDE CODE] in the project issue (if permitted). The owner will pass your response to GPT. The handoff must answer ALL questions below and include evidence (repo paths, safe command outputs, links or screenshots when allowed), identifying unknowns precisely.

Questions GPT requires Claude to answer

1. What exact GitHub repo(s), branches, directories and production/staging domains contain the earlier site? Include commit SHA, current status, working tree changes and project ownership boundaries.
2. What does the current site already do (pages, catalog, CMS/admin, auth, CRM, contacts, SEO, analytics, payment, map, locales)? What is working, broken or stubbed? How can it be run locally and tested?
3. Stack: framework, language, libraries, UI system, database, ORM, hosting, CI/CD, storage, image pipeline, infrastructure, costs and licenses? Which services are connected and which secrets/config values are missing (do not expose secret values)?
4. What real estate data sources and importers already exist? For each: source URL, access rights, endpoint/feed format, refresh rate, current coverage, unique IDs, developer/project/unit granularity, API restrictions.
5. Are real Moscow premium developers/projects already stored? How many verified Moscow projects, developer relationships and currently available units do we have, as of what date? Do not make up totals.
6. Which official developer sources can be accessed in a permitted, reliable way (test sample): Sminex, Vesper, Capital Group, MR Group, PIONEER, plus any others? Differentiate public catalog, broker feed, authenticated API, PDF/XLSX, and ‘not verified’. Record obstacles and terms-of-use / robots access limitations. Do NOT bypass CAPTCHA, login protections, paywalls, rate limits or anti-bot controls.
7. How are building/project/unit identifiers matched and deduplicated? Are discounts, dynamic pricing, mortgages and offers represented separately from base unit price? Can sold/blocked/reserved units be differentiated?
8. What images/floorplans already exist? For each image source, is reuse licensed/approved? Are original no-watermark images available? Do not remove or evade watermarks. Is there a CDN and local storage policy?
9. What would you keep versus refactor? Provide a prioritized gap analysis, estimated effort in relative size, risks, dependencies, and architecture options. No ungrounded hard budget promises.
10. What accesses/decisions do you need from the owner (domain, brand, business contacts, hosting, partner authorizations, editorial voice, languages, privacy/consents, CRM)? Ask only blockers; use safe placeholders elsewhere.
11. Can Claude Code read/write the Notion board with currently connected tools? If not, can it work via GitHub issue/comments and Markdown handoffs? Specify exact supported workflow.
12. Confirm a reliable two-way coordination loop: names of exact handoff files, GitHub issue path, comment prefixes [GPT] and [CLAUDE CODE], update cadence when actively working, conflict-resolution and sign-off. IMPORTANT: no claim that agents can exchange messages automatically or run in background without configured automations/webhooks; human relays are acceptable.

3. Product requirements (v1)

Public-facing site

• Luxury-grade design: elegant typography, editorial real-estate visuals, spacious cards, premium look, mobile-first, fast. Reuse existing brand assets where appropriate; don’t copy third-party layouts.
• Main page; Developers index; Projects index; Project page with verified location, developer, classes, status, construction timeline, legal sources, price range, gallery, project documentation, amenities and map; Units catalog with filters (price absolute and RUB/m², area, bedrooms, district, completion date, developer, finish, view, floor, building, available-now); unit detail with plan, public source link, price timestamp and CTA.
• Show exact fresh status: available, reserved, sold, unknown; never misrepresent unknown as available.
• Lead actions: book consultation, enquire about exact unit/project, Telegram/WhatsApp/contact form where owner-supplied and consent compliant; private CRM or existing CRM integration if available.
• Source badges and last verified date; show ‘price on request’ rather than fabricated values.
• Russian first, architecture localization-ready; English optional after owner approval.
• SEO: unique editorial copy, canonical URLs, structured data where appropriate, metadata, XML sitemap, server-rendered indexable pages and performant media.
• Legal: privacy policy, personal-data consents, image/source attribution and contact disclosures appropriate to actual operator; get legal review before release.

Analyst/admin experience

• Private dashboard tracking projects, units, import jobs, stale prices, errors, audit trail, duplicate resolution, media rights and individual deal annotations.
• Daily/weekly historical price snapshots; never overwrite historical price changes.
• Comparable selection must normalize area, rooms, floor, views, furnishing/finish, delivery date, payment structure and status; flag unsupported comparisons.
• Investment signal = transparent rule with explanation + confidence, never a guaranteed return. Avoid fabricated cap rates, guaranteed growth or ‘discount’ derived solely from marketing banners.
• Approval workflow for questionable data and manual expert overrides with audit log.

4. Required data model (adapt to existing schema)

developers, projects, buildings, units, price_snapshots, availability_events, source_records, source_connectors, images, media_licenses, project_documents, import_runs, manual_overrides, leads, audit_events.

Unit fields: stable internal ID, source identifier, canonical project/building, unit number when lawful and published, address, floor, rooms, area sqm, finish, orientation/view (with provenance), price RUB, price per sqm (derived), sales status, financing/discount conditions, source URL, fetched_at, source_updated_at when published, first_seen_at, last_seen_at, checksum, confidence, verification state.

Project fields: boundaries/address/coordinates (verified), Moscow jurisdiction, class with sourced methodology, completion dates, developer, source evidence, public price band, eligibility evidence for 800k threshold.

Data pipeline: collect -> normalize -> validate -> deduplicate -> quality score -> snapshot -> publish; idempotent upserts, monitoring, rate limits, retries/backoff, manual correction workflow. Respect source terms, robots directives where applicable, contractual and legal restrictions; prefer authorization/friendly feeds. No automated circumvention of access controls.

5. Developer/source pilot

Investigate these candidates, not guaranteed existing API sources:

• Sminex https://www.sminex.com/
• Vesper https://www.vespermoscow.com/
• Capital Group https://www.capitalgroup.ru/
• MR Group https://www.mr-group.ru/
• PIONEER https://pioneer.ru/
Additional possible candidates: ANT Development, Hutton, Coldy, October Group, Upside Development, STONE, Level Group. Verify each company’s active projects and published inventories; do not assume everything on their websites is residential or >=800k.

Create docs/sources/moscow-premium-source-matrix.csv with columns:
developer,project,official_url,source_type,auth_required,automation_permission,unit_level_data,price,availability,plan_images,license,refresh_policy,last_checked,coverage,blocking_issue,notes.

Pilot exit criterion: at least 3 authorized, stable, verifiably official unit-level connectors with representative data, or a documented blocker report plus explicit decision on alternatives. Never fake ‘success’ by importing synthetic live inventory. Capture 5–10 sample units per connector only when permitted; log validation against live developer pages and last-fetched timestamps. Keep code reusable with an adapter interface.

6. Images: original & legally reusable

Collect image URLs and metadata, not stolen/unlicensed reproductions. Prefer official developer/broker media kits and contractual permission for public republication. Store attribution, license scope, source URL, license confirmation date, derivatives, file hashes, sizes; use responsive WebP/AVIF only when adaptation permitted. No watermark removal. Avoid publishing images when rights are uncertain. Placeholder/fallback is acceptable.

7. Technical recommendations (not mandatory)

• Preserve existing architecture unless compelling reason to change. If greenfield components necessary: Next.js/TypeScript or current framework; PostgreSQL + migrations; Python collectors where easier; task queues/crons; S3-compatible media storage; OpenAPI service; quality flags and audit logs.
• Secrets in env/secret manager, not committed. Staging separate from production. Schema migrations and backup + rollback before deploy.
• Unit + integration tests for normalization, price units, pagination, duplicate IDs, missing prices and changing schemas. E2E for site search/contact flow.
• Performance and security baselines: logging, monitoring of scrape failures and stale data; auth for admin; abuse prevention and privacy-by-design.

8. Work sequence

Phase 0 — Audit (P0). Inspect site, repository, hosting, state, existing assets and tools. Create docs/CLAUDE_HANDOFF_TO_GPT.md. No destructive changes.
Phase 1 — Foundation (P0). Agree architecture, migrations, unit data contract, source matrix, first verified projects list, image rights approach, site IA/wireframes.
Phase 2 — Real data pilot (P0). Implement up to three permitted connectors. Prove reliability + freshness and explain missing data.
Phase 3 — Site (P1). Integrate with existing website, production-quality catalog, project/unit pages, filters, leads, search engine indexing and accessibility.
Phase 4 — Investment analysis (P1). Historical prices, comparables, alert signals, source confidence and admin moderation.
Phase 5 — Release (P1). Testing, owner approval, privacy, staging demo, rollout, observability, incident rollback.

After each phase give: changed files, tests run and outputs, demos/screenshots, URLs, blockers, risks, next actions. No claim of completion without evidence.

9. Collaboration and Git workflow

• Notion is the management board: https://app.notion.com/p/3a06cdccb5c64a758a595ef8ed5736bf . Keep task statuses aligned where tool access exists; otherwise supply owner with exact status updates for GPT to post.
• Use a dedicated issue in the actual site repository as the conversation channel when approved. Prefix comments [GPT], [CLAUDE CODE]. Each message carries ID, Context, Action, Evidence, Questions, Next owner fields. Use numbered requests [Q-GPT-001], [Q-CLAUDE-001].
• Canonical handoffs: inbound docs/CLAUDE_BRIEF_MOSCOW_800K.md (this document); outbound docs/CLAUDE_HANDOFF_TO_GPT.md; running decisions docs/DECISIONS.md; current progress docs/STATUS.md.
• Use dedicated branch and pull requests; do not overwrite uncommitted edits or unrelated branches; no merge/deploy without requested approvals.
• If independent agent-to-agent access is missing, user relays handoff files. Do not assert direct persistent agent chat.

10. FIRST actions for Claude Code (do now)

1. Identify real existing site repo and deployment; audit everything, without changing deployment.
2. Create a dedicated working branch unless owner-approved convention dictates otherwise.
3. Answer all 12 questions in docs/CLAUDE_HANDOFF_TO_GPT.md clearly (known/unknown/verified/evidence); include suggested architecture and scoped milestones.
4. Create the official source matrix with links and explicit rights/permissions status; test minimally and only where authorized.
5. Prepare docs/DECISIONS.md and docs/STATUS.md; propose (not execute) major refactors.
6. Return a short Russian owner-facing summary of exactly what works already, what needs decisions, and where GPT can read your response. Ensure the handoff Markdown is available for the user to send GPT.

11. Definition of done

The project is NOT done when a template appears or a page has placeholder units. Done means verified real developer inventory for measurable covered developers, explicit gaps, legal image use, documented source refreshes, fast responsive public site, secure lead/admin flows, reproducible automated tests, and approved deployment. A claim of ‘all Moscow projects’ must be supported by a documented completeness methodology and exclusions; otherwise say ‘catalog of verified projects’ and report estimated coverage transparently.