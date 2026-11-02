import os,json,urllib.request,urllib.parse,hmac,hashlib,ftplib,ssl,socket,time
from pathlib import Path
import subprocess,re,threading
from concurrent.futures import ThreadPoolExecutor
login='wellton'
password=os.environ['BEGET_API_PASSWORD']
if not password: raise SystemExit('Missing BEGET_API_PASSWORD')
class BegetUnavailable(Exception): pass
def api(method,args=None):
    values={'login':login,'passwd':password,'input_format':'json','output_format':'json','input_data':json.dumps(args or {})}
    request=urllib.request.Request('https://api.beget.com/api/'+method,data=urllib.parse.urlencode(values).encode())
    result=None
    last_error=None
    for attempt in range(4):
        try:
            result=json.load(urllib.request.urlopen(request,timeout=40))
            break
        except (urllib.error.URLError,TimeoutError,socket.timeout) as error:
            last_error=error
            if attempt<3:
                delay=5*(attempt+1)
                print('Beget API unavailable; retrying in',delay,'seconds',flush=True)
                time.sleep(delay)
    if result is None:
        raise BegetUnavailable('Beget request failed after retries: '+type(last_error).__name__)
    answer=result.get('answer',{})
    if result.get('status')!='success' or answer.get('status')!='success':
        message=json.dumps(result,ensure_ascii=False).replace(password,'***')
        raise SystemExit(method+': '+message)
    return answer.get('result')
suffix='mhdeploy'
ftp_login=login+'_'+suffix
ftp_password='Mh!'+hmac.new(password.encode(),b'mainhall-beget-deploy-v1',hashlib.sha256).hexdigest()[:32]
print('::add-mask::'+ftp_password,flush=True)
tls_name=login+'.beget.tech'
try:
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
    accounts=api('ftp/getList')
    existing=next((x for x in accounts if x['login']==ftp_login),None)
    if existing:
        if existing['homedir'].rstrip('/')!='/main-hall.ru/public_html': raise SystemExit('Deploy account points to unexpected directory')
        api('ftp/changePassword',{'suffix':suffix,'password':ftp_password})
    else:
        api('ftp/add',{'suffix':suffix,'homedir':'/main-hall.ru/public_html','password':ftp_password})
except BegetUnavailable:
    host=tls_name
    print('Beget control API unavailable; using the existing restricted FTP account',flush=True)
# FTP_TLS verifies the server certificate against this technical hostname
# during login; a separate openssl connection duplicates that verification
# and can hang even when the authenticated transfer succeeds.
class ReusingFTP_TLS(ftplib.FTP_TLS):
    def ntransfercmd(self,cmd,rest=None):
        connection,size=ftplib.FTP.ntransfercmd(self,cmd,rest)
        if self._prot_p:
            connection=self.context.wrap_socket(connection,server_hostname=self.host,session=self.sock.session)
        return connection,size
def resolve_a_direct(name):
    # GitHub runners occasionally fail to reach their recursive resolver for
    # Beget zones. Query Beget's published authoritative servers directly and
    # still verify the FTPS certificate against the hostname below.
    query_id=os.urandom(2)
    qname=b''.join(bytes([len(part)])+part.encode('ascii') for part in name.split('.'))+b'\0'
    packet=query_id+b'\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00'+qname+b'\x00\x01\x00\x01'
    def skip_name(data,offset):
        while True:
            length=data[offset]
            if length&0xc0==0xc0: return offset+2
            offset+=1
            if length==0: return offset
            offset+=length
    for server in ['93.92.81.0','185.50.27.12']:
        try:
            with socket.socket(socket.AF_INET,socket.SOCK_DGRAM) as dns:
                dns.settimeout(5)
                dns.sendto(packet,(server,53))
                data=dns.recv(4096)
            if data[:2]!=query_id: continue
            questions=int.from_bytes(data[4:6],'big')
            answers=int.from_bytes(data[6:8],'big')
            offset=12
            for _ in range(questions): offset=skip_name(data,offset)+4
            for _ in range(answers):
                offset=skip_name(data,offset)
                record_type=int.from_bytes(data[offset:offset+2],'big')
                record_class=int.from_bytes(data[offset+2:offset+4],'big')
                length=int.from_bytes(data[offset+8:offset+10],'big')
                value=data[offset+10:offset+10+length]
                offset+=10+length
                if record_type==1 and record_class==1 and length==4:
                    return socket.inet_ntoa(value)
        except (OSError,IndexError):
            pass
    # UDP DNS may be blocked on hosted runners. Use DNS-over-HTTPS through a
    # pinned resolver IP, with normal certificate verification and SNI.
    for ip,server,path in [
        ('1.1.1.1','cloudflare-dns.com','/dns-query?name='+name+'&type=A'),
        ('8.8.8.8','dns.google','/resolve?name='+name+'&type=A'),
    ]:
        try:
            context=ssl.create_default_context()
            raw=socket.create_connection((ip,443),timeout=10)
            with context.wrap_socket(raw,server_hostname=server) as connection:
                request=('GET '+path+' HTTP/1.1\r\nHost: '+server+'\r\nAccept: application/dns-json\r\nConnection: close\r\n\r\n')
                connection.sendall(request.encode('ascii'))
                response=b''
                while True:
                    part=connection.recv(65536)
                    if not part: break
                    response+=part
            headers,body=response.split(b'\r\n\r\n',1)
            if b' 200 ' not in headers.split(b'\r\n',1)[0]: continue
            if b'transfer-encoding: chunked' in headers.lower():
                decoded=b''
                while body:
                    line,body=body.split(b'\r\n',1)
                    size=int(line.split(b';',1)[0],16)
                    if size==0: break
                    decoded+=body[:size]
                    body=body[size+2:]
                body=decoded
            result=json.loads(body)
            for answer in result.get('Answer',[]):
                if answer.get('type')==1:
                    socket.inet_aton(answer['data'])
                    return answer['data']
        except (OSError,ValueError,KeyError,json.JSONDecodeError):
            pass
    return None
tls_context=ssl.create_default_context()
tls_context.maximum_version=ssl.TLSVersion.TLSv1_2
# Both endpoints are documented Beget addresses. Preserve certificate
# verification and retry transient network failures on the technical domain.
ftp=None
direct_ip=resolve_a_direct(tls_name)
endpoints=list(dict.fromkeys([host,tls_name]+([direct_ip] if direct_ip else [])))
for endpoint in endpoints:
    candidate=ReusingFTP_TLS(context=tls_context,timeout=25)
    try:
        candidate.connect(endpoint,21)
        candidate.host=tls_name
        candidate.login(ftp_login,ftp_password)
        candidate.prot_p()
        ftp=candidate
        print('FTP TLS connected:',endpoint,flush=True)
        break
    except OSError as error:
        candidate.close()
        print('FTP endpoint unavailable:',endpoint,type(error).__name__,flush=True)
if ftp is None:
    raise SystemExit('Beget FTP endpoints unavailable; no export files uploaded')
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

