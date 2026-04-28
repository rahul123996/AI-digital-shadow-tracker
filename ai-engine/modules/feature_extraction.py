"""Lightweight similarity helpers used by the scan pipeline.

Kept intentionally dependency-free (Pillow only) so the AI engine starts
fast and works offline; heavier model-based extraction can replace these
without changing the public surface.
"""

from __future__ import annotations

import re
from typing import Iterable

from PIL import Image


def histogram_similarity(a: Image.Image, b: Image.Image) -> float:
    ha, hb = a.histogram(), b.histogram()
    sa, sb = sum(ha) or 1, sum(hb) or 1
    return max(0.0, min(1.0, sum(min(x / sa, y / sb) for x, y in zip(ha, hb))))


def jaccard_similarity(a: str, b: str) -> float:
    aw = set(_tokens(a))
    bw = set(_tokens(b))
    if not aw or not bw:
        return 0.0
    return len(aw & bw) / len(aw | bw)


def _tokens(s: str) -> Iterable[str]:
    return re.findall(r"[a-z0-9]+", s.lower())
