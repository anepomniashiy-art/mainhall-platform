"""Read-only diagnosis of the document actually served by each production host."""
import os,re,json,socket,urllib.request,urllib.error
revision=os.environ.get('GITHUB_SHA','manual')
for host in ['main-hall.ru','www.main-hall.ru']:
 try:print('DNS',host,sorted({a[4][0] for a in socket.getaddrinfo(host,80,type=socket.SOCK_STREAM)}))
 except OSError as e:print('DNS ERROR',host,str(e))
 for scheme in ['http','https']:
  url=f'{scheme}://{host}/?mh_revision={revision}'
  try:
   request=urllib.request.Request(url,headers={'User-Agent':'MAINHALL-Production-Check/1.0','Cache-Control':'no-cache'})
   with urllib.request.urlopen(request,timeout=12) as response:
    body=response.read().decode('utf-8','replace');title=re.search(r'<title>(.*?)</title>',body,re.S)
    print(json.dumps({'requested':url,'resolved':response.url,'status':response.status,'title':title.group(1) if title else None,'new_navigation':'href="/districts/"' in body and 'href="/analytics/"' in body,'residential_hero':'раньше рынка' in body,'age':response.headers.get('Age'),'last_modified':response.headers.get('Last-Modified'),'request_id':response.headers.get('X-GitHub-Request-Id')},ensure_ascii=False))
  except (urllib.error.URLError,OSError) as e:print('FETCH ERROR',url,str(e))
