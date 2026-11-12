"""The bundled captions copy and the motion sync tool import subtitles into a contract identically.
Moved from Creative Studio's captions_test.py with the motion module (Studio 1.178.0)."""
import importlib.util
import json
import pathlib
import shutil
import subprocess
import unittest

PLUGIN = pathlib.Path(__file__).resolve().parent.parent
ASSETS = PLUGIN / 'skills/framemotion/assets'
EXAMPLE = ASSETS / 'motion-sync/examples/voice-over.srt'
SYNC = ASSETS / 'motion-sync/sync.mjs'
STARTER = ASSETS / 'gsap-motion-starter/motion-score.json'
spec = importlib.util.spec_from_file_location('captions', ASSETS / 'captions/captions.py')
captions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(captions)


class Parity(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'), 'Node.js not available')
    def test_contract_import_matches_the_motion_sync_tool(self):
        script = (f"import {{parseSubtitles, importCaptions}} from {json.dumps(SYNC.as_uri())};"
                  f"import fs from 'node:fs';"
                  f"const score = JSON.parse(fs.readFileSync({json.dumps(str(STARTER))}, 'utf8'));"
                  f"const cues = parseSubtitles(fs.readFileSync({json.dumps(str(EXAMPLE))}, 'utf8'));"
                  f"const out = importCaptions(score, cues, {{replace: true}});"
                  f"console.log(JSON.stringify({{captions: out.score.captions, copy: out.score.copy, warnings: out.warnings}}));")
        node = json.loads(subprocess.run(['node', '--input-type=module', '-e', script], capture_output=True, text=True, check=True).stdout)
        score = json.loads(STARTER.read_text())
        result, warnings = captions.import_captions(score, captions.read_cues(EXAMPLE), replace=True)
        self.assertEqual(result['captions'], node['captions'])
        self.assertEqual(result['copy'], node['copy'])
        self.assertEqual(warnings, node['warnings'])


if __name__ == '__main__':
    unittest.main(verbosity=1)
