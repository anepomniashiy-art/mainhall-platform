# Incident 2026-11-11: main-hall.ru ERR_TIMED_OUT (issue #40)

Reported: the owner saw Chrome `ERR_TIMED_OUT` on https://main-hall.ru.
Checked: 2026-11-11 07:25–07:30 UTC from GitHub Actions run
https://github.com/anepomniashiy-art/mainhall-platform/actions/runs/42979347914 (Azure network).

## Findings (external, read-only)

| Check | Result |
|---|---|
| NS (delegation from .ru) | `brian.ns.cloudflare.com`, `sandra.ns.cloudflare.com` |
| A @ authoritative / 1.1.1.1 / 8.8.8.8 / 77.88.8.8 | `201.24.63.94` (TTL 300, DNS-only, not proxied). No AAAA |
| www | CNAME → `main-hall.ru` → `201.24.63.94` |
| TCP 22 / 80 / 443 on origin | open (SSH banner `OpenSSH_10.2p1 Ubuntu`) |
| ICMP ping | 100% loss (ICMP filtered; not a failure in itself) |
| `https://main-hall.ru/`, `/projects/`, `/commercial/`, `/deploy-version.txt` | **200**, `server: Caddy`, HTTP/2 |
| `https://www.main-hall.ru/*` | **301** → `https://main-hall.ru/*` |
| `http://main-hall.ru/` | **308** → HTTPS |
| TLS | Let's Encrypt, separate certs for `main-hall.ru` and `www`, valid until 2027-02-03 |
| deploy-version.txt | `f22d8ff0d31f6354f3e11c448c853d1814831c0d` = `main` HEAD; `Last-Modified: 2026-11-11 06:55:03 GMT` |
| Last CI | run 42975518143 `success` (06:52–06:55 UTC) |
| check-host.net HTTP, 12 nodes | 11 × **200** (AT, IL×2, IR×2, IT, NL, RS, **RU Moscow ru1 AS14576**, SI, UA); ES node no response |

## Conclusion

When checked, the origin and DNS were working. Nothing on the server needed fixing, and
DNS was not changed. Likely causes of the owner's timeout, in order of probability:

1. A brief outage while the site was redeployed around 06:55 UTC (the new build
   `Last-Modified` timestamp), or an earlier transient outage that has since recovered.
2. A problem on the client side: the local or ISP resolver, a VPN or proxy, or a filter
   on the route to the Timeweb IP range from the owner's network.
3. An outdated IPv6 or DNS entry cached in the browser or OS.

## Owner steps if it still times out

- Open in Chrome incognito, or on mobile data with VPN off.
- `chrome://net-internals/#dns` → Clear host cache; `chrome://net-internals/#sockets` → Flush.
- `nslookup main-hall.ru 1.1.1.1` must return `201.24.63.94`.
- `curl -v --resolve main-hall.ru:443:201.24.63.94 https://main-hall.ru/`

## Re-check

`scripts/diagnose-outage.sh [expected_sha]`: read-only. Exit code 1 if any check fails.

## Not verified (no access)

The runner has no SSH key and no Timeweb or Cloudflare credentials. Because of that,
`systemctl status caddy`, `journalctl`, firewall, disk and resources on the server were
**not** checked. To check them, run on the server:
`systemctl status caddy; journalctl -u caddy --since "2026-11-11 06:00" --no-pager | tail -200; df -h; free -m; ufw status`.
