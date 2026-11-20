#!/usr/bin/env python3
"""The engine menu, built from engines.json (never from memory).

  python3 menu.py              the groups, numbered, each with one plain sentence
  python3 menu.py 2            the engines in group 2 (or its id, e.g. app-product)
  python3 menu.py --json       the same data as JSON (add a group to narrow it)

Text is English; translate it for the user. Engine ids are for FrameMotion, not for the user.
"""
import json
import sys
from math import gcd
from pathlib import Path

REGISTRY = json.loads((Path(__file__).resolve().parent / 'engines.json').read_text(encoding='utf-8'))


def aspect(size):
    w, h = size['width'], size['height']
    named = {(16, 9): '16:9', (9, 16): '9:16', (1, 1): '1:1', (4, 3): '4:3'}
    g = gcd(w, h)
    return named.get((w // g, h // g), f'{w}x{h}')


def groups():
    """Groups with their engines. An entry with method_of is another way of animating that engine's look: it is
    listed under that engine as one of its ways, not as an engine of its own."""
    out = []
    for n, g in enumerate(REGISTRY['groups'], 1):
        engines = [e for e in REGISTRY['engines'] if e['group'] == g['id'] and not e.get('method_of')]
        out.append({'number': n, **g, 'engines': [
            {'number': k, 'id': e['id'], 'about': e['about'], 'format': aspect(e['size']),
             'good_for': e['good_for'], 'inputs': e['inputs'], 'slow': bool(e.get('gpu_recommended')),
             'ways': [{'id': m['id'], 'about': m['about'], 'format': aspect(m['size'])}
                      for m in REGISTRY['engines'] if m.get('method_of') == e['id']]}
            for k, e in enumerate(engines, 1)]})
    return out


def pick(menu, key):
    for g in menu:
        if key in (str(g['number']), g['id']):
            return g
    sys.exit(f'menu: no group {key!r}; groups are 1-{len(menu)} or their ids')


def main(argv):
    as_json = '--json' in argv
    args = [a for a in argv if a != '--json']
    menu = groups()
    if args:
        g = pick(menu, args[0])
        if as_json:
            print(json.dumps(g, indent=2, ensure_ascii=False))
            return
        print(f"{g['title']}: {g['about']}\n")
        for e in g['engines']:
            slow = ', slower render' if e['slow'] else ''
            print(f"{e['number']}. {e['about']} ({e['format']}{slow})  [{e['id']}]")
            for w in e['ways']:
                print(f"   - {w['about']} ({w['format']})  [way: {w['id']}]")
        return
    if as_json:
        print(json.dumps(menu, indent=2, ensure_ascii=False))
        return
    for g in menu:
        print(f"{g['number']}. {g['title']}: {g['about']}")


if __name__ == '__main__':
    main(sys.argv[1:])
