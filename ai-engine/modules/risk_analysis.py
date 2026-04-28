"""Risk analysis powered by Gemini, with a deterministic fallback so the
service stays useful even when the API key is missing, the model is not
found, or the response cannot be parsed.

Design notes
------------
* The Gemini prompt is intentionally **simple and strict** — we ask for a
  small JSON object (risk_score / risk_level / reason). This dramatically
  reduces parse failures compared to large schemas.
* Inputs are bounded (content trimmed to 500 chars, sources_found capped
  at 3) so a single bad caller can't blow up the request.
* Every public entry point is wrapped: a missing key, a NotFound error,
  a JSON parse error, or a network blip all degrade to the deterministic
  fallback — we never raise.
* Existing downstream fields (`why_flagged`, `detected_misuse_types`,
  `duplication_factor`, `source`) are *always* present so the rest of the
  app keeps working unchanged.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Sequence

from dotenv import load_dotenv

load_dotenv()

try:
    import google.generativeai as genai  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    genai = None


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GEMINI_MODEL = "gemini-1.5-flash"
MAX_CONTENT_CHARS = 500
MAX_SOURCES = 3

SUSPICIOUS_KEYWORDS = (
    "scam", "fraud", "phishing", "leak", "breach", "dump", "fake",
    "impersonat", "stolen", "unauthorized", "clone", "password",
    "darkweb", "credentials",
)

# Map both the simple Gemini scale (Low/Medium/High) and the legacy scale
# (Safe/Suspicious/High Risk) onto our internal vocabulary.
LEVEL_ALIASES = {
    "low": "Safe", "safe": "Safe",
    "medium": "Suspicious", "suspicious": "Suspicious", "moderate": "Suspicious",
    "high": "High Risk", "high risk": "High Risk", "critical": "High Risk",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clip(text: str, limit: int = MAX_CONTENT_CHARS) -> str:
    if not text:
        return ""
    text = str(text)
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def _normalise_level(level: Any, score: int) -> str:
    if isinstance(level, str):
        mapped = LEVEL_ALIASES.get(level.strip().lower())
        if mapped:
            return mapped
    if score >= 80:
        return "High Risk"
    if score >= 50:
        return "Suspicious"
    return "Safe"


def _extract_keywords(text: str) -> List[str]:
    found: List[str] = []
    blob = (text or "").lower()
    for kw in SUSPICIOUS_KEYWORDS:
        if kw in blob and kw not in found:
            found.append(kw)
    return found[:6]


def _detect_misuse_types(context: str) -> List[str]:
    blob = (context or "").lower()
    out: List[str] = []
    if any(k in blob for k in ("scam", "fraud", "phishing")):
        out.append("Phishing / Scam")
    if any(k in blob for k in ("leak", "breach", "dump", "password")):
        out.append("Data Leak")
    if any(k in blob for k in ("impersonat", "fake profile", "clone")):
        out.append("Impersonation")
    return out


def _build_why_flagged(
    similarity: float,
    context: str,
    content_type: str,
    level: str,
    duplication_factor: float,
    sources_count: int,
) -> List[str]:
    pct = int(round(similarity * 100))
    bullets: List[str] = []

    if similarity >= 0.8:
        bullets.append(f"High {content_type} similarity detected ({pct}%) — strong likeness to the source.")
    elif similarity >= 0.5:
        bullets.append(f"Moderate {content_type} similarity ({pct}%) — partial overlap with the source.")
    else:
        bullets.append(f"Low {content_type} similarity ({pct}%) — limited overlap with the source.")

    keywords = _extract_keywords(context)
    if keywords:
        bullets.append("Suspicious keywords in context: " + ", ".join(keywords) + ".")
    else:
        bullets.append("No suspicious keywords detected in the supplied context.")

    if context and context.strip():
        url_match = re.search(r"https?://[\w./-]+", context)
        if url_match:
            bullets.append(f"Reference to an external source spotted: {url_match.group(0)}.")
        elif level != "Safe":
            bullets.append("Context describes the content appearing on an unverified destination.")
    else:
        bullets.append("No surrounding context was provided — the verdict is based on similarity alone.")

    if sources_count >= 2:
        bullets.append(f"Content surfaced across {sources_count} distinct sources — wider exposure increases risk.")

    if duplication_factor > 0:
        bullets.append(
            f"Repeated usage detected — duplication factor {int(round(duplication_factor * 100))}%, "
            f"risk score boosted accordingly."
        )

    if level == "High Risk":
        bullets.append("Combined signals indicate this content is being misused.")
    elif level == "Suspicious":
        bullets.append("Signals are mixed — manual review is recommended.")
    else:
        bullets.append("No reliable indicators of misuse were observed.")

    return bullets


def _format_sources(sources_found: Optional[Sequence[Any]]) -> List[str]:
    """Normalise sources into short labels and cap at MAX_SOURCES."""
    if not sources_found:
        return []
    out: List[str] = []
    for s in sources_found[:MAX_SOURCES]:
        if isinstance(s, dict):
            label = s.get("label") or s.get("source_domain") or s.get("url") or s.get("kind") or "source"
            kind = s.get("kind")
            out.append(f"{label} ({kind})" if kind else str(label))
        else:
            out.append(str(s))
    return out


# ---------------------------------------------------------------------------
# Deterministic fallback — always returns a valid payload
# ---------------------------------------------------------------------------

def _fallback(
    similarity: float,
    context: str,
    content_type: str,
    duplication_factor: float = 0.0,
    sources_found: Optional[Sequence[Any]] = None,
    note: str = "",
) -> Dict[str, Any]:
    pct = int(round(similarity * 100))
    misuse_types = _detect_misuse_types(context)

    # Base score derived from similarity, then boosted by the duplication
    # factor and the breadth of sources where the content surfaced.
    risk_score = pct
    if duplication_factor > 0.7:
        risk_score += 40
    elif duplication_factor > 0.4:
        risk_score += 25
    elif duplication_factor > 0:
        risk_score += int(round(duplication_factor * 18))

    sources_count = len(sources_found or [])
    if sources_count > 2:
        risk_score += 20

    risk_score = max(0, min(100, risk_score))

    if duplication_factor >= 0.4 and "Repeated Usage" not in misuse_types:
        misuse_types.append("Repeated Usage")
    if sources_count >= 3 and "Wide Exposure" not in misuse_types:
        misuse_types.append("Wide Exposure")

    if risk_score >= 80 or misuse_types:
        level = "High Risk"
        explanation = (
            f"Strong {content_type} match ({pct}%) combined with suspicious context "
            f"suggests potential misuse. Review the source and consider reporting."
        )
    elif risk_score >= 50:
        level = "Suspicious"
        explanation = (
            f"Moderate {content_type} match ({pct}%). The content appears related "
            f"but the context does not yet confirm misuse."
        )
    else:
        level = "Safe"
        explanation = (
            f"Low {content_type} match ({pct}%). No significant signs of misuse "
            f"were detected for this scan."
        )

    if duplication_factor > 0:
        explanation += (
            f" Duplication factor {int(round(duplication_factor * 100))}% applied "
            f"because the content has been seen before."
        )
    if sources_count > 2:
        explanation += f" Detected across {sources_count} sources."
    if note:
        explanation += f" ({note})"

    return {
        "misuse_detected": level == "High Risk",
        "risk_score": risk_score,
        "risk_level": level,
        "reason": explanation,
        "explanation": explanation,
        "detected_misuse_types": misuse_types,
        "why_flagged": _build_why_flagged(
            similarity, context, content_type, level, duplication_factor, sources_count,
        ),
        "duplication_factor": duplication_factor,
        "source": "fallback",
    }


# ---------------------------------------------------------------------------
# Risk analyzer
# ---------------------------------------------------------------------------

class RiskAnalyzer:
    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        if api_key and genai is not None:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(GEMINI_MODEL)
                print(f"[risk_analysis] Gemini model '{GEMINI_MODEL}' ready")
            except Exception as exc:  # pragma: no cover
                print(f"[risk_analysis] Gemini init failed: {exc}")
                self.model = None
        else:
            print("[risk_analysis] GEMINI_API_KEY missing — using deterministic fallback")

    # ------------------------------------------------------------------ prompt
    @staticmethod
    def _build_prompt(content: str, duplication_factor: float, sources: List[str]) -> str:
        clipped = _clip(content)
        sources_line = ", ".join(sources) if sources else "none"
        return (
            "Analyze the following content for potential misuse.\n\n"
            f"Content: {clipped}\n\n"
            f"Duplication Factor: {duplication_factor:.2f}\n"
            f"Sources Found: {sources_line}\n\n"
            "Return ONLY valid JSON in this format:\n"
            "{\n"
            '  "risk_score": number (0-100),\n'
            '  "risk_level": "Low | Medium | High",\n'
            '  "reason": "short explanation"\n'
            "}"
        )

    # ------------------------------------------------------------------ parse
    @staticmethod
    def _safe_parse(text: str) -> Optional[Dict[str, Any]]:
        if not text:
            return None
        # Strip code fences Gemini occasionally wraps the JSON in.
        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        # Some responses prepend explanatory text — grab the first JSON object.
        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except Exception:
                return None

    # --------------------------------------------------------------- entrypoint
    def analyze_risk(
        self,
        similarity_score: float,
        context: str = "",
        content_type: str = "content",
        duplication_factor: float = 0.0,
        sources_found: Optional[Sequence[Any]] = None,
    ) -> Dict[str, Any]:
        """Always returns a valid payload — never raises."""
        try:
            similarity_score = max(0.0, min(1.0, float(similarity_score or 0.0)))
        except Exception:
            similarity_score = 0.0
        try:
            duplication_factor = max(0.0, min(1.0, float(duplication_factor or 0.0)))
        except Exception:
            duplication_factor = 0.0

        compact_sources = _format_sources(sources_found)
        sources_count = len(compact_sources)

        # No model configured → deterministic path.
        if not self.model:
            return _fallback(similarity_score, context, content_type, duplication_factor, sources_found)

        prompt_content = _clip(f"{context or ''}\n{content_type} similarity {int(similarity_score*100)}%")
        prompt = self._build_prompt(prompt_content, duplication_factor, compact_sources)

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            raw_text = getattr(response, "text", "") or ""
            print(f"[risk_analysis] Gemini raw response: {raw_text[:240]}")
            parsed = self._safe_parse(raw_text)
            if not parsed or "risk_score" not in parsed:
                print("[risk_analysis] JSON parse failed or missing risk_score — using fallback")
                return _fallback(
                    similarity_score, context, content_type,
                    duplication_factor, sources_found,
                    note="Gemini fallback: invalid response",
                )

            try:
                base_score = int(round(float(parsed.get("risk_score", 0))))
            except Exception:
                base_score = 0
            base_score = max(0, min(100, base_score))

            # Apply duplication / source-spread boosts on top of Gemini's score.
            boosted = base_score
            if duplication_factor > 0:
                boosted = min(100, boosted + int(round(duplication_factor * 18)))
            if sources_count > 2:
                boosted = min(100, boosted + 10)

            level = _normalise_level(parsed.get("risk_level"), boosted)
            reason = str(parsed.get("reason") or parsed.get("explanation") or "Risk evaluated by Gemini.")

            misuse_types = _detect_misuse_types(context)
            if duplication_factor >= 0.4 and "Repeated Usage" not in misuse_types:
                misuse_types.append("Repeated Usage")
            if sources_count >= 3 and "Wide Exposure" not in misuse_types:
                misuse_types.append("Wide Exposure")

            return {
                "misuse_detected": level == "High Risk",
                "risk_score": boosted,
                "risk_level": level,
                "reason": reason,
                "explanation": reason,
                "detected_misuse_types": misuse_types,
                "why_flagged": _build_why_flagged(
                    similarity_score, context, content_type, level,
                    duplication_factor, sources_count,
                ),
                "duplication_factor": duplication_factor,
                "source": "gemini",
            }
        except Exception as exc:
            # Catch-all: NotFound, network, quota, parsing — degrade gracefully.
            print(f"[risk_analysis] Gemini call failed ({exc.__class__.__name__}): {exc}")
            return _fallback(
                similarity_score, context, content_type,
                duplication_factor, sources_found,
                note=f"Gemini fallback: {exc.__class__.__name__}",
            )
