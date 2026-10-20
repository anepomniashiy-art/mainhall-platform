"""Verify residential and commercial pages over both HTTP and HTTPS (valid TLS required)."""
import os, re, json, socket, urllib.request, urllib.error
revision = os.environ.get("GITHUB_SHA", "manual")
failures = []
for host in ["main-hall.ru", "www.main-hall.ru"]:
    try:
        print("DNS", host, sorted({a[4][0] for a in socket.getaddrinfo(host, 80, type=socket.SOCK_STREAM)}))
    except OSError as error:
        print("DNS ERROR", host, str(error))
    for scheme in ["http", "https"]:
        for suffix in ["/", "/?mh_revision=" + revision, "/commercial/"]:
            url = scheme + "://" + host + suffix
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "MAINHALL-Production-Check/2.0", "Cache-Control": "no-cache"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    body = response.read().decode("utf-8", "replace")
                    title = re.search(r"<title>(.*?)</title>", body, re.S)
                    modern = 'href="/districts/"' in body and 'href="/analytics/"' in body and "раньше рынка" in body
                    print(json.dumps({"requested": url, "resolved": response.url, "status": response.status, "title": title.group(1) if title else None, "modern_home": modern, "evgeny": "Прохоров" in body, "legacy_home": "Инвестируйте" in body and "центра Москвы" in body, "age": response.headers.get("Age"), "last_modified": response.headers.get("Last-Modified"), "request_id": response.headers.get("X-GitHub-Request-Id")}, ensure_ascii=False), flush=True)
                    commercial = "Инвестиции в коммерческую недвижимость Москвы" in body and "/legacy-mainhall/assets/" in body
                    valid_content = commercial if suffix == "/commercial/" else modern
                    print("PAGE CONTENT", url, "commercial" if suffix == "/commercial/" else "modern", valid_content, flush=True)
                    if not valid_content:
                        failures.append(url + " wrong content")
            except (urllib.error.URLError, OSError) as error:
                print("FETCH ERROR", url, str(error), flush=True)
                failures.append(url + " TLS/HTTP error")
if failures:
    raise SystemExit("Production homepage verification failed: " + ", ".join(failures))
