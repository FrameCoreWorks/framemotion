"""The cinetic kit is unchanged upstream text and starter files, credited, and the launch copy check works."""
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'skills/framemotion/assets/cinetic-kit'
CHECK = ROOT / 'skills/framemotion/assets/launch-copy/copy_check.py'
INTEGRATION = ROOT / 'integrations/cinetic'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())


def run(text):
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(text)
    out = subprocess.run([sys.executable, str(CHECK), f.name, '--json'], capture_output=True, text=True)
    Path(f.name).unlink()
    return out.returncode, json.loads(out.stdout)


class CineticKitTest(unittest.TestCase):
    def test_files_are_listed_and_unchanged(self):
        listed = {(INTEGRATION / f).resolve() for f in MANIFEST['own_files']}
        for f in MANIFEST['retained_files']:
            path = (INTEGRATION / f['destination_path']).resolve()
            listed.add(path)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), f['sha256'], f['source_path'])
        for path in KIT.rglob('*'):
            if path.is_file():
                self.assertIn(path.resolve(), listed, str(path.relative_to(KIT)))

    def test_left_out_parts_stay_out(self):
        names = {p.name for p in KIT.rglob('*')}
        for name in ('logos.mjs', 'logo-brands.json', 'package.json', 'setup.mjs', 'gsap.min.js', 'SKILL.md', 'techniques.json'):
            self.assertNotIn(name, names)
        self.assertFalse(any(KIT.rglob('*.ts')) or any(KIT.rglob('*.tsx')), 'no Remotion sources')
        for js in (KIT / 'upstream/hyperframes-starter').glob('*.js'):
            self.assertNotRegex(js.read_text(), r'\bfetch\(|https?://', js.name)

    def test_credit(self):
        self.assertIn('MIT License', (KIT / 'LICENSE').read_text())
        self.assertIn('Leonxlnx/cinetic', (ROOT / 'NOTICE').read_text())
        names = [s['name'] for s in json.loads((ROOT / 'integrations/sources.json').read_text())['sources']]
        self.assertIn('cinetic', names)

    def test_copy_check(self):
        code, bad = run('name: Kadr\n0.3 | Meet Kadr!\n1.5 | Unleash your creative superpower.\n3.5 | It always works for every team in every country on earth.\n')
        self.assertEqual(code, 1)
        self.assertEqual({i['check'] for i in bad['issues'] if i['severity'] == 'error'}, {'slogan', 'vague', 'metaphor', 'long', 'what-it-is'})
        code, good = run('name: Kadr\n0.4 | Kadr turns photos into short reels.\n2 | Drop in ten photos.\n3.5 | Get a reel in a minute.\n5 | kadr.app\n')
        self.assertEqual((code, good['issues']), (0, []))
        code, pl = run('name: Kadr\nkind: update\n0.4 | Kadr 2.0 jest już dostępny.\n2 | Napisy po polsku.\n3.5 | Pobierz z kadr.pl\n')
        self.assertEqual(code, 0, pl['issues'])
        # The closing line may hold the name and what to do; a question is a hook, so only a warning.
        code, end = run('name: Kadr\n0.4 | Kadr robi rolki ze zdjęć.\n2 | Masz dziesięć zdjęć?\n4 | Kadr. Wypróbuj za darmo.\n')
        self.assertEqual(code, 0, end['issues'])
        self.assertEqual([(i['severity'], i['check']) for i in end['issues']], [('warning', 'slogan')])
        code, plbad = run('name: Kadr\n0.4 | Rewolucyjna aplikacja z supermocą.\n')
        self.assertEqual(code, 1)
        self.assertTrue({'vague', 'metaphor'} <= {i['check'] for i in plbad['issues']})


if __name__ == '__main__':
    unittest.main()
