"""CRM contracts: authentication, isolation, CSRF, persistence, export safety."""
import base64
import http.client
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import threading
import unittest

MODULE=Path(__file__).resolve().parents[1]/'ops/crm/server.py'
spec=importlib.util.spec_from_file_location('mainhall_crm',MODULE)
crm=importlib.util.module_from_spec(spec);spec.loader.exec_module(crm)


def lead(**changes):
    return {'full_name':'Тестовый клиент','phone':'+7 (926) 123-45-67','project':'',
            'budget_rub':None,'deadline':'','purpose':'Для жизни','comment':'',
            'list_name':'Основной','status':'new',**changes}


class CRMTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.store=crm.Store(self.temp.name)
        self.assertTrue(self.store.bootstrap())
        self.credentials=json.loads((Path(self.temp.name)/'initial-access.json').read_text())
        self.admin=self.store.user('mainhall-admin')
        self.first=self.store.create_user(self.admin,{'id':'operator-1','name':'Первый'})
        self.second=self.store.create_user(self.admin,{'id':'operator-2','name':'Второй'})
        self.server=crm.CRMServer(('127.0.0.1',0),self.store,'https://main-hall.ru')
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()

    def tearDown(self):
        self.server.shutdown();self.server.server_close();self.thread.join();self.temp.cleanup()

    def request(self,path,method='GET',data=None,user=None,origin='https://main-hall.ru',headers=None):
        if user is None:user=self.first
        hdr={'Content-Type':'application/json','Origin':origin,'Sec-Fetch-Site':'same-origin'}
        if user:
            username=user.get('id',user.get('username'));password=user['password']
            hdr['Authorization']='Basic '+base64.b64encode((username+':'+password).encode()).decode()
        hdr.update(headers or {})
        connection=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=5)
        body=json.dumps(data) if data is not None else None
        connection.request(method,path,body,hdr);response=connection.getresponse();raw=response.read();status=response.status;result_headers=dict(response.getheaders());connection.close()
        return status,json.loads(raw) if result_headers.get('Content-Type','').startswith('application/json') else raw,result_headers

    def test_bootstrap_private_idempotent_no_plaintext_in_database(self):
        self.assertFalse(self.store.bootstrap())
        credential=Path(self.temp.name)/'initial-access.json'
        self.assertEqual(stat.S_IMODE(credential.stat().st_mode),0o600)
        self.assertEqual(stat.S_IMODE(self.store.path.stat().st_mode),0o600)
        self.assertNotIn(self.credentials['password'].encode(),self.store.path.read_bytes())
        self.assertTrue(crm.verify_password(self.credentials['password'],self.admin['password_hash']))
        self.assertFalse(crm.verify_password('wrong',self.admin['password_hash']))

    def test_authentication_and_private_headers(self):
        status,_,headers=self.request('/office/',user=False)
        self.assertEqual(status,401);self.assertIn('WWW-Authenticate',headers)
        status,html,headers=self.request('/office/')
        self.assertEqual(status,200);self.assertIn('Новый клиент'.encode(),html)
        self.assertEqual(headers['Cache-Control'],'no-store')
        self.assertIn('noindex',headers['X-Robots-Tag'])
        self.assertEqual(headers['X-Frame-Options'],'DENY')

    def test_operator_isolation_read_update_export_and_spoofing(self):
        status,result,_=self.request('/office/api/leads','POST',lead(comment='Первый оператор'))
        self.assertEqual(status,201);lead_id=result['id']
        status,rows,_=self.request('/office/api/leads?operator=operator-1',user=self.second)
        self.assertEqual(status,200);self.assertEqual(rows,[])
        status,_,_=self.request(f'/office/api/leads/{lead_id}','PUT',lead(comment='Чужая правка'),user=self.second)
        self.assertEqual(status,404)
        status,csv,_=self.request('/office/api/export.csv?operator=operator-1',user=self.second)
        self.assertEqual(status,200);self.assertNotIn('Первый оператор'.encode(),csv)
        status,_,_=self.request('/office/api/leads','POST',lead(operator_id='operator-2'))
        self.assertEqual(status,400)
        status,rows,_=self.request('/office/api/leads',user=self.credentials)
        self.assertEqual(status,200);self.assertEqual(rows[0]['operator_id'],'operator-1')

    def test_csrf_content_type_and_body_validation(self):
        for origin in ('https://evil.example','null',''):
            status,_,_=self.request('/office/api/leads','POST',lead(),origin=origin)
            self.assertEqual(status,403)
        status,_,_=self.request('/office/api/leads','POST',lead(),headers={'Sec-Fetch-Site':'cross-site'})
        self.assertEqual(status,403)
        status,_,_=self.request('/office/api/leads','POST',lead(),headers={'Content-Type':'text/plain'})
        self.assertEqual(status,415)
        for data in (lead(phone='abc'),lead(budget_rub=3.14),lead(budget_rub=True),lead(status='sold'),lead(comment='x'*4001),lead(full_name='')):
            status,_,_=self.request('/office/api/leads','POST',data)
            self.assertEqual(status,400)
        status,_,_=self.request('/office/api/leads','POST',lead(comment='x'*18000))
        self.assertEqual(status,413)
        self.assertEqual(self.store.leads(self.admin),[])

    def test_persistence_audit_and_safe_csv(self):
        status,result,_=self.request('/office/api/leads','POST',lead(full_name='=1+1',comment='<script>alert(1)</script>',list_name='Список А'))
        self.assertEqual(status,201)
        status,_,_=self.request('/office/api/leads/'+str(result['id']),'PUT',lead(full_name='=1+1',comment='Обновлено',list_name='Список А',budget_rub=30_000_000))
        self.assertEqual(status,200)
        reopened=crm.Store(self.temp.name);rows=reopened.leads(self.store.user('operator-1'))
        self.assertEqual(rows[0]['comment'],'Обновлено');self.assertEqual(rows[0]['budget_rub'],30_000_000)
        self.assertEqual(rows[0]['phone'],'+79261234567')
        with reopened.connect() as db:
            audits=[dict(r) for r in db.execute('SELECT * FROM audit WHERE lead_id=? ORDER BY id',(result['id'],))]
        self.assertEqual([r['action'] for r in audits],['create','update'])
        self.assertEqual(audits[0]['actor_id'],'operator-1')
        status,csv,_=self.request('/office/api/export.csv')
        self.assertEqual(status,200);self.assertIn(b"'=1+1",csv)

    def test_only_admin_creates_operator_and_password_is_one_time(self):
        status,_,_=self.request('/office/api/operators','POST',{'id':'new-operator','name':'Новый'})
        self.assertEqual(status,403)
        status,result,_=self.request('/office/api/operators','POST',{'id':'new-operator','name':'Новый'},user=self.credentials)
        self.assertEqual(status,201);self.assertGreaterEqual(len(result['password']),24)
        status,operators,_=self.request('/office/api/operators',user=self.credentials)
        self.assertEqual(status,200)
        self.assertTrue(all('password' not in r and 'password_hash' not in r for r in operators))
        status,user,_=self.request('/office/api/me',user=result)
        self.assertEqual(status,200);self.assertEqual(user['id'],'new-operator')

    def test_public_enquiry_persists_consent_and_admin_assignment(self):
        payload={'name':'Обращение с сайта','phone':'+79261234567','context':'HIGH LIFE','comment':'Нужна квартира','consent':True,'website':''}
        status,data,_=self.request('/api/enquiry','POST',payload,user=False)
        self.assertEqual(status,202);self.assertEqual(data,{'ok':True})
        self.assertEqual(self.store.leads(self.store.user('operator-1')),[])
        rows=self.store.leads(self.admin);self.assertEqual(len(rows),1)
        row=rows[0];self.assertEqual(row['origin'],'website');self.assertIsNotNone(row['consent_at'])
        self.assertEqual(row['operator_id'],'mainhall-admin')
        status,_,_=self.request('/office/api/leads/'+str(row['id'])+'/assign','POST',{'operator_id':'operator-1'},user=self.second)
        self.assertEqual(status,403)
        status,_,_=self.request('/office/api/leads/'+str(row['id'])+'/assign','POST',{'operator_id':'operator-1'},user=self.credentials)
        self.assertEqual(status,200)
        self.assertEqual(len(self.store.leads(self.store.user('operator-1'))),1)
        status,_,_=self.request('/api/enquiry')
        self.assertEqual(status,405)

    def test_public_enquiry_csrf_validation_honeypot_and_rate_limit(self):
        payload={'name':'Клиент','phone':'+79261234567','context':'Проект','comment':'','consent':True,'website':''}
        status,_,_=self.request('/api/enquiry','POST',payload,user=False,origin='https://evil.example')
        self.assertEqual(status,403)
        status,_,_=self.request('/api/enquiry','POST',{**payload,'consent':False},user=False)
        self.assertEqual(status,400)
        status,_,_=self.request('/api/enquiry','POST',{**payload,'phone':'abc'},user=False)
        self.assertEqual(status,400)
        status,_,_=self.request('/api/enquiry','POST',{**payload,'website':'spam'},user=False)
        self.assertEqual(status,202);self.assertEqual(self.store.leads(self.admin),[])
        for _ in range(2):
            status,_,_=self.request('/api/enquiry','POST',payload,user=False)
            self.assertEqual(status,202)
        status,_,_=self.request('/api/enquiry','POST',payload,user=False)
        self.assertEqual(status,429)
        self.assertEqual(len(self.store.leads(self.admin)),2)

    def test_password_change_requires_current_password_invalidates_old_and_has_no_secret_audit(self):
        new='A-new-strong-password-2026'
        for payload in ({'current_password':'wrong','new_password':new},
                        {'current_password':self.first['password'],'new_password':'short'},
                        {'current_password':self.first['password'],'new_password':new,'id':'operator-2'}):
            status,_,_=self.request('/office/api/password','POST',payload)
            self.assertEqual(status,400)
        status,data,_=self.request('/office/api/password','POST',{'current_password':self.first['password'],'new_password':new})
        self.assertEqual(status,200);self.assertEqual(data,{'ok':True})
        status,_,_=self.request('/office/api/me')
        self.assertEqual(status,401)
        status,_,_=self.request('/office/api/me',user={**self.first,'password':new})
        self.assertEqual(status,200)
        with self.store.connect() as db:
            rows=[dict(r) for r in db.execute("SELECT * FROM audit WHERE action='change_password'")]
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['actor_id'],'operator-1')
        self.assertEqual(rows[0]['details'],'{}')
        self.assertNotIn(new,json.dumps(rows))

if __name__=='__main__':unittest.main()
