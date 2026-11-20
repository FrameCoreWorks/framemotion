#!/usr/bin/env python3
"""Is a launch or update film's script clear to a stranger with the sound off? English and Polish.

FrameMotion's own check (MIT, like FrameMotion), written after the copy formula of cinetic
(Leonxlnx/cinetic, MIT; see ../cinetic-kit/README.md): by 3 s the viewer knows what the product is,
then one concrete thing per line, then the name and what to do. No upstream code is used.

  python3 copy_check.py script.txt [--kind launch|update] [--name Name] [--json]

The script is a text file, one line of the film per row, optionally timed: `2.4 | The line.`
(seconds). `# ` starts a comment, `name: X` and `kind: update` set the product name and the film kind.
Or a JSON file: {"name": "...", "kind": "launch", "lines": [{"t": 0.4, "text": "..."}]}.

Errors: long (over 7 words), vague (fancy words a customer would not say), metaphor, slogan, claims
(two sentences in one line), name (no line names the product), what-it-is (no line says what it is by
3 s; for an update, no "Name version" line by 3 s). Warnings: keyword (a one-word line other than the
name, a version or the close), close (the film does not end on the name or what to do), quantity
("every", "always", "zawsze"...: one example on screen never proves it). Exit code 0 pass, 1 errors.
"""
import argparse
import json
import re
import sys
from pathlib import Path

MAX_WORDS, WHAT_BY = 7, 3.0
VAGUE = r'''unleash|reimagin\w*|seamless\w*|effortless\w*|elevate\w*|supercharg\w*|next[- ]level|the future of|magic\w*|journey|
unlock\w*|empower\w*|revolutioni[sz]\w*|redefin\w*|game[- ]chang\w*|cutting[- ]edge|state[- ]of[- ]the[- ]art|world[- ]class|
synerg\w*|leverag\w*|transform your|limitless|ultimate|innovative|best[- ]in[- ]class|frictionless|delight\w*|
rewolucyj\w*|rewolucj\w*|innowacyjn\w*|wyjątkow\w*|niesamowit\w*|magiczn\w*|bezprobl\w*|odkryj|uwolnij|przyszłość\w*|podróż\w*|
kompleksow\w*|najwyższ\w* jakości|nowy wymiar|na najwyższym poziomie'''
METAPHOR = r'''superpower\w*|second brain|rocket fuel|on autopilot|secret weapon|swiss army knife|copilot for|
supermoc\w*|drugi mózg|tajna broń|na autopilocie|szwajcarski scyzoryk'''
SLOGAN = [r'^meet\b', r'^poznaj\b', r',\s*reimagined\b', r'\bmade (simple|easy)\b', r'\byour way\b', r'\blike never before\b',
          r'\bjak nigdy (dotąd|wcześniej)\b', r'\bpo twojemu\b', r'^less \w+\.\s*more \w+', r'^mniej \w+\.\s*więcej \w+',
          r'\b\w+ meets \w+\b', r'\?$', r'!$', r'^(\w+\.\s*){3}$']
QUANTITY = r'\b(every|each|all|always|automatically|każd\w*|wszystk\w*|zawsze|automatyczn\w*)\b'
CTA = re.compile(r'\b(out now|out today|available (now|today)|try it|get it|download|sign up|join|już (dziś|jest|dostępn\w*)|'
                 r'pobierz|wypróbuj|zapisz się|dołącz|sprawdź|zamów)\b|\b[\w-]+\.(com|app|dev|io|ai|pl|co|eu|studio)\b', re.I)
VERSION = re.compile(r'(^|\s)v?\d+(\.\d+)+\b|\bv\d+\b|\b(version|wersja) \d+', re.I)
WHAT = re.compile(r'\b(is an?|is the|turns|helps|lets|makes|to (aplikacja|narzędzie|sklep|platforma|program|serwis)|'
                  r'jest \w+|zamienia|pomaga|pozwala|robi)\b', re.I)


def words(text):
    return [w for w in re.split(r'\s+', text.strip()) if re.search(r'\w', w)]


