"""Text + image preprocessing helpers (lightweight)."""

from __future__ import annotations

import re
from io import BytesIO
from typing import Optional

import requests
from PIL import Image


def preprocess_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s@./:_-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_image(src: str, size=(224, 224)) -> Optional[Image.Image]:
    try:
        if src.startswith(("http://", "https://")):
            r = requests.get(src, timeout=8)
            r.raise_for_status()
            img = Image.open(BytesIO(r.content))
        else:
            img = Image.open(src)
        return img.convert("RGB").resize(size)
    except Exception as exc:
        print(f"[preprocessing] image load failed: {exc}")
        return None
