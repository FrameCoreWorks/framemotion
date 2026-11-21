"""Reel workflow version 2 (owner 2026-11-19): five stages, music before the cut, picture lock, the quality loop."""
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / 'skills' / 'framemotion'
TEXT = (SKILL / 'references' / 'reel-workflow.md').read_text(encoding='utf-8')


class ReelWorkflow(unittest.TestCase):
    def test_five_stages_in_order(self):
        heads = ['### Stage 1. Idea and look', '### Stage 2. Music', '### Stage 3. Contact sheet on the beats',
                 '### Stage 4. Preview at 540p', '### Stage 5. Render at 1080']
        positions = [TEXT.index(head) for head in heads]
        self.assertEqual(positions, sorted(positions))

    def test_music_before_the_cut_and_picture_lock(self):
        self.assertIn('composed to the times of the plan', TEXT)
        self.assertIn('picture lock', TEXT)
        self.assertIn('goes back to stage 2', TEXT)
        self.assertIn('Only on the user\'s explicit request', TEXT)

    def test_quality_loop(self):
        for part in ['The motion designer checks', 'The film editor checks', 'The composer and sound designer checks',
                     'The fresh reviewer', 'at most three passes', 'Below 8', 'Mono fold-down']:
            self.assertIn(part, TEXT)

    def test_brief_check_before_fresh_reviewer(self):
        self.assertIn('**The brief check**', TEXT)
        self.assertLess(TEXT.index('**The brief check**'), TEXT.index('**The fresh reviewer**'))
        for part in ['delivery format and size', 'everything the brief forbids', 'Any mismatch is a finding']:
            self.assertIn(part, TEXT)

    def test_correction_rules_and_profile(self):
        for part in ['At most two rounds', 'go back to stage 1', 'apply from the next project', '## Music profile', '## Reel log']:
            self.assertIn(part, TEXT)
        self.assertTrue((SKILL / 'templates' / 'music-profile.md').is_file())

    def test_music_sources_in_order(self):
        order = [TEXT.index(x) for x in ['played by real instruments', 'Synthesized instruments', 'A paid music generator']]
        self.assertEqual(order, sorted(order))

    def test_old_order_is_gone(self):
        sound = (SKILL / 'references' / 'motion-sound-design.md').read_text(encoding='utf-8')
        self.assertNotIn('**Picture first.**', sound)
        self.assertIn('Timing first', sound)
        self.assertIn('Stage 1. Idea and look', TEXT)
        self.assertIn('(5) the 1080 render only on the user\'s explicit request', (SKILL / 'SKILL.md').read_text(encoding='utf-8'))


if __name__ == '__main__':
    unittest.main()
