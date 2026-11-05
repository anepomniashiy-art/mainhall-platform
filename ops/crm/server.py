#!/usr/bin/env python3
"""Private MAINHALL call desk. Standard library only; run behind HTTPS Caddy."""
import argparse
import base64
import csv
from contextlib import contextmanager
import hashlib
import hmac
import io
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

ITERATIONS = 310_000
FIELDS = ('full_name', 'phone', 'project', 'budget_rub', 'deadline', 'purpose', 'comment', 'list_name', 'status')
LIMITS = {'full_name':160, 'phone':32, 'project':200, 'deadline':120, 'purpose':200, 'comment':4000, 'list_name':120, 'status':24}
STATUSES = ('new','contacted','followup','qualified','closed')
SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','operator')),
 password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS leads (
 id INTEGER PRIMARY KEY, operator_id TEXT NOT NULL REFERENCES users(id), full_name TEXT NOT NULL,
 phone TEXT NOT NULL, project TEXT NOT NULL DEFAULT '', budget_rub INTEGER, deadline TEXT NOT NULL DEFAULT '',
 purpose TEXT NOT NULL DEFAULT '', comment TEXT NOT NULL DEFAULT '', list_name TEXT NOT NULL DEFAULT 'Основной',
 status TEXT NOT NULL DEFAULT 'new', origin TEXT NOT NULL DEFAULT 'manual', consent_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS leads_operator ON leads(operator_id, id);
CREATE TABLE IF NOT EXISTS audit (
 id INTEGER PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL,
 lead_id INTEGER, details TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
'''


def password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),ITERATIONS).hex()
    return f'{ITERATIONS}${salt}${digest}'


def verify_password(password, encoded):
    try:
        iterations,salt,digest = encoded.split('$')
        candidate = hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),int(iterations)).hex()
        return hmac.compare_digest(candidate,digest)
    except (ValueError,TypeError):
        return False


def validate_lead(data):
    if not isinstance(data,dict) or set(data)-set(FIELDS):
        raise ValueError('Неизвестные поля заявки')
    result={}
    for field in FIELDS:
        value=data.get(field)
        if field=='budget_rub':
            if value in (None,''):
                result[field]=None
            elif type(value) is int and 0 < value <= 100_000_000_000:
                result[field]=value
            else:
                raise ValueError('Бюджет: целая сумма в рублях или неизвестно')
            continue
        if value is None:value=''
        if not isinstance(value,str) or len(value)>LIMITS[field] or '\x00' in value:
            raise ValueError('Недопустимое значение: '+field)
        result[field]=value.strip()
    phone=re.sub(r'[\s()+.-]','',result['phone'])
    if not re.fullmatch(r'\d{10,15}',phone):
        raise ValueError('Укажите телефон: от 10 до 15 цифр')
    result['phone']='+'+phone
    if not result['full_name']:raise ValueError('Укажите имя клиента')
    if not result['list_name']:result['list_name']='Основной'
    if result['status'] not in STATUSES:raise ValueError('Неизвестный статус')
    return result


class Store:
    def __init__(self,directory):
        self.directory=Path(directory)
        self.directory.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.path=self.directory/'crm.sqlite3'
        with self.connect() as db:
            db.executescript(SCHEMA)
            columns={row[1] for row in db.execute('PRAGMA table_info(leads)')}
            if 'origin' not in columns:db.execute("ALTER TABLE leads ADD COLUMN origin TEXT NOT NULL DEFAULT 'manual'")
            if 'consent_at' not in columns:db.execute('ALTER TABLE leads ADD COLUMN consent_at TEXT')
        os.chmod(self.path,0o600)

    @contextmanager
    def connect(self):
        db=sqlite3.connect(self.path,timeout=10)
        db.row_factory=sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('PRAGMA journal_mode=WAL')
        try:
            with db:yield db
        finally:db.close()

    def bootstrap(self):
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT 1 FROM users LIMIT 1').fetchone():return False
            password=secrets.token_urlsafe(24)
            db.execute('INSERT INTO users(id,name,role,password_hash) VALUES(?,?,?,?)',
                       ('mainhall-admin','MAINHALL','admin',password_hash(password)))
            credential=self.directory/'initial-access.json'
            fd=os.open(credential,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
            with os.fdopen(fd,'w') as out:
                json.dump({'url':'https://main-hall.ru/office/','username':'mainhall-admin','password':password},out,ensure_ascii=False)
        return True

    def user(self,username):
        with self.connect() as db:
            row=db.execute('SELECT * FROM users WHERE id=? AND active=1',(username,)).fetchone()
            return dict(row) if row else None

    def leads(self,user,operator=None):
        with self.connect() as db:
            if user['role']=='admin' and not operator:
                rows=db.execute('SELECT leads.*,users.name operator_name FROM leads JOIN users ON users.id=leads.operator_id ORDER BY leads.id DESC LIMIT 5000')
            else:
                owner=operator if user['role']=='admin' else user['id']
                rows=db.execute('SELECT leads.*,users.name operator_name FROM leads JOIN users ON users.id=leads.operator_id WHERE operator_id=? ORDER BY leads.id DESC LIMIT 5000',(owner,))
            return [dict(row) for row in rows]

    def save(self,user,data,lead_id=None):
        values=validate_lead(data)
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old=None
            if lead_id is not None:
                row=db.execute('SELECT * FROM leads WHERE id=?',(lead_id,)).fetchone()
                if not row or (user['role']!='admin' and row['operator_id']!=user['id']):raise LookupError('Заявка не найдена')
                old=dict(row)
                db.execute('UPDATE leads SET '+','.join(f'{key}=?' for key in FIELDS)+',updated_at=CURRENT_TIMESTAMP WHERE id=?',[values[k] for k in FIELDS]+[lead_id])
            else:
                cursor=db.execute('INSERT INTO leads(operator_id,'+','.join(FIELDS)+') VALUES('+','.join('?' for _ in range(len(FIELDS)+1))+')',[user['id']]+[values[k] for k in FIELDS])
                lead_id=cursor.lastrowid
            db.execute('INSERT INTO audit(actor_id,action,lead_id,details) VALUES(?,?,?,?)',
                       (user['id'],'update' if old else 'create',lead_id,json.dumps({'before':old,'after':values},ensure_ascii=False)))
            return lead_id

    def public_lead(self,data):
        allowed={'name','phone','context','comment','consent','website'}
        if not isinstance(data,dict) or set(data)-allowed or data.get('consent') is not True:
            raise ValueError('Подтвердите согласие на обработку обращения')
        if data.get('website'):
            return None
        context=data.get('context','')
        if not isinstance(context,str) or len(context)>200:
            raise ValueError('Слишком длинный контекст обращения')
        name=data.get('name','')
        if not isinstance(name,str) or len(name)>120:raise ValueError('Проверьте имя')
        values=validate_lead({'full_name':name.strip() or 'Заявка с сайта','phone':data.get('phone'),
            'project':context,'purpose':'Подбор недвижимости','comment':data.get('comment',''),
            'list_name':'Заявки с сайта','status':'new','budget_rub':None})
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            owner=db.execute("SELECT id FROM users WHERE role='admin' AND active=1 ORDER BY created_at LIMIT 1").fetchone()
            if not owner:raise sqlite3.OperationalError('CRM administrator is not configured')
            cursor=db.execute('INSERT INTO leads(operator_id,'+','.join(FIELDS)+",origin,consent_at) VALUES("+','.join('?' for _ in range(len(FIELDS)+1))+",'website',CURRENT_TIMESTAMP)",[owner['id']]+[values[k] for k in FIELDS])
            lead_id=cursor.lastrowid
            db.execute('INSERT INTO audit(actor_id,action,lead_id,details) VALUES(NULL,?,?,?)',
                       ('website_create',lead_id,json.dumps({'origin':'website','consent':True},ensure_ascii=False)))
            return lead_id

    def assign(self,actor,lead_id,operator_id):
        if actor['role']!='admin':raise PermissionError()
        if not isinstance(operator_id,str):raise ValueError('Укажите оператора')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            target=db.execute('SELECT id FROM users WHERE id=? AND active=1',(operator_id,)).fetchone()
            row=db.execute('SELECT operator_id FROM leads WHERE id=?',(lead_id,)).fetchone()
            if not row or not target:raise LookupError()
            db.execute('UPDATE leads SET operator_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',(operator_id,lead_id))
            db.execute('INSERT INTO audit(actor_id,action,lead_id,details) VALUES(?,?,?,?)',
                       (actor['id'],'assign',lead_id,json.dumps({'before':row['operator_id'],'after':operator_id})))

    def change_password(self,actor,data):
        if not isinstance(data,dict) or set(data)!={'current_password','new_password'}:
            raise ValueError('Укажите текущий и новый пароль')
        current=data['current_password'];new=data['new_password']
        if not isinstance(current,str) or not isinstance(new,str) or not 14<=len(new)<=128 or len(current)>128:
            raise ValueError('Новый пароль должен содержать от 14 до 128 символов')
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row=db.execute('SELECT password_hash FROM users WHERE id=? AND active=1',(actor['id'],)).fetchone()
            if not row or not verify_password(current,row['password_hash']):
                raise ValueError('Текущий пароль неверен')
            if hmac.compare_digest(current,new):raise ValueError('Новый пароль должен отличаться от текущего')
            db.execute('UPDATE users SET password_hash=? WHERE id=?',(password_hash(new),actor['id']))
            db.execute('INSERT INTO audit(actor_id,action,details) VALUES(?,?,?)',(actor['id'],'change_password','{}'))

    def create_user(self,actor,data):
        if actor['role']!='admin':raise PermissionError()
        if not isinstance(data,dict) or set(data)!={'id','name'}:raise ValueError('Укажите идентификатор и имя оператора')
        user_id=data['id'];name=data['name']
        if not isinstance(user_id,str) or not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,39}',user_id):raise ValueError('ID: 3–40 латинских букв, цифр, _ или -')
        if not isinstance(name,str) or not 1<=len(name.strip())<=120:raise ValueError('Укажите имя оператора')
        password=secrets.token_urlsafe(24)
        with self.connect() as db:
            try:db.execute('INSERT INTO users(id,name,role,password_hash) VALUES(?,?,?,?)',(user_id,name.strip(),'operator',password_hash(password)))
            except sqlite3.IntegrityError:raise ValueError('Такой ID уже существует') from None
            db.execute('INSERT INTO audit(actor_id,action,details) VALUES(?,?,?)',(actor['id'],'create_operator',json.dumps({'id':user_id,'name':name.strip()},ensure_ascii=False)))
        return {'id':user_id,'name':name.strip(),'password':password}


class CRMServer(ThreadingHTTPServer):
    daemon_threads=True
    def __init__(self,address,store,origin):
        super().__init__(address,Handler)
        self.store=store
        self.origin=origin.rstrip('/')
        self.failures={}
        self.public_requests={}
        self.failure_lock=threading.Lock()
        self.dummy_hash=password_hash(secrets.token_urlsafe(24))


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    server_version='MAINHALL'
    sys_version=''
    def log_message(self,format,*args):pass # No personal data, credentials or URLs in access logs.

    def respond(self,status,data=None,kind='application/json; charset=utf-8',extra=None):
        if isinstance(data,dict) or isinstance(data,list):data=json.dumps(data,ensure_ascii=False).encode()
        elif isinstance(data,str):data=data.encode()
        data=data or b''
        self.send_response(status)
        for k,v in {'Content-Type':kind,'Content-Length':str(len(data)),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Robots-Tag':'noindex, nofollow, noarchive',**(extra or {})}.items():self.send_header(k,v)
        self.end_headers()
        self.wfile.write(data)

    def authenticate(self):
        value=self.headers.get('Authorization','')
        username=password=''
        try:
            if not value.startswith('Basic ') or len(value)>2048:raise ValueError()
            username,password=base64.b64decode(value[6:],validate=True).decode().split(':',1)
        except (ValueError,UnicodeDecodeError):pass
        now=time.monotonic()
        key=username[:80]
        with self.server.failure_lock:
            failures=[t for t in self.server.failures.get(key,[]) if now-t<60]
            if len(self.server.failures)>2000:
                self.server.failures={k:v for k,v in self.server.failures.items() if v and now-v[-1]<60}
            self.server.failures[key]=failures
            if len(failures)>=20:
                self.respond(429,{'error':'Слишком много попыток. Повторите через минуту.'},extra={'Retry-After':'60'})
                return None
        user=self.server.store.user(username)
        valid=verify_password(password,user['password_hash'] if user else self.server.dummy_hash)
        if not user or not valid:
            with self.server.failure_lock:self.server.failures.setdefault(key,[]).append(now)
            self.respond(401,{'error':'Нужен доступ оператора MAINHALL'},extra={'WWW-Authenticate':'Basic realm="MAINHALL Office", charset="UTF-8"'})
            return None
        return user

    def do_GET(self):
        if urlsplit(self.path).path=='/api/enquiry':
            return self.respond(405,{'error':'Метод не поддерживается'},extra={'Allow':'POST'})
        user=self.authenticate()
        if not user:return
        parsed=urlsplit(self.path)
        path=parsed.path
        if path in ('/office/','/office'):
            self.respond(200,(Path(__file__).parent/'index.html').read_bytes(),'text/html; charset=utf-8')
        elif path=='/office/api/me':
            self.respond(200,{k:user[k] for k in ('id','name','role')})
        elif path in ('/office/api/leads','/office/api/export.csv'):
            operator=parse_qs(parsed.query).get('operator',[None])[0]
            rows=self.server.store.leads(user,operator)
            if path.endswith('.csv'):
                out=io.StringIO();writer=csv.writer(out);columns=['id','operator_id',*FIELDS,'created_at','updated_at'];writer.writerow(columns)
                for row in rows:
                    # Prevent spreadsheet formula injection when opened in Excel.
                    writer.writerow([("'"+str(row.get(k,''))) if isinstance(row.get(k),str) and row[k][:1] in ('=','+','-','@','\t','\r') else row.get(k,'') for k in columns])
                self.respond(200,'\ufeff'+out.getvalue(),'text/csv; charset=utf-8',{'Content-Disposition':'attachment; filename="mainhall-clients.csv"'})
            else:self.respond(200,rows)
        elif path=='/office/api/operators' and user['role']=='admin':
            with self.server.store.connect() as db:self.respond(200,[dict(r) for r in db.execute('SELECT id,name,role,active FROM users ORDER BY name')])
        else:self.respond(404,{'error':'Страница не найдена'})

    def do_POST(self):self.mutate()
    def do_PUT(self):self.mutate()
    def mutate(self):
        if urlsplit(self.path).path=='/api/enquiry':
            return self.public_enquiry()
        user=self.authenticate()
        if not user:return
        if self.headers.get('Origin')!=self.server.origin or self.headers.get('Sec-Fetch-Site') in ('cross-site','none'):
            return self.respond(403,{'error':'Запрос с другого сайта запрещён'})
        if self.headers.get('Content-Type','').split(';')[0].strip()!='application/json':
            return self.respond(415,{'error':'Ожидается JSON'})
        try:length=int(self.headers.get('Content-Length','0'))
        except ValueError:return self.respond(400,{'error':'Некорректная длина запроса'})
        if not 0<length<=16_384:return self.respond(413,{'error':'Слишком большой запрос'})
        try:
            data=json.loads(self.rfile.read(length))
            path=urlsplit(self.path).path
            if path=='/office/api/leads' and self.command=='POST':
                self.respond(201,{'id':self.server.store.save(user,data)})
            elif re.fullmatch(r'/office/api/leads/[1-9]\d*',path) and self.command=='PUT':
                self.respond(200,{'id':self.server.store.save(user,data,int(path.rsplit('/',1)[1]))})
            elif re.fullmatch(r'/office/api/leads/[1-9]\d*/assign',path) and self.command=='POST':
                if not isinstance(data,dict) or set(data)!={'operator_id'}:raise ValueError('Укажите оператора')
                self.server.store.assign(user,int(path.split('/')[-2]),data['operator_id'])
                self.respond(200,{'ok':True})
            elif path=='/office/api/password' and self.command=='POST':
                self.server.store.change_password(user,data)
                self.respond(200,{'ok':True})
            elif path=='/office/api/operators' and self.command=='POST':
                self.respond(201,self.server.store.create_user(user,data))
            else:self.respond(404,{'error':'Страница не найдена'})
        except PermissionError:self.respond(403,{'error':'Только для администратора'})
        except LookupError:self.respond(404,{'error':'Заявка не найдена'})
        except (ValueError,UnicodeDecodeError) as error:self.respond(400,{'error':str(error) if isinstance(error,ValueError) and not isinstance(error,json.JSONDecodeError) else 'Проверьте формат данных'})
        except sqlite3.Error:self.respond(503,{'error':'Не удалось сохранить. Повторите запрос.'})


    def public_enquiry(self):
        if self.command!='POST':
            return self.respond(405,{'error':'Метод не поддерживается'},extra={'Allow':'POST'})
        allowed={self.server.origin,'https://www.main-hall.ru'}
        if self.headers.get('Origin') not in allowed or self.headers.get('Sec-Fetch-Site')=='cross-site':
            return self.respond(403,{'error':'Обращение с другого сайта запрещено'})
        if self.headers.get('Content-Type','').split(';')[0].strip()!='application/json':
            return self.respond(415,{'error':'Ожидается JSON'})
        try:length=int(self.headers.get('Content-Length','0'))
        except ValueError:return self.respond(400,{'error':'Некорректный запрос'})
        if not 0<length<=8192:return self.respond(413,{'error':'Слишком большой запрос'})
        # Only the loopback Caddy proxy is trusted. The last XFF entry is the
        # direct visitor added by Caddy, not an arbitrary client-supplied prefix.
        remote=self.client_address[0]
        if ipaddress.ip_address(remote).is_loopback:
            candidate=self.headers.get('X-Forwarded-For','').split(',')[-1].strip()
            try:remote=str(ipaddress.ip_address(candidate))
            except ValueError:pass
        now=time.monotonic()
        with self.server.failure_lock:
            if len(self.server.public_requests)>2000:
                self.server.public_requests={k:v for k,v in self.server.public_requests.items() if v and now-v[-1]<3600}
            requests=[t for t in self.server.public_requests.get(remote,[]) if now-t<3600]
            if len(requests)>=5:
                return self.respond(429,{'error':'Слишком много обращений. Позвоните в MAINHALL или повторите позже.'},extra={'Retry-After':'3600'})
            self.server.public_requests[remote]=requests+[now]
        try:
            data=json.loads(self.rfile.read(length))
            self.server.store.public_lead(data)
            self.respond(202,{'ok':True})
        except (ValueError,UnicodeDecodeError):
            self.respond(400,{'error':'Укажите имя, корректный телефон и согласие на обработку обращения'})
        except sqlite3.Error:
            self.respond(503,{'error':'Не удалось отправить обращение. Позвоните в MAINHALL или повторите позже.'})


def main():
    os.umask(0o077)
    parser=argparse.ArgumentParser();parser.add_argument('--bootstrap',action='store_true');parser.add_argument('--data',default=os.environ.get('MAINHALL_CRM_DATA','/var/lib/mainhall-crm'))
    args=parser.parse_args();store=Store(args.data)
    if args.bootstrap:
        store.bootstrap();return
    origin=os.environ.get('MAINHALL_CRM_ORIGIN','https://main-hall.ru')
    server=CRMServer(('127.0.0.1',8791),store,origin)
    server.serve_forever()

if __name__=='__main__':main()
