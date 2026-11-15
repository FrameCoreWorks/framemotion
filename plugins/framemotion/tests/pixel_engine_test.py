"""The bundled Pixel engine: a pixelfx copy with one marked step in method.md with its notices, no gallery font, and registered samples."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/pixel-engine'
ENGINES = ROOT / 'skills/framemotion/assets/engines'
INTEGRATION = ROOT / 'integrations/pixelfx'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class PixelEngineTest(unittest.TestCase):
    def test_bundled_files_match_the_manifest_unchanged(self):
        self.assertEqual(MANIFEST['source_commit'], 'a84159688af3ca37a4be05a0d422b94451b2e24e')
        for f in MANIFEST['retained_files']:
            with self.subTest(f['source_path']):
                if f['source_path'] == 'skills/pixelfx/SKILL.md':
                    self.assertTrue(f['changed'])
                    self.assertEqual(sha((INTEGRATION / f['destination_path']).resolve()), f['current_sha256'])
                    self.assertEqual((ENGINE / 'method.md').read_text().count('FrameMotion:'), 1)
                    continue
                self.assertNotIn('changed', f)
                self.assertEqual(sha((INTEGRATION / f['destination_path']).resolve()), f['sha256'])

    def test_every_bundled_file_is_listed(self):
        listed = {(INTEGRATION / f['destination_path']).resolve() for f in MANIFEST['retained_files']}
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md' and not rel.startswith('framemotion/'):
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_left_out_parts_stay_out(self):
        self.assertEqual(list(ENGINE.rglob('SKILL.md')), [])
        self.assertFalse((ENGINE / 'gallery').exists())
        self.assertEqual([p for p in ENGINE.rglob('*') if p.suffix in {'.woff', '.woff2', '.ttf', '.otf', '.gif', '.mp4'}], [])
        self.assertFalse((ENGINE / 'tools/serve.mjs').exists())

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertIn('Hugo Duprez', (ENGINE / 'NOTICE.md').read_text())
        self.assertIn('Pixel engine (skills/framemotion/assets/pixel-engine)', (ROOT / 'NOTICE').read_text())
        self.assertIn('fxlib.mjs', (ENGINE / 'framemotion/player.js').read_text())

    def test_registered_pixel_entries(self):
        pixel = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'pixel']
        self.assertEqual(len(pixel), 4)
        for e in pixel:
            with self.subTest(e['id']):
                self.assertEqual((e['adapter'], e['capture'], e['duration']), ('renderFrameAt', '#c', 'page'))
                self.assertTrue((ENGINE / 'src/fx' / (e['build']['fx'] + '.js')).is_file())


if __name__ == '__main__':
    unittest.main()
