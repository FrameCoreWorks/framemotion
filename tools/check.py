#!/usr/bin/env python3
"""Validate the FrameMotion repository and run its test suites.

--fast skips the Node.js suites (the slowest); a release runs the full check.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

from package import ROOT, PLUGIN, build, source_files

CONTRACT_SHA = 'e7cc0f4e612395768e8c8c6cf2a033a555bc69b4c8ea5ca45c4db019a342897a'
STUDIO_SKILLS = ('hyperframes-workflow', 'remotion-video-production')


def require(condition, message):
    if not condition:
        raise SystemExit(f'FAIL: {message}')


def frontmatter(text):
    require(text.startswith('---\n'), 'SKILL.md needs frontmatter')
    block = text.split('---', 2)[1]
    return dict(re.findall(r'^(\w+): ?"?(.*?)"?$', block, re.M))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fast', action='store_true')
    fast = parser.parse_args().fast
    files = source_files()
    for name, content in files.items():
        if name.endswith('.json') and '/node_modules/' not in name:
            json.loads(content)
    manifests = [json.loads(files[p]) for p in ('plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json')]
    version = manifests[0]['version']
    require(all(m['version'] == version and m['name'] == 'framemotion' for m in manifests), 'Manifest identity differs')
    require(re.fullmatch(r'\d+\.\d+\.\d+', version), 'Expected release SemVer')
    require(manifests[0]['extensions']['com.openai']['interface'] == manifests[1]['interface'], 'Portable and Codex presentation differ')
    market = json.loads((ROOT / '.claude-plugin/marketplace.json').read_text())
    require(market['name'] == 'framemotion' and len(market['plugins']) == 1, 'Marketplace must hold only FrameMotion')
    entry = market['plugins'][0]
    require(entry['name'] == 'framemotion' and entry['version'] == version, 'Marketplace identity differs')
    require((ROOT / entry['source']).resolve() == PLUGIN, 'Marketplace points outside the plugin')
    caps = json.loads(files['capabilities.json'])
    require(caps['plugin'] == {'name': 'framemotion', 'version': version}, 'capabilities.json identity differs')
    require(hashlib.sha256(files['contracts/framecore-task.schema.json']).hexdigest() == CONTRACT_SHA == caps['contract_schema']['sha256'],
            'Shared contract schema drifted from Studio, Toolbox and Open Assets')
    skills = sorted(p for p in files if p.endswith('/SKILL.md') and p.startswith('skills/'))
    require(skills == ['skills/framemotion/SKILL.md'], f'Exactly one skill expected, found {skills}')
    meta = frontmatter(files['skills/framemotion/SKILL.md'].decode())
    require(meta.get('name') == 'framemotion' and meta.get('description'), 'Invalid skill metadata')
    agent = files['skills/framemotion/agents/openai.yaml'].decode()
    short = re.search(r'short_description: "(.+)"', agent).group(1)
    require('display_name: "FrameMotion"' in agent and 25 <= len(short) <= 64, 'Skill interface metadata')
    captions = (PLUGIN / 'skills/framemotion/assets/captions')
    recorded = re.findall(r'`([0-9a-f]{64})`', (captions / 'README.md').read_text())
    require(len(recorded) == 2 and hashlib.sha256((captions / 'captions.py').read_bytes()).hexdigest() == recorded[1],
            'captions.py copy differs from its recorded hash')
    for path in [*ROOT.glob('*.md'), *ROOT.glob('docs/*.md'), *PLUGIN.rglob('*.md')]:
        if 'node_modules' in path.parts:
            continue
        text = path.read_text(encoding='utf-8')
        for link in re.findall(r'\]\(([^)\s]+)\)', text):
            if '://' in link or link.startswith(('#', 'mailto:')):
                continue
            require((path.parent / link.split('#')[0]).exists(), f'Broken local link: {path.relative_to(ROOT)}: {link}')
    for name, content in files.items():
        if name.endswith(('.md', '.py', '.mjs', '.js', '.json', '.yaml')) and '/node_modules/' not in name:
            text = content.decode('utf-8', 'replace')
            for old in STUDIO_SKILLS:
                if old in text and not name.endswith(('captions.py', 'REMOTION.md', 'CHANGELOG.md', 'NOTICE')) \
                        and not name.startswith(('integrations/', 'evals/')) and 'formerly' not in text:
                    require(False, f'Old Studio skill path {old} in {name}')
    print(f'Source: {len(files)} files, version {version}', flush=True)
    for test in sorted((PLUGIN / 'tests').glob('*_test.py')):
        run = subprocess.run([sys.executable, str(test)], cwd=PLUGIN, capture_output=True, text=True)
        if run.returncode != 0:
            print((run.stdout + run.stderr)[-4000:])
            run.check_returncode()
        print(f'PASS {test.name}', flush=True)
    # The bundled Earshot launcher's tests (pack P11) need Python 3.12, like Toolbox's copy.
    py312 = shutil.which('python3.12')
    require(py312 is not None or not os.environ.get('CI'), 'Python 3.12 is needed for tests/earshot')
    if py312:
        run = subprocess.run([py312, '-m', 'unittest', 'discover', '-s', 'tests/earshot', '-p', '*_test.py'],
                             cwd=PLUGIN, capture_output=True, text=True)
        if run.returncode != 0:
            print((run.stdout + run.stderr)[-4000:])
            run.check_returncode()
        print('PASS tests/earshot (python3.12)', flush=True)
    else:
        print('SKIP tests/earshot: python3.12 not found', flush=True)
    if not fast:
        run = subprocess.run(['node', '--test', '--test-reporter=tap', *sorted(str(p) for p in (PLUGIN / 'tests').glob('*.test.mjs'))],
                             cwd=PLUGIN, capture_output=True, text=True)
        if run.returncode != 0:
            print((run.stdout + run.stderr)[-8000:])
            run.check_returncode()
        # A skipped browser test is not a pass: name every skip, and fail when the render
        # tests are required (CI sets FRAMEMOTION_REQUIRE_RENDER=1 after installing Chromium).
        skips = re.findall(r'^[ \t]*ok \d+ - ([^\n]+?) # SKIP[ \t]*([^\n]*)$', run.stdout, re.M)
        for name, reason in skips:
            print(f'SKIP {name}: {reason or "no reason given"}', flush=True)
        engine_skips = [name for name, reason in skips if reason.startswith('engines:')]   # engine tests name their skips 'engines: ...'
        require(not (engine_skips and os.environ.get('FRAMEMOTION_REQUIRE_RENDER') == '1'),
                f'Engine render tests skipped while FRAMEMOTION_REQUIRE_RENDER=1: {engine_skips}')
        print(f'PASS Node.js suites ({len(skips)} skipped)' if skips else 'PASS Node.js suites', flush=True)
    with tempfile.TemporaryDirectory() as temp:
        one, two = build(Path(temp) / 'one'), build(Path(temp) / 'two')
        require(one.read_bytes() == two.read_bytes(), 'Archive is not reproducible')
        with zipfile.ZipFile(one) as archive:
            names = archive.namelist()
        require('plugin.json' in names and 'skills/framemotion/SKILL.md' in names, 'Archive root files missing')
        require(not any('node_modules' in n for n in names), 'node_modules leaked into the archive')
        print(f'Archive: {len(names)} files, {one.stat().st_size / 1e6:.1f} MB', flush=True)
    print('PASS: manifests, contract, links, tests and reproducible archive' + (' (fast: Node.js suites skipped)' if fast else ''))


if __name__ == '__main__':
    main()
