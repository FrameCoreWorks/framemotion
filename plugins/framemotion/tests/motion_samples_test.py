"""Real instruments for composed music (motion-sound/samples.py, owner decision 2026-11-19).

Stage 2 of the reel workflow composes the music in code and plays it with recorded CC0 instruments fetched on demand.
The recordings are never bundled; without them the part falls back to synthesis on the same notes and grid."""
import importlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

import numpy as np

PLUGIN = pathlib.Path(__file__).resolve().parent.parent
SOUND = PLUGIN / 'skills/framemotion/assets/motion-sound'
sys.path.insert(0, str(SOUND))
import compose  # noqa: E402
import samples  # noqa: E402
import synth  # noqa: E402

PROFILE = {'moods': {'calm': 0.7, 'editorial': 0.5}, 'pace': 'medium'}
REAL = {'lead': 'real-piano', 'pad': 'real-strings', 'bass': 'real-pizz-bass'}


class Manifest(unittest.TestCase):
    def test_pinned_cc0_source(self):
        data = samples.manifest()
        self.assertEqual(data['source']['licence'], 'CC0-1.0')
        self.assertRegex(data['source']['commit'], r'^[0-9a-f]{40}$')
        for name, spec in data['instruments'].items():
            notes = [z['note'] for z in spec['zones']]
            self.assertEqual(notes, sorted(set(notes)), name)
            self.assertTrue(set(spec['parts']) <= {'lead', 'pad', 'bass'}, name)
            for zone in spec['zones']:
                self.assertRegex(zone['sha'], r'^[0-9a-f]{40}$')
                self.assertGreater(zone['size'], 0)
                self.assertTrue(zone['path'].lower().endswith('.wav'))

    def test_recordings_are_not_bundled(self):
        bundled = [p for p in PLUGIN.rglob('*.wav') if 'VSCO' in str(p) or re.search(r'(UR1_|KSHarp_|susVib_|BKCtbss_)', p.name)]
        self.assertEqual(bundled, [])

    def test_every_real_family_can_be_set(self):
        self.assertIn('real-piano', compose.LEAD_FAMILIES)
        self.assertIn('real-strings', compose.REAL_FAMILIES['pad'])
        self.assertIn('real-pizz-bass', compose.REAL_FAMILIES['bass'])


class Playing(unittest.TestCase):
    def setUp(self):
        self.cache = tempfile.mkdtemp()
        os.environ['FRAMEMOTION_SAMPLES'] = self.cache
        samples.MISSING.clear()
        samples._DECODED.clear()

    def tearDown(self):
        os.environ.pop('FRAMEMOTION_SAMPLES', None)
        shutil.rmtree(self.cache, ignore_errors=True)

    def test_recipe_names_the_instruments(self):
        spec = compose.generate_music(PROFILE, 5, 'D major', 'meadow', REAL)
        self.assertEqual({part: spec['parts'][part].get('instrument') for part in REAL}, {'lead': 'piano', 'pad': 'strings', 'bass': 'pizz-bass'})

    def test_missing_files_fall_back_to_synthesis_on_the_same_grid(self):
        spec = compose.generate_music(PROFILE, 5, 'D major', 'meadow', REAL)
        bed = compose.render_music(spec, 6.0, 96, [0, 1, 2], seed=5, reveal_bar=2)
        self.assertTrue(np.isfinite(bed).all())
        self.assertGreater(float(np.max(np.abs(bed))), 0.01)
        self.assertEqual(samples.MISSING, {'piano', 'strings', 'pizz-bass'})

    @unittest.skipUnless(shutil.which('ffmpeg'), 'ffmpeg needed to decode samples')
    def test_a_cached_note_is_shifted_to_the_asked_pitch(self):
        zone = next(z for z in samples.manifest()['instruments']['piano']['zones'] if z['note'] == 60)
        target = samples.zone_file(zone)
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=261.6256:duration=2', str(target)], check=True)
        n = synth.RATE
        out = samples.voice('piano', n, synth.midi_hz(62), 0.8)
        self.assertIsNotNone(out)
        spectrum = np.abs(np.fft.rfft(out * np.hanning(n), 1 << 18))
        peak = np.fft.rfftfreq(1 << 18, 1 / synth.RATE)[np.argmax(spectrum)]
        self.assertAlmostEqual(peak, synth.midi_hz(62), delta=1.0)
        self.assertEqual(samples.MISSING, set())

    def test_sound_cli_accepts_real_instruments(self):
        sound = importlib.import_module('sound')

        class Args:
            set = ['lead=real-harp', 'pad=real-cello', 'bass=real-pizz-bass']
            palette = None
        fixed = sound.overrides(Args())
        self.assertEqual(fixed, {'lead': 'real-harp', 'pad': 'real-cello', 'bass': 'real-pizz-bass'})


if __name__ == '__main__':
    unittest.main()
