"""Every engine folder is registered, every registered engine is complete and credited."""
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINES = ROOT / 'skills/framemotion/assets/engines'
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())
SOURCES = {s['name'] for s in json.loads((ROOT / 'integrations/sources.json').read_text())['sources']}
SHARED = {'kit', 'node_modules'}
BUILDERS = set(re.findall(r'^  (?:async )?(\w+)\(entry, enginesRoot\)', (ENGINES / 'kit/builders.mjs').read_text(), re.M))


class EnginesRegistryTest(unittest.TestCase):
    def test_entries_are_complete(self):
        ids = [e['id'] for e in REGISTRY['engines']]
        self.assertEqual(len(ids), len(set(ids)))
        for e in REGISTRY['engines']:
            with self.subTest(e['id']):
                self.assertRegex(e['id'], r'^[a-z0-9][a-z0-9-]*$')
                self.assertIn(e['status'], {'ready', 'experimental'})
                self.assertIn(e['kind'], {'three', 'canvas', 'svg', 'pixi', 'p5', 'html'})
                if 'page' in e:
                    page = ENGINES / e['page']
                    self.assertTrue(page.is_file(), e['page'])
                    self.assertIn('__framemotion', page.read_text())
                    self.assertIn(f"id: '{e['id']}'", self._page_scripts(page))
                else:
                    self.assertIn(e['build']['tool'], BUILDERS)
                    self.assertEqual(e['adapter'], 'renderFrame')
                    self.assertTrue(e['fps'] > 0 and e['duration'] > 0)
                    if 'piece' in e['build']:
                        self.assertTrue((ENGINES / e['build']['piece'] / 'piece.json').is_file())
                self.assertTrue((ENGINES / e['readme']).is_file())
                for block in e['blocks']:
                    self.assertTrue((ENGINES / block).is_file(), block)
                self.assertTrue(set(e['sources']) <= SOURCES, set(e['sources']) - SOURCES)
                self.assertTrue(e['size']['width'] >= 16 and e['size']['height'] >= 16)

    def _page_scripts(self, page):
        text = ''
        for path in page.parent.rglob('*.mjs'):
            text += path.read_text()
        return text

    def test_every_engine_folder_is_registered(self):
        used = {Path(e['page']).parts[0] for e in REGISTRY['engines'] if 'page' in e}
        folders = {p.name for p in ENGINES.iterdir() if p.is_dir()} - SHARED
        self.assertEqual(folders - used, set(), 'engine folders missing from engines.json')

    def test_engines_share_one_dependency_set(self):
        for path in ENGINES.rglob('package.json'):
            if 'node_modules' in path.parts:
                continue
            self.assertEqual(path.parent, ENGINES, f'{path}: engines share assets/engines/package.json')
        deps = json.loads((ENGINES / 'package.json').read_text())['dependencies']
        for name, version in deps.items():
            self.assertRegex(version, r'^\d+\.\d+\.\d+$', f'{name} must be pinned exactly')

    def test_no_network_or_server_in_engine_code(self):
        bad = re.compile(r"\b(fetch\(|XMLHttpRequest|WebSocket|child_process|createServer|http\.request)")
        for path in ENGINES.rglob('*.mjs'):
            if 'node_modules' in path.parts or path.name in {'render-engine.mjs', 'builders.mjs'}:
                continue
            self.assertIsNone(bad.search(path.read_text()), f'{path.relative_to(ENGINES)} reaches the network or a process')


if __name__ == '__main__':
    unittest.main()
