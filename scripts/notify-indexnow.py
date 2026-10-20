"""Notify Yandex only after the origin and the published verification file are reachable."""
from pathlib import Path
import json,urllib.request,urllib.error,xml.etree.ElementTree as ET
base='http://main-hall.ru'
key=Path('_seo/indexnow-key.txt').read_text().strip()
try:
 def get(path):
  with urllib.request.urlopen(base+path,timeout=20) as r:return r.read()
 assert get('/'+key+'.txt').decode().strip()==key,'verification key not published'
 robots=get('/robots.txt').decode();assert 'Disallow: /\n' not in robots,'site is closed to crawlers'
 urls=[x.text for x in ET.fromstring(get('/sitemap.xml')).findall('{*}url/{*}loc')]
 assert urls and all(x.startswith(base+'/') for x in urls)
 payload={'host':'main-hall.ru','key':key,'keyLocation':base+'/'+key+'.txt','urlList':urls}
 request=urllib.request.Request('https://yandex.com/indexnow',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json; charset=utf-8'})
 with urllib.request.urlopen(request,timeout=20) as r:print(f'IndexNow accepted: HTTP {r.status}, {len(urls)} URLs. Indexing is determined by the search engine.')
except (urllib.error.URLError,AssertionError,ValueError) as e:
 print(f'IndexNow was not submitted: {e}')
