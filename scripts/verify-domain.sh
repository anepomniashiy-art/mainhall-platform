#!/usr/bin/env bash
# Read-only check of main-hall.ru DNS, TLS and HTTP state for the GitHub Pages cutover.
# Changes nothing. Exit code 0 only when apex + www serve the new site over valid HTTPS.
# Usage: scripts/verify-domain.sh [domain] [owner.github.io]
set -u
DOMAIN="${1:-main-hall.ru}"
PAGES_HOST="${2:-anepomniashiy-art.github.io}"
PAGES_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"
fail=0

echo "== DNS (resolver 1.1.1.1)"
echo "NS    $DOMAIN: $(dig +short "$DOMAIN" NS @1.1.1.1 | tr '\n' ' ')"
apex_a="$(dig +short "$DOMAIN" A @1.1.1.1 | sort | tr '\n' ' ')"
echo "A     $DOMAIN: $apex_a"
echo "AAAA  $DOMAIN: $(dig +short "$DOMAIN" AAAA @1.1.1.1 | tr '\n' ' ')"
www_cname="$(dig +short "www.$DOMAIN" CNAME @1.1.1.1)"
echo "CNAME www.$DOMAIN: $www_cname"

for ip in $PAGES_IPS; do
  case " $apex_a " in *" $ip "*) ;; *) echo "WARN  apex A is missing GitHub Pages IP $ip" ;; esac
done
for ip in $apex_a; do
  case " $PAGES_IPS " in *" $ip "*) ;; *) echo "FAIL  apex A $ip is not a GitHub Pages IP"; fail=1 ;; esac
done
[ "$www_cname" = "$PAGES_HOST." ] || { echo "FAIL  www CNAME should be $PAGES_HOST."; fail=1; }

echo "== TLS"
for h in "$DOMAIN" "www.$DOMAIN"; do
  cert="$(echo | timeout 15 openssl s_client -connect "$h:443" -servername "$h" 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName 2>/dev/null)"
  echo "$h: $(echo "$cert" | head -1)"
  echo "$cert" | grep -q "DNS:$h" || { echo "FAIL  certificate does not cover $h"; fail=1; }
done

echo "== HTTP"
for u in "http://$DOMAIN/" "https://$DOMAIN/" "https://www.$DOMAIN/" "https://$DOMAIN/commercial/" "https://$DOMAIN/legacy/" "https://$DOMAIN/projects/"; do
  echo "$u -> $(curl -sS -o /dev/null -m 20 -w '%{http_code} %{redirect_url}' "$u" 2>&1 | tail -1)"
done
code="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "https://$DOMAIN/")"
[ "$code" = "200" ] || { echo "FAIL  https://$DOMAIN/ returned $code"; fail=1; }

[ "$fail" = 0 ] && echo "RESULT: OK" || echo "RESULT: NOT READY"
exit "$fail"
