"""The bundled rea-video package: upstream files with their hashes, six marked changes, no capsule-cinema or eval route."""
import ast
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'skills/framemotion/assets/reference-breakdown/rea-video'
INTEGRATION = ROOT / 'integrations/rea-video'
MANIFEST = json.loads((INTEGRATION / 'source-manifest.json').read_text())
CHANGED = {'rea_video/cli.py', 'rea_video/memory.py', 'rea_video/util.py', 'rea_video/audio.py', 'rea_video/pipeline.py',
           'rea_video/playbook.py', 'rea_video/sound_source.py'}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ReaVideoTest(unittest.TestCase):
    def test_files_match_the_manifest_and_changes_are_marked(self):
        self.assertEqual(MANIFEST['source_commit'], '751596967f58b8949124d291e59bdc40fc04486e')
        self.assertEqual(MANIFEST['license'], 'Apache-2.0')
        changed = set()
        for f in MANIFEST['retained_files']:
            with self.subTest(f['source_path']):
                path = (INTEGRATION / f['destination_path']).resolve()
                if f.get('changed'):
                    changed.add(f['source_path'])
                    self.assertNotEqual(f['sha256'], f['current_sha256'])
                    self.assertEqual(sha(path), f['current_sha256'])
                    self.assertIn('FrameMotion:', path.read_text())
                else:
                    self.assertEqual(sha(path), f['sha256'])
                    self.assertNotIn('FrameMotion', path.read_text(errors='ignore'))
        self.assertEqual(changed, CHANGED)

    def test_every_bundled_file_is_listed(self):
        listed = {(INTEGRATION / f['destination_path']).resolve() for f in MANIFEST['retained_files']}
        for path in PACKAGE.rglob('*'):
            if path.is_file() and '__pycache__' not in path.parts:
                self.assertIn(path.resolve(), listed, path.relative_to(PACKAGE).as_posix())

    def test_left_out_parts_stay_out(self):
        self.assertEqual(sorted(p.name for p in PACKAGE.iterdir() if p.name != '__pycache__'),
                         ['LICENSE', 'NOTICE', 'pyproject.toml', 'rea_video'])
        pkg = PACKAGE / 'rea_video'
        self.assertFalse((pkg / 'integrations').exists())
        self.assertFalse((pkg / 'evaluate.py').exists())
        self.assertEqual([p for p in PACKAGE.rglob('*') if p.suffix in {'.mp4', '.mov', '.webm', '.onnx', '.bin'}], [])
        for path in pkg.rglob('*.py'):
            text = path.read_text()
            ast.parse(text)
            self.assertNotIn('import capsule', text, path.name)
            self.assertNotIn('from .integrations', text, path.name)
            self.assertNotIn('from .evaluate', text, path.name)

    def test_cli_has_no_capsule_or_eval_command(self):
        tree = ast.parse((PACKAGE / 'rea_video/cli.py').read_text())
        commands = {node.args[0].value for node in ast.walk(tree)
                    if isinstance(node, ast.Call) and getattr(node.func, 'attr', '') == 'add_parser'
                    and node.args and isinstance(node.args[0], ast.Constant)}
        self.assertIn('decompose', commands)
        self.assertTrue(commands.isdisjoint({'capsule', 'remake-plan', 'remake-run', 'capsule-draft', 'eval'}),
                        commands)

    def test_models_are_pinned_by_hash(self):
        for name in ('stems.py', 'effects.py', 'faces.py'):
            text = (PACKAGE / 'rea_video' / name).read_text()
            self.assertRegex(text, r'MODEL_SHA256 = "[0-9a-f]{64}"', name)

    def test_licence_notice_and_credit(self):
        for name in ('LICENSE', 'NOTICE'):
            self.assertEqual(sha(PACKAGE / name), sha(INTEGRATION / name), name)
        self.assertIn('Apache License', (INTEGRATION / 'LICENSE').read_text())
        notice = (ROOT / 'NOTICE').read_text()
        self.assertIn('rea-video (skills/framemotion/assets/reference-breakdown/rea-video)', notice)
        self.assertIn(MANIFEST['source_commit'], notice)


PYTHON = os.environ.get('REA_VIDEO_PYTHON', sys.executable)


def _has_deps():
    probe = 'import cv2, numpy, PIL, yaml, videomd'
    return subprocess.run([PYTHON, '-c', probe], capture_output=True).returncode == 0 and shutil.which('ffmpeg')


@unittest.skipUnless(_has_deps(), 'set REA_VIDEO_PYTHON to a Python with the pinned dependencies')
class ReaVideoRunTest(unittest.TestCase):
    def test_a_three_shot_clip_gives_three_shots(self):
        with tempfile.TemporaryDirectory() as tmp:
            clip = Path(tmp) / 'clip.mp4'
            inputs = []
            for src in ('testsrc', 'smptebars', 'rgbtestsrc'):
                inputs += ['-f', 'lavfi', '-i', f'{src}=s=320x240:d=2:r=25']
            subprocess.run(['ffmpeg', '-v', 'error', *inputs, '-f', 'lavfi', '-i', 'sine=f=440:d=6',
                            '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-map', '3:a',
                            '-pix_fmt', 'yuv420p', '-shortest', str(clip)], check=True)
            env = {k: v for k, v in os.environ.items() if k != 'REA_VIDEO_DOWNLOADS'}
            env.update(REA_VIDEO_HOME=str(Path(tmp) / 'home'), REA_VIDEO_MODELS=str(Path(tmp) / 'models'))
            out = Path(tmp) / 'out'
            subprocess.run([PYTHON, '-E', '-s', '-m', 'rea_video', 'decompose', str(clip), '-o', str(out),
                            '--no-asr', '--no-speakers', '--no-vlm', '--no-ocr', '--lang', 'en'],
                           cwd=PACKAGE, env=env, check=True, capture_output=True, timeout=600)
            data = json.loads((out / 'breakdown.json').read_text())
            self.assertEqual(len(data['shots']), 3)
            # With sound and no --stems, and no download allowed, nothing is fetched and no stems are written.
            self.assertFalse(any((Path(tmp) / 'models').rglob('*')), 'a model was downloaded')
            self.assertFalse((out / 'stems' / 'vocals.wav').exists())


if __name__ == '__main__':
    unittest.main()
