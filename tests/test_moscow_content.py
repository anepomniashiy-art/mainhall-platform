import copy
import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

spec = importlib.util.spec_from_file_location('moscow_content', Path(__file__).parents[1] / 'scripts/generate-moscow-content.py')
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

NOW = datetime(2026, 10, 22, 9, 0, tzinfo=gen.MSK)
CHECKED = (NOW - timedelta(days=2)).isoformat()
ESCROW_TEXT = ('Застройщик получает деньги дольщика с эскроу-счёта только после ввода дома в эксплуатацию. '
               'Срок условного депонирования не может превышать срок ввода объекта более чем на 6 месяцев.')
DECL_TEXT = ('Проектная декларация публикуется застройщиком в единой информационной системе жилищного строительства '
             'и содержит сведения о застройщике, разрешении на строительство и правах на земельный участок.')

PACK = {
    'packId': 'fixture-2026-10-22',
    'projects': [{'slug': 'high-life', 'name': 'HIGH LIFE'}, {'slug': 'opus', 'name': 'OPUS'},
                 {'slug': 'shagal', 'name': 'Шагал'}],
    'topics': [
        {'slug': 'escrow-schet-pri-pokupke-novostroyki',
         'sources': [{'name': 'КонсультантПлюс: 214-ФЗ, ст. 15.5', 'url': 'https://www.consultant.ru/document/cons_doc_LAW_51038/',
                      'checkedAt': CHECKED, 'text': ESCROW_TEXT}]},
        {'slug': 'kak-chitat-proektnuyu-deklaraciyu',
         'sources': [{'name': 'ЕИСЖС наш.дом.рф', 'url': 'https://xn--80az8a.xn--d1aqf.xn--p1ai/',
                      'checkedAt': CHECKED, 'text': DECL_TEXT}]},
        {'slug': 'klubnyy-dom-chto-proverit', 'sources': []},
    ],
}
QUEUE = [
    {'slug': 'kak-chitat-proektnuyu-deklaraciyu', 'title': 'Как читать проектную декларацию новостройки',
     'category': 'Гид покупателя', 'kind': 'evergreen', 'image': 'shagal', 'related': ['shagal']},
    {'slug': 'escrow-schet-pri-pokupke-novostroyki', 'title': 'Эскроу-счёт при покупке квартиры в новостройке',
     'category': 'Право', 'kind': 'law', 'image': 'high-life', 'related': ['high-life', 'opus']},
    {'slug': 'klubnyy-dom-chto-proverit', 'title': 'Клубный дом в центре Москвы: что проверить до покупки',
     'category': 'Гид покупателя', 'kind': 'evergreen', 'image': 'high-life', 'related': []},
]
PARA = 'Покупателю стоит проверить этот пункт в документах до подписания договора и задать вопросы юристу.'


def draft(title, number_text=''):
    return json.dumps({
        'title': title,
        'description': 'Разбираем, какие документы и условия покупатель проверяет до подписания договора долевого участия.',
        'sections': [
            {'title': 'Что это такое', 'paragraphs': [PARA + number_text]},
            {'title': 'Что проверить', 'paragraphs': [PARA], 'points': ['Разрешение на строительство', 'Права на участок'],
             'subheadings': [{'title': 'Вопросы застройщику', 'paragraphs': [PARA]}]},
            {'title': 'Итог', 'paragraphs': [PARA]},
        ],
        'sourceIndexes': [1],
    }, ensure_ascii=False)


def valid_article():
    return {
        'slug': 'escrow-schet-pri-pokupke-novostroyki', 'title': 'Эскроу-счёт при покупке квартиры в новостройке',
        'description': 'Разбираем, какие документы и условия покупатель проверяет до подписания договора долевого участия.',
        'category': 'Право', 'image': 'high-life', 'related': ['high-life', 'developer:pioneer'],
        'publishedAt': NOW.isoformat(), 'updatedAt': NOW.isoformat(), 'author': 'Редакция MAINHALL',
        'sections': [{'title': 'Как работает эскроу', 'paragraphs': [PARA]},
                     {'title': 'Сроки', 'paragraphs': ['Срок депонирования не может превышать срок ввода более чем на 6 месяцев.']}],
        'sources': [{'name': 'КонсультантПлюс', 'url': 'https://www.consultant.ru/document/cons_doc_LAW_51038/'}],
        'links': [{'name': 'HIGH LIFE', 'url': '/projects/high-life'}],
    }


