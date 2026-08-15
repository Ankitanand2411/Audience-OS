# AudienceOS — Production-Ready Content Intelligence Platform

> **Your audience already tells you what to create.**

AudienceOS is an AI-powered content intelligence platform for YouTube creators. It connects to a creator's channel, analyzes audience conversations, identifies recurring questions, requests, confusion, emerging topics, and content gaps, then converts those insights into ranked content opportunities and ready-to-publish content.

---

## 🏗️ Architecture

- **Frontend**: Vite, HTML5, Vanilla JS, Lucide Icons, Custom CSS Design System (`/frontend`)
- **Backend Engine**: FastAPI, Python 3.12, Pydantic, SQLite3 (`/backend`)
- **AI Agent Suite**:
  - `CommentClassifierAgent`: Classifies audience comments into Question, Request, Confusion, Feedback, Idea.
  - `ContentGapDetectorAgent`: Identifies unaddressed topics against existing channel coverage.
  - `OpportunityScorerAgent`: Scores and ranks opportunities (0–100).
  - `ContentStudioAgent`: Generates full content packages (Titles, Hook, Script, Description, Tags, Shorts, Social Posts).

---

## 🚀 Quick Start

### 1. Run Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API server will run at `http://localhost:8000`.  
Swagger UI Documentation: `http://localhost:8000/docs`.

### 2. Run Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

The web application will run at `http://localhost:5173`.

---

## ⚡ Features

- **Dashboard**: High-level KPI metrics, top AI content opportunities, demand trends & recent audience signals.
- **Audience Intelligence**: Dense data presentation of audience comments categorized by intent and priority.
- **Content Opportunities**: Detailed intelligence reports with evidence grids, gap analysis, and recommended hooks.
- **Content Studio**: Multi-section writing workspace for title options, hooks, scripts, descriptions, and tags.
- **Calendar**: Content pipeline schedule and platform status.
- **Analytics**: Channel performance insights with AI recommendations.
