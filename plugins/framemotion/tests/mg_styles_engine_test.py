"""The bundled MG styles engine matches its upstream files, its added fonts are listed, and its films are registered."""
import hashlib
import json
import re
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/mg-styles-engine'
INTEGRATION = ROOT / 'integrations/mg-styles-15'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ROOT / 'skills/framemotion/assets/engines/engines.json').read_text())
FILMS = {'mg-cel-boil': '05-cel-boil', 'mg-liquid': '07-liquid', 'mg-morph': '08-morph',
         'mg-synthwave': '10-synthwave', 'mg-aurora-glass': '12-aurora-glass'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class MgStylesEngineTest(unittest.TestCase):
    def test_every_file_is_listed_and_unchanged(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertEqual(sha(path), f['sha256'])
        for f in MANIFEST['added_fonts']:
            path = (INTEGRATION / f['file']).resolve()
            listed.add(path)
            with self.subTest(f['file']):
                self.assertEqual(sha(path), f['sha256'])
                self.assertTrue(f['licence'].startswith('OFL-1.1'))
        listed |= {(INTEGRATION / f).resolve() for f in MANIFEST['own_files']}
        for path in ENGINE.rglob('*'):
            if path.is_file():
                self.assertIn(path.resolve(), listed, f'{path.relative_to(ENGINE)} is not in the source manifest')

    def test_left_out_files_stay_out(self):
        self.assertEqual(MANIFEST['source_commit'], '8fab7eb49cc60590c518d1a932dfff753697fce7')
        demos = {p.name for p in (ENGINE / 'upstream/demos').iterdir()}
        self.assertEqual(demos, set(FILMS.values()))
        for name in ('upstream/harness', 'upstream/videos', 'upstream/site', 'upstream/lib', 'upstream/assets/images',
                     'upstream/assets/textures/grain'):
            self.assertFalse((ENGINE / name).exists(), name)
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix in ('.mp4', '.flac', '.wav')], [])

    def test_every_font_has_its_licence_text(self):
        texts = {p.name.split('-OFL')[0] for p in (ENGINE / 'fonts/licences').glob('*-OFL.txt')}
        for f in MANIFEST['added_fonts']:
            family = f['from'].split(':ofl/')[1].split('/')[0]
            self.assertIn(family, texts, f['file'])

    def test_licence_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertIn('Vincentwei1021', (INTEGRATION / 'LICENSE').read_text())
        notice = (ROOT / 'NOTICE').read_text()
        self.assertIn('Vincentwei1021/mg-styles-15', notice)
        self.assertIn(MANIFEST['source_commit'], notice)

    def test_films_make_no_outside_requests(self):
        bad = re.compile(r'https?://(?!www\.w3\.org)')
        for path in (ENGINE / 'upstream/demos').rglob('*'):
            if path.suffix in ('.js', '.html'):
                text = re.sub(r'/\*.*?\*/|(?<![:"\'])//[^\n]*', '', path.read_text(encoding='utf-8'), flags=re.S)
                self.assertIsNone(bad.search(text), path.relative_to(ENGINE))

    def test_registered_films(self):
        films = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'mgstyles']
        self.assertEqual({e['id']: e['build']['film'] for e in films}, FILMS)
        for e in films:
            with self.subTest(e['id']):
                self.assertTrue((ENGINE / 'upstream/demos' / e['build']['film'] / 'index.html').exists())
                self.assertEqual(e['sources'], ['mg-styles-15'])
                self.assertEqual(e['adapter'], 'renderFrame')


if __name__ == '__main__':
    unittest.main()
