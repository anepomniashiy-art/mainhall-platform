import unittest, json, pathlib, re
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PortfolioTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.manifest=json.loads((ROOT/'data/catalogue/sminex-portfolio.json').read_text())
  cls.projects=cls.manifest['projects']
 def test_complete_portfolio_and_unique_canonicals(self):
  self.assertEqual(len(self.projects),30)
  self.assertEqual(len({p['slug'] for p in self.projects}),30)
  self.assertIn('lavrushinsky',{p['slug'] for p in self.projects})
  self.assertNotIn('lavrushinskiy',{p['slug'] for p in self.projects})
  self.assertTrue(all(re.fullmatch('[a-z0-9-]+',p['slug']) for p in self.projects))
 def test_residential_and_commercial_stay_distinct(self):
  self.assertEqual(sum(p['propertyType']=='residential' for p in self.projects),19)
  self.assertEqual(sum(p['propertyType']=='mixed_residential_commercial' for p in self.projects),2)
  self.assertEqual(sum(p['propertyType']=='commercial' for p in self.projects),9)
  self.assertEqual(sum('editorial' in p for p in self.projects),21)
 def test_sources_dates_and_truthful_inventory_flags(self):
  for p in self.projects:
   self.assertTrue(p['addressOfficial'])
   self.assertEqual(p['sourceCheckedAt'],'2026-10-21')
   self.assertFalse(p['priceVerified'])
   self.assertFalse(p['unitInventoryVerified'])
   self.assertTrue(p['galleryImages'][0]['url'].startswith('https://'))
 def test_all_local_images_have_verified_provenance(self):
  records=json.loads((ROOT/'data/provenance/sminex-images.json').read_text())
  self.assertEqual(len(records),30)
  byslug={r['slug']:r for r in records}
  for p in self.projects:
   record=byslug[p['slug']]
   self.assertEqual(record['sourceUrl'],p['galleryImages'][0]['url'])
   path=ROOT/'public'/p['localImage'].lstrip('/')
   with Image.open(path) as im:
    self.assertEqual(im.format,'WEBP')
    self.assertLessEqual(im.width,1600)
    self.assertGreater(im.width,200)
   self.assertEqual(record['photographVsRender'],'not_verified')
 def test_individual_editorial_copy_and_existing_lavrushinsky_preserved(self):
  summaries=[p['editorial']['summary'] for p in self.projects if 'editorial' in p]
  self.assertEqual(len(set(summaries)),21)
  source=(ROOT/'src/lib/editorial-projects.ts').read_text()
  self.assertEqual(source.count('slug:"lavrushinsky"'),1)
  self.assertIn('else editorialProjects.push(entry)',source)
  self.assertIn('1,4 га',source)
if __name__=='__main__':unittest.main()
