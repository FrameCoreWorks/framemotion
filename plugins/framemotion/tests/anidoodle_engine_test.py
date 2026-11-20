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
STYLES = json.loads((ENGINE / 'styles.json').read_text())['styles']


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

    def test_one_engine_with_its_styles(self):
        # Owner decision 2026-11-20: anidoodle is one hand-drawn engine of its own, never split into other engines' ways.
        self.assertEqual([e['id'] for e in FILMS], ['anidoodle'])
        engine = FILMS[0]
        self.assertEqual((engine['adapter'], engine['capture'], engine['sources']), ('renderFrame', '#frame', ['anidoodle']))
        self.assertNotIn('method_of', engine)
        self.assertFalse([e['id'] for e in REGISTRY['engines'] if e['id'].startswith('ad-')])
        self.assertEqual((ENGINE.parent / 'engines' / engine['styles']).resolve(), (ENGINE / 'styles.json').resolve())
        self.assertIn(engine['params']['style']['default'], STYLES)
        # The upstream films; FrameMotion's own (the template and the motif film) live in their own folders.
        bundled = {n: r for n, r in STYLES.items() if 'folder' not in r}
        self.assertEqual(len(bundled), 32)
        self.assertEqual({n: r['film'] for n, r in bundled.items()}, MANIFEST['styles'])
        self.assertEqual(sorted(r['film'] for r in bundled.values()), MANIFEST['bundled_films'])
        for name, row in STYLES.items():
            with self.subTest(name):
                base = (ENGINE.parent / 'engines' / row['folder']) if 'folder' in row else ENGINE / 'upstream/engine/src'
                self.assertTrue((base / 'canvas-core' / (row['film'] + '.ts')).is_file())
                self.assertEqual(set(row['size']), {'width', 'height'})
                self.assertTrue(row['about'] and row['duration'] > 0 and row['fps'] > 0)


if __name__ == '__main__':
    unittest.main()
