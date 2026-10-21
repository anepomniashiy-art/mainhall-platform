import importlib.util
import json
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('adapters',Path(__file__).parents[1]/'scripts/adapt-official-units.py')
adapters=importlib.util.module_from_spec(spec);spec.loader.exec_module(adapters)
WHEN='2026-10-21T10:00:00+00:00'

def highlife(unit,similar=None):
    query={'endpointName':'getFlatById','originalArgs':{'id':'405'},'data':{'data':unit,'similar':similar or []}}
    data={'props':{'pageProps':{'initialState':{'api':{'queries':{'getFlatById(405)':query}}}}}}
    return '<script id="__NEXT_DATA__" type="application/json">'+json.dumps(data)+'</script>'

def stone(unit):
    model=['$','provider',None,{'value':{'lot':unit}}]
    flight='1d:'+json.dumps(model)+'\n'
    return '<script>self.__next_f.push('+json.dumps([1,flight])+')</script>'

class UnitAdapterTests(unittest.TestCase):
    def test_highlife_exact_id_and_numeric_offer_not_title(self):
        unit={'id':405,'square':148.2,'price':140790000,'price_discount':140790000,'rooms':3,'floor':24,'num':'2/146'}
        rows=adapters.extract(highlife(unit)+'<title>1 рубль</title>','https://highlife.ru/flats/405',WHEN)
        self.assertEqual(rows[0]['priceRub'],140790000)
        self.assertEqual(rows[0]['sourceId'],'405')
        self.assertIn('data.data',rows[0]['proof']['statePath'])
        self.assertEqual(adapters.extract(highlife(unit),'https://highlife.ru/flats/999',WHEN),[])

    def test_stone_uses_selling_price_and_preserves_base_price(self):
        unit={'id':13805,'slug':'a-157','project':{'strapiSlug':'blik'},'area':'89.10','showPriceFlg':True,'sellingPrice':50693891,'sellingPriceBeforeDiscount':53361990,'roomsCount':3,'bedroomsCount':3,'isDecoration':False}
        row=adapters.extract(stone(unit),'https://stone.ru/catalog/residential/blik/a-157',WHEN)[0]
        self.assertEqual((row['priceRub'],row['priceBeforeDiscountRub']),(50693891,53361990))
        self.assertEqual(row['salesStatus'],'UNKNOWN')
        self.assertEqual(row['proof']['fields']['priceRub'],'sellingPrice')

    def test_hidden_price_or_wrong_project_is_not_published(self):
        unit={'id':1,'slug':'a-157','project':{'strapiSlug':'blik'},'area':'89.10','showPriceFlg':False,'sellingPrice':50693891}
        self.assertEqual(adapters.extract(stone(unit),'https://stone.ru/catalog/residential/blik/a-157',WHEN),[])
        unit['showPriceFlg']=True
        self.assertEqual(adapters.extract(stone(unit),'https://stone.ru/catalog/residential/sokolniki/a-157',WHEN),[])

    def test_similar_units_are_opt_in_and_preserve_original_evidence_url(self):
        unit={'id':405,'square':148.2,'price':140790000,'rooms':3,'floor':24,'num':'2/146'}
        other={'id':650,'square':148.3,'price':140885000,'rooms':3,'floor':32,'num':'3/243'}
        html=highlife(unit,[other]);url='https://highlife.ru/flats/405'
        self.assertEqual(len(adapters.extract(html,url,WHEN)),1)
        rows=adapters.extract(html,url,WHEN,True)
        self.assertEqual(len(rows),2)
        self.assertEqual(rows[1]['sourceUrl'],url)
        self.assertEqual(rows[1]['detailUrl'],'https://highlife.ru/flats/650')
        self.assertIn('.similar[0]',rows[1]['proof']['statePath'])

    def test_stone_studio_is_not_a_one_bedroom(self):
        unit={'id':42,'slug':'c-006','project':{'strapiSlug':'sokolniki'},'area':'32.60','showPriceFlg':True,'sellingPrice':20139791,'roomsCount':1,'bedroomsCount':0}
        row=adapters.extract(stone(unit),'https://stone.ru/catalog/residential/sokolniki/c-006',WHEN)[0]
        self.assertEqual(row['unitType'],'studio')
        self.assertEqual(row['bedrooms'],0)

    def test_plan_media_rejects_other_hosts_and_html(self):
        for url in ['https://evil.com/a.png','http://highlife.ru/a.png','https://user:pass@highlife.ru/a.png']:
            with self.assertRaises(ValueError):adapters.plan_url(url)
        with self.assertRaises(ValueError):adapters.raster_extension(b'<html>Not a plan</html>','image/png')

    def test_wrong_host_and_arbitrary_js_are_not_evaluated(self):
        unit={'id':405,'square':148.2,'price':140790000,'num':'2/146'}
        self.assertEqual(adapters.extract(highlife(unit),'https://other.com/flats/405',WHEN),[])
        self.assertEqual(adapters.extract('<script>self.__next_f.push(fetch("/"))</script>','https://stone.ru/catalog/residential/blik/a-157',WHEN),[])

if __name__=='__main__':unittest.main()
