"""The bundled Lemo engine: 24 Lemo-Opuscar styles and the core, unchanged, with no docs, prompts, media or Clawd."""
import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / 'skills/framemotion/assets/lemo-engine'
ENGINES = ROOT / 'skills/framemotion/assets/engines'
INTEGRATION = ROOT / 'integrations/lemo-opuscar'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())
MEDIA = {'.md', '.wav', '.mp3', '.flac', '.ogg', '.m4a', '.mp4', '.webm', '.srt', '.npy', '.onnx', '.bin', '.py', '.sh'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class LemoEngineTest(unittest.TestCase):
    def test_bundled_files_match_the_manifest_unchanged(self):
        self.assertEqual(MANIFEST['source_commit'], '3a7132b996be0241c1ea0ab180d519f06e6f10b6')
        for f in MANIFEST['retained_files']:
            with self.subTest(f['source_path']):
                path = (INTEGRATION / f['destination_path']).resolve()
                if f['source_path'] == 'styles/tilt-shift/demo/sky.js':
                    self.assertTrue(f['changed'])
                    self.assertEqual(sha(path), f['current_sha256'])
                    self.assertEqual(path.read_text().count('FrameMotion:'), 1)
                    continue
                self.assertNotIn('changed', f)
                self.assertEqual(sha(path), f['sha256'])
                self.assertIn(f['license'], {'MIT', 'OFL-1.1', 'notice'})
                if 'fetched_from' in f:
                    self.assertRegex(f['fetched_from'], r'^https://(raw\.githubusercontent\.com/google/fonts/[0-9a-f]{40}/|fonts\.gstatic\.com/(s/[a-z0-9]+/v\d+/|l/font\?kit=[\w-]+&skey=[0-9a-f]+&v=v\d+$)|raw\.githubusercontent\.com/JetBrains/JetBrainsMono/[0-9a-f]{40}/)')

    def test_every_bundled_file_is_listed(self):
        listed = {(INTEGRATION / f['destination_path']).resolve() for f in MANIFEST['retained_files']}
        for path in ENGINE.rglob('*'):
            rel = path.relative_to(ENGINE).as_posix()
            if path.is_file() and rel != 'README.md':
                self.assertIn(path.resolve(), listed, f'{rel} is not in the source manifest')

    def test_left_out_parts_stay_out(self):
        bad = [p.relative_to(ENGINE).as_posix() for p in ENGINE.rglob('*')
               if p.is_file() and p.suffix in MEDIA and p.relative_to(ENGINE).as_posix() not in {'README.md', 'core/fonts/OFL.md'}]
        self.assertEqual(bad, [])
        for part in ('prompts', 'stills', 'tools'):
            self.assertEqual([p for p in ENGINE.rglob(part) if p.is_dir()], [], part)
        self.assertEqual(sorted(p.name for p in (ENGINE / 'core').iterdir()), ['fonts', 'lib.js', 'post', 'three'])
        self.assertFalse((ENGINE / 'styles/living-screencast').exists())
        self.assertFalse((ENGINE / 'styles/ink-wash').exists())
        for path in ENGINE.rglob('*'):
            if path.is_file() and path.suffix in {'.js', '.mjs', '.html', '.json', '.css'} and path.name != 'REUSE.toml':
                self.assertNotIn('clawd', path.read_text(errors='ignore').lower(), path.relative_to(ENGINE).as_posix())

    def test_licences_and_credit(self):
        self.assertEqual(sha(ENGINE / 'LICENSE'), sha(INTEGRATION / 'LICENSE'))
        self.assertTrue((ENGINE / 'LICENSES/MIT.txt').is_file() and (ENGINE / 'LICENSES/OFL-1.1.txt').is_file())
        self.assertIn('SIL Open Font License', (ENGINE / 'core/fonts/OFL.md').read_text())
        self.assertIn('Lemo engine (skills/framemotion/assets/lemo-engine)', (ROOT / 'NOTICE').read_text())
        self.assertIn('Lemo-Opuscar by Lemomo (LemoLab)', (ENGINE / 'README.md').read_text())
        for style in MANIFEST['styles']:
            with self.subTest(style):
                self.assertTrue((ENGINE / 'styles' / style / 'demo/CREDITS').is_file())

    def test_every_style_is_registered_once(self):
        lemo = [e for e in REGISTRY['engines'] if e.get('build', {}).get('tool') == 'lemo']
        self.assertEqual(sorted(e['build']['style'] for e in lemo), sorted(MANIFEST['styles']))
        self.assertEqual(len(lemo), 24)
        readme = (ENGINE / 'README.md').read_text()
        for e in lemo:
            with self.subTest(e['id']):
                self.assertEqual(e['id'], 'lemo-' + e['build']['style'])
                self.assertEqual((e['adapter'], e['duration'], e['size']), ('renderFrameAt', 'page', {'width': 1920, 'height': 1080}))
                self.assertTrue((ENGINE / 'styles' / e['build']['style'] / 'demo/index.html').is_file())
                self.assertIn(f"| `{e['build']['style']}`", readme)
                self.assertEqual('screenshot' in e, e['kind'] == 'three')


if __name__ == '__main__':
    unittest.main()
