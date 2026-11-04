import ipaddress,socket,os,json,urllib.request,urllib.error,subprocess
from pathlib import Path
token=os.environ['CLOUDFLARE_API_TOKEN']
def cf(method,path,data=None):
    request=urllib.request.Request('https://api.cloudflare.com/client/v4/'+path,data=json.dumps(data).encode() if data is not None else None,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method=method)
    try:
        response=json.load(urllib.request.urlopen(request,timeout=30))
    except urllib.error.HTTPError as error:
        body=error.read().decode()
        print('CLOUDFLARE_ERROR',error.code,body.replace(token,'***'))
        raise SystemExit('Cloudflare request rejected: '+path.split('?')[0])
    if not response.get('success'): raise SystemExit('Cloudflare returned unsuccessful response')
    return response['result']
ip=str(ipaddress.IPv4Address(Path('/tmp/beget-ip').read_text().strip()))
revision=os.environ['GITHUB_SHA']
for path,marker in [('/', 'MAINHALL'), ('/projects/', 'MAINHALL'),
                    ('/commercial/', 'MAINHALL'), ('/deploy-version.txt', revision)]:
    result=subprocess.run(
        ['curl','--noproxy','*','--max-time','20','--fail','-sS',
         '--resolve',f'main-hall.ru:443:{ip}','https://main-hall.ru'+path],
        capture_output=True,text=True,
    )
    if result.returncode or marker not in result.stdout:
        raise SystemExit('Beget HTTPS preflight failed: '+path+' '+result.stderr)
www_tls=subprocess.run(
    ['curl','--noproxy','*','--max-time','20','--fail','-sS','-o','/dev/null',
     '-w','%{redirect_url}','--resolve',f'www.main-hall.ru:443:{ip}',
     'https://www.main-hall.ru/'],capture_output=True,text=True,
)
if www_tls.returncode or www_tls.stdout!='https://main-hall.ru/':
    raise SystemExit('Beget www TLS or redirect preflight failed: '+www_tls.stderr)
print('BEGET_PREFLIGHT_OK',flush=True)
# Routine releases do not need DNS credentials when both records already point here.
apex=socket.gethostbyname_ex('main-hall.ru')[2]
www=socket.gethostbyname_ex('www.main-hall.ru')[2]
if set(apex)=={ip} and set(www)=={ip}:
    print('BEGET_DNS_ALREADY_ACTIVE')
    raise SystemExit(0)
if not token: raise SystemExit('CLOUDFLARE_API_TOKEN is missing')
zone=os.environ.get('CLOUDFLARE_ZONE_ID','').strip()
if not zone:
    zones=cf('GET','zones?name=main-hall.ru')
    zones=[z for z in zones if z['name']=='main-hall.ru']
    if len(zones)!=1: raise SystemExit('Need CLOUDFLARE_ZONE_ID or Zone Read permission for main-hall.ru')
    zone=zones[0]['id']
prefix='zones/'+zone+'/dns_records'
records=cf('GET',prefix+'?per_page=100')
web=[r for r in records if r['name'] in ['main-hall.ru','www.main-hall.ru']]
print('WEB_DNS_BEFORE',json.dumps([{k:r.get(k) for k in ['type','name','content','proxied']} for r in web]),flush=True)
allowed=['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153','72.56.84.90','45.130.41.213',ip]
apex=[r for r in web if r['name']=='main-hall.ru' and r['type']=='A']
if any(r['content'] not in allowed for r in apex): raise SystemExit('Unexpected apex IP; no changes made')
if any(r['type']=='AAAA' for r in web): raise SystemExit('Unexpected IPv6 record; no changes made')
www=[r for r in web if r['name']=='www.main-hall.ru' and r['type'] in ['A','CNAME']]
if any(r['type']!='CNAME' or r['content'].rstrip('.') not in ['anepomniashiy-art.github.io','main-hall.ru'] for r in www):
    raise SystemExit('Unexpected www target; no changes made')
data={'type':'A','name':'main-hall.ru','content':ip,'ttl':300,'proxied':False}
if apex:
    cf('PUT',prefix+'/'+apex[0]['id'],data)
    for extra in apex[1:]: cf('DELETE',prefix+'/'+extra['id'])
else: cf('POST',prefix,data)
data={'type':'CNAME','name':'www','content':'main-hall.ru','ttl':300,'proxied':False}
if www: cf('PUT',prefix+'/'+www[0]['id'],data)
else: cf('POST',prefix,data)
after=cf('GET',prefix+'?per_page=100')
print('WEB_DNS_AFTER',json.dumps([{k:r.get(k) for k in ['type','name','content','proxied']} for r in after if r['name'] in ['main-hall.ru','www.main-hall.ru']]),flush=True)
print('DNS_CUTOVER_COMPLETE',flush=True)
