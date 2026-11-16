"""The bundled Line-art engine matches its upstream files, and its films are registered."""
import hashlib
import json
import re
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/line-art-engine'
INTEGRATION = ROOT / 'integrations/line-art-animation'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ROOT / 'skills/framemotion/assets/engines/engines.json').read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class LineArtEngineTest(unittest.TestCase):
    def test_every_bundled_file_is_listed_unchanged(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertFalse(f.get('changed'))
                self.assertEqual(sha(path), f['sha256'])
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md':
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_left_out_files_stay_out(self):
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])
        for name in ('media', 'scripts/capture.ts', 'package.json', 'vite.config.ts'):
            self.assertFalse((ENGINE / name).exists(), name)
        self.assertEqual(MANIFEST['source_commit'], 'c43d698913cf0ad44f984c7ae14c5348010594d3')

    def test_licence_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertIn('JDhruv14', (INTEGRATION / 'LICENSE').read_text())
        notice = (ROOT / 'NOTICE').read_text()
        self.assertIn('JDhruv14/line-art-animation', notice)
        self.assertIn(MANIFEST['source_commit'], notice)

    def test_scene_code_makes_no_requests(self):
        # scripts/clip.ts runs a local ffmpeg on the user's clip (a measuring tool, never part of a render)
        bad = re.compile(r'\bfetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|new\s+Worker\(|importScripts|child_process|https?://')
        for path in list(ENGINE.glob('lib/*.ts')) + list(ENGINE.glob('examples/**/*.ts')) + list(ENGINE.glob('examples/**/*.html')):
            text = re.sub(r'/\*.*?\*/|//[^\n]*', '', path.read_text(), flags=re.S).replace("'http://www.w3.org/2000/svg'", '')
            self.assertIsNone(bad.search(text), path.relative_to(ENGINE))

    def test_registered_films(self):
        films = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'lineart']
        self.assertEqual({e['id'] for e in films}, {'lineart-walker', 'lineart-village'})
        for e in films:
            with self.subTest(e['id']):
                self.assertEqual(60 % e['fps'], 0)
                self.assertTrue((ENGINE / 'examples' / e['build']['example'] / 'index.html').exists())
                self.assertEqual(e['sources'], ['line-art-animation'])
                self.assertEqual(e['capture'], '#fm-canvas')


if __name__ == '__main__':
    unittest.main()
