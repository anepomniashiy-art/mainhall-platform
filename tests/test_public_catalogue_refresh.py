import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
h=module('highlife_refresh','import-highlife-catalogue.py')
s=module('stone_refresh','import-stone-catalogue.py')
g=module('granelle_refresh','import-granelle-catalogue.py')

class RefreshTests(unittest.TestCase):
    def highlife(self,status='Продажа'):
        return {'id':12,'type':'Квартира','status':status,'price':20000000,'price_discount':18000000,'square':40,'num':'12','floor':4,'rooms':2,'plan':'/plans/12.svg'}
    def test_highlife_reserved_not_published(self):
        data={'flats':[self.highlife(),{**self.highlife('Резерв'),'id':13}]}
        rows=h.normalize(data,'2026-11-05T07:00:00Z','hash')
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['priceRub'],18000000)
        self.assertEqual(rows[0]['availabilityRaw'],'Продажа')
    def test_highlife_duplicate_rejected(self):
        with self.assertRaises(ValueError):h.normalize({'flats':[self.highlife(),self.highlife()]},'date','hash')
    def test_highlife_missing_price_not_zero(self):
        row={**self.highlife(),'price':None,'price_discount':None}
        with self.assertRaises(ValueError):h.normalize({'flats':[row]},'date','hash')
    def stone(self):
        return {'id':123,'project':{'strapi_slug':'blik'},'show_price_flg':True,'selling_price':20000000,'area':'40.5','type':10,'slug':'a-123','rooms_count':2,'bedrooms_count':1}
    def test_stone_hidden_price_excluded(self):
        self.assertIsNone(s.normalize({**self.stone(),'show_price_flg':False},'blik',{},'date'))
    def test_stone_wrong_project_rejected(self):
        with self.assertRaises(ValueError):s.normalize(self.stone(),'sokolniki',{},'date')
    def test_stone_plan_and_explicit_price(self):
        row=s.normalize({**self.stone(),'interior_plan_img':'https://storage.mwsapis.ru/plan.jpg'},'blik',{'url':'catalogue','sha256':'hash','statePath':'model'},'date')
        self.assertEqual(row['priceRub'],20000000);self.assertEqual(row['areaSqm'],40.5)
        self.assertEqual(row['planImageUrl'],'https://storage.mwsapis.ru/plan.jpg')
        self.assertEqual(row['sourceUrl'],'https://stone.ru/catalog/residential/blik/a-123')

class GranelleRefreshTests(unittest.TestCase):
    def test_visible_card_price_not_mortgage_payment(self):
        html='<a href="/flats/mypriority-mnevniki/12"><h2>Студия 28.36 м<sup>2</sup></h2><span class="priceLabel_abc">от 17 302 490 ₽</span><p>Ипотека от 68 462 ₽/мес.</p><img src="https://storage.yandexcloud.net/granelleprod/media/properties/property/plan/12.svg"><p>Без отделки этаж 2 из 39 IV кв. 2028</p></a>'
        rows=g.normalize(html,'mypriority-mnevniki','https://www.granelle.ru/flats/?project=mypriority-mnevniki','date')
        self.assertEqual(rows[0]['priceRub'],17302490);self.assertEqual(rows[0]['rooms'],1)
        self.assertEqual(rows[0]['bedrooms'],0);self.assertEqual(rows[0]['floor'],2)
        self.assertEqual(rows[0]['completionYear'],2028)
    def test_project_aggregate_does_not_create_apartments(self):
        with self.assertRaises(ValueError):g.normalize('<p>100 квартир от 15 млн</p>','triniti','url','date')

if __name__=='__main__':unittest.main()
