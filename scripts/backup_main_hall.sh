#!/usr/bin/env bash
# Backup + recon of the live main-hall.ru site. Runs on a GitHub Actions runner
# (clean internet). Produces:
#   backup/main-hall-ru/<date>/recon/   — dns, headers, robots, sitemap, filelist (committed)
#   backup/main-hall-ru/<date>/pages/   — every crawled .html page (committed, text)
#   _mirror/                            — full wget mirror incl. assets (artifact only)
set -uo pipefail

SITE_HOST="main-hall.ru"
SITE="https://${SITE_HOST}"
DATE="$(date -u +%Y-%m-%d)"
OUT="backup/main-hall-ru/${DATE}"
REC="${OUT}/recon"
PAGES="${OUT}/pages"
MIRROR="_mirror/${SITE_HOST}"
mkdir -p "$REC" "$PAGES" "$MIRROR"

log(){ echo -e "\n========== $* =========="; }

# ---- 1. DNS: is it live, where is it hosted, who runs the zone ----
log "DNS"
{
  echo "# A record"; dig +short A "$SITE_HOST"
  echo "# AAAA"; dig +short AAAA "$SITE_HOST"
  echo "# www CNAME"; dig +short CNAME "www.${SITE_HOST}"
  echo "# NS (who controls the zone — this is who must repoint)"; dig +short NS "$SITE_HOST"
  echo "# MX"; dig +short MX "$SITE_HOST"
  echo "# TXT"; dig +short TXT "$SITE_HOST"
  echo "# whois registrar"; (whois "$SITE_HOST" 2>/dev/null | grep -iE "registrar|name server|nserver" | head -20) || echo "whois unavailable"
} | tee "${REC}/dns.txt"

# ---- 2. HTTP headers: platform fingerprint (Tilda / Vercel / etc.) ----
log "HEADERS (apex + www)"
{
  echo "### GET ${SITE}/"
  curl -sSL -D - -o /dev/null -m 40 -A "Mozilla/5.0 MAINHALL-backup" "${SITE}/" 2>&1
  echo; echo "### GET https://www.${SITE_HOST}/"
  curl -sSL -D - -o /dev/null -m 40 -A "Mozilla/5.0 MAINHALL-backup" "https://www.${SITE_HOST}/" 2>&1
} | tee "${REC}/headers.txt"

# ---- 3. robots.txt + sitemap.xml ----
log "robots.txt"
curl -sS -m 30 -A "Mozilla/5.0 MAINHALL-backup" "${SITE}/robots.txt" -o "${REC}/robots.txt"
echo "curl robots exit=$?"; head -40 "${REC}/robots.txt" 2>/dev/null

log "sitemap.xml"
curl -sS -m 30 -A "Mozilla/5.0 MAINHALL-backup" "${SITE}/sitemap.xml" -o "${REC}/sitemap.xml"
echo "curl sitemap exit=$?"; head -60 "${REC}/sitemap.xml" 2>/dev/null
# extract loc URLs from sitemap (if any)
grep -oE "<loc>[^<]+</loc>" "${REC}/sitemap.xml" 2>/dev/null | sed -E "s|</?loc>||g" > "${REC}/sitemap_urls.txt" || true
echo "sitemap urls:"; cat "${REC}/sitemap_urls.txt" 2>/dev/null

# ---- 4. Self-contained mirror (page + ALL requisites, incl. static.tildacdn.com) → artifact ----
# Not --mirror (that recurses infinitely across spanned hosts). -p -H -D fetches the
# single page plus every cross-host requisite (css/js/images/fonts) in the allowed hosts.
log "MIRROR (wget — page + cross-host requisites)"
wget -p -k -E -H --no-parent \
  --domains="${SITE_HOST},www.${SITE_HOST},static.tildacdn.com,static.tildacdn.ru,static.tildacdn.one" \
  --timeout=40 --tries=3 --wait=0.2 -e robots=off -U "Mozilla/5.0 MAINHALL-backup" \
  -P "_mirror" "${SITE}/" 2>&1 | tail -80

# sanitize filenames containing characters upload-artifact rejects (? : * < > |)
find _mirror -depth -name '*[?:*<>|]*' -print 2>/dev/null | while IFS= read -r f; do
  nf="$(printf '%s' "$f" | sed 's/[?:*<>|].*$//')"
  if [ -n "$nf" ] && [ "$nf" != "$f" ]; then mv -f "$f" "$nf" 2>/dev/null || true; fi
done

log "MIRROR RESULT"
find "_mirror" -type f 2>/dev/null | sort | tee "${REC}/filelist.txt" | wc -l
du -sh "_mirror" 2>/dev/null | tee "${REC}/size.txt"

# ---- 4b. SHA-256 checksum manifest of every backed-up file (rollback verification) ----
log "CHECKSUMS (sha256)"
( cd _mirror && find . -type f -print0 | sort -z | xargs -0 sha256sum ) | tee "${REC}/checksums.txt" | wc -l

# ---- 5. Copy text/html pages into committed backup; extract forms/canonical/meta ----
log "EXTRACT html pages + forms/canonical/meta"
: > "${REC}/forms.txt"; : > "${REC}/canonical_meta.txt"; : > "${REC}/internal_links.txt"
while IFS= read -r f; do
  case "$f" in
    *.html|*.htm)
      rel="${f#_mirror/}"
      dest="${PAGES}/${rel}"
      mkdir -p "$(dirname "$dest")"
      cp "$f" "$dest"
      echo "### ${rel}" >> "${REC}/forms.txt"
      grep -oiE "<form[^>]*>" "$f" >> "${REC}/forms.txt" 2>/dev/null || true
      grep -oiE "<input[^>]*name=[\"'][^\"']+[\"'][^>]*>" "$f" >> "${REC}/forms.txt" 2>/dev/null || true
      echo "### ${rel}" >> "${REC}/canonical_meta.txt"
      grep -oiE "<link[^>]*rel=[\"']canonical[\"'][^>]*>" "$f" >> "${REC}/canonical_meta.txt" 2>/dev/null || true
      grep -oiE "<meta[^>]*name=[\"']description[\"'][^>]*>" "$f" >> "${REC}/canonical_meta.txt" 2>/dev/null || true
      grep -oiE "<title>[^<]*</title>" "$f" >> "${REC}/canonical_meta.txt" 2>/dev/null || true
      grep -oiE "href=[\"'][^\"']+[\"']" "$f" | sed -E "s/href=[\"']//; s/[\"']$//" >> "${REC}/internal_links.txt" 2>/dev/null || true
      ;;
  esac
done < "${REC}/filelist.txt"
sort -u "${REC}/internal_links.txt" -o "${REC}/internal_links.txt" 2>/dev/null || true

log "SUMMARY"
echo "pages copied: $(find "$PAGES" -type f | wc -l)"
echo "recon dir: ${REC}"
echo "DONE"