def read(path):
    p = Path(path)
    if p.suffix == '.json':
        data = json.loads(p.read_text(encoding='utf-8'))
        lines = [{'t': l.get('t'), 'text': l['text']} for l in data['lines']]
        return data.get('name'), data.get('kind'), lines
    name = kind = None
    lines = []
    for raw in p.read_text(encoding='utf-8').splitlines():
        row = raw.strip()
        if not row or row.startswith('#'):
            continue
        meta = re.match(r'^(name|kind)\s*:\s*(.+)$', row, re.I)
        if meta:
            if meta.group(1).lower() == 'name':
                name = meta.group(2).strip()
            else:
                kind = meta.group(2).strip().lower()
            continue
        timed = re.match(r'^(\d+(?:\.\d+)?)\s*\|\s*(.+)$', row)
        lines.append({'t': float(timed.group(1)), 'text': timed.group(2).strip()} if timed else {'t': None, 'text': row})
    return name, kind, lines


def check(lines, name=None, kind='launch'):
    issues = []
    add = lambda sev, check_, i, detail: issues.append({'severity': sev, 'check': check_, 'line': i + 1 if i is not None else None,
                                                        'text': lines[i]['text'] if i is not None else '', 'detail': detail})
    # untimed lines are spaced 1.5 s apart, the shortest hold that a line of a few words can be read in
    times = [l['t'] if l['t'] is not None else i * 1.5 for i, l in enumerate(lines)]
    named = lambda text: bool(name) and name.lower() in text.lower()
    for i, line in enumerate(lines):
        text, n = line['text'], len(words(line['text']))
        if n > MAX_WORDS:
            add('error', 'long', i, f'{n} words; keep a line to 2-{MAX_WORDS} words, one line on screen at a time')
        if n == 1 and not named(text) and not VERSION.search(text) and not CTA.search(text) and i != len(lines) - 1:
            add('warning', 'keyword', i, 'a one-word line says nothing on its own: say what the product does, with a verb')
        for label, pattern in (('vague', VAGUE), ('metaphor', METAPHOR)):
            hit = re.search(pattern.replace('\n', ''), text, re.I)
            if hit:
                add('error', label, i, f'"{hit.group(0)}": say the concrete thing a customer would say')
        for pattern in SLOGAN:
            if re.search(pattern, text.strip(), re.I):
                add('error', 'slogan', i, 'a slogan shape (Meet X, X meets Y, Less X. More Y., a question, an exclamation): state one plain fact')
                break
        if len(re.findall(r'[.!?](\s|$)', text.strip())) >= 2 and not re.match(r'^(\w+\.\s*){3}$', text.strip()):
            add('error', 'claims', i, 'two sentences in one line: one claim a line')
        hit = re.search(QUANTITY, text, re.I)
        if hit:
            add('warning', 'quantity', i, f'"{hit.group(0)}": one example on screen does not prove it; show several or drop the word')
    if name and not any(named(l['text']) for l in lines):
        add('error', 'name', None, f'no line names {name}')
    early = [i for i, t in enumerate(times) if t <= WHAT_BY]
    if kind == 'update':
        if not any(VERSION.search(lines[i]['text']) for i in early):
            add('error', 'what-it-is', None, f'an update film opens on "Name version" by {WHAT_BY:g} s')
    elif not any(WHAT.search(lines[i]['text']) or (named(lines[i]['text']) and len(words(lines[i]['text'])) > 2) for i in early):
        add('error', 'what-it-is', None, f'no line says what the product is by {WHAT_BY:g} s ("Name is a ... for ...", "Name turns ... into ...")')
    if lines and not (named(lines[-1]['text']) or CTA.search(lines[-1]['text'])):
        add('warning', 'close', len(lines) - 1, 'end on the name and what to do (a web address, "Out now", "Pobierz")')
    return issues


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('script')
    ap.add_argument('--kind', choices=['launch', 'update'])
    ap.add_argument('--name')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args(argv)
    name, kind, lines = read(a.script)
    name, kind = a.name or name, a.kind or kind or 'launch'
    issues = check(lines, name, kind)
    errors = sum(i['severity'] == 'error' for i in issues)
    if a.json:
        print(json.dumps({'kind': kind, 'name': name, 'lines': len(lines), 'issues': issues,
                          'verdict': 'fail' if errors else 'pass'}, ensure_ascii=False, indent=2))
    else:
        for i in issues:
            where = f'line {i["line"]} ' if i['line'] else ''
            print(f'{i["severity"].upper()} {i["check"]} {where}{i["text"]!r}: {i["detail"]}' if i['text'] else f'{i["severity"].upper()} {i["check"]}: {i["detail"]}')
        print(f'{"FAIL" if errors else "PASS"}: {errors} errors, {len(issues) - errors} warnings in {len(lines)} lines ({kind}).')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
