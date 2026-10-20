# MAINHALL — main-hall.ru domain / TLS status (2026-10-20 ~05:30 UTC)

Executor: Claude Code via GitHub Actions run [39374708091](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39374708091) (API executor, fresh runner; no access to interactive Claude sessions or to REG.RU / Tilda panels).
All values below were measured from this runner. Reproduce with `scripts/verify-domain.sh`.

## Verdict

**main-hall.ru is NOT serving MAINHALL yet.** DNS already points at GitHub Pages, but the Pages site has **no custom domain bound** (`cname: null`). So GitHub answers `404 Site not found` on HTTP and has not issued a certificate for main-hall.ru. HTTPS fails with a certificate name mismatch.

## 1. DNS (fresh queries at 1.1.1.1, 8.8.8.8 and authoritative ns1.reg.ru agree)

| Name | Type | Value | TTL |
|---|---|---|---|
| main-hall.ru | NS | ns1.reg.ru, ns2.reg.ru (delegation from .ru TLD confirmed with `dig +trace`) | 345600 at TLD |
| main-hall.ru | A | 185.199.108.153, 185.199.109.153, 185.199.110.153 | 86400 |
| main-hall.ru | AAAA | (none) | — |
| www.main-hall.ru | CNAME | anepomniashiy-art.github.io. | — |

- Tilda is out of the path: NS are REG.RU, and the A records are GitHub Pages. The old Tilda / DDoS-Guard `176.57.67.199` is gone.
- Minor issue: the apex is missing the 4th GitHub Pages IP `185.199.111.153`. It works without it, but GitHub recommends all four. Optional AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
- The TTL is 86400 (24 h). Rollback through DNS would take up to a day to propagate. Lowering it to 300–3600 during the cutover makes rollback faster.

## 2. TLS

| Host | Certificate served | Valid for host? |
|---|---|---|
| main-hall.ru | CN `*.github.io` (Let's Encrypt YR1, until 2026-12-29) | **No.** The SAN has only github.com/github.io names |
| www.main-hall.ru | the same `*.github.io` certificate | **No** |

GitHub issues a main-hall.ru certificate only after the domain is bound to the Pages site.

## 3. HTTP

| URL | Result |
|---|---|
| http://main-hall.ru/ | **404**, `<title>Site not found · GitHub Pages</title>` ("There isn't a GitHub Pages site here.") |
| http://www.main-hall.ru/ | **404** (same page) |
| https://main-hall.ru/ (and /commercial/, /legacy/, /projects/, robots.txt, sitemap.xml) | **000**, curl error 60: no certificate subject matches `main-hall.ru` |
| https://www.main-hall.ru/ | **000** (same error) |
| https://anepomniashiy-art.github.io/mainhall-platform/ | **200**, title «MAINHALL — Инвестиции в премиальную недвижимость Москвы», last-modified 2026-10-19 21:42:50 GMT |
| …/mainhall-platform/commercial/, /legacy/, /projects/, /projects/high-life/ | all **200** |

**Side effect on the preview:** the deployed build (00593a6) uses root-path URLs for the custom domain. On the github.io preview, assets such as `/_next/static/chunks/008rzxvn0yz2i.css` therefore return **404** at the github.io root. They exist only under `/mainhall-platform/_next/…`. Until the domain is bound, the preview HTML loads **without CSS/JS/images**. This is expected for a root-path build and resolves itself once main-hall.ru is bound.

## 4. GitHub Pages state

`GET /repos/anepomniashiy-art/mainhall-platform/pages`:

```
cname: null, status: null, build_type: workflow, https_enforced: true,
html_url: https://anepomniashiy-art.github.io/mainhall-platform/, source.branch: main
```

The `CNAME` file in the repo (`main-hall.ru`) does **not** bind the domain for `build_type: workflow`. The domain must be set in the Pages settings.

Deploy runs (`deploy-pages.yml`):

| Run | Commit | Result |
|---|---|---|
| [39329408586](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39329408586) | 00593a6 | success. **This is the build currently served** |
| [39374673760](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39374673760) | a7c2016 | cancelled (superseded) |
| [39374692548](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39374692548) | 42ed53c | **failure**. The build passed, then the deploy job failed at step "Bind main-hall.ru to this Pages site" |
| [39374835189](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39374835189) | 3e7abf1 | **success**. Bind step removed. "Inspect Pages configuration" printed `cname: null`. The soft "Verify production DNS and HTTP" step had DNS matching §1, and its `curl https://main-hall.ru/` failed on TLS (`continue-on-error`) |

The failing step (added in a7c2016) logged:

```
gh api --method PUT repos/anepomniashiy-art/mainhall-platform/pages --raw-field cname=main-hall.ru
gh: Resource not accessible by integration (HTTP 403)
```

`GITHUB_TOKEN` cannot change Pages settings; that API needs repo-admin rights. Commit **3e7abf1** (on main, 05:25 UTC) already replaced the bind step with a read-only inspect step plus a soft DNS/HTTPS check, and its deploy succeeded. Deploys from main work again, but the domain is still unbound.

## 5. Work on Oct 19 and overnight to Oct 20 (from `git log origin/main`)

- Pipeline: 655f384, 62ecc64, d0040e8, ba076c0 (bridge limits, dispatch fixes, cron off). 30043f7, bb2565c, 4ca20f4, eaa7946, 99d006d (PR gate, run↔PR correlation, automatic CI feedback). 42ed53c (relay condition fix).
- PRs merged: #10 (execution report), #11 bffa382 (generateMetadata for /projects/[slug]), #12 f00e405 (Tailwind via PostCSS), #14 38367af (infrastructure discovery + coordinator intake).
- Legacy preservation: ad58136 (backup workflow), 5e2e5c0 (`legacy/`), 43b83e3 + 5898018 (`/commercial/` with local assets + SEO), 283292c + 00593a6 (root asset URLs for the custom domain, with a test).
- Design, chronologically: 53a00f3 / 6b63ac2 FORUM + Prata/Manrope → c78ada2 … b726306 → **fb56516 Onest + 5a58623 sunlit Badaevsky (current; preserved, untouched here)**.
- Domain: 7ce0d78 (CNAME file + root base path), a7c2016 (Pages API bind step; fails with 403, see §4), 3e7abf1 (bind step replaced by read-only inspect + soft DNS/HTTPS check; deploy green).
- Production `main-hall.ru` serving MAINHALL: **not achieved** (see §3).

## 6. One next step (owner, about 1 minute, needs repo-admin)

**Settings → Pages → Custom domain → enter `main-hall.ru` → Save.** After the DNS check passes and the certificate is issued (usually minutes, up to about 24 h), tick **Enforce HTTPS**.
CLI alternative with an admin token: `gh api -X PUT repos/anepomniashiy-art/mainhall-platform/pages -f cname=main-hall.ru`.

After that, no redeploy is needed: the currently served artifact (3e7abf1, same site content as 00593a6) is already a root-path build.

Recommended alongside it (outside this PR):

1. In REG.RU, add the A record `185.199.111.153`. AAAA records are optional.
2. Re-run `scripts/verify-domain.sh`. `RESULT: OK` means the apex and www serve over valid HTTPS.

## Rollback

- Fastest: in Settings → Pages, clear the custom domain. The domain then stops serving the site, and the github.io preview returns.
- Full rollback to the old site: point the apex A record back at the old host. Note the 86400 TTL. The old Tilda zone is no longer authoritative, so returning to Tilda means restoring its records at REG.RU. The legacy content is preserved in `legacy/` and under `/commercial/`, and the private archive SHA-256 `fd90d8b2…53ac4` is reported in this issue.
