# AudienceOS - Production Content Intelligence Engine

AudienceOS is an AI-powered content intelligence platform for YouTube creators. It converts audience comment streams and engagement signals into actionable, ranked content opportunities and ready-to-publish content packages.

---

## 1. System Architecture

AudienceOS is built as a decoupled, multi-agent platform comprising a high-density frontend client and a Python FastAPI backend service.

```
[ Frontend: Vite + Vanilla JS + CSS Design System ]
                      │
                      │ REST API (JSON / HTTP)
                      ▼
[ Backend: FastAPI Engine (Python 3.12) ]
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  [ SQLite DB ]  [ YouTube API ] [ Groq LLM API ]
                                  (llama-3.3-70b)
```

### Component Breakdown

1. **Frontend Application (`/frontend`)**
   - Built with Vite, ES Modules, and Vanilla JavaScript.
   - Design system styled using pure CSS tokens (dark theme, responsive grid layouts).
   - Dynamic routing and single-page application state management.
   - API client module (`src/api/client.js`) for RESTful interaction with the backend.

2. **Backend Service Engine (`/backend`)**
   - Built with Python 3.12 and FastAPI framework.
   - Native CORS middleware for cross-origin request handling.
   - Persistent SQLite database layer (`audienceos.db`) using Python `sqlite3`.

3. **Groq AI Agent Engine (`/backend/agents`)**
   - `CommentClassifierAgent`: Categorizes audience input using Groq `llama-3.1-8b-instant` or heuristic NLP rule parsing.
   - `ContentGapDetectorAgent`: Identifies missing topics against channel content using Groq `llama-3.3-70b-versatile`.
   - `OpportunityScorerAgent`: Formulates 0-100 priority opportunity scores using demand velocity and coverage penalties.
   - `ContentStudioAgent`: Generates structured content packages using Groq `llama-3.3-70b-versatile`.

4. **External Services (`/backend/services`)**
   - `YouTubeService`: Integrates with YouTube Data API v3 for live video and comment thread fetching.

---

## 2. End-to-End Execution Flow

Here is what actually happens when a user runs AudienceOS:

### Phase 1: Ingestion & Comment Fetching
- The user initiates an audience analysis from the Onboarding flow or Dashboard.
- `YouTubeService` receives the request and fetches raw comment threads from YouTube Data API v3 or local channel streams.

### Phase 2: AI Intent Classification
- `CommentClassifierAgent` processes incoming comments.
- Each comment is analyzed for intent bucket (`QUESTION`, `REQUEST`, `CONFUSION`, `FEEDBACK`, `IDEA`), technology topic, priority level (`High`, `Medium`, `Low`), and author avatar initials.

### Phase 3: Content Gap Detection
- `ContentGapDetectorAgent` aggregates comment topics against existing channel video titles.
- It calculates interaction frequency, growth rate, and assigns coverage levels (`Low`, `Medium`, `High`).

### Phase 4: Opportunity Ranking & Scoring
- `OpportunityScorerAgent` evaluates the topic gaps using the formula:
  `Opportunity Score = (Demand Score * 0.8) + (Mention Volume * 4) - Coverage Penalty`
- Scored opportunities are saved to SQLite and populated on the Dashboard and Opportunities page.

### Phase 5: AI Content Package Generation
- Selecting "Generate Content" calls `ContentStudioAgent` via endpoint `/api/opportunities/{id}/generate`.
- Groq LLM generates viral title variations, a 30-second video hook, a structured multi-section script, an SEO description, tags, YouTube Shorts script, a LinkedIn post, and an X thread.

### Phase 6: Management & Execution
- Generated packages can be edited and saved directly to SQLite from Content Studio.
- Scheduled content is mapped to the monthly Calendar view.
- Channel growth and view analytics are tracked on the Analytics page.

---

## 3. Environment Setup & Configuration

### Prerequisites
- Python 3.12+
- Node.js 18+

### Step 1: Configure Backend Environment
Create a `.env` file inside the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
YOUTUBE_API_KEY=your_youtube_data_api_key_here
```

### Step 2: Start Backend API Server

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API Docs will be available at: `http://localhost:8000/docs`

### Step 3: Start Frontend Client

```bash
cd frontend
npm install
npm run dev
```

Frontend application will be available at: `http://localhost:5173`

---

## 4. API Specification Summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health status check |
| GET | `/api/dashboard` | Dashboard metrics, opportunities, and audience signals |
| POST | `/api/analyze` | Triggers multi-agent audience analysis pipeline |
| GET | `/api/audience` | Classified audience comments and intent distribution |
| GET | `/api/opportunities` | Ranked content opportunities and topic gaps |
| GET | `/api/opportunities/{id}` | Detailed opportunity evidence report |
| POST | `/api/opportunities/{id}/generate` | Invokes Content Studio agent to build package |
| GET | `/api/content-studio` | Latest generated content package |
| POST | `/api/content-studio/save` | Saves edited title, hook, script, and description |
| GET | `/api/calendar` | Monthly scheduled content items |
| GET | `/api/analytics` | Channel performance metrics and AI insights |
| GET | `/api/settings` | Channel configuration and connection status |
