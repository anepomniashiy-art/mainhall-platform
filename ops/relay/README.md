# MAINHALL event relay

Status: **locally tested transport, NOT deployed to the owner's VPS**. Existing server provider/address/access have not yet been recovered. No new paid server was created.

This is a continuously running HTTP/SSE broker. Producers POST messages; the broker commits them to SQLite and immediately wakes the recipient's open event stream. The 15-second SSE keepalive is not a polling schedule. Consumers replay unacknowledged messages after reconnect. Delivery is at least once; task execution must separately deduplicate side effects by message ID.

Local test, 2026-10-19: 30 messages, p50 2.10ms, p95 4.44ms, max 45.12ms. This is loopback transport latency, **not** WAN latency or model response time. Authentication, recipient isolation, durable replay, duplicate requests and acknowledgement checks pass.

## Host prerequisites

Use the existing owner's VPS only after identifying its address, authorized SSH access, OS, running services and firewall. Bind the relay to loopback and place it behind an existing HTTPS reverse proxy. No existing Walton Property service or DNS record may be overwritten. Shared HTML hosting on Beget can host the static website but suitability for an always-running relay depends on its actual hosting product; a shared-hosting account is not assumed to be a VPS.

Python 3.10+; no third-party dependencies. Single broker process. The SQLite database must be on persistent local storage; two simultaneously active brokers against the same DB do not share notifications and are unsupported.

Deploy repository directory `ops/relay` to `/opt/mainhall/ops/relay`. Create the dedicated `mainhall-relay` system account. Install `deploy/mainhall-relay.service`. Create `/etc/mainhall-relay.env` with owner-only permissions, containing:

- `MAINHALL_RELAY_DB=/var/lib/mainhall-relay/events.sqlite`
- `MAINHALL_RELAY_PORT=8881`
- `MAINHALL_AGENT_TOKENS`: JSON object mapping `gpt`, `claude`, `claude-code` to distinct randomly generated tokens (at least 32 characters). Never put token values in Git, logs, URLs or issue comments.

Generate tokens on the target host, provide each process only its own token, and start the unit. Use HTTPS for every remote request. If Caddy is already available, add the separate host from `deploy/Caddyfile.example`; preserve every existing site block. Verify health and end-to-end WAN latency before claiming operational status.

## Protocol

- `GET /health`: basic health.
- `POST /messages`: Bearer token; JSON `{ "to": "claude-code", "request_id": "unique-task-id", "text": "task" }`. Returns durable message ID, HTTP 202. Reusing the same sender/request ID with different text or recipient returns 409.
- `GET /events?after=0`: Bearer token for the receiving agent; continuous SSE with `id` and JSON `data`. Resume using `Last-Event-ID` or `after`.
- `POST /ack`: recipient Bearer token; JSON `{ "id": 123 }`. Acknowledge only after processing or recording the result durably.

The broker does not execute shell commands or invoke models. Persistent GPT/Claude API or Claude Code consumers must be connected explicitly, with bounded execution and duplicate protection. This does not attach to existing claude.ai conversations or deliver webhooks into an interactive ChatGPT conversation. Existing GitHub Actions remains the verified coding executor until a server-side execution adapter is connected and tested.

Run tests: `python3 -m unittest discover -s ops/relay/tests -v` from repository root. Keep production DB and token file outside the repository. Add message retention, rate limiting and operational monitoring before broader multi-user exposure; this component is scoped to the owner's trusted agent processes.
