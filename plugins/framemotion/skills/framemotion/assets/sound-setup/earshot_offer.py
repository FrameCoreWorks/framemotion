#!/usr/bin/env python3
"""Before offering the Earshot sound engine: is Python 3.12 here, and did the user already say "not now"?

  python3 earshot_offer.py check      JSON: python312 (path or null), declined (true/false), settings path
  python3 earshot_offer.py decline    remember "not now" (FrameMotion stops asking until the user asks for it)
  python3 earshot_offer.py reset      forget it (the user asked for the engine, or installed it)

The answer lives in ~/.framecore-works/framemotion/settings.json (FRAMEMOTION_SETTINGS overrides the file).
Nothing else is written; the Earshot runtime and its status are not touched. Standard library only.
"""
import datetime
import json
import os
from pathlib import Path
import shutil
import sys

SETTINGS = Path(os.environ.get('FRAMEMOTION_SETTINGS') or Path.home() / '.framecore-works' / 'framemotion' / 'settings.json')


def load():
    try:
        return json.loads(SETTINGS.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def save(data):
    SETTINGS.parent.mkdir(parents=True, exist_ok=True)
    tmp = SETTINGS.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    tmp.replace(SETTINGS)


def main(argv):
    command = argv[0] if argv else 'check'
    data = load()
    if command == 'check':
        offer = data.get('earshot_offer', {})
        print(json.dumps({'python312': shutil.which('python3.12'), 'declined': offer.get('answer') == 'not_now',
                          'declined_on': offer.get('date'), 'settings': str(SETTINGS)}, indent=2))
        return 0
    if command == 'decline':
        data['earshot_offer'] = {'answer': 'not_now', 'date': datetime.date.today().isoformat()}
        save(data)
        print(f'remembered: not now ({SETTINGS})')
        return 0
    if command == 'reset':
        if data.pop('earshot_offer', None) is not None:
            save(data)
        print('forgotten: FrameMotion may offer Earshot again')
        return 0
    print(__doc__, file=sys.stderr)
    return 3


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
