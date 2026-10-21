# Research and team recovery: source map (issue #18)
Date: 2026-10-20. Executor: Claude Code, Action run 39392769874.

## 1. Team: recovered
Source: the team section of MAINHALL's own previous site, main-hall.ru `#team`.
- Local copy of the live site: `public/legacy-mainhall/index.html`
- Earlier export: `legacy/index.html`, lines 429–455

Each photo `alt`, name, role and bio sit together in a single card, so we know which photo belongs to whom. Bios are copied verbatim.

| Person | Role (live site) | Photo in repo | Original asset | Tilda CDN |
|---|---|---|---|---|
| Андрей Непомнящий | Партнёр | `public/images/team/andrey-nepomniashchiy.jpg` (483×483) | `public/legacy-mainhall/assets/6eb04e5b5cd60be3-IMG_6163_2.jpg` | `tild3334-3636-4233-a237-636432363665/IMG_6163_2.jpg` |
| Иван Ячменев | Партнёр | `public/images/team/ivan-yachmenev.jpg` (1024×1024) | `public/legacy-mainhall/assets/75543ff3f8d2bc96-IMG_6145.JPG` | `tild3736-3138-4265-a664-613930303430/IMG_6145.JPG` |
| Сергей Чернавин | Руководитель отдела продаж и привлечения* | `public/images/team/sergey-chernavin.jpg` (830×826) | `public/legacy-mainhall/assets/59426f858b465503-_.jpg` | `tild3934-6664-4561-b362-373130663031/_.jpg` |

\* `legacy/index.html` says «Руководитель отдела продаж». The live-site copy is used.

Structured data: `src/lib/team.mjs`. The photos are byte copies of the originals with the EXIF/XMP (APP1) segment removed. ICC colour profiles are kept. The bios describe **commercial real estate** experience (the previous MAINHALL direction). We did not invent any roles for the residential Moscow direction. No phones, messengers or other private details are in the team data.

The issue also mentions «employees/photos from north-cyprus project». We could not identify any such people: that repo is inaccessible (see §2). No other faces were imported.

## 2. Investment research: NOT recovered (access blocker)
| Requested item | Status | Found in mainhall-platform? |
|---|---|---|
| Квартал Серебряный бор: review | not recovered | No mention in files, git history or issues |
| Квартал Издание: review | not recovered | No mention |
| U2: review | not recovered | No mention (`u2` in `src/app/(public)/units/page.tsx` is a placeholder row ID, not this project) |
| Квартал на воде: review | not recovered | No mention |
| Район Южный порт: catalysts | not recovered | Only an editorial entry `level-yuzhnoportovaya` in `src/lib/editorial-projects.ts` (no prices, no catalysts) |
| Installment catalogue / comparison | not recovered | Only due-diligence placeholders («Реальные условия рассрочки») in `editorial-projects.ts` |

Searched:
- all tracked files and the full git history (147 commits), using keywords Серебрян / Издание / Южный порт / рассрочк / PHOTO_MAP / MAINHALL_BRIEF
- issues #1, #2, #3, #6, #7 with comments

Exact blocker:
- `gh api repos/anepomniashiy-art/north-cyprus` → `404 Not Found`. The Action's GITHUB_TOKEN is scoped to `mainhall-platform`; `gh repo list anepomniashiy-art` returns only this repo. This is consistent with `docs/INFRASTRUCTURE_DISCOVERY.md`.
- So `PHOTO_MAP.md`, `MAINHALL_BRIEF.md`, the archive and north-cyprus issue #93 could not be read.
- Re-collecting facts from the web was not attempted: WebSearch permission was denied in this run. Per the issue, nothing was invented in its place.

`src/lib/research-recovery.mjs` keeps the six items as `not_recovered` with empty `facts` / `scenarios` / `sourceUrls`. `tests/team-research.test.mjs` fails if any item gains content without source URLs and a date.

## 3. How to unblock (one of these)
1. Add this repo's Action access to `north-cyprus`. Options: a fine-grained PAT/secret with `contents:read` on both repos, or installing the Claude GitHub App on `north-cyprus`. Then re-run #18.
2. Or copy the folder (e.g. `docs/reports/source`, `PHOTO_MAP.md`, `MAINHALL_BRIEF.md`) from north-cyprus into `mainhall-platform/docs/reports/source/` in a PR. The executor then converts it into `research-recovery.mjs` entries, keeping the original dates, URLs and terms, and splitting facts from scenarios.
3. Or allow WebSearch for the executor, so public facts (developer, address, official URL) can be re-collected. These would be labelled «собрано заново 2026-10-20», not the original research.
