"""'Not now' for the Earshot engine is remembered, and the Python 3.12 check comes first."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'skills/framemotion/assets/sound-setup/earshot_offer.py'


class EarshotOfferTest(unittest.TestCase):
    def run_offer(self, *args, env):
        out = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True, env=env, check=True)
        return out.stdout

    def test_decline_is_remembered_and_reset(self):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, 'FRAMEMOTION_SETTINGS': str(Path(tmp) / 'fm' / 'settings.json')}
            self.assertFalse(json.loads(self.run_offer('check', env=env))['declined'])
            self.assertFalse((Path(tmp) / 'fm').exists(), 'check writes nothing')
            self.run_offer('decline', env=env)
            state = json.loads(self.run_offer('check', env=env))
            self.assertTrue(state['declined'])
            self.assertIn('python312', state)
            self.run_offer('reset', env=env)
            self.assertFalse(json.loads(self.run_offer('check', env=env))['declined'])

    def test_rules_use_it(self):
        refs = ROOT / 'skills/framemotion/references'
        for name in ('first-setup.md', 'motion-toolkit-routing.md'):
            text = (refs / name).read_text()
            self.assertIn('earshot_offer.py', text, name)
            self.assertIn('Python 3.12', text, name)


if __name__ == '__main__':
    unittest.main()
