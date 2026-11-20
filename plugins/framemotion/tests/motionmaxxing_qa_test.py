"""The motionmaxxing review references are unchanged upstream files, documented, and no upstream script is bundled."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'skills/framemotion/assets/motionmaxxing-qa'
INTEGRATION = ROOT / 'integrations/motionmaxxing'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())


class MotionmaxxingQaTest(unittest.TestCase):
    def test_files_are_listed_and_unchanged(self):
        listed = {(INTEGRATION / f).resolve() for f in MANIFEST['own_files']}
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), f['sha256'], f['source_path'])
        for path in QA.rglob('*'):
            if path.is_file():
                self.assertIn(path.resolve(), listed, str(path.relative_to(QA)))

    def test_no_upstream_code_or_skill(self):
        self.assertEqual(MANIFEST['source_commit'], '8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c')
        self.assertEqual([p for p in QA.rglob('*') if p.suffix in ('.py', '.mjs', '.js', '.sh')], [])
        self.assertFalse((QA / 'SKILL.md').exists())

    def test_licence_and_credit(self):
        self.assertIn('Apache License', (QA / 'LICENSE').read_text())
        self.assertEqual((QA / 'NOTICE').read_bytes(), (INTEGRATION / 'NOTICE').read_bytes())
        self.assertIn('motionmaxxing-qa', (ROOT / 'NOTICE').read_text())
        names = [s['name'] for s in json.loads((ROOT / 'integrations/sources.json').read_text())['sources']]
        self.assertIn('motionmaxxing', names)


if __name__ == '__main__':
    unittest.main()
