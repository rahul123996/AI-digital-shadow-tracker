"""Thin wrapper around google-generativeai for ad-hoc text analysis."""

from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai  # type: ignore
except Exception:  # pragma: no cover
    genai = None


class GeminiService:
    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        if api_key and genai is not None:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
            except Exception as exc:  # pragma: no cover
                print(f"[gemini_service] init failed: {exc}")

    def analyze_footprint(self, content: str) -> Optional[str]:
        if not self.model:
            return None
        prompt = (
            "Analyze the following digital footprint data for security risks "
            f"and privacy leaks: {content}"
        )
        try:
            return self.model.generate_content(prompt).text
        except Exception as exc:
            print(f"[gemini_service] generate_content failed: {exc}")
            return None
