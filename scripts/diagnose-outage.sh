#!/usr/bin/env bash
# Read-only outage diagnostics for main-hall.ru (issue #40).
# Checks DNS (authoritative + public resolvers), origin TCP ports, HTTPS via
# curl --resolve (bypasses local DNS), TLS validity and deployed SHA.
# Usage: scripts/diagnose-outage.sh [expected_sha]
# Env: MAINHALL_DOMAIN (default main-hall.ru), MAINHALL_ORIGIN (default: resolved A record).
# Never changes DNS, server or production state. Exit code 1 if any check fails.
set -u
DOMAIN="${MAINHALL_DOMAIN:-main-hall.ru}"
EXPECTED_SHA="${1:-}"
FAIL=0
fail() { echo "FAIL: $*"; FAIL=1; }
echo "== MAINHALL outage diagnostics $(date -u +%Y-%m-%dT%H:%M:%SZ) domain=$DOMAIN"

echo "== DNS"
NS=$(dig +short +time=3 +tries=1 @8.8.8.8 "$DOMAIN" NS | head -1)
[ -n "$NS" ] || fail "no NS records for $DOMAIN"
for r in "$NS" 1.1.1.1 8.8.8.8 77.88.8.8; do
  for n in "$DOMAIN" "www.$DOMAIN"; do
    A=$(dig +short +time=3 +tries=1 @"$r" "$n" A | grep -E '^[0-9.]+$' | sort -u | tr '\n' ' ')
    AAAA=$(dig +short +time=3 +tries=1 @"$r" "$n" AAAA | grep ':' | tr '\n' ' ')
    echo "  @$r $n A=[${A% }] AAAA=[${AAAA% }]"
    [ -n "$A" ] || fail "$n has no A record at $r"
  done
done

ORIGIN="${MAINHALL_ORIGIN:-$(dig +short +time=3 +tries=1 @1.1.1.1 "$DOMAIN" A | grep -E '^[0-9.]+$' | head -1)}"
[ -n "$ORIGIN" ] || { fail "origin IP unknown"; exit 1; }
echo "== Origin $ORIGIN TCP"
for p in 80 443; do
  if timeout 8 bash -c "exec 3<>/dev/tcp/$ORIGIN/$p" 2>/dev/null; then echo "  tcp/$p open"; else fail "tcp/$p closed or filtered on $ORIGIN"; fi
done

echo "== HTTPS via curl --resolve"
for path in / /projects/ /commercial/ /deploy-version.txt; do
  for host in "$DOMAIN" "www.$DOMAIN"; do
    OUT=$(curl -sS -o /dev/null --max-time 15 --resolve "$host:443:$ORIGIN" \
      -w '%{http_code} %{time_total}s -> %{redirect_url}' "https://$host$path" 2>&1)
    echo "  https://$host$path $OUT"
    CODE=${OUT%% *}
    if [ "$host" = "$DOMAIN" ]; then [ "$CODE" = "200" ] || fail "https://$host$path returned $CODE"
    else case "$CODE" in 200|301|308) ;; *) fail "https://$host$path returned $CODE";; esac; fi
  done
done

echo "== HTTP -> HTTPS redirect"
CODE=$(curl -sS -o /dev/null --max-time 10 --resolve "$DOMAIN:80:$ORIGIN" -w '%{http_code}' "http://$DOMAIN/" 2>&1)
echo "  http://$DOMAIN/ $CODE"
case "$CODE" in 301|302|307|308|200) ;; *) fail "http://$DOMAIN/ returned $CODE";; esac

echo "== TLS"
for host in "$DOMAIN" "www.$DOMAIN"; do
  CERT=$(echo | timeout 10 openssl s_client -connect "$ORIGIN:443" -servername "$host" 2>/dev/null)
  echo "$CERT" | openssl x509 -noout -subject -enddate 2>/dev/null | sed "s/^/  $host /"
  echo "$CERT" | openssl x509 -noout -checkend 604800 >/dev/null 2>&1 || fail "TLS cert for $host missing or expires within 7 days"
done

echo "== Deployed version"
DEPLOYED=$(curl -sS --max-time 15 --resolve "$DOMAIN:443:$ORIGIN" "https://$DOMAIN/deploy-version.txt" 2>/dev/null | tr -d '[:space:]')
echo "  deploy-version.txt=$DEPLOYED"
if [ -n "$EXPECTED_SHA" ] && [ "${DEPLOYED#"$EXPECTED_SHA"}" = "$DEPLOYED" ]; then
  fail "deployed SHA $DEPLOYED does not match expected $EXPECTED_SHA"
fi

if [ "$FAIL" -eq 0 ]; then echo "RESULT: OK (from this network only; confirm from other networks)"; else echo "RESULT: FAILURES DETECTED"; fi
exit "$FAIL"
