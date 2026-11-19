"""Real instruments for the composed music: CC0 recordings, fetched on demand, played from the composed score.

The composer writes the notes (progression, rhythms, motif) exactly as for its synthesized instruments; a part whose
timbre family is `sampled` plays those notes from recordings of a real instrument instead. The recordings come from
VS Chamber Orchestra: Community Edition (CC0-1.0), pinned to one commit in `samples-vsco2ce.json`. They are never
bundled in the plugin: `fetch` downloads only the instruments a video uses into a local cache, checks each file's size
and git blob hash, and `mix` fetches what its recipe needs. Without the files (offline, blocked network) the part falls
back to the nearest synthesized family and the mix says so; the timing and the grid never change.

    python samples.py list
    python samples.py fetch piano strings
    python samples.py status
    python samples.py verify piano          # measures the pitch of the cached files against the manifest

Cache: $FRAMEMOTION_SAMPLES, else ~/.cache/framemotion/samples.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np

from synth import RATE

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / 'samples-vsco2ce.json'
RAW = 'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/{commit}/{path}'
# Synthesized family that stands in for an instrument whose files are missing.
FALLBACK = {'piano': 'piano', 'harp': 'string', 'marimba': 'mallet', 'glock': 'mallet', 'flute': 'fm',
            'strings': 'additive', 'cello': 'additive', 'pizz-bass': 'round'}
MISSING = set()  # instruments that fell back to synthesis in this process (reported by sound.py mix)
_DECODED = {}


def manifest():
    return json.loads(MANIFEST.read_text(encoding='utf-8'))


def instruments(part=None):
    items = manifest()['instruments']
    return [name for name, spec in items.items() if part is None or part in spec['parts']]


def cache_dir():
    return Path(os.environ.get('FRAMEMOTION_SAMPLES') or Path.home() / '.cache' / 'framemotion' / 'samples') / 'vsco2ce'


def zone_file(zone):
    return cache_dir() / zone['path']


def blob_sha(data):
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


def valid(zone):
    path = zone_file(zone)
    if not path.is_file() or path.stat().st_size != zone['size']:
        return False
    return blob_sha(path.read_bytes()) == zone['sha']


def download(url, target, size):
    """One file, checked by size; urllib first, curl as a second route (some proxies cut long responses)."""
    tmp = target.with_suffix(target.suffix + '.part')
    for attempt in range(4):
        try:
            if attempt < 2:
                with urllib.request.urlopen(url, timeout=60) as response, open(tmp, 'wb') as out:
                    shutil.copyfileobj(response, out)
            elif shutil.which('curl'):
                subprocess.run(['curl', '-sfL', '--retry', '2', '-o', str(tmp), url], check=True, timeout=180)
            if tmp.is_file() and tmp.stat().st_size == size:
                tmp.replace(target)
                return True
        except Exception:  # noqa: BLE001 - every failure means "try the next route"
            pass
    if tmp.exists():
        tmp.unlink()
    return False


def fetch(names, log=print):
    """Download the instruments' files that are not cached yet. Returns the names that are complete."""
    data = manifest()
    commit = data['source']['commit']
    complete = []
    for name in names:
        spec = data['instruments'].get(name)
        if spec is None:
            raise ValueError(f'unknown instrument {name!r}; known: {", ".join(data["instruments"])}')
        ok = True
        for zone in spec['zones']:
            if valid(zone):
                continue
            target = zone_file(zone)
            target.parent.mkdir(parents=True, exist_ok=True)
            url = RAW.format(commit=commit, path=urllib.parse.quote(zone['path']))
            if not download(url, target, zone['size']) or not valid(zone):
                ok = False
                log(f'{name}: could not fetch {zone["path"]}')
        if ok:
            complete.append(name)
        log(f'{name}: {"ready" if ok else "incomplete"} ({len(spec["zones"])} files, {sum(z["size"] for z in spec["zones"]) / 1e6:.1f} MB)')
    return complete


def cached(name):
    spec = manifest()['instruments'][name]
    return all(zone_file(z).is_file() and zone_file(z).stat().st_size == z['size'] for z in spec['zones'])


