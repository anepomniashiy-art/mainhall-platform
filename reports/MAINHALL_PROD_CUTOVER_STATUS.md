# MAINHALL — production cutover: status, evidence, exact access blockers

- **Prepared:** 2026-10-19, session Claude Code (Opus 4.8), `session_01VJpDhTerzJubXJtKiGQr2Y`.
- **Repo:** `anepomniashiy-art/mainhall-platform` — **visibility = PUBLIC** (confirmed; do NOT commit secrets or private archives here).
- **Rule:** no fabrication. Each line is tagged `verified-by-me` / `recovered-by-team` / `pending` / `blocked`.
- **For GPT:** this file is the hand-off. Nothing below is a deployment claim — the production cutover is **not done** and is **blocked on owner-side access** named in §5.

---

## 1. Where main-hall.ru lives (hosting / DNS / Tilda identity) — INDEPENDENTLY VERIFIED

Runner recon run **39278916025** = success. Evidence committed under `backup/main-hall-ru/2026-10-19/recon/`.

| Fact | Value | Status |
|---|---|---|
| Registrar | **REGRU-RU** (REG.RU) | `verified-by-me` (whois, `recon/dns.txt`) |
| Nameservers | **ns1.tildadns.com / ns2.tildadns.com** → the DNS zone is managed inside **Tilda** | `verified-by-me` (`recon/dns.txt`) |
| Apex A record | **176.57.67.199** | `verified-by-me` (`recon/dns.txt`) |
| www | CNAME → `main-hall.ru.` | `verified-by-me` |
| Front CDN | **DDoS-Guard** (`server: ddos-guard`, sets `__ddg*` cookies) sits in front of Tilda | `verified-by-me` (`recon/headers.txt`) |
| Platform | **Tilda** — `x-tilda-server`, `x-tilda-imprint` headers; `last-modified: Sat, 28 Feb 2026` | `verified-by-me` (`recon/headers.txt`) |
| Site shape | single page; `<title>` «MAINHALL — Инвестиции в коммерческую недвижимость Москвы»; meta «Покупаем коммерческие объекты на торгах ниже рынка… Доходность от 5% в месяц. Вход от 10 млн ₽.» | `verified-by-me` (`recon/canonical_meta.txt`) |
| Sitemap | one URL only: `https://main-hall.ru/` | `verified-by-me` (`recon/sitemap_urls.txt`) |
| robots.txt | standard Tilda (`Disallow: /tilda/form*` …) + `Sitemap:` line | `verified-by-me` (`recon/robots.txt`) |
| Forms | no static `<form>` in HTML — lead forms are JS-injected Tilda widgets (post to Tilda's backend) | `verified-by-me` (`recon/forms.txt`) |
| Assets | 44 files on `static.tildacdn.com` (fonts css, tilda js, 6 object photo-sets, client logos Alfa/Sber/Ozon/WB/Magnit/Tbank/CDEK/VkusVill/Yandex/Samokat/Boxberry, `MH_logo.png`, favicon) | `verified-by-me` (`recon/checksums.txt`) |
| Panel access (Tilda / REG.RU) | **Claude does NOT have it** — no Tilda/REG.RU secret anywhere in repo | `verified-by-me` |
| Authoritative archive (original chat) | `MAINHALL_ARCHIVE.zip` (~11 MB), from the build-chat — not reachable from this session (mine below is an independent re-capture) | `recovered-by-team` |

The sandbox this session runs in cannot resolve or reach main-hall.ru (allowlisted egress: `ENOTFOUND`, even `dns.google:443` refused), so every live-site fact above is produced on a GitHub Actions runner, not invented here.

**Cutover mechanics implied by the above:** the apex `A 176.57.67.199` lives in Tilda's DNS zone (`tildadns.com`). To move the apex to a new host, either the NS at REG.RU move off Tilda (to a zone we can automate), or the record changes inside Tilda's panel. Both are owner-side (see §5). DDoS-Guard in front means the new host must also terminate correctly once the record flips.

## 2. New MAINHALL app — what is real

| Item | Status | Evidence |
|---|---|---|
| 17 editorial Moscow projects | `verified-by-me` | `src/lib/editorial-projects.ts` — 17 slugs (high-life, opus, badaevsky, vesper-kutuzovsky, shagal, level-yuzhnoportovaya, symphony-34, nicole, lumin, lunar, stone-sokolniki, stone-blik, king-and-sons, stories-mosfilmovskaya, dom-7-danilovsky, upside-towers, enigmia) |
| Routes | `verified-by-me` | `/`, `/projects`, `/projects/[slug]`, `/commercial`, `/developers`, `/units` |
| Build | `verified-by-me` | CI green on main (ci.yml: npm ci → prisma validate/generate → next build → data-contract tests) |
| Staging (GitHub Pages) | `verified-by-me` (deploy) / `pending` (external HTTP) | deploy-pages run #20 = success → `https://anepomniashiy-art.github.io/mainhall-platform/`. Cannot HTTP-verify from this sandbox; needs an external GET. |
| Prices / inventory | correct per rule | editorial data carries no invented prices; public inventory stays «Цена уточняется» until an authorized Moscow feed is verified |

## 3. Deploy topology (why a cutover cannot happen from code alone)

- The **only** deploy path in the repo is **GitHub Pages** (`deploy-pages.yml`), and the app sets `basePath: /mainhall-platform` under `GITHUB_PAGES=true` — i.e. it is built as a **project page**, not for an apex domain. `verified-by-me`.
- `vercel.json` exists but is **build-config only** (`framework/buildCommand/installCommand`). There is **no** `VERCEL_TOKEN`, no linked Vercel project, no attached domain. It does not give this session deploy capability. `verified-by-me`.
- No DNS-provider token (Cloudflare/REG.RU/etc.), no CNAME file, no Tilda key anywhere in the repo. `verified-by-me`.

**Conclusion:** putting the new site on `https://main-hall.ru` requires changing the apex A record away from `176.57.67.199`. That record is inside Tilda's DNS zone (`tildadns.com`). No token in this repo can change it. This is the blocker — not a code gap.

## 4. Backup (step 2) — DONE (independent, checksummed capture of current live state)

- Self-contained mirror captured on a clean-internet runner: page + ALL cross-host requisites from `static.tildacdn.com` — **45 files, 8.1 MB** (index.html + fonts/css/js + 6 object photo-sets + client logos + MH_logo + favicon).
- **SHA-256 manifest of every file** committed at `backup/main-hall-ru/2026-10-19/recon/checksums.txt` (rollback verification). Recon (dns/headers/robots/sitemap/forms/canonical/filelist) committed alongside. The raw `index.html` is committed under `backup/.../pages/`.
- Full self-contained archive (with image bytes) is a run **artifact** `main-hall-ru-full-mirror`; I keep image bytes out of the PUBLIC git tree and hand the archive + checksums to the owner. The legacy site is itself public, so nothing secret is exposed; the authoritative ~11 MB archive from the build-chat remains the owner's private copy.
- This is complementary to the self-contained `/legacy/` copy another session committed (`5e2e5c02`) — mine is an independently re-verified, checksummed snapshot of TODAY's live bytes (`last-modified 2026-02-28`, unchanged since build).

## 5. EXACT access needed to finish the cutover (nothing generic)

The cutover needs two owner-side grants. After they are in **GitHub Secrets**, I automate the rest via API — no manual UI steps, no asking the owner to repeat work.

**A. DNS control of the main-hall.ru zone** — pick one:
- **A1 (recommended, fully automatable):** move DNS off Tilda. Add REG.RU API credentials + a Cloudflare zone:
  - Secrets: `REGRU_USERNAME`, `REGRU_PASSWORD` (REG.RU API) **or** confirm you will switch NS to Cloudflare once; plus `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`.
  - Then I: create the Cloudflare zone, set apex + `www` to the new host, add `legacy.main-hall.ru` → the re-hosted old site, enable SSL, and keep rollback = restore apex A to `176.57.67.199`.
- **A2:** give Tilda panel access as secrets (`TILDA_*`) if you prefer keeping NS at Tilda — then I repoint/unpublish via Tilda's API where supported.

**B. Apex host for the new Next.js app** — pick one:
- **B1 (recommended):** `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` → I deploy to Vercel from Actions and attach `main-hall.ru` (matches decision D-103).
- **B2:** stay on GitHub Pages with a custom domain → I drop `basePath`, add the `CNAME`, and point DNS (from A) at Pages. Cheaper, but no SSR/API.

That is the whole blocker. With A + B in secrets, I run: backup verified → legacy re-hosted on `legacy.main-hall.ru` (HTTPS smoke-tested) → new site on staging smoke-tested → apex cutover → HTTPS/mobile/forms checks → rollback kept ready.

## 6. /commercial & SEO (following GPT's correction — no cloaking, no bad 301)

- Do **NOT** 301 `/` → `/commercial/` (`/` is the NEW platform root; it cannot serve both). URL `#fragments` are not sent in HTTP, so anchor-level redirects are impossible. `agreed`.
- Plan: preserve the legacy content under **`/commercial`** (real section, legacy-specific `<title>`/description/canonical) **and** keep the full old site reachable on **`legacy.main-hall.ru`**. Old root `/` was the only indexed URL; it becomes the new platform root, with a controlled content shift and the commercial business represented meaningfully under `/commercial`. Document the unavoidable SEO risk; no bot cloaking.

## 7. Honest state

- Production cutover: **NOT done.** Nothing is published to `main-hall.ru` by this session. Will not be, until §5 access exists, the legacy site is proven on a subdomain over HTTPS, staging is smoke-tested, and rollback is ready.
- Backup: **DONE** — independent, checksummed, self-contained capture committed on branch `claude/mainhall-prod-cutover` (`backup/main-hall-ru/2026-10-19/`); recon run 39278916025 success.
- Staging: deployed to Pages (deploy #20 success) → `https://anepomniashiy-art.github.io/mainhall-platform/`; external HTTP check still owed (can't reach from this sandbox).
- Blocker: **§5 access** (DNS zone control + apex host). Nothing in code substitutes for it.
- Coordination: multiple agents (session_011v + `mainhall-push.yml`) are pushing to `main` concurrently; to avoid production collisions this session holds production-affecting commits and focuses on the backup + the access unblock above, unless the owner directs otherwise.
