# AI Digital Shadow Tracker - Demo Dataset

This directory contains curated data for testing and demonstrating the capabilities of the AI Engine and its Gemini integration.

## 📁 Directory Structure

- `images/`: Contains sample "Original" and "Misused" images.
  - `original_profile.png`: A high-quality professional headshot.
  - `misused_profile.png`: The same headshot used in a suspicious context (crypto scam).
- `demo_data.json`: A structured mapping of test cases, fake websites, and expected risk outcomes.

## 🧪 How to Test

1. **Image Similarity**: Use the `ai-engine` to compare `original_profile.png` and `misused_profile.png`.
   - **Expectation**: High similarity score (>0.90) despite context changes.
2. **Context Analysis (Gemini)**: Feed the `context` from `TC-001` in `demo_data.json` into the `RiskAnalyzer`.
   - **Expectation**: Gemini should identify the "Identity Fraud" and "Investment Scam" patterns.
3. **End-to-End Pipeline**: Upload `original_profile.png` via the Flutter app and simulate a detection using the data in `demo_data.json`.

## 🛡️ Use Cases Covered

- **Impersonation**: Using your face with a fake name.
- **Data Leaks**: Finding your sensitive info in public dumps.
- **Suspicious Usage**: Your data appearing on untrusted or flagged domains.
