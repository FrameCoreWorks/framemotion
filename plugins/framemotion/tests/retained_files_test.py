"""Files kept unchanged from an upstream still match the hashes in their source manifest."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class RetainedFilesTest(unittest.TestCase):
    def test_retained_files_match_their_manifest(self):
        checked = 0
        for manifest in sorted((ROOT / 'integrations').glob('*/source-manifest.json')):
            data = json.loads(manifest.read_text())
            for item in data.get('retained_files', []):
                if 'sha256' not in item or 'destination_path' not in item:
                    continue
                path = (manifest.parent / item['destination_path']).resolve()
                with self.subTest(str(path.relative_to(ROOT))):
                    self.assertTrue(path.is_file(), 'retained file is missing')
                    self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), item['sha256'], 'retained file was changed')
                    checked += 1
        self.assertGreater(checked, 20)

    def test_kaventro_templates_are_all_listed(self):
        base = ROOT / 'skills/framemotion/assets/kaventro-engine/templates'
        manifest = json.loads((ROOT / 'integrations/kaventro-motion-designer/source-manifest.json').read_text())
        listed = {item['destination_path'] for item in manifest['retained_files']}
        for path in base.rglob('*'):
            if path.is_file():
                self.assertIn(f'../../skills/framemotion/assets/kaventro-engine/templates/{path.relative_to(base).as_posix()}', listed)

    def test_copied_libraries_hold_only_listed_files(self):
        # Every file in a folder copied 1:1 is in its manifest, so an unsigned file cannot slip in.
        own = {'README.md'}   # our own notes next to the copies
        for manifest_name, folder in [('brag', 'skills/framemotion/assets/sfx-library'),
                                      ('gl-transitions', 'skills/framemotion/assets/engines/gl-transitions/shaders')]:
            manifest = json.loads((ROOT / f'integrations/{manifest_name}/source-manifest.json').read_text())
            listed = {item['destination_path'] for item in manifest['retained_files']}
            for path in (ROOT / folder).rglob('*'):
                if path.is_file() and path.name not in own:
                    with self.subTest(str(path.relative_to(ROOT))):
                        self.assertIn('../../' + path.relative_to(ROOT).as_posix(), listed)


if __name__ == '__main__':
    unittest.main()
