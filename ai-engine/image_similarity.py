"""Backwards-compatible shim that exposes the lightweight similarity helpers."""

from modules.feature_extraction import histogram_similarity
from modules.preprocessing import load_image


def calculate_similarity(image_path1: str, image_path2: str) -> float:
    a = load_image(image_path1)
    b = load_image(image_path2)
    if a is None or b is None:
        return 0.0
    return histogram_similarity(a, b)


if __name__ == "__main__":
    print("Image similarity module loaded")
