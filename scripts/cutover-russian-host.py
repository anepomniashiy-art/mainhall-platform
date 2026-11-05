"""Switch MAINHALL web records only after the Russian release is verified."""
import json
import os
import re
import subprocess
import time
import urllib.request

IP = '201.24.63.94'
TECHNICAL = 'https://mainhall.201-24-63-94.sslip.io'
TOKEN = os.environ['CLOUDFLARE_API_TOKEN']

def cf(method, path, data=None):
    request = urllib.request.Request(
        'https://api.cloudflare.com/client/v4/'+path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'},
        method=method,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    if not result.get('success'):
        raise RuntimeError('Cloudflare request failed')
    return result['result']

def fetch(url, pinned=False):
    args=['curl','--fail','--silent','--show-error','--max-time','20']
    if pinned:
        args += ['--noproxy','*','--resolve','main-hall.ru:443:'+IP]
    result=subprocess.run(args+[url],capture_output=True,text=True)
    if result.returncode:
        raise RuntimeError('HTTPS check failed: '+url)
    return result.stdout

revision=fetch(TECHNICAL+'/deploy-version.txt').strip()
if not re.fullmatch('[0-9a-f]{40}',revision):
    raise RuntimeError('Invalid Russian release version')
checks=[('/','MAINHALL'),('/projects/','MAINHALL'),
        ('/units/','mh-project-result-price'),
        ('/units/public-high-life-405/','id="floor-plan"'),
        ('/commercial/','Коммерческая недвижимость Sminex')]
for path,marker in checks:
    if marker not in fetch(TECHNICAL+path):
        raise RuntimeError('Russian preflight content mismatch: '+path)
print('RUSSIAN_RELEASE_VERIFIED',revision,flush=True)
zone=os.environ.get('CLOUDFLARE_ZONE_ID','').strip()
if not zone:
    zones=[z for z in cf('GET','zones?name=main-hall.ru') if z['name']=='main-hall.ru']
    if len(zones)!=1:raise RuntimeError('Ambiguous domain zone')
    zone=zones[0]['id']
prefix='zones/'+zone+'/dns_records'
records=cf('GET',prefix+'?per_page=100')
web=[r for r in records if r['name'] in ['main-hall.ru','www.main-hall.ru']]
if any(r['type']=='AAAA' for r in web):raise RuntimeError('Unexpected IPv6 web record')
apex=[r for r in web if r['name']=='main-hall.ru' and r['type']=='A']
www=[r for r in web if r['name']=='www.main-hall.ru' and r['type']=='CNAME']
if len(apex)!=1 or len(www)!=1:raise RuntimeError('Unexpected web record structure')
if apex[0]['content'] not in [IP,'72.56.84.90','87.236.19.212','45.130.41.213']:
    raise RuntimeError('Unexpected current origin')
if www[0]['content'].rstrip('.')!='main-hall.ru':raise RuntimeError('Unexpected www destination')
def payload(record):
    return {k:record[k] for k in ['type','name','content','ttl','proxied']}
changed=[]
try:
    for record,value in [(apex[0],IP),(www[0],'main-hall.ru')]:
        update=payload(record)
        update.update(content=value,ttl=300,proxied=False)
        cf('PUT',prefix+'/'+record['id'],update)
        changed.append(record)
    print('RUSSIAN_DNS_SET',IP,flush=True)
    # Caddy obtains the public-domain certificate once DNS points here.
    for attempt in range(24):
        try:
            if fetch('https://main-hall.ru/deploy-version.txt',pinned=True).strip()==revision:
                break
        except RuntimeError:
            pass
        time.sleep(10)
    else:raise RuntimeError('Russian origin public-domain TLS did not become ready')
    for path,marker in checks:
        if marker not in fetch('https://main-hall.ru'+path,pinned=True):
            raise RuntimeError('Russian public-domain page failed: '+path)
    for _ in range(2):
        for path,marker in checks:
            if marker not in fetch('https://main-hall.ru'+path):
                raise RuntimeError('Public page verification failed: '+path)
        if fetch('https://main-hall.ru/deploy-version.txt').strip()!=revision:
            raise RuntimeError('Public domain still serves a different revision')
    print('RUSSIAN_PUBLIC_HTTPS_VERIFIED',revision,flush=True)
except Exception:
    for record in reversed(changed):
        cf('PUT',prefix+'/'+record['id'],payload(record))
    print('DNS_ROLLED_BACK',flush=True)
    raise
