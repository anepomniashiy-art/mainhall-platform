# MAINHALL — Autonomy & CI status

Last updated: 2026-10-16.

## Executors on `main` (verified by reading `.github/workflows` on `main`)
- `mainhall-executor.yml` — real executor using the official `anthropics/claude-code-action@v1`
  (added in commit `2ed971a`). Triggers: `workflow_dispatch` + `schedule` cron `*/15 * * * *`.
- `mainhall-watchdog.yml` — scheduled progress watchdog (commit `ba1b5bc`).
- `bridge-poll.yml` / `claude-bridge.yml` / `gpt-bridge.yml` — text-only Anthropic/OpenAI API
  bridges (NOT executors): they call the Messages API via `actions/github-script` + curl; they do
  not checkout, build, commit or deploy.

## Added here
- `.github/workflows/ci.yml` — general build CI: `npm ci` → `prisma validate` → `prisma generate`
  → `npm run build` → data-contract tests, on push / PR / dispatch. The repo previously had no
  build CI (only the paths-limited `official-feed-check.yml`), so executor/human PRs were not
  build-verified. This closes that gap.

## Honest open items (no fabrication)
- **`ANTHROPIC_API_KEY` presence not verifiable from this environment** (Actions-secrets API returns
  403 through the agent proxy). The executor will fail loudly at the Claude Code step if the secret
  is absent; that failure is the verification, not a silent success. Confirm the round-trip from an
  actual executor run URL before calling it "connected".
- **`schedule: */15` on `mainhall-executor.yml` is aggressive** — every 15 min invokes
  claude-code-action with a broad "read issues and implement" prompt. Recommend adding: an explicit
  per-run turn/cost ceiling via `claude_args --max-turns`, idempotency / a "nothing to do" early
  exit, and a lower cadence (hourly) to avoid runaway cost and bot-to-bot loops. (Not changed here
  to avoid colliding with the parallel authoring of that file.)
- **Pin the action SHA before production**: `anthropics/claude-code-action@v1` is a floating tag.
- Build on `main` reproduced locally this session: `npm ci` OK, `prisma validate` valid,
  `npm run build` EXIT 0, `node --test` 5/5.
