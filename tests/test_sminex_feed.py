import importlib.util,pathlib,unittest
spec=importlib.util.spec_from_file_location('sminex',pathlib.Path(__file__).parents[1]/'scripts/import-sminex.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def xml(extra='',category='office',price='24510000',sid='001'):
 return ('<realty-feed><generation-date>2026-10-26T13:00:01</generation-date><offer internal-id="'+sid+'"><building-name>Мануфактура XIX</building-name><property-type>Коммерческая</property-type><category>'+category+'</category><price><value>'+price+'</value><currency>RUR</currency></price><area><value>56.2</value></area><floor>3</floor><description>Звоните застройщику +7 000; лучший офис!</description><sales-agent><email>private@example.com</email></sales-agent><image tag="plan">https://feeds.sminex.com/p.jpg</image>'+extra+'</offer></realty-feed>').encode()
class ImportTest(unittest.TestCase):
 def test_commercial_not_flat(self):
  a=m.normalize(xml());u=a['units'][0];self.assertEqual((u['category'],u['propertyType']),('office','commercial'));self.assertEqual(u['sourceId'],'001');self.assertEqual(u['priceRub'],24510000);self.assertNotIn('Звоните',u['description']);self.assertNotIn('private@example.com',str(a));self.assertEqual(u['salesStatus'],'IN_FEED')
 def test_unknown_type_fails(self):
  with self.assertRaises(ValueError):m.normalize(xml(category='unrecognized'))
 def test_zero_price_not_free(self):self.assertIsNone(m.normalize(xml(price='0'))['units'][0]['priceRub'])
 def test_cian_enrich_not_override_type(self):
  c=b'<feed><object><ExternalId>001</ExternalId><Category>newBuildingFlatSale</Category><BedroomsCount>2</BedroomsCount><Booking><Status>free</Status></Booking></object></feed>';u=m.normalize(xml(),c)['units'][0];self.assertEqual(u['category'],'office');self.assertEqual(u['bedrooms'],2);self.assertEqual(u['bookingStatusRaw'],'free')
 def test_plan_url_dedup(self):self.assertEqual(len(m.normalize(xml('<image tag="plan">https://feeds.sminex.com/p.jpg</image>'))['units'][0]['images']),1)
 def test_duplicate_conflict_fails(self):
  raw=xml().decode().replace('</realty-feed>',xml(price='5').decode().split('<offer')[1].split('</realty-feed>')[0].join(['<offer',''])+'</realty-feed>')
  with self.assertRaises(ValueError):m.normalize(raw.encode())
 def test_ancillary_separate(self):self.assertEqual(m.classify('parking','Коммерческая'),('parking','ancillary'));self.assertEqual(m.classify('storage','Коммерческая'),('storage','ancillary'))
if __name__=='__main__':unittest.main()
