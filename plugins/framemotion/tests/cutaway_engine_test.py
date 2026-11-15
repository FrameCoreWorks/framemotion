"""The bundled Cutaway engine matches its upstream files, and FrameMotion's teardown stays apart."""
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/cutaway-engine'
MANIFEST = json.loads((ROOT / 'integrations/cutaway/source-manifest.json').read_text())
REGISTRY = json.loads((ROOT / 'skills/framemotion/assets/engines/engines.json').read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CutawayEngineTest(unittest.TestCase):
    def test_every_bundled_file_is_listed_unchanged(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (ROOT / 'integrations/cutaway' / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertFalse(f.get('changed'), 'the cutaway files are bundled unchanged')
                self.assertEqual(sha(path), f['sha256'])
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md' and not rel.startswith('framemotion/'):
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_no_file_is_loaded_as_a_skill(self):
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(ROOT / 'integrations/cutaway/LICENSE'))
        licence = (ROOT / 'integrations/cutaway/LICENSE').read_text()
        self.assertIn('Nyxera0x', licence)
        self.assertIn('whaleyxbt', licence)
        sources = (ENGINE / 'sfx/samples/SOURCES.md').read_text()
        self.assertIn('CC0', sources)
        self.assertEqual(len(list((ENGINE / 'sfx/samples').glob('*.ogg'))), 12)
        notice = (ROOT / 'NOTICE').read_text()
        for name in ('Nyxera0x/cutaway', 'whaleyxbt/claude-motion', 'Barty-Bart/motion-graphics', 'breakdown/template.html'):
            self.assertIn(name, notice)
        teardown = (ENGINE / 'framemotion/teardown.js').read_text()
        self.assertIn('Apache-2.0', teardown)
        self.assertIn('artemnovitckii/claude-animation-skills', teardown)

    def test_teardown_page_code_makes_no_requests(self):
        bad = re.compile(r'\bfetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|new\s+Worker\(|importScripts|https?://')
        for path in ENGINE.glob('framemotion/**/*.js'):
            text = re.sub(r'/\*.*?\*/|//[^\n]*', '', path.read_text(), flags=re.S)
            text = text.replace("'http://www.w3.org/2000/svg'", '')   # the SVG namespace is a name, not a request
            self.assertIsNone(bad.search(text), path.relative_to(ENGINE))

    def test_registered_sims_exist(self):
        sims = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'cutaway']
        self.assertEqual({e['id'] for e in sims}, {'cutaway-piranha', 'teardown-phone', 'teardown-watch'})
        for e in sims:
            self.assertEqual(e['adapter'], 'renderFrame')
            if 'spec' in e['build']:   # a teardown is built from its spec alone and is as long as the spec says
                spec = json.loads((ROOT / 'skills/framemotion/assets/engines' / e['build']['spec']).read_text())
                self.assertTrue(2 <= len(spec['layers']) <= 8)
                self.assertEqual(e['duration'], 'page')
            else:
                folder = ROOT / 'skills/framemotion/assets/engines' / e['build']['sim']
                self.assertTrue((folder / 'main.js').is_file(), e['id'])


if __name__ == '__main__':
    unittest.main()