SLUGS = {'high-life', 'opus', 'shagal'}


class ValidatorTests(unittest.TestCase):
    def errors(self, article, **kw):
        return gen.validate_article(article, now=NOW, project_slugs=SLUGS, **kw)

    def test_valid_article_passes_including_pack_checks(self):
        topic = {'title': QUEUE[1]['title'], 'sources': PACK['topics'][0]['sources']}
        pack_urls = {s['url'] for s in topic['sources']}
        self.assertEqual(self.errors(valid_article(), topic=topic, pack_sources=pack_urls), [])

    def test_schema_violations(self):
        cases = {
            'author': ('author', 'Андрей Непомнящий'),
            'image': ('image', 'unknown-project'),
            'category': ('category', 'Реклама'),
            'slug': ('slug', 'Эскроу Счёт'),
            'publishedAt': ('publishedAt', '2026-10-22'),
        }
        for label, (key, value) in cases.items():
            with self.subTest(label):
                article = valid_article()
                article[key] = value
                self.assertTrue(any(key in e for e in self.errors(article)), self.errors(article))
        article = valid_article()
        del article['sources']
        self.assertTrue(any('missing keys' in e for e in self.errors(article)))
        article = valid_article()
        article['price'] = 1
        self.assertTrue(any('unexpected keys' in e for e in self.errors(article)))

    def test_future_dates_fail(self):
        article = valid_article()
        article['publishedAt'] = article['updatedAt'] = (NOW + timedelta(days=1)).isoformat()
        self.assertTrue(any('future' in e for e in self.errors(article)))
        article = valid_article()
        article['updatedAt'] = (NOW - timedelta(days=1)).isoformat()
        self.assertTrue(any('earlier than publishedAt' in e for e in self.errors(article)))

    def test_sources_must_be_https_and_from_pack(self):
        article = valid_article()
        article['sources'] = [{'name': 'Сайт', 'url': 'http://example.com/'}]
        self.assertTrue(any('HTTPS' in e for e in self.errors(article)))
        article = valid_article()
        self.assertTrue(any('not present in source pack' in e for e in self.errors(article, pack_sources={'https://other.ru/'})))

    def test_html_script_and_raw_urls_fail(self):
        for payload in ['<script>alert(1)</script>', 'Текст <b>жирный</b> абзац', 'javascript:alert(1)', 'см. https://pioneer.ru/sale']:
            with self.subTest(payload):
                article = valid_article()
                article['sections'][0]['paragraphs'][0] = PARA + ' ' + payload
                self.assertTrue(self.errors(article))

    def test_outbound_developer_cta_and_promises_fail(self):
        for payload in ['Звоните в отдел продаж прямо сейчас.', 'Подробности на сайте застройщика.',
                        'Телефон +7 (495) 000-00-00.', 'Это гарантированный доход для инвестора.',
                        'Материал подготовил Андрей.']:
            with self.subTest(payload):
                article = valid_article()
                article['sections'][0]['paragraphs'][0] = PARA + ' ' + payload
                self.assertTrue(any('forbidden content' in e for e in self.errors(article)), payload)

    def test_external_article_links_are_rejected(self):
        article = valid_article()
        article['links'] = [{'name': 'Купить у застройщика', 'url': 'https://pioneer.ru/'}]
        self.assertTrue(any('internal' in e for e in self.errors(article)))
        article['links'] = [{'name': 'Каталог', 'url': 'https://main-hall.ru/projects'}]
        self.assertFalse(any('links' in e for e in self.errors(article)))

    def test_numbers_not_in_source_pack_are_unsafe_facts(self):
        topic = {'title': QUEUE[1]['title'], 'sources': PACK['topics'][0]['sources']}
        pack_urls = {s['url'] for s in topic['sources']}
        for invented in ['Цена квадратного метра — 1 250 000 ₽.', 'Ставка составляет 6,5% годовых.', 'Закон изменили в 2025 году.']:
            with self.subTest(invented):
                article = valid_article()
                article['sections'][0]['paragraphs'][0] = PARA + ' ' + invented
                errors = self.errors(article, topic=topic, pack_sources=pack_urls)
                self.assertTrue(any('unsafe facts' in e for e in errors), errors)

    def test_duplicate_slug_and_paraphrased_title(self):
        existing = [valid_article()]
        article = valid_article()
        self.assertTrue(any('duplicate slug' in e for e in self.errors(article, existing=existing)))
        article['slug'] = 'eskrou-novostroyki'
        article['title'] = 'Эскроу-счёт при покупке квартиры в новостройке: разбор'
        self.assertTrue(any('duplicate topic' in e for e in self.errors(article, existing=existing)))


