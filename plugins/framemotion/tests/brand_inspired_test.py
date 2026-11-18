"""Brand-name requests get the inspired version first, with hard limits only for 1:1 copies."""
import re
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / 'skills' / 'framemotion'
REF = SKILL / 'references' / 'brand-inspired-requests.md'


class BrandInspiredTest(unittest.TestCase):
    def setUp(self):
        self.text = REF.read_text(encoding='utf-8')

    def test_skill_links_the_rule(self):
        skill = (SKILL / 'SKILL.md').read_text(encoding='utf-8')
        self.assertIn('references/brand-inspired-requests.md', skill)
        self.assertLessEqual(len(skill.encode('utf-8')), 52000)

    def test_cases_have_inspired_reply(self):
        for name in ('Minecraft', 'Clawd', 'Pok', 'Mario'):
            self.assertIn(name, self.text)
        replies = re.findall(r'^> (.+)$', self.text, re.M)
        self.assertGreaterEqual(len(replies), 4)
        for reply in replies:
            self.assertRegex(reply, r'^Zrobię ')
            self.assertNotRegex(reply.lower(), r'nie zrobię|nie narysuję|odmawiam|nie odtwarzam')

    def test_hard_limits_are_the_three(self):
        part = self.text.split('## Hard limits')[1].split('##')[0]
        self.assertEqual(len(re.findall(r'^- ', part, re.M)), 3)

    def test_clawd_is_allowed(self):
        self.assertRegex(self.text, r'Clawd')
        self.assertIn('Clawd', self.text.split('## The rule')[1].split('## Hard limits')[0])

    def test_no_refusal_first_wording_left(self):
        for rel in ('references/generated-motion-assets.md', 'references/reference-style-rebuild.md'):
            body = (SKILL / rel).read_text(encoding='utf-8')
            self.assertNotIn('No brand names, third-party logos or copies', body)


if __name__ == '__main__':
    unittest.main()
