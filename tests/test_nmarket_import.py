"""Completeness contracts for the authorised, unfiltered 19 November snapshot."""
import hashlib
import gzip
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

def load(name):
    file=ROOT/'data/catalogue'/name
    return json.loads(file.read_text() if file.exists() else gzip.decompress(file.with_name(name+'.gz').read_bytes()).decode())

class NmarketImportTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.units = load('nmarket-units.json')['units']
        cls.projects = load('nmarket-projects.json')['projects']
        cls.media = load('nmarket-media.json')['images']
        cls.audit = load('nmarket-import-audit.json')

    def test_full_authorised_snapshot_without_price_filter(self):
        self.assertEqual(20282, len(self.units))
        self.assertEqual(144, len(self.projects))
        self.assertEqual(27420, len(self.media))
        self.assertEqual(27421, self.audit['uniqueImages'])
        self.assertEqual(1, self.audit['unavailableImages'])
        self.assertEqual(0, self.audit['omittedImages'])
        self.assertEqual(160871, self.audit['imageReferences'])
        self.assertEqual('4c5cfe49de5aadf418c3cec244f1bf80928edce84c2d127ac86c20ae941b9ee9', self.audit['sourceSha256'])
        self.assertEqual(0, self.audit['unresolvedImages'])
        self.assertTrue(any(u['pricePerSqm'] and u['pricePerSqm'] < 400000 for u in self.units))
        self.assertEqual(18, sum(u['location'].get('locality-name') == 'Обнинск' for u in self.units))

    def test_identity_and_all_projects_have_property_pages(self):
        slugs = {p['slug'] for p in self.projects}
        self.assertEqual(len(slugs), len(self.projects))
        self.assertEqual(len(self.units), len({u['id'] for u in self.units}))
        self.assertEqual(slugs, {u['projectSlug'] for u in self.units})
        self.assertTrue(all(u['unitNumber'] for u in self.units))
        self.assertTrue(all(p['addresses'] and p['descriptionRefs'] and p['buildings'] for p in self.projects))
        self.assertTrue(all(p['slug'] in load('nmarket-dossiers.json') for p in self.projects))

    def test_every_referenced_original_is_local_and_unchanged(self):
        referenced = {i['url'] for u in self.units for i in u['images']}
        self.assertEqual(referenced, {i['src'] for i in self.media})
        self.assertEqual(self.audit['mediaBytes'], sum(i['bytes'] for i in self.media))
        for image in self.media:
            with self.subTest(src=image['src']):
                path = ROOT/'public'/image['src'].lstrip('/')
                self.assertTrue(path.is_file())
                self.assertEqual(image['bytes'], path.stat().st_size)
                with path.open('rb') as source:
                    self.assertEqual(image['sha256'], hashlib.file_digest(source, 'sha256').hexdigest())
                self.assertGreater(image['width'], 0)
                self.assertGreater(image['height'], 0)

    def test_private_source_contacts_are_not_public_data(self):
        text = json.dumps(self.units,ensure_ascii=False)
        for marker in ['sales-agent', 'ecatalog-service.nmarket.pro', 'password=', 'login=']:
            self.assertNotIn(marker, text)
        self.assertFalse((ROOT/'public/data/private').exists())

if __name__ == '__main__':
    unittest.main()
