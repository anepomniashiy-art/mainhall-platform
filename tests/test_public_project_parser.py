import importlib.util
import json
import unittest
import urllib.request
from pathlib import Path

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect-public-projects.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
CONFIG = {'slug': 'example', 'url': 'https://example.com/project', 'allowedHosts': ['example.com'], 'allowedMediaHosts': ['example.com', 'cdn.example.com']}


def html(node, extra=''):
    return '<html><title>Example</title><script type="application/ld+json">' + json.dumps(node) + '</script>' + extra + '</html>'


class PublicProjectParserTests(unittest.TestCase):
    def test_project_aggregate_stays_project_not_unit(self):
        result = collector.parse_page(html({'@type': 'ApartmentComplex', 'offers': {'@type': 'AggregateOffer', 'lowPrice': '42000000', 'highPrice': '180000000', 'priceCurrency': 'RUB'}}), CONFIG)
        self.assertEqual(result['projectPriceFromRub'], 42000000)
        self.assertEqual(result['units'], [])
        self.assertEqual(result['projectPriceEvidence'][0]['basis'], 'aggregate_low_price')

    def test_ranges_and_plain_text_never_become_numeric_price(self):
        result = collector.parse_page(html({'@type': 'ApartmentComplex', 'offers': {'@type': 'Offer', 'price': '42–55 млн', 'priceCurrency': 'RUB'}}, '<p>От 42 000 000 ₽, доходность 25%</p><script>price=42000000</script>'), CONFIG)
        self.assertIsNone(result['projectPriceFromRub'])
        self.assertEqual(result['units'], [])

    def test_missing_and_foreign_currency_remain_null(self):
        for offer in [{}, {'@type': 'Offer', 'price': '300000', 'priceCurrency': 'USD'}, {'@type': 'Offer', 'price': '42000000'}]:
            with self.subTest(offer=offer):
                result = collector.parse_page(html({'@type': 'ApartmentComplex', 'offers': offer}), CONFIG)
                self.assertIsNone(result['projectPriceFromRub'])

    def test_apartment_requires_id_area_and_single_direct_offer(self):
        unit = {'@type': 'Apartment', 'identifier': 'A-17', 'floorSize': {'value': 72.5, 'unitCode': 'MTK'}, 'offers': {'@type': 'Offer', 'price': '62000000', 'priceCurrency': 'RUB', 'availability': 'https://schema.org/InStock'}}
        result = collector.parse_page(html({'@graph': [unit]}), CONFIG)
        self.assertEqual(result['units'][0]['priceRub'], 62000000)
        self.assertEqual(result['units'][0]['salesStatus'], 'UNKNOWN')
        self.assertIsNone(result['projectPriceFromRub'])
        for removed in ['identifier', 'floorSize', 'offers']:
            copy = dict(unit)
            copy.pop(removed)
            self.assertEqual(collector.parse_page(html(copy), CONFIG)['units'], [])

    def test_unit_aggregate_never_used_as_single_apartment_price(self):
        node = {'@type': 'Apartment', 'identifier': 'A-1', 'floorSize': {'value': 55, 'unitCode': 'MTK'}, 'offers': {'@type': 'AggregateOffer', 'lowPrice': 30000000, 'priceCurrency': 'RUB'}}
        result = collector.parse_page(html(node), CONFIG)
        self.assertEqual(result['units'], [])
        self.assertIsNone(result['projectPriceFromRub'])

    def test_unrelated_organization_offer_not_project_price(self):
        node = {'@type': 'Organization', 'offers': {'@type': 'Offer', 'price': 1000, 'priceCurrency': 'RUB'}}
        self.assertIsNone(collector.parse_page(html(node), CONFIG)['projectPriceFromRub'])

    def test_metadata_media_provenance_and_allowlist(self):
        extra = '<meta name="description" content="Описание"><meta property="og:image" content="https://cdn.example.com/photo.jpg"><meta property="og:image" content="https://other.com/photo.jpg">'
        result = collector.parse_page(html({}, extra), CONFIG, collected_at='2026-10-21T00:00:00+00:00')
        self.assertEqual(result['description'], 'Описание')
        self.assertEqual(len(result['media']), 1)
        self.assertEqual(result['media'][0]['sourceUrl'], CONFIG['url'])

    def test_arbitrary_and_private_domains_rejected(self):
        for url in ['https://evil.com/x', 'http://127.0.0.1/x', 'file:///etc/passwd', 'https://user:pass@example.com/']:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    collector.safe_url(url, ['example.com', '127.0.0.1'])

    def test_redirect_cannot_escape_allowlist(self):
        handler = collector.RestrictedRedirect(['example.com'])
        request = urllib.request.Request(CONFIG['url'])
        with self.assertRaises(ValueError):
            handler.redirect_request(request, None, 302, 'Found', {}, 'https://other.com/project')

    def test_broken_json_ld_still_preserves_og_metadata(self):
        result = collector.parse_page('<script type="application/ld+json">{broken}</script><meta property="og:title" content="Project">', CONFIG)
        self.assertEqual(result['title'], 'Project')
        self.assertTrue(result['warnings'])
        self.assertIsNone(result['projectPriceFromRub'])

    def test_lumin_adapter_requires_one_complete_official_card(self):
        config = dict(CONFIG, adapter='lumin-apartment-cards')
        card = '''<div class="apartment-card">
          <h3 class="apartment-card__title">АПАРТАМЕНТ 7.9</h3>
          <p class="apartment-card__type">2 спальни</p>
          <img class="apartment-card__slide-img" src="/plans/7.9.png">
          <div class="apartment-card__text"><p>Этаж: 7</p><p>Площадь: 111,5 м²</p><p>Отделка: White box max</p></div>
          <div class="apartment-card__price-wrap"><span>Стоимость лота, ₽:</span>
            <div class="apartment-card__price"><p>126 552 500</p><strike>158 190 625</strike></div>
          </div><a class="download-link" href="/docs/7.9.pdf">Скачать PDF</a>
        </div>'''
        unit = collector.parse_page(card, config)['units'][0]
        self.assertEqual(unit['sourceId'], '7.9')
        self.assertEqual(unit['priceRub'], 126552500)
        self.assertEqual(unit['priceBeforeDiscountRub'], 158190625)
        self.assertEqual(unit['areaSqm'], 111.5)
        self.assertEqual(unit['bedrooms'], 2)
        self.assertEqual(unit['floor'], 7)
        self.assertEqual(unit['planImageUrl'], 'https://example.com/plans/7.9.png')
        self.assertEqual(collector.parse_page(card.replace('126 552 500', ''), config)['units'], [])

    def test_safe_url_encodes_official_unicode_media_path(self):
        url = collector.safe_url('https://example.com/планы/вид 1.png', ['example.com'])
        self.assertEqual(url, 'https://example.com/%D0%BF%D0%BB%D0%B0%D0%BD%D1%8B/%D0%B2%D0%B8%D0%B4%201.png')

    def test_level_adapter_resolves_only_complete_matching_nuxt_units(self):
        state = [None, {"price": 2, "area": 3, "number": 4, "room": 5, "floor": 6,
                        "plan": 7, "status": 8, "project": 9},
                 15672173, 28.7, "10-241", 0, 19, "https://cdn.example.com/plan.svg", 1, "Левел Южнопортовая"]
        page = '<script type="application/json" id="__NUXT_DATA__">' + json.dumps(state, ensure_ascii=False) + '</script>'
        config = dict(CONFIG, adapter='level-nuxt-project-selection', projectName='Левел Южнопортовая')
        unit = collector.parse_page(page, config)['units'][0]
        self.assertEqual(unit['sourceId'], '10-241')
        self.assertEqual(unit['priceRub'], 15672173)
        self.assertEqual(unit['rooms'], 0)
        self.assertEqual(unit['type'], 'Студия')
        self.assertEqual(unit['planImageUrl'], 'https://cdn.example.com/plan.svg')
        config['projectName'] = 'Другой проект'
        self.assertEqual(collector.parse_page(page, config)['units'], [])


if __name__ == '__main__':
    unittest.main()
