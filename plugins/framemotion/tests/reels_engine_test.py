"""The bundled Reels engine matches its upstream files, with one marked change, and FrameMotion's parts stay apart."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/reels-engine'
ENGINES = ROOT / 'skills/framemotion/assets/engines'
INTEGRATION = ROOT / 'integrations/claude-animation-skills'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ReelsEngineTest(unittest.TestCase):
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

    def test_only_shot_7_is_changed_and_marked(self):
        changed = [f for f in MANIFEST['retained_files'] if f.get('changed')]
        self.assertEqual([f['source_path'] for f in changed], ['skills/zach-d-films/engine/src/shots.js'])
        self.assertNotEqual(changed[0]['sha256'], changed[0]['current_sha256'])
        text = (ENGINE / 'styles/what-if-3d/engine/src/shots.js').read_text()
        self.assertEqual(text.count('FrameMotion:'), 1)

    def test_left_out_parts_stay_out(self):
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])
        for name in ('install.sh', 'kit/setup.sh', 'styles/stick-figure', 'styles/breakdown', 'styles/zach-d-films'):
            self.assertFalse((ENGINE / name).exists(), name)
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix in {'.wav', '.mp3', '.m4a', '.mp4', '.jpg'}], [])

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertIn('Artem Novitckii', (ENGINE / 'LICENSE').read_text())
        for font in ('inter', 'intertight', 'jetbrainsmono', 'poppins', 'pixelifysans'):
            self.assertTrue((ENGINE / f'kit/fonts/OFL-{font}.txt').is_file(), font)
        notice = (ROOT / 'NOTICE').read_text()
        self.assertIn('Reels engine (skills/framemotion/assets/reels-engine)', notice)

    def test_fonts_come_from_pinned_packages(self):
        deps = json.loads((ENGINES / 'package.json').read_text())['dependencies']
        for pkg in ('inter', 'inter-tight', 'poppins', 'jetbrains-mono', 'montserrat'):
            self.assertRegex(deps.get(f'@fontsource/{pkg}', ''), r'^\d+\.\d+\.\d+$', pkg)
        for pkg in ('three', 'gsap'):
            self.assertRegex(deps.get(pkg, ''), r'^\d+\.\d+\.\d+$', pkg)

    def test_registered_reels(self):
        reels = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'reels']
        self.assertEqual(sorted(e['build']['style'] for e in reels), ['graph', 'graph', 'hairline-tree', 'map-route', 'minimal-line-art', 'ps1-low-poly', 'voxel-build', 'what-if-3d'])
        for e in reels:
            with self.subTest(e['id']):
                self.assertEqual((e['adapter'], e['duration'], e['size']['height'] / e['size']['width']), ('seek', 'page', 16 / 9))
                if 'spec' in e['build']:
                    self.assertTrue((ENGINES / e['build']['spec']).is_file())


if __name__ == '__main__':
    unittest.main()
