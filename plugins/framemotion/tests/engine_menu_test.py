"""The welcome menu comes from the registry: ten plain-language groups, every engine in exactly one."""
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENGINES = ROOT / 'skills/framemotion/assets/engines'
REGISTRY = json.loads((ENGINES / 'engines.json').read_text())
GOOD_FOR = {'logo', 'title', 'app', 'product', 'data', 'explainer', 'story', 'effect', 'transition', 'background'}
INPUTS = {'none', 'text', 'image', 'screenshots', 'logo', 'clip', 'data'}
JARGON = re.compile(r'three\.js|webgl|shader|lemo|kaventro|pixi|p5|svg|canvas|risograph|ukiyo|isometric|css', re.I)


def menu(*args):
    out = subprocess.run([sys.executable, str(ENGINES / 'menu.py'), *args, '--json'], capture_output=True, text=True,
                         check=True).stdout
    return json.loads(out)


class EngineMenuTest(unittest.TestCase):
    def test_groups_are_plain_and_filled(self):
        groups = REGISTRY['groups']
        self.assertEqual(len(groups), 10)
        ids = [g['id'] for g in groups]
        self.assertEqual(len(ids), len(set(ids)))
        for g in groups:
            with self.subTest(g['id']):
                self.assertTrue(g['title'] and g['about'].endswith('.'))
                self.assertNotRegex(g['title'] + ' ' + g['about'], JARGON)
                self.assertTrue(any(e['group'] == g['id'] for e in REGISTRY['engines']), 'empty group')

    def test_every_engine_has_menu_fields(self):
        groups = {g['id'] for g in REGISTRY['groups']}
        for e in REGISTRY['engines']:
            with self.subTest(e['id']):
                self.assertIn(e['group'], groups)
                self.assertTrue(e['about'].endswith('.') and len(e['about']) <= 140)
                self.assertNotRegex(e['about'], JARGON)
                self.assertTrue(e['good_for'] and set(e['good_for']) <= GOOD_FOR, e['good_for'])
                self.assertTrue(e['inputs'] and set(e['inputs']) <= INPUTS, e['inputs'])

    def test_menu_equals_registry(self):
        full = menu()
        self.assertEqual([g['id'] for g in full], [g['id'] for g in REGISTRY['groups']])
        listed = [e['id'] for g in full for e in g['engines']]
        self.assertEqual(sorted(listed), sorted(e['id'] for e in REGISTRY['engines']))
        self.assertEqual(len(listed), len(set(listed)), 'an engine sits in two groups')
        self.assertEqual(menu('2'), menu(full[1]['id']))

    def test_skill_uses_the_menu(self):
        skill = (ROOT / 'skills/framemotion/SKILL.md').read_text()
        self.assertIn('references/engine-routing.md', skill)
        self.assertIn('assets/engines/menu.py', (ROOT / 'skills/framemotion/references/engine-routing.md').read_text())


if __name__ == '__main__':
    unittest.main()
