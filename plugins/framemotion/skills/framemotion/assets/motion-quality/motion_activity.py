#!/usr/bin/env python3
"""Motion activity: how much of a rendered video stands still.

A frame check can pass a film whose motion stops after the first second. This tool samples the
encoded video, measures the change between samples and reports the share of still time and the
longest still stretch, outside the holds the plan declares (an end card, a deliberate pause).

    python3 motion_activity.py film.mp4
    python3 motion_activity.py film.mp4 --hold 12.5-15 --json

Needs Python 3.8+, numpy and ffmpeg. It measures pixels, not meaning: a slow drift counts as
motion, and a still that the idea needs is declared with --hold. Exit code 1 when a limit fails.

Two more checks read every frame (at 96x54), after the measured gates of Tejashmakwana/motionmaxxing (G2, G3;
Apache-2.0, credited in NOTICE; the numbers are theirs, this code is ours):
- empty frames: a run of more than 3 frames that are one flat field (grey spread under 1.5 and range under 8)
  fails, outside declared holds; a dip of up to 3 frames inside a transition is fine;
- end hold: how long the picture stands unchanged at the end (mean grey change under 0.35 per frame). Undeclared
  and longer than 1.4 s fails; under 0.6 s is a note (the film ends mid-motion). Declare an end card with --hold.
"""
import argparse
import hashlib
import json
import subprocess
import sys

import numpy as np

SAMPLE_FPS = 6
SIZE = (64, 114)          # width, height of the grey thumbnail; enough to see any visible change
STILL_DIFF = 0.6          # mean absolute grey change per sample below which a sample counts as still
MAX_STILL_SHARE = 0.40    # more than this share of undeclared still time fails
MAX_STILL_SECONDS = 2.5   # an undeclared still longer than this fails
FULL_SIZE = (96, 54)      # every frame, for the empty-frame and end-hold checks
FLAT_STD, FLAT_RANGE, MAX_FLAT_RUN = 1.5, 8, 3
# End hold: FrameMotion's end card holds 1.5-2.5 s (critique.py, the title recipes), so only a longer undeclared
# end fails; motionmaxxing's own 1.4 s limit is for films without an end card.
HOLD_EPS, MAX_END_HOLD, SHORT_END_HOLD = 0.35, 2.5, 0.6


def samples(path, fps=SAMPLE_FPS, size=SIZE):
    width, height = size
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={fps},scale={width}:{height},format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, np.uint8)
    if frames.size < 2 * width * height:
        raise ValueError(f'{path}: fewer than two frames decoded')
    return frames[: frames.size // (width * height) * width * height].reshape(-1, height, width).astype(np.int16)


def parse_hold(text):
    start, end = (float(part) for part in text.split('-', 1))
    if end <= start:
        raise argparse.ArgumentTypeError(f'hold {text}: end must be after start')
    return start, end


def measure(frames, fps=SAMPLE_FPS, holds=(), still_diff=STILL_DIFF):
    change = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    times = (np.arange(change.size) + 1) / fps            # each change ends at this sample time
    held = np.zeros(change.size, bool)
    for start, end in holds:
        held |= (times > start) & (times <= end)
    still = (change < still_diff) & ~held
    counted = (~held).sum()
    longest = run = 0
    longest_end = 0.0
    for index, value in enumerate(still):
        run = run + 1 if value else 0
        if run > longest:
            longest, longest_end = run, float(times[index])
    return {
        'seconds': round(frames.shape[0] / fps, 2),
        'still_share': round(float(still.sum() / counted), 3) if counted else 0.0,
        'longest_still_seconds': round(longest / fps, 2),
        'longest_still_ends_at': round(longest_end, 2),
        'mean_change': round(float(change.mean()), 2),
        'declared_holds': [list(hold) for hold in holds],
    }


def video_fps(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=avg_frame_rate',
                          '-of', 'csv=p=0', path], capture_output=True, text=True, check=True).stdout.strip()
    num, _, den = out.partition('/')
    return float(num) / float(den or 1)


