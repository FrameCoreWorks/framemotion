"""match.py: an identical rebuild matches, a late linear rebuild is caught with its timing errors."""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MATCH = ROOT / 'skills/framemotion/assets/reference-breakdown/match.py'


def clip(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=white:s=320x180:r=30:d=2.5', '-f', 'lavfi',
                    '-i', 'color=c=red:s=40x40:r=30:d=2.5', '-filter_complex', f"[0][1]overlay=x='{x}':y=70", '-pix_fmt', 'yuv420p',
                    str(path)], check=True)


@unittest.skipUnless(shutil.which('ffmpeg'), 'needs FFmpeg')
class ReferenceMatchTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = Path(tempfile.mkdtemp())
        ease = 'if(lt(t,0.5),20,if(lt(t,1.5),20+200*(1-pow(1-(t-0.5),3)),220))'
        clip(cls.dir / 'ref.mp4', ease)
        clip(cls.dir / 'same.mp4', ease)
        clip(cls.dir / 'late.mp4', 'if(lt(t,0.7),20,if(lt(t,1.7),20+200*(t-0.7),220))')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.dir, ignore_errors=True)

    def run_match(self, copy, *extra):
        out = self.dir / ('out-' + copy + '-'.join(extra))
        code = subprocess.run([sys.executable, str(MATCH), '--ref', str(self.dir / 'ref.mp4'), '--copy', str(self.dir / copy), '--out', str(out), *extra],
                              capture_output=True, text=True).returncode
        return code, json.loads((out / 'match.json').read_text()), out

    def test_identical_rebuild_matches(self):
        code, result, out = self.run_match('same.mp4', '--mode', 'pixel')
        self.assertEqual((code, result['verdict'], result['offset_frames']), (0, 'match', 0))
        self.assertTrue((out / 'match.jpg').is_file() and (out / 'activity.jpg').is_file())

    def test_late_linear_rebuild_is_caught(self):
        code, result, _ = self.run_match('late.mp4')
        self.assertEqual((code, result['verdict']), (1, 'not_yet'))
        self.assertEqual(result['offset_frames'], 6)
        self.assertTrue(any('late by 6 frames' in p for p in result['problems']))
        self.assertGreater(abs(result['timing_error_s']['centre']), 0.08)


if __name__ == '__main__':
    unittest.main()
