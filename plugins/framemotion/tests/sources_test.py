"""Every source of the own-engines plan is pinned, permitted and credited."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'integrations/sources.json').read_text())['sources']
NOTICE = (ROOT / 'NOTICE').read_text()
LICENCES = {'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'}
STATUSES = {'bundled', 'adapted', 'patterns', 'planned'}
KINDS = {'engine', 'knowledge', 'library', 'technique'}
PACKS = {f'P{n}' for n in range(1, 11)}


class SourcesTest(unittest.TestCase):
    def test_entries_are_pinned_and_permitted(self):
        names = [s['name'] for s in SOURCES]
        self.assertEqual(len(names), len(set(names)), 'duplicate source names')
        for s in SOURCES:
            with self.subTest(s['name']):
                self.assertRegex(s['repo'], r'^[\w.-]+/[\w.-]+$')
                self.assertRegex(s['commit'], r'^[0-9a-f]{40}$')
                self.assertIn(s['licence'], LICENCES)
                self.assertIn(s['status'], STATUSES)
                self.assertIn(s['kind'], KINDS)
                self.assertIn(s['pack'], PACKS)
                self.assertTrue(s['copyright'].strip())
                self.assertIsInstance(s['conditions'], list)

    def test_material_in_the_package_is_credited(self):
        for s in SOURCES:
            if s['status'] not in {'bundled', 'adapted'}:
                self.assertNotIn('bundled_commit', s, s['name'])
                continue
            with self.subTest(s['name']):
                self.assertRegex(s.get('bundled_commit', ''), r'^[0-9a-f]{40}$')
                self.assertIn(s['repo'], NOTICE)
                self.assertIn(s['bundled_commit'], NOTICE)

    def test_nothing_rejected_sneaks_in(self):
        rejected = {'DavidHDev/react-bits', 'ruucm/shadergradient', 'bangtutorial/bang-motion', 'pmndrs/drei',
                    'jberg/butterchurn', 'feitangyuan/onetake'}
        self.assertFalse(rejected & {s['repo'] for s in SOURCES})


if __name__ == '__main__':
    unittest.main()