def frame_checks(frames, fps, holds=()):
    """Empty-frame runs and the end hold, from every frame of the video (frames: n x h x w grey)."""
    n = frames.shape[0]
    times = np.arange(n) / fps
    held = np.zeros(n, bool)
    for start, end in holds:
        held |= (times >= start) & (times <= end)
    flat = (frames.reshape(n, -1).std(axis=1) < FLAT_STD) & (np.ptp(frames.reshape(n, -1), axis=1) < FLAT_RANGE) & ~held
    runs, start = [], None
    for index, value in enumerate(list(flat) + [False]):
        if value and start is None:
            start = index
        elif not value and start is not None:
            if index - start > MAX_FLAT_RUN:
                runs.append([round(start / fps, 2), round(index / fps, 2), index - start])
            start = None
    change = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    tail = 0
    for value in change[::-1]:
        if value >= HOLD_EPS:
            break
        tail += 1
    end_hold = round(tail / fps, 2)
    declared = any(end >= (n - 1) / fps - 0.05 and start <= (n - 1 - tail) / fps + 0.05 for start, end in holds)
    return {'empty_runs': runs, 'end_hold_seconds': end_hold, 'end_hold_declared': declared}


def verdict(report, max_share=MAX_STILL_SHARE, max_seconds=MAX_STILL_SECONDS):
    problems = []
    for start, end, count in report.get('empty_runs', []):
        problems.append(f'{count} empty frames (one flat field) from {start} s to {end} s (limit {MAX_FLAT_RUN})')
    if not report.get('end_hold_declared') and report.get('end_hold_seconds', 0) > MAX_END_HOLD:
        problems.append(f"the picture stands still for the last {report['end_hold_seconds']} s (limit {MAX_END_HOLD} s; "
                        'declare an end card with --hold)')
    if report['still_share'] > max_share:
        problems.append(f"{report['still_share']:.0%} of the undeclared time stands still (limit {max_share:.0%})")
    if report['longest_still_seconds'] > max_seconds:
        problems.append(f"a {report['longest_still_seconds']} s still ends at {report['longest_still_ends_at']} s (limit {max_seconds} s)")
    return problems


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('video')
    parser.add_argument('--hold', action='append', type=parse_hold, default=[], help='declared still, seconds START-END; repeatable')
    parser.add_argument('--max-share', type=float, default=MAX_STILL_SHARE)
    parser.add_argument('--max-still', type=float, default=MAX_STILL_SECONDS)
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args(argv)
    try:                                   # an input problem exits 2, never 1, which means REVISE
        frames = samples(args.video)
        fps = video_fps(args.video)
    except FileNotFoundError as error:
        print(f'FFmpeg or ffprobe is not installed: {error}', file=sys.stderr)
        return 2
    except (subprocess.CalledProcessError, ValueError, ZeroDivisionError) as error:
        print(f'cannot read video {args.video}: ' + (error.stderr.decode(errors='replace').strip().splitlines() or ['not a video'])[-1]
              if isinstance(error, subprocess.CalledProcessError) else str(error), file=sys.stderr)
        return 2
    report = measure(frames, holds=args.hold)
    try:
        report.update(frame_checks(samples(args.video, fps=fps, size=FULL_SIZE), fps, args.hold))
    except (subprocess.CalledProcessError, ValueError, ZeroDivisionError) as error:
        print(f'cannot read every frame of {args.video}: {error}', file=sys.stderr)
        return 2
    report['notes'] = ([f"the end holds only {report['end_hold_seconds']} s: the film ends mid-motion (fine when meant)"]
                       if report['end_hold_seconds'] < SHORT_END_HOLD else [])
    with open(args.video, 'rb') as handle:   # binds the result to this exact encoded file for acceptance
        report['video_sha256'] = hashlib.sha256(handle.read()).hexdigest()
    problems = verdict(report, args.max_share, args.max_still)
    report['verdict'] = 'REVISE' if problems else 'PASS'
    report['problems'] = problems
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"{report['verdict']}: still {report['still_share']:.0%}, longest still {report['longest_still_seconds']} s, "
              f"mean change {report['mean_change']}, end hold {report['end_hold_seconds']} s"
              + ''.join(f"\n- {p}" for p in problems) + ''.join(f"\n  note: {n}" for n in report['notes']))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
