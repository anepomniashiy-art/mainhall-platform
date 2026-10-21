import os,json,urllib.request,urllib.parse,hmac,hashlib,ftplib,ssl,socket,time
from pathlib import Path
import subprocess,re,threading
from concurrent.futures import ThreadPoolExecutor
login='wellton'
password=os.environ['BEGET_API_PASSWORD']
if not password: raise SystemExit('Missing BEGET_API_PASSWORD')
def api(method,args=None):
    values={'login':login,'passwd':password,'input_format':'json','output_format':'json','input_data':json.dumps(args or {})}
    request=urllib.request.Request('https://api.beget.com/api/'+method,data=urllib.parse.urlencode(values).encode())
    try:
        result=json.load(urllib.request.urlopen(request,timeout=40))
    except Exception as error:
        raise SystemExit('Beget request failed: '+type(error).__name__)
    answer=result.get('answer',{})
    if result.get('status')!='success' or answer.get('status')!='success':
        message=json.dumps(result,ensure_ascii=False).replace(password,'***')
        raise SystemExit(method+': '+message)
    return answer.get('result')
info=api('user/getAccountInfo')
host=info['server_name']
sites=api('site/getList')
target=next((x for x in sites if x['path']=='main-hall.ru/public_html'),None)
if target is None:
    api('site/add',{'name':'main-hall.ru'})
    target=next(x for x in api('site/getList') if x['path']=='main-hall.ru/public_html')
domains=api('domain/getList')
domain=next((x for x in domains if x['fqdn']=='main-hall.ru'),None)
if domain is None:
    api('domain/addVirtual',{'hostname':'main-hall','zone_id':1})
    domain=next(x for x in api('domain/getList') if x['fqdn']=='main-hall.ru')
linked=any(str(x['id'])==str(domain['id']) for x in target.get('domains',[]))
if not linked:
    api('site/linkDomain',{'domain_id':int(domain['id']),'site_id':int(target['id'])})
print('Site configured:',target['path'],'site_id',target['id'],flush=True)
suffix='mhdeploy'
ftp_login=login+'_'+suffix
ftp_password='Mh!'+hmac.new(password.encode(),b'mainhall-beget-deploy-v1',hashlib.sha256).hexdigest()[:32]
print('::add-mask::'+ftp_password,flush=True)
accounts=api('ftp/getList')
existing=next((x for x in accounts if x['login']==ftp_login),None)
if existing:
    if existing['homedir'].rstrip('/')!='/main-hall.ru/public_html': raise SystemExit('Deploy account points to unexpected directory')
    api('ftp/changePassword',{'suffix':suffix,'password':ftp_password})
else:
    api('ftp/add',{'suffix':suffix,'homedir':'/main-hall.ru/public_html','password':ftp_password})
probe=subprocess.run(['openssl','s_client','-starttls','ftp','-connect',host+':21','-servername',host],input=b'',stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=20,check=False)
certinfo=subprocess.run(['openssl','x509','-noout','-ext','subjectAltName'],input=probe.stdout,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,check=True).stdout.decode()
sans=[part.split(',')[0].strip().split()[0] for part in certinfo.split('DNS:')[1:]]
print('FTP certificate names:',sans,flush=True)
# The API supplies the physical FTP endpoint; Beget issues its certificate
# for technical account names. Verify that technical name during TLS.
tls_name=login+'.beget.tech'
if not any(ssl._dnsname_match(name,tls_name) for name in sans):
    raise SystemExit('Unexpected Beget FTP certificate')
class ReusingFTP_TLS(ftplib.FTP_TLS):
    def ntransfercmd(self,cmd,rest=None):
        connection,size=ftplib.FTP.ntransfercmd(self,cmd,rest)
        if self._prot_p:
            connection=self.context.wrap_socket(connection,server_hostname=self.host,session=self.sock.session)
        return connection,size
tls_context=ssl.create_default_context()
tls_context.maximum_version=ssl.TLSVersion.TLSv1_2
ftp=ReusingFTP_TLS(context=tls_context,timeout=45)
ftp.connect(host,21)
ftp.host=tls_name
print('FTP TLS identity:',tls_name,flush=True)
ftp.login(ftp_login,ftp_password)
ftp.prot_p()
base=Path('out')
if not (base/'index.html').is_file(): raise SystemExit('Export missing')
(base/'.htaccess').write_text('DirectoryIndex index.html\nErrorDocument 404 /404.html\nOptions -Indexes\n')
files=sorted((p for p in base.rglob('*') if p.is_file()),key=lambda p:(p.suffix=='.html',p.name=='index.html',str(p)))
ftp.quit()
local=threading.local()
def connection():
    if not hasattr(local,'ftp'):
        client=ReusingFTP_TLS(context=tls_context,timeout=45)
        client.connect(host,21)
        client.host=tls_name
        client.login(ftp_login,ftp_password)
        client.prot_p()
        local.ftp=client
        local.made={''}
    return local.ftp
def upload(path):
    client=connection()
    relative=path.relative_to(base).as_posix()
    parts=relative.split('/')[:-1]
    for i in range(1,len(parts)+1):
        folder='/'.join(parts[:i])
        if folder not in local.made:
            try: client.mkd(folder)
            except ftplib.error_perm as error:
                if not str(error).startswith('550'): raise
            local.made.add(folder)
    with path.open('rb') as stream:
        client.storbinary('STOR '+relative,stream,blocksize=262144)
    return relative
assets=[p for p in files if p.suffix!='.html']
pages=[p for p in files if p.suffix=='.html' and p!=base/'index.html']
count=0
with ThreadPoolExecutor(max_workers=8) as pool:
    for group in [assets,pages]:
        for result in pool.map(upload,group):
            count+=1
            if count%100==0: print('Uploaded',count,'/',len(files),flush=True)
    upload(base/'index.html')
ip=socket.gethostbyname(login+'.beget.tech')
print('UPLOAD_COMPLETE files='+str(len(files))+' host='+host+' ip='+ip,flush=True)
Path('/tmp/beget-ip').write_text(ip)
