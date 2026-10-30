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
# FTP_TLS verifies the server certificate against this technical hostname
# during login; a separate openssl connection duplicates that verification
# and can hang even when the authenticated transfer succeeds.
tls_name=login+'.beget.tech'
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
(base/'.htaccess').write_text(Path('public/.htaccess').read_text())
files=sorted((p for p in base.rglob('*') if p.is_file()),key=lambda p:(p.suffix=='.html',p.name=='index.html',str(p)))
# Transfer a single archive: per-file FTP round trips do not scale to a catalogue.
import secrets,zipfile,io
nonce=secrets.token_hex(16)
token=secrets.token_hex(32)
print('::add-mask::'+token,flush=True)
archive_name='.mh-release-'+nonce+'.zip'
runner_name='mh-release-'+nonce+'.php'
archive=Path('/tmp')/archive_name
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for path in files:
        if path!=base/'index.html': z.write(path,path.relative_to(base).as_posix())
    z.write(base/'index.html','index.html')
php = r'''<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals('TOKEN_HASH', hash('sha256', (isset($_SERVER['HTTP_X_MAINHALL_DEPLOY']) ? $_SERVER['HTTP_X_MAINHALL_DEPLOY'] : '')))) { http_response_code(403); exit; }
set_time_limit(300);
if (!class_exists('ZipArchive')) {
 try {
  $archive=__DIR__ . '/ARCHIVE_NAME'; $phar=new PharData($archive);
  $prefix='phar://' . $archive . '/'; $count=0;
  foreach (new RecursiveIteratorIterator($phar) as $entry) {
   $name=substr($entry->getPathname(),strlen($prefix));
   if (!$name || $name[0]=='/' || strpos($name,'..')!==false || strpos($name,chr(92))!==false || $entry->isLink()) { http_response_code(400); exit; }
   $target=__DIR__ . '/' . $name;
   if (!is_dir(dirname($target))) mkdir(dirname($target),0755,true);
   if (file_put_contents($target,$entry->getContent())===false) throw new Exception('write failed');
   $count++;
  }
  echo json_encode(['files'=>$count]); exit;
 } catch (Exception $e) { http_response_code(500); echo json_encode(['error'=>'archive extraction failed','type'=>get_class($e)]); exit; }
}
$z = new ZipArchive();
if ($z->open(__DIR__ . '/ARCHIVE_NAME') !== true) { http_response_code(500); exit; }
$count = $z->numFiles;
for ($i=0; $i<$count; $i++) {
 $name=$z->getNameIndex($i);
 if (!$name || $name[0]=='/' || strpos($name, '..')!==false || strpos($name, chr(92))!==false || strpos($name, chr(0))!==false) { http_response_code(400); exit; }
 $opsys=0; $attr=0; $z->getExternalAttributesIndex($i,$opsys,$attr);
 if ((($attr >> 16) & 0170000) === 0120000) { http_response_code(400); exit; }
}
for ($i=0; $i<$count; $i++) { if (!$z->extractTo(__DIR__, [$z->getNameIndex($i)])) { http_response_code(500); exit; } }
$z->close();
echo json_encode(['files'=>$count]);
?>'''
php=php.replace('TOKEN_HASH',hashlib.sha256(token.encode()).hexdigest()).replace('ARCHIVE_NAME',archive_name)
try:
    with archive.open('rb') as stream: ftp.storbinary('STOR '+archive_name,stream,blocksize=262144)
    ftp.storbinary('STOR '+runner_name,io.BytesIO(php.encode()))
    print('Archive uploaded:',archive.stat().st_size,'bytes',flush=True)
    request=urllib.request.Request('https://main-hall.ru/'+runner_name,data=b'deploy',headers={'X-Mainhall-Deploy':token},method='POST')
    try:
        with urllib.request.urlopen(request,timeout=360) as response: result=json.load(response)
    except urllib.error.HTTPError as error:
        print('Archive extraction HTTP',error.code,error.read(500).decode('utf8',errors='replace'),flush=True)
        raise SystemExit('Archive extraction failed')
    if result.get('files')!=len(files): raise SystemExit('Archive extraction count mismatch')
    print('UPLOAD_COMPLETE files='+str(result['files']),flush=True)
finally:
    for remote in [runner_name,archive_name]:
        try: ftp.delete(remote)
        except ftplib.all_errors: pass
    ftp.quit()
    archive.unlink(missing_ok=True)
ip=socket.gethostbyname(login+'.beget.tech')
Path('/tmp/beget-ip').write_text(ip)
