#!/usr/bin/env python3
"""Does a rebuild move like its reference? Compare the two clips frame by frame and say what is still off.

  python3 match.py --ref reference.mp4 --copy rebuild.mp4 --out match-r1/ [--mode motion|pixel] [--region x,y,w,h]

The second half of "rebuild from a reference": breakdown.py maps the reference, you build it in code, render
it at the same size and frame rate, and this script measures the rebuild against the reference. Fix the
largest difference, render again, compare again: usually 2 to 5 rounds; after 5 rounds without progress,
report what is left and why. Never loosen a threshold to pass.

Both clips are decoded at the reference's frame rate and a small common size (--region crops both, in
reference pixels). Writes, under --out:
  match.json   offset, motion window and timing errors, activity shape, mismatch per frame, problems, verdict
  match.jpg    the worst frames: reference, rebuild and a red difference map side by side, with the mismatch
  activity.jpg the change per frame of both clips as bars: same shape = same easing and stagger

Verdict (mode motion, the default): start, end and peak of the motion within 0.08 s, the activity centre
within 0.08 s (a front-loaded rebuild against an even reference is a stronger ease-out), no movement where
the reference is still. Mode pixel adds: mean mismatch at most 2 %, no frame above 5 %. Exit 0 match, 1 not
yet, 2 setup problem.

FrameMotion's own code (MIT), written after the record, compare and repeat method of reanimate
(NiazMorshed2007/reanimate, MIT); no upstream code is used. Needs FFmpeg, NumPy and Pillow. Compare only
footage the user owns or may study, and rebuild to learn the motion, never to pass off a copy.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from breakdown import probe  # noqa: E402

TIMING = 0.08          # s: start, end, peak and centre of the motion
MOVING = 1.0           # mean grey-level change per frame that counts as motion (0-255 scale)
PIXEL = 24             # grey-level difference that counts a pixel as mismatched
MEAN_MISMATCH, MAX_MISMATCH = 0.02, 0.05
SIZE = 320             # analysis width


def decode(video, fps, size, region=None):
    crop = f'crop={region[2]}:{region[3]}:{region[0]}:{region[1]},' if region else ''
    w, h = size
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', f'{crop}fps={fps},scale={w}:{h}:flags=area',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def activity(clip):
    grey = clip.astype(np.float32).mean(axis=3)
    change = np.abs(np.diff(grey, axis=0)).mean(axis=(1, 2))
    return np.concatenate([[0.0], change])


def window(act, fps):
    moving = np.flatnonzero(act > MOVING)
    if not len(moving):
        return None
    total = act.sum()
    centre = float((act * np.arange(len(act))).sum() / total) if total else 0.0
    return {'start': moving[0] / fps, 'end': moving[-1] / fps, 'peak': int(np.argmax(act)) / fps, 'centre': centre / fps}


def best_offset(ref, cpy, fps):
    """Rebuild frame matched to reference frame 0, by the activity curves (within one second either way)."""
    best, score = 0, None
    span = int(round(fps))
    for off in range(-span, span + 1):
        a = ref[max(0, -off):]
        b = cpy[max(0, off):]
        n = min(len(a), len(b))
        if n < max(4, len(ref) // 3):
            continue
        err = float(np.abs(a[:n] - b[:n]).mean())
        if score is None or err < score - 1e-9 or (abs(err - score) <= 1e-9 and abs(off) < abs(best)):
            best, score = off, err
    return best


def bars(ref, cpy, path):
    n = max(len(ref), len(cpy))
    w, h = max(400, n * 6), 220
    img = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(img)
    top = max(ref.max(initial=0), cpy.max(initial=0), 1e-6)
    step = w / n
    for curve, colour, y0 in ((ref, (40, 90, 200), 100), (cpy, (220, 70, 40), 210)):
        for i, v in enumerate(curve):
            d.rectangle([i * step, y0 - 90 * v / top, (i + 1) * step - 1, y0], fill=colour)
    d.text((4, 2), 'reference', fill=(40, 90, 200))
    d.text((4, 112), 'rebuild', fill=(220, 70, 40))
    img.save(path)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--ref', required=True)
    ap.add_argument('--copy', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--mode', choices=['motion', 'pixel'], default='motion')
    ap.add_argument('--region', help='x,y,w,h in reference pixels: compare only this part of both frames')
    a = ap.parse_args(argv)
    try:
        rw, rh, fps = probe(a.ref)
        cw, ch, _ = probe(a.copy)
    except (subprocess.CalledProcessError, FileNotFoundError, KeyError, IndexError) as error:
        print(f'SETUP: cannot read the clips ({error})', file=sys.stderr)
        return 2
    region = tuple(int(v) for v in a.region.split(',')) if a.region else None
    if (cw, ch) != (rw, rh):
        print(f'NOTE: sizes differ ({rw}x{rh} against {cw}x{ch}); both are scaled to the same analysis size', file=sys.stderr)
    bw, bh = (region[2], region[3]) if region else (rw, rh)
    size = (SIZE, max(2, int(round(SIZE * bh / bw / 2)) * 2))
    ref = decode(a.ref, fps, size, region)
    scale = (cw / rw, ch / rh)
    cregion = (int(region[0] * scale[0]), int(region[1] * scale[1]), int(region[2] * scale[0]), int(region[3] * scale[1])) if region else None
    cpy = decode(a.copy, fps, size, cregion)
    act_ref, act_cpy = activity(ref), activity(cpy)
    off = best_offset(act_ref, act_cpy, fps)
    a_ref, a_cpy = ref[max(0, -off):], cpy[max(0, off):]
    n = min(len(a_ref), len(a_cpy))
    a_ref, a_cpy = a_ref[:n], a_cpy[:n]
    grey = lambda c: c.astype(np.int16).mean(axis=3)
    diff = np.abs(grey(a_ref) - grey(a_cpy))
    mismatch = (diff > PIXEL).mean(axis=(1, 2))
    win_ref, win_cpy = window(act_ref, fps), window(act_cpy, fps)
    problems = []
    timing = {}
    if abs(off) > 0:
        problems.append(f'the rebuild is {"late" if off > 0 else "early"} by {abs(off)} frames ({abs(off) / fps:.2f} s): fix the start delay, do not rely on alignment')
    if win_ref and win_cpy:
        shift = off / fps
        for key in ('start', 'end', 'peak', 'centre'):
            timing[key] = round(win_cpy[key] - shift - win_ref[key], 3)
            if abs(timing[key]) > TIMING:
                what = {'centre': 'activity centre (easing or stagger shape)'}.get(key, key)
                problems.append(f'{what} off by {timing[key]:+.2f} s (allowed {TIMING} s)')
        ar, ac = act_ref[max(0, -off):][:n], act_cpy[max(0, off):][:n]
        stray = np.flatnonzero((ac > 3 * MOVING) & (ar < MOVING / 2))
        if len(stray) > 2:
            problems.append(f'the rebuild moves where the reference is still ({len(stray)} frames, first at {stray[0] / fps:.2f} s)')
        missing = np.flatnonzero((ar > 3 * MOVING) & (ac < MOVING / 2))
        if len(missing) > 2:
            problems.append(f'the reference moves where the rebuild is still ({len(missing)} frames, first at {missing[0] / fps:.2f} s)')
    elif win_ref and not win_cpy:
        problems.append('the rebuild does not move')
    elif win_cpy and not win_ref:
        problems.append('the reference does not move; compare a clip with motion')
    if a.mode == 'pixel':
        if mismatch.mean() > MEAN_MISMATCH:
            problems.append(f'mean mismatch {mismatch.mean():.1%} (allowed {MEAN_MISMATCH:.0%})')
        if mismatch.max(initial=0) > MAX_MISMATCH:
            problems.append(f'frame {int(mismatch.argmax())} mismatch {mismatch.max():.1%} (allowed {MAX_MISMATCH:.0%})')
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    worst = sorted(np.argsort(mismatch)[::-1][:6].tolist()) if n else []
    cells = []
    for i in worst:
        heat = np.zeros((*diff[i].shape, 3), np.uint8)
        heat[..., 0] = np.clip(diff[i] * 3, 0, 255).astype(np.uint8)
        row = np.concatenate([a_ref[i], a_cpy[i], heat], axis=1)
        img = Image.fromarray(row)
        ImageDraw.Draw(img).text((4, 2), f'{i / fps:.2f}s  {mismatch[i]:.1%}', fill='yellow')
        cells.append(img)
    if cells:
        sheet = Image.new('RGB', (cells[0].width, sum(c.height for c in cells)))
        y = 0
        for c in cells:
            sheet.paste(c, (0, y))
            y += c.height
        sheet.save(out / 'match.jpg', quality=88)
    bars(act_ref, act_cpy, out / 'activity.jpg')
    result = {'reference': str(a.ref), 'rebuild': str(a.copy), 'fps': fps, 'mode': a.mode, 'region': region, 'offset_frames': off,
              'frames_compared': n, 'window_reference': win_ref, 'window_rebuild': win_cpy, 'timing_error_s': timing,
              'mismatch_mean': round(float(mismatch.mean()), 4) if n else None, 'mismatch_max': round(float(mismatch.max()), 4) if n else None,
              'worst_frames': worst, 'problems': problems, 'verdict': 'not_yet' if problems else 'match'}
    (out / 'match.json').write_text(json.dumps(result, indent=2))
    for p in problems:
        print('PROBLEM', p)
    print(f'{"MATCH" if not problems else "NOT YET"}: offset {off} f, mismatch {result["mismatch_mean"]:.1%} mean, {len(problems)} problems ({a.mode}).')
    return 0 if not problems else 1


if __name__ == '__main__':
    sys.exit(main())
