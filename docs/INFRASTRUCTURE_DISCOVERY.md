# MAINHALL — Infrastructure discovery

Issue #7 · executor run [39286999873](https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/39286999873) · 2026-10-19
Scope: find existing paid infrastructure (owner recalls a server in Amsterdam / Netherlands / Belgium; Walton/Wellton Property on Beget) and decide whether MAINHALL and an event-driven coordinator can reuse it. No secret values appear in this document. Nothing was bought, registered, deployed or changed in DNS.

## 1. What was searched (and what was not)

| Source | Accessible to this executor? | Result |
|---|---|---|
| This repo: all files, all 14 remote branches, full history (81 commits) | ✅ | No mention of Amsterdam, Netherlands, Belgium, Beget, Walton/Wellton, VPS/VDS host, SSH host or server IP. The only "hetzner" hit is a transitive npm package in `package-lock.json` (`@distilled.cloud/hetzner`, pulled in by `@prisma/composer`), not infrastructure. |
| Repo docs on hosting | ✅ | `docs/DECISIONS.md` D-103: "Vercel для MVP. Миграция на VPS при масштабировании" — a plan, no provisioned server. `docs/CLAUDE_HANDOFF_TO_GPT.md`: hosting = Tilda, "Secrets/Config: Нет". `vercel.json` exists, but there is no evidence of a linked Vercel project. |
| GitHub Actions secrets referenced by workflows | ✅ (names only) | Only `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`. No `SSH_*`, `DEPLOY_*`, `BEGET_*` or host secret is referenced. |
| Repo secrets/variables list via API | ❌ HTTP 403 (`Resource not accessible by integration`) | Unknown. The owner can check *Settings → Secrets and variables → Actions*. |
| Runner environment (variable **names** only) | ✅ | Only model-provider, GitHub-token and commit-signing variables (`SSH_SIGNING_KEY` is the action's git commit-signing key, not a server login). There is no `~/.ssh` directory and no server host/IP variable. |
| Other repos of the owner (e.g. `anepomniashiy-art/north-cyprus`, which `docs/CLAUDE_BRIEF_MOSCOW_800K.md` mentions) | ❌ HTTP 404 with this token (it is scoped to this repo) | Unknown. If a server was set up in that conversation, its records would be there, not here. |
| Original Claude chat / coordinator session history (where the server purchase may have been discussed) | ❌ This executor is a fresh GitHub Actions job and cannot see claude.ai chats or other sessions | **Inaccessible.** Requested from the original session in §6. |
| Hosting control panels (Beget, Tilda, REG.RU, any VPS provider) | ❌ No credentials present | Inaccessible. |

**Conclusion:** no evidence of an Amsterdam/NL/BE server is reachable from this executor. This does **not** prove the server doesn't exist. It means its records live outside this repo and this job, most likely in the original chat, the provider's account email, or billing.

## 2. Public evidence (DNS / RDAP / HTTP, collected 2026-10-19 ~16:39 UTC)

### main-hall.ru (current production, old Tilda site)
- NS: `ns1.tildadns.com`, `ns2.tildadns.com`
- A: `176.57.67.199`. RIPE RDAP: `176.57.67.0 - 176.57.67.255 Tilda_Publishing RU`
- `www` → CNAME `main-hall.ru`. No `legacy`/`old`/`staging`/`api` subdomains resolve.
- Registrar REG.RU (already recorded in `reports/MAINHALL_WORK_MODE_2026-10-19.md`).

### Walton / Wellton Property: actual domain is **welltonproperty.com**
Candidate spellings checked:

| Domain | NS | Verdict |
|---|---|---|
| **welltonproperty.com** | `ns1.beget.ru`, `ns2.beget.ru`, `ns1.beget.pro` | ✅ **Owner's site, hosted at Beget.** |
| waltonproperty.com | `ns5/ns6.afternic.com` | Parked for-sale domain (Afternic), not the owner's. |
| weltonproperty.com | GoDaddy `domaincontrol.com`, Google MX | Unrelated third party. |
| walton-property.com, wellton-property.com | no NS | Not registered / not delegated. |

welltonproperty.com details:
- A `45.130.41.213` (`www` is the same). PTR: `ssl.urdak.beget.com`. RIPE RDAP: `BEGET-NET-89`, country **RU**.
- MX `mx1/mx2.beget.com`. SPF `v=spf1 redirect=beget.com`.
- HTTP 200, `server: nginx-reuseport/1.21.1`, `x-powered-by: PHP/8.3.20`, WordPress 7.1.3 (Yoast). Title "Real Estate in North Cyprus – Wellton Property".
- RDAP (.com): registrar **REG.RU**, registered 2023-08-18, expires 2027-08-18, last changed 2026-10-18.

**What this means:** Wellton is on **Beget shared hosting** (a PHP/nginx shared node in Beget's Russian network). It is **not** a VPS, and nothing in the public data points to Amsterdam/NL/BE. Beget does sell VPS products, but nothing visible shows the owner has one.

## 3. Can the Beget account host MAINHALL without touching Wellton?

Based on Beget's general shared-hosting model (not verified against this specific account):
- Shared tariffs normally allow several sites/domains per account. Each site gets its own directory, and a domain is attached to that directory in the panel. Adding `main-hall.ru` as a separate site does not change the Wellton directory, its DB or its DNS.
- Shared hosting serves static files and PHP. It does **not** keep a long-running Node.js process. MAINHALL therefore has to be deployed as a **static export** (`next build` with `output: "export"`, which already works for the GitHub Pages build via `GITHUB_PAGES=true` in `next.config.ts`; a root-path variant without `basePath` would be needed). The legacy commercial page from PR #13 is static too.
- Free Let's Encrypt SSL is issued per domain in the Beget panel.
- Shared hosting is **not suitable for the always-on coordinator** (§5). No persistent processes or queues.

**Unverified limits (owner must check in the Beget panel):** the tariff's site/domain limit and how many are used, free disk quota, and whether SSH access is enabled on the tariff.

**Missing access:** a Beget login or a Beget sub-account/FTP/SSH user limited to a new MAINHALL site directory. Do not share the main account password in this public repo or issue.

## 4. Recommended deployment path (no purchases)

1. **Owner** (in the Beget panel): add a site `main-hall.ru` (new directory), plus `legacy.main-hall.ru` (or a directory) for the preserved commercial site. Do **not** change DNS yet; Beget lets you preview a site via its technical domain / hosts file.
2. Upload the static export of MAINHALL and the legacy snapshot. Smoke-test over HTTPS using the technical address.
3. Keep the private archive (SHA256 `fd90d8b2…f1653ac4`, recorded in the Work Mode report) outside this public repo as the rollback source.
4. Cutover at REG.RU: either delegate NS to Beget, or keep `tildadns` and change only the records. That is the owner's action, after the legacy restoration is verified. Rollback = restore NS/A to `ns1/ns2.tildadns.com` / `176.57.67.199`.
5. The Tilda project stays published until the post-cutover checks pass.

## 5. Always-on event-driven coordinator

**Status: not implemented on a server.** No server address or credentials were found (§1), and Beget shared hosting cannot run it (§3). What this PR adds is a dependency-free, unit-tested intake core (`src/lib/coordinator-intake.mjs`) that can be deployed unchanged once a VPS exists.

Design (for a VPS the owner already has, wherever it is located):

```
GitHub webhook (issue_comment, pull_request, check_suite)
   │  HTTPS POST, X-Hub-Signature-256
   ▼
receiver (Node, systemd, behind Caddy/nginx TLS)
   1. verifySignature(rawBody, header, secret)  → 401 if bad
   2. deduper.accept(X-GitHub-Delivery)         → 200 + drop if duplicate
   3. shouldDispatch(actor, body)               → trusted human + [EXECUTE]/@claude only, never [bot] or [AUTOMATION…]
   4. enqueue (SQLite WAL table) → respond 202   ← receipt latency measured here (target ~1 s, typically ms)
   ▼
worker (same host)
   - dispatches workflow_dispatch mainhall-push.yml (or runs the CLI locally)
   - retryDelay(n): 1s,2s,4s,8s,16s, then dead-letter + issue comment
   - logs: received_at, enqueued_at, dispatched_at, run_started_at, run_completed_at
```

- **No polling.** GitHub pushes the events, and the worker is woken by the queue insert.
- **Latency is reported in two parts.** Receipt/queue latency (webhook to 202 response) targets ~1 s. Model execution (Claude Code run time) is measured separately and takes minutes, not seconds. No 1-second model replies are promised.
- **Interactive ChatGPT cannot receive webhooks.** The GPT step in the pipeline is an API call, not the ChatGPT chat UI. Results flow back as issue comments, as the existing `mainhall-feedback.yml` already does.
- **Loop protection:** bot actors and `[AUTOMATION…]` bodies are ignored, delivery IDs are deduplicated, and retries are bounded.

Code status: `verifySignature`, `createDeduper`, `retryDelay` and `shouldDispatch` are implemented and covered by `tests/coordinator-intake.test.mjs`. The HTTP receiver, queue and systemd unit are deliberately **not** written yet, because there is no host to target. That is the next step once access exists.

## 6. Requests, by holder

**Owner (Andrey):**
1. Amsterdam/NL/BE server: provider name (e.g. from the invoice or welcome email), region, public IP or hostname, OS. Then **one** of:
   - add a dedicated SSH public key, which the executor will generate and post on request. The private key would go to a GitHub Actions secret, never into the issue.
   - or confirm that the server cannot be found.
2. Beget: tariff name and the site/disk limits shown in the panel, whether SSH is enabled, and a scoped FTP/SSH user for a new site directory (via a GitHub secret, not a comment).
3. Optional: grant this repo's Actions access to read secret **names**, or list them yourself, to confirm whether any deploy secret already exists.

**Original Claude coordinator / chat session (claude.ai), which built the old site:**
- Please post in issue #7 any record of the server purchase: provider, region, hostname/IP and setup notes, **without credentials**. This executor cannot read that history.

## 7. Evidence commands (reproducible)

```
dig +short NS welltonproperty.com      # ns1.beget.ru ns2.beget.ru ns1.beget.pro
dig +short A  welltonproperty.com      # 45.130.41.213
dig +short -x 45.130.41.213            # ssl.urdak.beget.com.
curl -s https://rdap.db.ripe.net/ip/45.130.41.213   # BEGET-NET-89, RU
curl -sI https://welltonproperty.com   # 200, nginx-reuseport, PHP/8.3.20
dig +short NS main-hall.ru             # ns1/ns2.tildadns.com
curl -s https://rdap.db.ripe.net/ip/176.57.67.199   # Tilda_Publishing, RU
git log --all -i -G"amsterdam|beget|wellton|walton" --oneline   # (empty)
```
