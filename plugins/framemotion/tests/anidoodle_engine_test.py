"""The bundled anidoodle engine matches its upstream files, leaves the rest out, and its films are registered."""
import hashlib
import json
import re
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/anidoodle-engine'
INTEGRATION = ROOT / 'integrations/anidoodle'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ROOT / 'skills/framemotion/assets/engines/engines.json').read_text())
BY_ID = {e['id']: e for e in REGISTRY['engines']}
FILMS = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'anidoodle']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class AnidoodleEngineTest(unittest.TestCase):
    def test_every_file_is_listed_and_unchanged(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertEqual(sha(path), f['sha256'])
        listed |= {(INTEGRATION / f).resolve() for f in MANIFEST['own_files']}
        for path in ENGINE.rglob('*'):
            if path.is_file():
                self.assertIn(path.resolve(), listed, f'{path.relative_to(ENGINE)} is not in the source manifest')

    def test_left_out_files_stay_out(self):
        self.assertEqual(MANIFEST['source_commit'], '4ae27d2c281fcfd01bce87ab13dc5ad4df81a795')
        up = ENGINE / 'upstream/engine'
        for name in ('tools', 'vendor', 'assets', 'test', 'src/three-core', 'package.json'):
            self.assertFalse((up / name).exists(), name)
        self.assertEqual(sorted(p.name for p in (up / 'src/hosts').iterdir()), ['audio.ts', 'instrument.ts', 'page.ts', 'probe.ts'])
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix not in ('.ts', '.json', '.md', '')], [])

    def test_licence_and_credit(self):
        for name in ('LICENSE', 'NOTICE'):
            self.assertEqual(sha(ENGINE / name), sha(INTEGRATION / name))
        self.assertIn('Apache License', (ENGINE / 'LICENSE').read_text())
        notice = (ROOT / 'NOTICE').read_text()
        self.assertIn('alexgreensh/anidoodle', notice)
        self.assertIn(MANIFEST['source_commit'], notice)

    def test_films_make_no_outside_requests(self):
        bad = re.compile(r'\bfetch\(|XMLHttpRequest|WebSocket|https?://')
        for path in (ENGINE / 'upstream/engine/src').rglob('*.ts'):
            text = re.sub(r'/\*.*?\*/|//[^\n]*', '', path.read_text(encoding='utf-8'), flags=re.S)
            self.assertIsNone(bad.search(text), path.relative_to(ENGINE))

    def test_registered_films(self):
        self.assertEqual(len(FILMS), 32)
        self.assertEqual(sorted(e['build']['film'] for e in FILMS), MANIFEST['bundled_films'])
        self.assertEqual({e['id']: e['method_of'] for e in FILMS if 'method_of' in e}, MANIFEST['ways_of_existing_engines'])
        self.assertEqual(len(MANIFEST['ways_of_existing_engines']), 19)
        for e in FILMS:
            with self.subTest(e['id']):
                self.assertTrue((ENGINE / 'upstream/engine/src/canvas-core' / (e['build']['film'] + '.ts')).is_file())
                self.assertEqual(e['sources'], ['anidoodle'])
                self.assertEqual((e['adapter'], e['capture']), ('renderFrame', '#film'))
                if 'method_of' in e:
                    self.assertEqual(e['group'], BY_ID[e['method_of']]['group'])


if __name__ == '__main__':
    unittest.main()
