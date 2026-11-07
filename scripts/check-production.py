"""Read-only MAINHALL release gate: HTTP->HTTPS, valid TLS, home, projects, commercial.

Usage:
  python3 scripts/check-production.py                       # public DNS (production)
  python3 scripts/check-production.py --origin 72.56.84.90  # pin one origin (staging gate)
  python3 scripts/check-production.py --origin 45.130.41.213 --expect-sha <sha>

--origin connects to the given IP while still sending SNI/Host for main-hall.ru and
verifying the certificate, so a candidate origin (Beget or NL) can be proven before
any DNS change. The script never writes anywhere.

/commercial/ is the Sminex commercial catalogue (since 3d23eaa); the preserved legacy
commercial document lives at /commercial/strategy/ and /legacy-mainhall/.
"""
import argparse, http.client, json, re, socket, ssl, sys

HOSTS = ["main-hall.ru", "www.main-hall.ru"]
CANONICAL = "https://main-hall.ru"
LEGACY_MARKERS = ["Инвестиции в коммерческую недвижимость Москвы", "/legacy-mainhall/assets/"]
PAGES = {
    "/": "modern",
    "/projects/": "projects",
    "/commercial/": "commercial",
    "/commercial/strategy/": "legacy",
    "/legacy-mainhall/": "legacy",
}


def evaluate(kind, body, min_projects=90):
    """Return (ok, detail) for a page body. Pure function; unit-tested offline."""
    if kind == "modern":
        ok = 'href="/districts/"' in body and 'href="/analytics/"' in body and "раньше рынка" in body
        return ok, "modern home markers"
    if kind == "projects":
        count = len(set(re.findall(r'href="/projects/[a-z0-9-]+/"', body)))
        return count >= min_projects, "%d project links (min %d)" % (count, min_projects)
    if kind == "commercial":
        ok = "Коммерческая недвижимость Sminex" in body and 'href="/commercial/strategy/"' in body
        return ok, "Sminex catalogue + link to legacy strategy page"
    if kind == "legacy":
        return all(m in body for m in LEGACY_MARKERS), "legacy commercial document markers"
    raise ValueError(kind)


def redirect_ok(scheme_status, location, path):
    return scheme_status in (301, 308) and location == CANONICAL + path


def fetch(scheme, host, path, origin=None, timeout=20):
    """GET without following redirects. TLS is always verified against `host`."""
    target = origin or host
    port = 443 if scheme == "https" else 80
    sock = socket.create_connection((target, port), timeout=timeout)
    if scheme == "https":
        sock = ssl.create_default_context().wrap_socket(sock, server_hostname=host)
        conn = http.client.HTTPSConnection(host, port, timeout=timeout)
    else:
        conn = http.client.HTTPConnection(host, port, timeout=timeout)
    conn.sock = sock
    conn.request("GET", path, headers={"Host": host, "User-Agent": "MAINHALL-Release-Gate/3.0", "Cache-Control": "no-cache"})
    response = conn.getresponse()
    body = response.read().decode("utf-8", "replace")
    conn.close()
    return response.status, response.getheader("Location"), body


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", help="IP to pin instead of public DNS")
    parser.add_argument("--expect-sha", help="required content of /deploy-version.txt")
    parser.add_argument("--min-projects", type=int, default=90)
    args = parser.parse_args(argv)
    failures = []

    def check(label, ok, detail):
        print(json.dumps({"check": label, "ok": bool(ok), "detail": detail}, ensure_ascii=False), flush=True)
        if not ok:
            failures.append(label)

    for host in HOSTS:
        try:
            print("DNS", host, sorted({a[4][0] for a in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}), "pinned_origin=" + str(args.origin), flush=True)
        except OSError as error:
            print("DNS ERROR", host, error, flush=True)
        for path in ["/", "/projects/", "/commercial/"]:
            try:
                status, location, _ = fetch("http", host, path, args.origin)
                check("redirect http://" + host + path, redirect_ok(status, location, path), "%s -> %s" % (status, location))
            except OSError as error:
                check("redirect http://" + host + path, False, "%s: %s" % (type(error).__name__, error))
        for path, kind in PAGES.items():
            url = "https://" + host + path
            try:
                status, location, body = fetch("https", host, path, args.origin)
                ok, detail = evaluate(kind, body, args.min_projects) if status == 200 else (False, "status %s location %s" % (status, location))
                check(url, ok, detail)
            except (OSError, ssl.SSLError) as error:
                check(url, False, "TLS/HTTP %s: %s" % (type(error).__name__, error))
    try:
        status, _, body = fetch("https", "main-hall.ru", "/deploy-version.txt", args.origin)
        sha = body.strip() if status == 200 else None
        check("deploy-version", status == 200 and (not args.expect_sha or sha == args.expect_sha), "served=%s expected=%s" % (sha, args.expect_sha))
    except (OSError, ssl.SSLError) as error:
        check("deploy-version", False, "%s: %s" % (type(error).__name__, error))

    if failures:
        raise SystemExit("MAINHALL release gate FAILED: " + ", ".join(failures))
    print("MAINHALL release gate PASSED (%d hosts, origin=%s)" % (len(HOSTS), args.origin or "public DNS"))


if __name__ == "__main__":
    main(sys.argv[1:])
