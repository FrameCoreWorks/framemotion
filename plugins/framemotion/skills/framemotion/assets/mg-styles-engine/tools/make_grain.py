"""FrameMotion's own film-grain plate for the mg-styles engine (Apache-2.0, FrameCore Works).

Writes textures/grain_fine_2048.png: a 2048 x 2048 grey plate of seeded Gaussian noise, mean 128 and
standard deviation about 28, softened by a 0.6 px blur so the grain reads as fine film grain. It stands in
for the upstream grain plate, whose source is not recorded. Run: python3 tools/make_grain.py
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter

rng = np.random.default_rng(2048)
noise = rng.normal(128.0, 34.0, (2048, 2048))
img = Image.fromarray(np.clip(noise, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.6))
a = np.asarray(img, np.float32)
a = (a - a.mean()) / a.std() * 28.0 + 128.0
out = pathlib.Path(__file__).resolve().parent.parent / 'textures' / 'grain_fine_2048.png'
Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), 'L').save(out, optimize=True)
print(out, round(float(a.mean()), 2), round(float(a.std()), 2))
