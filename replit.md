# AI Digital Shadow Tracker

Full-stack AI app that monitors digital footprints: upload an image or text
snippet, and Gemini-backed analysis classifies the risk (Safe / Suspicious /
High Risk).

## Stack & layout

- `frontend/` — React + Vite SPA (port **5000**, `0.0.0.0`).
- `backend/` — Node.js + Express API (port **3001**, localhost).
- `ai-engine/` — Python Flask service (port **8000**, localhost).
- `cloud-functions/` — Firebase Cloud Functions source (not started by Replit).
- `database/` — Firestore rules.

## Workflows (development)

| Workflow            | Command                       | Port |
|---------------------|-------------------------------|------|
| `Start application` | `cd frontend && npm run dev`  | 5000 |
| `Backend`           | `node backend/index.js`       | 3001 |
| `AI Engine`         | `python ai-engine/main.py`    | 8000 |

Vite proxies `/api/*` and `/health` to the backend on `localhost:3001`.
The backend forwards scans to the AI engine on `localhost:8000`.

## Demo / fallback behaviour

- **Firebase**: `backend/serviceAccountKey.json` is loaded if it contains a real
  private key; otherwise the backend uses an in-memory store for uploads,
  scans and alerts so the demo always works.
- **Gemini**: if `GEMINI_API_KEY` is unset (or rate-limited), the AI engine
  falls back to a deterministic risk classifier based on similarity score and
  context keywords.

## Deployment

Configured for the **VM** target so the Express API and the Flask AI engine can
run side-by-side:

```bash
# build
cd frontend && npm install && npm run build && cd .. && cd backend && npm install

# run
python ai-engine/main.py &
AI_ENGINE_URL=http://localhost:8000 PORT=5000 node backend/index.js
```

In production the backend serves the built React app from `frontend/dist`.

## Recent changes

- Built the missing React SPA (login, dashboard, upload, alerts) with a
  modern dark UI, loading spinner and high-risk popup.
- Added `/api/scan/text`, `/api/alerts`, `/api/files/:name`, `/api/status` and
  in-memory fallbacks throughout the backend.
- Simplified the AI engine to dependency-light Pillow + Gemini with a
  deterministic fallback risk analyzer.
- Reconfigured workflows: frontend on 5000 (webview), backend on 3001 (console),
  AI engine on 8000 (console).
- Switched deployment to VM so both the Node API and Python AI engine run.
- **Premium UI/UX overhaul**: glassmorphism, aurora gradient background,
  Space Grotesk display font, neon glow buttons, animated counters,
  collapsible sidebar, radar pulse on Live Monitor, page-fade transitions,
  drag-and-drop with risk bar on uploads, skeleton loaders, alert sound chime.
- **New components**: HeroBanner, RiskHeatmap (24-cell glow grid),
  IdentityScore (SVG ring with grade & trend), Recommendations
  (Report/Monitor/Ignore actions), AIAssistant (floating chatbot FAB),
  AlertTimeline, ActivityFeed.
- **New backend services & endpoints**:
  - `recommendationService` — actionable next-step suggestions per scan,
    auto-attached to every `/api/scan/*` response.
  - `identityScoreService` — Digital Safety Score 0-100 with grade A-F,
    breakdown and trend. Exposed at `GET /api/identity-score?userId=…`.
  - `assistantService` — Gemini-backed chat with deterministic fallback.
    Exposed at `POST /api/assistant` (accepts `{ message, userId?, scanId?,
    scan? }`). Uses `GEMINI_API_KEY` if present, else friendly heuristic.
