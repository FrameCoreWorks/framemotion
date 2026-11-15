"""The bundled Launch engine matches its upstream files, and FrameMotion's own sample stays apart."""
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/launch-engine'
ENGINES = ROOT / 'skills/framemotion/assets/engines'
MANIFEST = json.loads((ROOT / 'integrations/motion-launch-videos/source-manifest.json').read_text())
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class LaunchEngineTest(unittest.TestCase):
    def test_every_bundled_file_is_listed_unchanged(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (ROOT / 'integrations/motion-launch-videos' / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertEqual(sha(path), f['sha256'])
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md' and not rel.startswith('framemotion/'):
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_left_out_parts_stay_out(self):
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])
        self.assertFalse((ENGINE / 'styles/motion-captions').exists(), 'captioned clips belong to FrameCut')
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix in {'.wav', '.mp3', '.m4a', '.mp4', '.gif'}], [])
        self.assertFalse((ENGINE / 'styles/motion-story/scripts/voice.mjs').exists())

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(ROOT / 'integrations/motion-launch-videos/LICENSE'))
        self.assertIn('Marouane Gazouzi', (ENGINE / 'LICENSE').read_text())
        notice = (ROOT / 'NOTICE').read_text()
        for name in ('Kimeur/motion-launch-videos', 'Natural Earth', 'SIL Open Font'):
            self.assertIn(name, notice)

    def test_fonts_come_from_pinned_packages(self):
        deps = json.loads((ENGINES / 'package.json').read_text())['dependencies']
        for path in ENGINE.rglob('film.html'):
            for pkg in set(re.findall(r'__FONT:([a-z0-9-]+?)-latin-\d+-(?:normal|italic)\.woff2__', path.read_text())):
                with self.subTest(path=path.relative_to(ENGINE).as_posix(), font=pkg):
                    self.assertRegex(deps.get(f'@fontsource/{pkg}', ''), r'^\d+\.\d+\.\d+$')

    def test_registered_films_exist(self):
        films = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'launch']
        self.assertEqual(len(films), 14)
        for e in films:
            with self.subTest(e['id']):
                self.assertEqual((e['adapter'], e['capture'], e['duration']), ('renderFrame', '#c', 'page'))
                folder = ENGINES / e['build']['film'] if 'film' in e['build'] else ENGINE / 'styles' / e['build']['style'] / 'templates'
                self.assertTrue((folder / 'film.html').is_file())
                if e['build'].get('format') == '9:16':
                    self.assertEqual((e['size']['width'], e['size']['height']), (1080, 1920))


if __name__ == '__main__':
    unittest.main()