def decode(path):
    if path not in _DECODED:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-'],
                             check=True, capture_output=True).stdout
        x = np.frombuffer(raw, '<f4').astype(np.float64)
        peak = float(np.max(np.abs(x))) or 1.0
        # Start on the attack, not on the recording's lead-in, so a note lands on its grid step.
        onset = int(np.argmax(np.abs(x) > 0.02 * peak))
        x = x[max(0, onset - int(0.002 * RATE)):] / peak
        _DECODED[path] = x
    return _DECODED[path]


def voice(name, n, freq, velocity=0.8, release_at=None, release=0.15):
    """`n` samples of `name` playing `freq`, or None when its files are not cached (the caller then synthesizes)."""
    spec = manifest()['instruments'][name]
    target = 69 + 12 * np.log2(freq / 440.0)
    zone = min(spec['zones'], key=lambda z: abs(z['note'] - target))
    path = zone_file(zone)
    if not path.is_file():
        MISSING.add(name)
        return None
    x = decode(path)
    ratio = 2 ** ((target - zone['note']) / 12)
    positions = np.arange(n) * ratio
    out = np.interp(positions, np.arange(len(x)), x, right=0.0)
    if release_at is not None:
        start = int(release_at * RATE)
        if start < n:
            fade = np.ones(n - start)
            m = min(len(fade), int(release * RATE))
            fade[:m] = np.linspace(1, 0, m) ** 2
            fade[m:] = 0.0
            out[start:] *= fade
    out[-min(n, 96):] *= np.linspace(1, 0, min(n, 96))
    return out * velocity


def ensure(recipe, log=print):
    """Fetch the instruments a music recipe plays; returns the names still missing afterwards."""
    names = sorted({p['instrument'] for p in (recipe or {}).get('parts', {}).values() if p and p.get('family') == 'sampled'})
    todo = [name for name in names if not cached(name)]
    if todo:
        log(f'fetching real-instrument samples (CC0): {", ".join(todo)}')
        fetch(todo, log)
    return [name for name in names if not cached(name)]


def measure(path):
    """Fundamental of a cached note (harmonic product spectrum), as a MIDI number."""
    x = decode(path)
    seg = x[int(0.05 * RATE):int(0.05 * RATE) + RATE // 2]
    seg = seg * np.hanning(len(seg))
    spectrum = np.abs(np.fft.rfft(seg, 1 << 20))
    freqs = np.fft.rfftfreq(1 << 20, 1 / RATE)
    hps = spectrum.copy()
    for h in (2, 3, 4):
        d = spectrum[::h]
        hps[:len(d)] *= d
        hps[len(d):] = 0
    band = (freqs > 25) & (freqs < 5000)
    return 69 + 12 * np.log2(freqs[band][np.argmax(hps[band])] / 440.0)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Real-instrument samples (CC0, fetched on demand) for composed music.')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('list')
    sub.add_parser('status')
    f = sub.add_parser('fetch')
    f.add_argument('names', nargs='+')
    v = sub.add_parser('verify')
    v.add_argument('names', nargs='+')
    args = parser.parse_args(argv)
    data = manifest()
    if args.command == 'list':
        print(f"{data['source']['name']} ({data['source']['licence']}), commit {data['source']['commit'][:10]}")
        for name, spec in data['instruments'].items():
            notes = [z['note'] for z in spec['zones']]
            print(f"  {name:10} {spec['label']}; parts: {', '.join(spec['parts'])}; notes {min(notes)}-{max(notes)}; "
                  f"{sum(z['size'] for z in spec['zones']) / 1e6:.1f} MB; {'cached' if cached(name) else 'not cached'}")
        return 0
    if args.command == 'status':
        print(json.dumps({name: cached(name) for name in data['instruments']}, indent=1))
        return 0
    if args.command == 'fetch':
        names = list(data['instruments']) if args.names == ['all'] else args.names
        return 0 if len(fetch(names)) == len(names) else 1
    worst = 0.0
    for name in args.names:
        for zone in data['instruments'][name]['zones']:
            if not zone_file(zone).is_file():
                print(f'{name} {zone["note"]}: not cached')
                continue
            if not 36 < zone['note'] < 90:
                # Very low notes read as their second harmonic and very high ones decay before the window.
                print(f'{name} {zone["note"]}: outside the measurable range, not judged')
                continue
            off = measure(zone_file(zone)) - zone['note']
            worst = max(worst, abs(off))
            print(f'{name} {zone["note"]}: measured offset {off:+.2f} semitones')
    return 0 if worst < 0.5 else 1


if __name__ == '__main__':
    sys.exit(main())
