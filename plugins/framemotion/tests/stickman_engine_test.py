"""The bundled Stickman engine matches its upstream files, and FrameMotion's additions stay apart."""
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/stickman-engine'
MANIFEST = json.loads((ROOT / 'integrations/stickman-kino/source-manifest.json').read_text())
OURS = {'README.md'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class StickmanEngineTest(unittest.TestCase):
    def test_every_bundled_file_is_listed_with_its_hash(self):
        listed = {}
        for f in MANIFEST['retained_files']:
            path = (ROOT / 'integrations/stickman-kino' / f['destination_path']).resolve()
            listed[path] = f
            with self.subTest(f['source_path']):
                self.assertTrue(path.is_file())
                if f.get('changed'):
                    self.assertNotEqual(f['sha256'], f['current_sha256'])
                    self.assertEqual(sha(path), f['current_sha256'], 'changed file differs from its recorded hash')
                    self.assertTrue(f.get('change'))
                else:
                    self.assertEqual(sha(path), f['sha256'], 'bundled file differs from upstream')
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel not in OURS and not rel.startswith('framemotion/'):
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_only_the_rig_is_changed(self):
        changed = [f['source_path'] for f in MANIFEST['retained_files'] if f.get('changed')]
        self.assertEqual(changed, ['engine/sm-rig.js'])

    def test_licences_travel_with_the_engine(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(ROOT / 'integrations/stickman-kino/LICENSE'))
        self.assertIn('SIL OPEN FONT LICENSE', (ENGINE / 'engine/fonts/OFL.txt').read_text().upper())
        self.assertIn('Prerit Ahuja', (ROOT / 'integrations/stickman-kino/LICENSE').read_text())
        self.assertIn('Artem Novitckii', (ROOT / 'integrations/claude-animation-skills/LICENSE').read_text())

    def test_additions_are_ours_and_offline(self):
        reel = (ENGINE / 'framemotion/reel.js').read_text()
        self.assertIn('Apache-2.0', reel)
        self.assertIn('5dbea55c23aa6a5c93dc3cfb5583840513b56b94', reel)
        for path in [*ENGINE.rglob('*.js'), *ENGINE.rglob('*.mjs')]:
            text = path.read_text()
            self.assertIsNone(re.search(r'\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon', text), path.name)

    def test_registered_films_exist(self):
        registry = json.loads((ROOT / 'skills/framemotion/assets/engines/engines.json').read_text())
        films = [e for e in registry['engines'] if e.get('build', {}).get('tool') == 'stickman']
        self.assertEqual({e['id'] for e in films}, {'stickman-hello', 'stickman-vertical', 'stickman-reel'})
        for e in films:
            folder = ROOT / 'skills/framemotion/assets/engines' / e['build']['film']
            self.assertTrue((folder / 'film.json').is_file() and (folder / 'scenes.js').is_file(), e['id'])
            self.assertEqual(e['adapter'], 'seek')


if __name__ == '__main__':
    unittest.main()