class SourcePackTests(unittest.TestCase):
    def test_bad_sources_are_dropped(self):
        pack = copy.deepcopy(PACK)
        pack['topics'][0]['sources'] += [
            {'name': 'HTTP', 'url': 'http://example.com/', 'checkedAt': CHECKED, 'text': ESCROW_TEXT},
            {'name': 'Будущее', 'url': 'https://example.com/a', 'checkedAt': (NOW + timedelta(days=3)).isoformat(), 'text': ESCROW_TEXT},
            {'name': 'Без текста', 'url': 'https://example.com/b', 'checkedAt': CHECKED, 'text': ''},
        ]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'pack.json'
            path.write_text(json.dumps(pack, ensure_ascii=False), encoding='utf-8')
            loaded, problems = gen.load_source_pack(path, NOW)
        self.assertEqual(len(loaded['topics'][0]['sources']), 1)
        self.assertEqual(len(problems), 3)

    def test_stale_sources_skip_news_kind(self):
        topic = {'slug': 'novost', 'title': 'Новость рынка новостроек Москвы', 'kind': 'news', 'category': 'Новости',
                 'image': 'opus', 'sources': [dict(PACK['topics'][0]['sources'][0], checkedAt=(NOW - timedelta(days=40)).isoformat())]}
        self.assertIn('older than', gen.topic_skip_reason(topic, NOW, SLUGS, []))


