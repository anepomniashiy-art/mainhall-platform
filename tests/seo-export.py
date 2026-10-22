"""Check the actual static export, including the robots regression that blocked production."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET
import json,re
root=Path('out')
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.title=[];self.in_title=False;self.h1=0;self.canonical=[];self.descriptions=[];self.hrefs=[];self.json_scripts=[];self.script=None;self.noindex=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='title':self.in_title=True
  if tag=='h1':self.h1+=1
  if tag=='a' and a.get('href'):self.hrefs.append(a['href'])
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if tag=='meta' and a.get('name')=='description':self.descriptions.append(a.get('content',''))
  if tag=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content',''):self.noindex=True
  if tag=='script' and a.get('type')=='application/ld+json':self.script=''
 def handle_endtag(self,tag):
  if tag=='title':self.in_title=False
  if tag=='script' and self.script is not None:self.json_scripts.append(json.loads(self.script));self.script=None
 def handle_data(self,d):
  if self.in_title:self.title.append(d)
  if self.script is not None:self.script+=d
urls=[e.text for e in ET.parse(root/'sitemap.xml').findall('{*}url/{*}loc')]
assert urls and len(urls)==len(set(urls))
robots=(root/'robots.txt').read_text()
assert not re.search(r'^Disallow:\s*/\s*$',robots,re.M),robots
assert 'Sitemap: https://main-hall.ru/sitemap.xml' in robots, robots
assert 'Sitemap: http://main-hall.ru/sitemap.xml' not in robots, robots
assert all(url.startswith('https://main-hall.ru/') for url in urls), urls
seen_titles={};seen_desc={};count=0
for url in urls:
 path=urlsplit(url).path;file=root/path.lstrip('/')/'index.html'
 assert file.exists(),f'Missing sitemap target: {url}'
 p=Page();p.feed(file.read_text())
 assert p.h1==1,(path,'h1',p.h1)
 assert not p.noindex,(path,'noindex')
 assert p.canonical==[url],(path,'canonical',p.canonical)
 title=''.join(p.title);assert title and title not in seen_titles,(path,'duplicate title',seen_titles.get(title));seen_titles[title]=path
 assert len(p.descriptions)==1 and p.descriptions[0],(path,'description')
 desc=p.descriptions[0];assert desc not in seen_desc,(path,'duplicate description',seen_desc.get(desc));seen_desc[desc]=path
 assert p.json_scripts,(path,'missing structured data')
 if path!='/':assert any(x.get('@type')=='BreadcrumbList' for x in p.json_scripts),(path,'breadcrumb')
 if path!='/commercial/':
  for href in p.hrefs:
   parsed=urlsplit(href)
   if parsed.scheme or not parsed.path or not parsed.path.startswith('/'):continue
   target=root/unquote(parsed.path).lstrip('/')
   assert target.exists() or (target/'index.html').exists(),(path,'broken internal link',href)
 count+=1
# Project pages must expose the facts in HTML without waiting for client JS.
for folder in (root/'projects').iterdir():
 if not folder.is_dir() or not (folder/'index.html').exists():continue
 text=(folder/'index.html').read_text();assert 'Расположение' in text and 'ApartmentComplex' in text,folder
print(f'PASS SEO export: {count} sitemap pages, unique metadata, canonicals, crawl access, JSON-LD, internal links')
