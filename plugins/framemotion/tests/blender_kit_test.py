"""The Blender kit is unchanged upstream guides and scripts, registers no skill, sends nothing out, and is credited."""
import hashlib
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'skills/framemotion/assets/blender-kit'
INTEGRATION = ROOT / 'integrations/blender-skills'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())


class BlenderKitTest(unittest.TestCase):
    def test_files_are_listed_and_unchanged(self):
        listed = {(INTEGRATION / f).resolve() for f in MANIFEST['own_files']}
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), f['sha256'], f['source_path'])
        for path in KIT.rglob('*'):
            if path.is_file():
                self.assertIn(path.resolve(), listed, str(path.relative_to(KIT)))

    def test_no_second_skill_and_no_network(self):
        self.assertEqual(list(KIT.rglob('SKILL.md')), [])
        self.assertEqual(len(list(KIT.glob('upstream/*/GUIDE.md'))), 13)
        for script in KIT.rglob('*.py'):
            self.assertNotRegex(script.read_text(), r'\b(urllib|requests|http\.client|socket\.socket)\b', script.name)

    def test_credit(self):
        self.assertIn('MIT License', (KIT / 'LICENSE').read_text())
        self.assertIn('EL4CTEO/blender-skills', (ROOT / 'NOTICE').read_text())
        self.assertIn('blender-skills', [s['name'] for s in json.loads((ROOT / 'integrations/sources.json').read_text())['sources']])


if __name__ == '__main__':
    unittest.main()
