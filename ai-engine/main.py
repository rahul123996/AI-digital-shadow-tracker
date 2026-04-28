"""AI Engine — Flask service for the AI Digital Shadow Tracker.

Endpoints:
  GET  /health              → liveness probe
  POST /analyze             → unified analyzer (image URL or text)
  POST /analyze/image       → image-similarity scan
  POST /analyze/text        → text-similarity scan

Output JSON shape:
  {
    "similarity_score": float,
    "risk_level": "Safe" | "Suspicious" | "High Risk",
    "explanation": str,
    "risk_score": int (0-100),
    "misuse_detected": bool,
    "detected_misuse_types": [str]
  }
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from modules.scan_pipeline import ScanPipeline

load_dotenv()

app = Flask(__name__)
CORS(app)
pipeline = ScanPipeline()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP", "service": "AI Shadow Tracker AI Engine"})


@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "AI Engine running", "endpoints": ["/health", "/analyze", "/analyze/image", "/analyze/text"]})


def _coerce_sources(value):
    if not isinstance(value, list):
        return None
    # Cap at top 3 to keep prompts/payloads small.
    return value[:3]


@app.route("/analyze", methods=["POST"])
def analyze():
    """Unified analyzer.

    Body:
      { "type": "image" | "text",
        "content": "<image url | text>",
        "context": "<optional context>",
        "duplication_factor": 0..1,
        "sources_found": [ ... up to 3 ... ] }
    """
    try:
        data = request.get_json(silent=True) or {}
        kind = (data.get("type") or "text").lower()
        content = data.get("content") or ""
        context = data.get("context", "")
        duplication_factor = float(data.get("duplication_factor") or 0.0)
        sources_found = _coerce_sources(data.get("sources_found"))

        if not content:
            return jsonify({"error": "content is required"}), 400

        if kind == "image":
            result = pipeline.run_image_scan(
                content, context=context,
                duplication_factor=duplication_factor,
                sources_found=sources_found,
            )
        else:
            result = pipeline.run_text_scan(
                content, context=context,
                duplication_factor=duplication_factor,
                sources_found=sources_found,
            )
        return jsonify(result)
    except Exception as exc:
        # Last-resort safety net so the AI engine NEVER 500s on an analyze call.
        print(f"[main] /analyze unhandled error: {exc.__class__.__name__}: {exc}")
        return jsonify({
            "type": (request.get_json(silent=True) or {}).get("type", "text"),
            "similarity_score": 0.0,
            "risk_score": 0,
            "risk_level": "Safe",
            "misuse_detected": False,
            "explanation": f"AI engine recovered from error: {exc.__class__.__name__}",
            "reason": "AI engine internal fallback",
            "detected_misuse_types": [],
            "why_flagged": ["AI engine recovered from an internal error and returned a safe default."],
            "duplication_factor": 0.0,
            "source": "fallback",
        })


@app.route("/analyze/image", methods=["POST"])
def analyze_image():
    data = request.get_json(silent=True) or {}
    image_url = data.get("image_url") or data.get("original_image_path") or data.get("found_image_path")
    context = data.get("context", "")
    duplication_factor = float(data.get("duplication_factor") or 0.0)
    sources_found = _coerce_sources(data.get("sources_found"))
    if not image_url:
        return jsonify({"error": "image_url is required"}), 400
    result = pipeline.run_image_scan(
        image_url, context=context,
        duplication_factor=duplication_factor,
        sources_found=sources_found,
    )
    return jsonify(result)


@app.route("/analyze/text", methods=["POST"])
def analyze_text():
    data = request.get_json(silent=True) or {}
    text = data.get("text") or data.get("original_text") or data.get("found_text")
    context = data.get("context", "")
    duplication_factor = float(data.get("duplication_factor") or 0.0)
    sources_found = _coerce_sources(data.get("sources_found"))
    if not text:
        return jsonify({"error": "text is required"}), 400
    result = pipeline.run_text_scan(
        text, context=context,
        duplication_factor=duplication_factor,
        sources_found=sources_found,
    )
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("AI_ENGINE_PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=False)
