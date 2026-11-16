"""The bare-invocation welcome in SKILL.md is a byte-exact copy of the English asset."""
import re
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / 'skills' / 'framemotion'


class WelcomeTest(unittest.TestCase):
    def test_embedded_welcome_matches_asset(self):
        text = (SKILL / 'SKILL.md').read_text(encoding='utf-8')
        found = re.findall(r'<!-- welcome:start -->\n(.*?)\n<!-- welcome:end -->', text, re.S)
        self.assertEqual(len(found), 1)
        asset = (SKILL / 'assets' / 'startup-welcome.en.md').read_text(encoding='utf-8')
        self.assertEqual(found[0] + '\n', asset)

    def test_embedded_polish_welcome_matches_asset(self):
        text = (SKILL / 'SKILL.md').read_text(encoding='utf-8')
        found = re.findall(r'<!-- welcome-pl:start -->\n(.*?)\n<!-- welcome-pl:end -->', text, re.S)
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0] + '\n', (SKILL / 'assets' / 'startup-welcome.pl.md').read_text(encoding='utf-8'))

    def test_welcome_shape(self):
        asset = (SKILL / 'assets' / 'startup-welcome.en.md').read_text(encoding='utf-8')
        self.assertTrue(asset.startswith('I am '))
        self.assertGreaterEqual(len(re.findall(r'^- "', asset, re.M)), 3)
        self.assertEqual(re.findall(r'^(\d)\. ', asset, re.M), ['1', '2'])   # two starts (owner 2026-11-16)
        self.assertNotIn('Creative Studio', asset)
        self.assertNotRegex(asset, r'(?i)plain words|ten groups')   # the groups themselves, not a description of them

    def test_welcome_names_every_group_and_polish_matches(self):
        import json
        asset = (SKILL / 'assets' / 'startup-welcome.en.md').read_text(encoding='utf-8')
        groups = json.loads((SKILL / 'assets' / 'engines' / 'engines.json').read_text())['groups']
        start = re.search(r'^1\. Pick a kind of film: (.*)$', asset, re.M).group(1)
        self.assertEqual(len(start.split(', ')), len(groups))
        pl = (SKILL / 'assets' / 'startup-welcome.pl.md').read_text(encoding='utf-8')
        self.assertEqual(len(pl.split('\n\n')), len(asset.split('\n\n')))
        self.assertEqual(re.findall(r'^(\d)\. ', pl, re.M), ['1', '2'])
        pl_start = re.search(r'^1\. Wybierz rodzaj filmu: (.*)$', pl, re.M).group(1)
        self.assertEqual(len(pl_start.rstrip('.').split(', ')), len(groups))
        self.assertTrue(asset.rstrip().endswith('what we are animating.') and pl.rstrip().endswith('co animujemy.'))

    def test_rule_points_to_welcome(self):
        text = (SKILL / 'SKILL.md').read_text(encoding='utf-8')
        for phrase in ('## Welcome', 'A bare invocation is', 'copy it exactly', 'numbered example', 'translate all of it', '](assets/startup-welcome.pl.md)', 'references/engine-routing.md',
                       '](assets/startup-welcome.en.md)'):
            self.assertIn(phrase, text)


if __name__ == '__main__':
    unittest.main()
