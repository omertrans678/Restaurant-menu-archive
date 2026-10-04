import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('web_data', Path(__file__).with_name('build_web_data.py'))
web_data = importlib.util.module_from_spec(spec)
spec.loader.exec_module(web_data)


class ReleaseRevisionTest(unittest.TestCase):
    def test_content_changes_require_new_consent_even_when_date_is_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dated = root / '2026-10-04_00-00_Test'
            dated.mkdir()
            source = dated / 'Test.json'
            raw = {'address': 'Test', 'collectedAt': '2026-10-04T00:00:00+03:00',
                   'restaurants': [{'info': {'id': 1, 'name': 'Test'}, 'sections': [
                       {'name': 'Menü', 'products': [{'id': 2, 'name': 'Ürün', 'price': {'marketPrice': 100}}]}]}]}
            source.write_text(json.dumps(raw), encoding='utf8')
            original = source.read_bytes()
            web_data.build(root)
            first = json.loads((root / 'datasets.json').read_text(encoding='utf8'))['folders'][0]
            self.assertEqual(source.read_bytes(), original)
            catalog = json.loads((root / '_texgo' / dated.name / 'catalog.json').read_text(encoding='utf8'))
            self.assertEqual(first['revision'], catalog['revision'])
            self.assertGreater(first['summaryBytes'], 0)
            web_data.build(root)
            self.assertEqual(first['revision'], json.loads((root / 'datasets.json').read_text(encoding='utf8'))['folders'][0]['revision'])
            raw['restaurants'][0]['sections'][0]['products'][0]['price']['marketPrice'] = 120
            source.write_text(json.dumps(raw), encoding='utf8')
            web_data.build(root)
            changed = json.loads((root / 'datasets.json').read_text(encoding='utf8'))['folders'][0]
            self.assertNotEqual(first['revision'], changed['revision'])
            self.assertEqual(first['collectedAt'], changed['collectedAt'])


if __name__ == '__main__':
    unittest.main()
