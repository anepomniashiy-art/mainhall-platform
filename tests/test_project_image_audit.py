import hashlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit_project_images',ROOT/'scripts/audit-project-images.py')
module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)

class ProjectImageAuditTest(unittest.TestCase):
    def test_committed_audit_matches_registries(self):
        committed=json.loads((ROOT/'data/provenance/project-photo-missing-audit.json').read_text())
        self.assertEqual(committed,module.build_audit())

    def test_every_collected_cover_is_a_local_image(self):
        collected=json.loads((ROOT/'data/catalogue/collected-project-images.json').read_text())
        for slug,entry in collected.items():
            with self.subTest(slug=slug):
                path=ROOT/'public'/entry['src'].lstrip('/')
                self.assertTrue(path.is_file(),path)
                head=path.read_bytes()[:12]
                self.assertTrue(head.startswith((b'\xff\xd8\xff',b'\x89PNG\r\n\x1a\n',b'RIFF')),path)

    def test_new_official_assets_match_provenance_hashes(self):
        pack=json.loads((ROOT/'data/provenance/official-project-images-2026-11-06.json').read_text())
        self.assertEqual(63,len(pack['images']))
        for image in pack['images']:
            with self.subTest(src=image['src']):
                path=ROOT/'public'/image['src'].lstrip('/')
                self.assertEqual(image['sha256'],hashlib.sha256(path.read_bytes()).hexdigest())
                self.assertTrue(image['sourceAssetUrl'].startswith('https://'))
                self.assertTrue(image['sourcePageUrl'].startswith('https://'))
                self.assertEqual('verified',image['status'])

if __name__=='__main__': unittest.main()
