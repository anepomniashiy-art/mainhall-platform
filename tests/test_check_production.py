import importlib.util, unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("check_production", Path(__file__).resolve().parents[1] / "scripts" / "check-production.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

LEGACY = '<h1>Инвестиции в коммерческую недвижимость Москвы</h1><img src="/legacy-mainhall/assets/a.jpg">'


class ReleaseGateContent(unittest.TestCase):
    def test_modern_home(self):
        self.assertTrue(gate.evaluate("modern", '<a href="/districts/"></a><a href="/analytics/"></a> раньше рынка')[0])
        self.assertFalse(gate.evaluate("modern", "Инвестируйте в центр Москвы")[0])

    def test_projects_threshold(self):
        body = "".join('<a href="/projects/p%d/">' % i for i in range(98)) + '<a href="/projects/p1/">'
        ok, detail = gate.evaluate("projects", body, 90)
        self.assertTrue(ok)
        self.assertIn("98 project links", detail)
        self.assertFalse(gate.evaluate("projects", body, 99)[0])

    def test_commercial_catalogue_requires_link_to_preserved_legacy(self):
        catalogue = "<title>Коммерческая недвижимость Sminex в Москве</title>"
        self.assertFalse(gate.evaluate("commercial", catalogue)[0])
        self.assertTrue(gate.evaluate("commercial", catalogue + '<a href="/commercial/strategy/">')[0])

    def test_legacy_commercial_document(self):
        self.assertTrue(gate.evaluate("legacy", LEGACY)[0])
        self.assertFalse(gate.evaluate("legacy", "<h1>Инвестиции в коммерческую недвижимость Москвы</h1>")[0])

    def test_redirect_must_be_permanent_to_canonical_https(self):
        self.assertTrue(gate.redirect_ok(301, "https://main-hall.ru/projects/", "/projects/"))
        self.assertTrue(gate.redirect_ok(308, "https://main-hall.ru/", "/"))
        self.assertFalse(gate.redirect_ok(302, "https://main-hall.ru/", "/"))
        self.assertFalse(gate.redirect_ok(301, "https://www.main-hall.ru/", "/"))
        self.assertFalse(gate.redirect_ok(200, None, "/"))


if __name__ == "__main__":
    unittest.main()
