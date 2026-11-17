"""Layered work rule (owner 2026-11-17): the skill, workflow, template and reference name every layer."""
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / 'skills' / 'framemotion'
LAYERS = ['Plan and structure', 'Typography and content', 'Base motion', 'Depth and polish',
          'Colour and look', 'Sound', 'Detail control and file QC']


class LayersTest(unittest.TestCase):
    def test_reference_lists_all_layers(self):
        text = (SKILL / 'references' / 'layered-work.md').read_text(encoding='utf-8')
        for layer in LAYERS:
            self.assertIn(f'| {layer} |', text)
        self.assertIn('Exception', text)
        self.assertIn('function or file with a switch', text)

    def test_entry_points_link_reference(self):
        for rel in ['SKILL.md', 'references/reel-workflow.md', 'references/workshop/process-and-render.md']:
            text = (SKILL / rel).read_text(encoding='utf-8')
            self.assertIn('layered-work.md', text, rel)
        self.assertIn('Work in layers (mandatory', (SKILL / 'SKILL.md').read_text(encoding='utf-8'))

    def test_template_has_layer_plan(self):
        text = (SKILL / 'templates' / 'motion-storyboard-contract.md').read_text(encoding='utf-8')
        self.assertIn('## Layer plan', text)


if __name__ == '__main__':
    unittest.main()
