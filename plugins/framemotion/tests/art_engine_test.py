"""The bundled Art engine matches its upstream files, with one marked change, and leaves out what it must."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/art-engine'
ENGINES = ROOT / 'skills/framemotion/assets/engines'
INTEGRATION = ROOT / 'integrations/huashu-art-motion'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())
LEFT_OUT_SCENES = {'21_kusama', '23_dali', '24_hopper', '25_ghibli', '27_kirby', '31_haring', '35_shinkai',
                   '36_picasso_blue', '49_chagall', '52_south_park', '53_pixar', '54_ghibli_lab'}
LEFT_OUT_CARDS = {'21_kusama', '23_dali', '24_hopper', '25_ghibli', '27_kirby', '31_haring', '35_shinkai',
                  '36_picasso_blue', '37_rick_morty', '49_chagall', '52_south_park', '53_pixar'}
# Upstream files with marked changes, and how many FrameMotion marks each carries.
CHANGED = {'scripts/engine/lib/typo.js': 2, 'scripts/engine/scenes/14_8bit.js': 1, 'scripts/engine/index.html': 1, 'scripts/engine/transitions.js': 1,
           'SKILL.md': 2, 'references/风格配方/INDEX.md': 1, 'references/角色精细度.md': 1,
           'references/16-风格演示95分协议.md': 1, 'references/10-角色.md': 1}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ArtEngineTest(unittest.TestCase):
    def test_every_bundled_file_is_listed(self):
        listed = set()
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            with self.subTest(f['source_path']):
                self.assertEqual(sha(path), f.get('current_sha256', f['sha256']))
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md' and not rel.startswith('framemotion/'):
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_changed_files_are_marked(self):
        changed = {f['source_path']: f for f in MANIFEST['retained_files'] if f.get('changed')}
        self.assertEqual(sorted(changed), sorted(CHANGED))
        for src, marks in CHANGED.items():
            with self.subTest(src):
                dest = (INTEGRATION / changed[src]['destination_path']).resolve()
                self.assertEqual(sha(dest), changed[src]['current_sha256'])
                self.assertEqual(dest.read_text(encoding='utf-8').count('FrameMotion:'), marks)
        self.assertNotIn('WORLD 1-1', (ENGINE / 'scripts/engine/scenes/14_8bit.js').read_text(encoding='utf-8'))

    def test_left_out_parts_stay_out(self):
        engine = ENGINE / 'scripts/engine'
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])
        self.assertFalse((engine / 'reference_films').exists())
        self.assertFalse((engine / 'demos/_shared').exists())
        self.assertFalse((engine / 'lib/rig_huashu.js').exists())
        self.assertNotIn('rig_huashu.js"', (engine / 'index.html').read_text(encoding='utf-8'))
        self.assertFalse((ENGINE / 'references/about-author.md').exists())
        cards = ENGINE / 'references/风格配方'
        self.assertEqual(sorted(p.stem for p in cards.glob('*.md') if p.stem in LEFT_OUT_CARDS), [])
        for doc in [ENGINE / 'method.md', *(ENGINE / 'references').rglob('*.md')]:
            with self.subTest(doc.name):
                self.assertFalse([c for c in LEFT_OUT_CARDS if f'{c}.md' in doc.read_text(encoding='utf-8')])
        self.assertFalse((ENGINE / 'assets').exists())
        self.assertEqual(sorted(p.stem for p in (engine / 'scenes').glob('*.js') if p.stem in LEFT_OUT_SCENES), [])
        fonts = {p.name for p in (engine / 'lib/fonts').iterdir()}
        self.assertFalse({f for f in fonts if f.startswith(('NotoSans', 'NotoSerif', 'LXGW'))})
        self.assertFalse([p for p in ENGINE.rglob('*') if 'arphic' in p.name.lower()])
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix in {'.gif', '.mp4', '.wav', '.mp3'}], [])

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertIn('alchaincyf', (ENGINE / 'LICENSE').read_text())
        fonts = ENGINE / 'scripts/engine/lib/fonts'
        self.assertTrue((fonts / 'OFL.txt').is_file() and (fonts / 'LICENSES.md').is_file())
        self.assertTrue((ENGINE / 'scripts/engine/lib/THREE_LICENSE.txt').is_file())
        self.assertIn('Art engine (skills/framemotion/assets/art-engine)', (ROOT / 'NOTICE').read_text())

    def test_registered_art_entries(self):
        art = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'art']
        self.assertEqual(len(art), 7)
        for e in art:
            with self.subTest(e['id']):
                self.assertEqual((e['adapter'], e['capture'], e['duration']), ('renderFrameAt', '#c', 'page'))
                if 'clip' in e['build']:
                    spec = json.loads((ENGINES / e['build']['clip']).read_text())
                    self.assertEqual((spec['width'], spec['height'], spec['fps']), (e['size']['width'], e['size']['height'], e['fps']))
                    self.assertTrue((ENGINE / 'scripts/engine/clips' / f"{spec['grammar']}.js").is_file())


if __name__ == '__main__':
    unittest.main()
