"""Every source of the own-engines plan is pinned, permitted and credited."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'integrations/sources.json').read_text())['sources']
NOTICE = (ROOT / 'NOTICE').read_text()
LICENCES = {'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'Unlicense',   # Unlicense: a public-domain dedication (Reanimate, owner 2026-11-23)
            'Public-Domain-Natural-Earth'}   # Natural Earth's public-domain terms (map-projection film; owner decision 2026-11-25)
STATUSES = {'bundled', 'adapted', 'patterns', 'planned', 'dependency'}
ENGINES_PACKAGE = json.loads((ROOT / 'skills/framemotion/assets/engines/package.json').read_text())
KINDS = {'engine', 'knowledge', 'library', 'technique', 'data'}   # data: map data used by an engine
PACKS = {f'P{n}' for n in range(1, 14)} | {'L1'}   # L1: the motion library moved from Toolbox in 0.4.0; P12: the 2026-11-20 X-list engines; P13: the Reanimate engine


class SourcesTest(unittest.TestCase):
    def test_entries_are_pinned_and_permitted(self):
        names = [s['name'] for s in SOURCES]
        self.assertEqual(len(names), len(set(names)), 'duplicate source names')
        for s in SOURCES:
            with self.subTest(s['name']):
                if s.get('host') == 'hackage':
                    # A Haskell package published only on Hackage (no Git repository): pinned by its release
                    # version and the SHA-256 of that release's archive.
                    self.assertRegex(s['repo'], r'^hackage:[\w.-]+$')
                    self.assertRegex(s['version'], r'^\d+(\.\d+)+$')
                    self.assertRegex(s['archive_sha256'], r'^[0-9a-f]{64}$')
                else:
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
                if s.get('host') == 'hackage':
                    self.assertIn(f"{s['repo'].split(':', 1)[1]} {s['version']}", NOTICE)
                    self.assertIn(s['archive_sha256'], NOTICE)
                    continue
                self.assertRegex(s.get('bundled_commit', ''), r'^[0-9a-f]{40}$')
                self.assertIn(s['repo'], NOTICE)
                self.assertIn(s['bundled_commit'], NOTICE)

    def test_summarised_knowledge_links_its_pinned_source(self):
        # Knowledge summarised in references: each named reference links the repository at the reviewed commit,
        # and the source's licence text travels in integrations/<name>/.
        refs = ROOT / 'skills/framemotion'
        knowledge = [s for s in SOURCES if s['kind'] == 'knowledge' and s['status'] in {'adapted', 'bundled'} and s.get('references')]
        self.assertGreaterEqual(len(knowledge), 11)
        for s in knowledge:
            with self.subTest(s['name']):
                self.assertTrue(s.get('references'), 'name the references that summarise it')
                licence = ROOT / 'integrations' / s['name'] / 'LICENSE'
                self.assertTrue(licence.is_file(), 'keep the licence text')
                self.assertIn(s['licence'], licence.read_text())
                for rel in s['references']:
                    text = (refs / rel).read_text()
                    self.assertIn(f"github.com/{s['repo']}", text, rel)
                    self.assertIn(s['bundled_commit'], text, rel)
                    self.assertNotRegex(text, rf"github\.com/{s['repo']}/blob/(?!{s['bundled_commit']})", f'{rel} links another commit')

    def test_dependencies_match_the_engines_package(self):
        for s in SOURCES:
            if s['status'] != 'dependency':
                continue
            with self.subTest(s['name']):
                self.assertEqual(ENGINES_PACKAGE['dependencies'].get(s.get('package', s['name'])), s['version'])
                self.assertIn(s['repo'], NOTICE)

    def test_nothing_rejected_sneaks_in(self):
        # bangtutorial/bang-motion left this list on 2026-11-17: the owner asked for it to be merged into motion craft.
        rejected = {'DavidHDev/react-bits', 'ruucm/shadergradient', 'pmndrs/drei',
                    'jberg/butterchurn', 'feitangyuan/onetake'}
        self.assertFalse(rejected & {s['repo'] for s in SOURCES})


if __name__ == '__main__':
    unittest.main()
