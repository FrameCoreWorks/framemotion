#!/usr/bin/env python3
"""FrameMotion: fill a reel style's spec the way the style's own build.py does, without rendering.

    python3 spec.py <style> <spec.json>   ->   prints {"spec": {...}, "duration": seconds}

It loads the style's build.py as a module (its DEFAULTS, check and timing) and the shared
kit/anim.py load_spec, so a spec is checked exactly as upstream checks it. The durations below
repeat the ones each build.py passes to anim.build (graph and map-route 4 s, minimal-line-art the
dot's payoff plus 1.6 s), plus the spec's optional "hold". Rendering is done by FrameMotion's kit.
"""
import sys
sys.dont_write_bytecode = True   # never write __pycache__ into the plugin folder
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'kit'))
import anim  # noqa: E402

DURATION = {
    'graph': lambda mod, s: 4.0,
    'map-route': lambda mod, s: 4.0,
    'minimal-line-art': lambda mod, s: mod.payoff(s) + 1.6,
}


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in DURATION:
        sys.exit(f'usage: spec.py <{"|".join(DURATION)}> <spec.json>')
    style, path = sys.argv[1], sys.argv[2]
    loader = importlib.util.spec_from_file_location(f'reel_{style.replace("-", "_")}', ROOT / 'styles' / style / 'build.py')
    mod = importlib.util.module_from_spec(loader)
    loader.loader.exec_module(mod)
    out = sys.stdout
    sys.stdout = sys.stderr            # load_spec and check print notes; keep stdout for the JSON
    spec = anim.load_spec(path, mod.DEFAULTS)
    if getattr(mod, 'check', None):
        mod.check(spec)
    dur = DURATION[style](mod, spec) + float(spec.get('hold', 0))
    sys.stdout = out
    print(json.dumps({'spec': spec, 'duration': round(dur, 3)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
