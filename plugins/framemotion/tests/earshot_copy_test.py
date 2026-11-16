"""The bundled Earshot launcher is Toolbox's, file for file, except the files marked as adapted (pack P11)."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / 'integrations/earshot/source-manifest.json').read_text())
DIRS = ('skills/framemotion/assets/earshot', 'skills/framemotion/references/earshot', 'tests/earshot')
ADAPTED = {
    'skills/framemotion/assets/earshot/scripts/contract.py', 'skills/framemotion/assets/earshot/scripts/envelope.py',
    'skills/framemotion/assets/earshot/scripts/import_source_record.py', 'skills/framemotion/assets/earshot/scripts/runtime.py',
    *(f'skills/framemotion/references/earshot/{n}.md' for n in ('earshot', 'listening', 'runtime-and-evidence',
                                                                 'source-records', 'written-critique')),
    *(f'tests/earshot/{n}_test.py' for n in ('capability', 'envelope', 'independence', 'runtime', 'source_record',
                                             'transformers_compat')),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class EarshotCopyTest(unittest.TestCase):
    def test_manifest_pins_toolbox(self):
        self.assertEqual(MANIFEST['commit'], '1e82404aba0ddb41369a4cca843a11d8c704b974')
        self.assertEqual(MANIFEST['toolbox_version'], '1.15.1')

    def test_every_bundled_file_is_listed_and_matches(self):
        on_disk = {str(p.relative_to(ROOT)) for d in DIRS for p in (ROOT / d).rglob('*')
                   if p.is_file() and '__pycache__' not in p.parts}
        listed = {f['path']: f for f in MANIFEST['files']}
        self.assertEqual(on_disk, set(listed))
        for path, f in listed.items():
            with self.subTest(path):
                self.assertEqual(sha(ROOT / path), f['sha256'])
                self.assertEqual(f['changed'], f['sha256'] != f['source_sha256'])

    def test_only_the_adapted_files_differ_from_toolbox(self):
        self.assertEqual({f['path'] for f in MANIFEST['files'] if f['changed']}, ADAPTED)

    def test_licence_travels_with_the_launcher(self):
        self.assertIn('Leon Lin', (ROOT / 'skills/framemotion/assets/earshot/LICENSE').read_text())
        self.assertIn('Leon Lin', (ROOT / 'integrations/earshot/LICENSE').read_text())


if __name__ == '__main__':
    unittest.main()