class GeneratorTests(unittest.TestCase):
    def run_generate(self, out, complete, max_articles=3):
        return gen.generate(pack=copy.deepcopy(PACK), queue_topics=QUEUE, output_dir=out,
                            max_articles=max_articles, complete=complete, now=NOW, log=lambda *_: None)

    def fake_model(self, prompt):
        title = 'Эскроу-счёт при покупке квартиры в новостройке' if 'Эскроу' in prompt.split('ТЕМА:')[1][:80] \
            else 'Как читать проектную декларацию новостройки'
        return draft(title)

    def test_generates_only_topics_with_sources_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as out:
            first = self.run_generate(out, self.fake_model)
            written = sorted(slug for status, slug, _ in first if status == 'written')
            self.assertEqual(written, ['escrow-schet-pri-pokupke-novostroyki', 'kak-chitat-proektnuyu-deklaraciyu'])
            self.assertIn(('skip', 'klubnyy-dom-chto-proverit', 'no verified sources in source pack'), first)
            files = {p.name: p.read_text(encoding='utf-8') for p in Path(out).glob('*.json')}

            article = json.loads(files['escrow-schet-pri-pokupke-novostroyki.json'])
            self.assertEqual(article['author'], 'Редакция MAINHALL')
            self.assertEqual(article['publishedAt'], NOW.isoformat())
            self.assertEqual(article['sources'], [{'name': PACK['topics'][0]['sources'][0]['name'], 'url': PACK['topics'][0]['sources'][0]['url']}])
            with redirect_stdout(io.StringIO()):
                self.assertEqual(gen.validate_files(sorted(Path(out).glob('*.json')), PACK, NOW), 0)

            second = self.run_generate(out, mock.Mock(side_effect=AssertionError('model must not be called')))
            self.assertFalse(any(status == 'written' for status, _, _ in second))
            self.assertEqual({p.name: p.read_text(encoding='utf-8') for p in Path(out).glob('*.json')}, files)

    def test_max_articles_limit(self):
        with tempfile.TemporaryDirectory() as out:
            results = self.run_generate(out, self.fake_model, max_articles=1)
            self.assertEqual(sum(1 for r in results if r[0] == 'written'), 1)
            self.assertEqual(len(list(Path(out).glob('*.json'))), 1)

    def test_invented_facts_are_retried_then_skipped(self):
        calls = []

        def lying_model(prompt):
            calls.append(prompt)
            return draft('Эскроу-счёт при покупке квартиры в новостройке', ' Цены выросли на 17% за год.')

        with tempfile.TemporaryDirectory() as out:
            pack_topics = QUEUE[1:2]
            results = gen.generate(pack=copy.deepcopy(PACK), queue_topics=pack_topics, output_dir=out, max_articles=1,
                                   complete=lying_model, now=NOW, log=lambda *_: None)
            self.assertIn(('skip', 'escrow-schet-pri-pokupke-novostroyki', 'rejected after 3 attempts'), results)
            self.assertEqual(list(Path(out).glob('*.json')), [])
        self.assertEqual(len(calls), 3)
        self.assertIn('ОТКЛОНЕНА ВАЛИДАТОРОМ', calls[1])

    def test_dry_run_writes_nothing(self):
        with tempfile.TemporaryDirectory() as out:
            results = self.run_generate(out, None)
            self.assertTrue(any(status == 'planned' for status, _, _ in results))
            self.assertEqual(list(Path(out).iterdir()), [])


class CliTests(unittest.TestCase):
    def test_no_api_key_is_explicit_dry_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            pack = Path(tmp) / 'pack.json'
            pack.write_text(json.dumps(PACK, ensure_ascii=False), encoding='utf-8')
            topics = Path(tmp) / 'topics.json'
            topics.write_text(json.dumps({'topics': QUEUE}, ensure_ascii=False), encoding='utf-8')
            out = Path(tmp) / 'articles'
            buf = io.StringIO()
            with mock.patch.dict('os.environ', {'ANTHROPIC_API_KEY': ''}), redirect_stdout(buf):
                code = gen.main(['--source-pack', str(pack), '--topics', str(topics), '--output', str(out), '--max-articles', '2'])
            self.assertEqual(code, 0)
            self.assertIn('DRY-RUN: ANTHROPIC_API_KEY is not set', buf.getvalue())
            self.assertFalse(out.exists())

    def test_source_pack_required_and_max_articles_bounded(self):
        with redirect_stdout(io.StringIO()), mock.patch('sys.stderr', io.StringIO()):
            with self.assertRaises(SystemExit):
                gen.main([])
            with self.assertRaises(SystemExit):
                gen.main(['--source-pack', 'x.json', '--max-articles', '4'])

    def test_repository_topics_reference_existing_projects(self):
        data = json.loads((Path(__file__).parents[1] / 'data/editorial/topics.json').read_text(encoding='utf-8'))
        slugs = gen.known_project_slugs()
        self.assertTrue(slugs)
        seen = set()
        for topic in data['topics']:
            with self.subTest(topic['slug']):
                self.assertRegex(topic['slug'], gen.SLUG_RE)
                self.assertNotIn(topic['slug'], seen)
                seen.add(topic['slug'])
                self.assertIn(topic['category'], gen.CATEGORIES)
                self.assertIn(topic['kind'], gen.KINDS)
                self.assertIn(topic['image'], slugs)
                self.assertTrue(set(topic['related']) <= slugs)
                self.assertNotRegex(topic['title'] + topic.get('angle', ''), r'\d')  # queue holds no facts


if __name__ == '__main__':
    unittest.main()
