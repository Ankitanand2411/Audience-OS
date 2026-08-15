import json
import os
import sys
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

try:
    from database import init_db, get_db
    from agents.comment_classifier import CommentClassifierAgent
    from agents.gap_detector import ContentGapDetectorAgent
    from agents.opportunity_scorer import OpportunityScorerAgent
    from agents.content_generator import ContentStudioAgent
    from services.youtube_service import YouTubeService
except ImportError:
    from .database import init_db, get_db
    from .agents.comment_classifier import CommentClassifierAgent
    from .agents.gap_detector import ContentGapDetectorAgent
    from .agents.opportunity_scorer import OpportunityScorerAgent
    from .agents.content_generator import ContentStudioAgent
    from .services.youtube_service import YouTubeService

app = FastAPI(
    title="AudienceOS API",
    description="Backend AI Content Intelligence Engine for YouTube Creators",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Agents & Services
classifier_agent = CommentClassifierAgent()
gap_detector_agent = ContentGapDetectorAgent()
scorer_agent = OpportunityScorerAgent()
generator_agent = ContentStudioAgent()
youtube_service = YouTubeService()

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AudienceOS Backend Engine"}

@app.get("/api/dashboard")
def get_dashboard():
    conn = get_db()
    cursor = conn.cursor()

    # Channel info
    cursor.execute("SELECT * FROM channels LIMIT 1")
    channel_row = cursor.fetchone()
    channel = dict(channel_row) if channel_row else {}

    # Opportunities
    cursor.execute("SELECT * FROM opportunities ORDER BY score DESC LIMIT 5")
    opps = [dict(r) for r in cursor.fetchall()]

    # Recent Comments
    cursor.execute("SELECT * FROM comments ORDER BY id DESC LIMIT 4")
    comments = [dict(r) for r in cursor.fetchall()]

    # Topics
    cursor.execute("SELECT * FROM topics ORDER BY opportunity DESC LIMIT 3")
    top_topics = [dict(r) for r in cursor.fetchall()]

    conn.close()

    kpi = [
        {"label": "Comments Analyzed", "value": "8,421", "trend": "+12% this month", "up": True, "icon": "message-square"},
        {"label": "Topics Discovered", "value": "127", "trend": "18 new this week", "up": True, "icon": "layers"},
        {"label": "Content Gaps", "value": "23", "trend": "7 high priority", "up": None, "icon": "target"},
        {"label": "High-Priority Opportunities", "value": str(len([o for o in opps if o["score"] >= 80])), "trend": "3 trending now", "up": True, "icon": "trending-up"}
    ]

    return {
        "channel": channel,
        "kpi": kpi,
        "opportunities": opps,
        "recent_comments": comments,
        "top_topics": top_topics
    }

@app.post("/api/analyze")
def run_full_analysis(range_type: str = Query("Last 30 days")):
    raw_comments = youtube_service.fetch_channel_comments(range_type=range_type)
    classified = classifier_agent.process_batch(raw_comments)
    gaps = gap_detector_agent.detect_gaps(classified)
    ranked_opps = scorer_agent.score_opportunities(gaps)

    conn = get_db()
    cursor = conn.cursor()

    for c in classified:
        cursor.execute("""
        INSERT INTO comments (author_avatar, text, comment_type, topic, priority, time_ago)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (c["author_avatar"], c["text"], c["comment_type"], c["topic"], c["priority"], c["time_ago"]))

    for g in gaps:
        cursor.execute("""
        INSERT INTO topics (name, interactions, growth, demand, coverage, opportunity)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
        interactions=excluded.interactions, growth=excluded.growth, demand=excluded.demand, coverage=excluded.coverage, opportunity=excluded.opportunity
        """, (g["name"], g["interactions"], g["growth"], g["demand"], g["coverage"], g["demand"]))

    for o in ranked_opps:
        cursor.execute("""
        INSERT INTO opportunities (title, description, score, questions, growth, coverage, format, trending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (o["title"], o["description"], o["score"], o["questions"], o["growth"], o["coverage"], o["format"], o["trending"]))

    conn.commit()
    conn.close()

    return {
        "message": "Analysis completed successfully",
        "processed_comments": len(classified),
        "discovered_topics": len(gaps),
        "new_opportunities": len(ranked_opps)
    }

@app.get("/api/audience")
def get_audience():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM comments ORDER BY id DESC")
    comments = [dict(r) for r in cursor.fetchall()]

    stats = [
        {"label": "Questions", "count": str(len([c for c in comments if c['comment_type'] == 'QUESTION']) + 1280), "color": "info"},
        {"label": "Requests", "count": str(len([c for c in comments if c['comment_type'] == 'REQUEST']) + 738), "color": "accent"},
        {"label": "Confusion", "count": str(len([c for c in comments if c['comment_type'] == 'CONFUSION']) + 388), "color": "warning"},
        {"label": "Feedback", "count": str(len([c for c in comments if c['comment_type'] == 'FEEDBACK']) + 283), "color": "success"},
        {"label": "Ideas", "count": str(len([c for c in comments if c['comment_type'] == 'IDEA']) + 177), "color": "default"},
    ]

    conn.close()
    return {"stats": stats, "comments": comments}

@app.get("/api/opportunities")
def get_opportunities():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM opportunities ORDER BY score DESC")
    opps = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM topics ORDER BY opportunity DESC")
    topics = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"opportunities": opps, "topics": topics}

@app.get("/api/opportunities/{opp_id}")
def get_opportunity_detail(opp_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM opportunities WHERE id = ?", (opp_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = dict(row)

    cursor.execute("SELECT * FROM comments ORDER BY id DESC LIMIT 5")
    comments = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"opportunity": opp, "comments": comments}

@app.post("/api/opportunities/{opp_id}/generate")
def generate_content_for_opportunity(opp_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM opportunities WHERE id = ?", (opp_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp = dict(row)
    pkg = generator_agent.generate_package(opp["title"], opp["description"])

    cursor.execute("""
    INSERT INTO content_packages (opportunity_id, titles, selected_title_index, hook, script, description, tags, short_script, linkedin_post, x_thread, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (opp_id, pkg["titles"], pkg["selected_title_index"], pkg["hook"], pkg["script"], pkg["description"], pkg["tags"], pkg["short_script"], pkg["linkedin_post"], pkg["x_thread"], pkg["status"]))
    
    pkg_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"message": "Content generated successfully", "package_id": pkg_id, "package": pkg}

@app.get("/api/content-studio")
def get_content_studio():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM content_packages ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"package": None}

    pkg = dict(row)
    pkg["titles"] = json.loads(pkg["titles"]) if isinstance(pkg["titles"], str) else pkg["titles"]
    pkg["tags"] = json.loads(pkg["tags"]) if isinstance(pkg["tags"], str) else pkg["tags"]

    conn.close()
    return {"package": pkg}

class SaveContentRequest(BaseModel):
    titles: List[str]
    selected_title_index: int
    hook: str
    script: str
    description: str
    tags: List[str]

@app.post("/api/content-studio/save")
def save_content_studio(body: SaveContentRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM content_packages ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if row:
        pkg_id = row["id"]
        cursor.execute("""
        UPDATE content_packages
        SET titles = ?, selected_title_index = ?, hook = ?, script = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """, (json.dumps(body.titles), body.selected_title_index, body.hook, body.script, body.description, json.dumps(body.tags), pkg_id))
    else:
        cursor.execute("""
        INSERT INTO content_packages (titles, selected_title_index, hook, script, description, tags)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (json.dumps(body.titles), body.selected_title_index, body.hook, body.script, body.description, json.dumps(body.tags)))

    conn.commit()
    conn.close()
    return {"message": "Saved successfully"}

@app.get("/api/calendar")
def get_calendar():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM calendar_events")
    events = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {"events": events}

@app.get("/api/analytics")
def get_analytics():
    metrics = [
        {"label": "Total Views", "value": "142.8K", "trend": "+18% vs last month", "up": True},
        {"label": "Engagement Rate", "value": "8.4%", "trend": "+2.1% vs last month", "up": True},
        {"label": "New Comments", "value": "1,247", "trend": "+31% vs last month", "up": True},
        {"label": "Avg. Watch Time", "value": "6m 42s", "trend": "+12% vs last month", "up": True}
    ]

    ai_insight = {
        "insight": "AI-agent content is currently outperforming your channel average by 2.4×. Audience interaction around practical tutorials has increased 31% this month.",
        "recommendation": "Create more practical AI-agent tutorials."
    }

    return {"metrics": metrics, "ai_insight": ai_insight}

@app.get("/api/settings")
def get_settings():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM channels LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return {"channel": dict(row) if row else {}}

class UpdateSettingsRequest(BaseModel):
    name: str
    channel_name: str

@app.post("/api/settings")
def update_settings(body: UpdateSettingsRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("UPDATE channels SET name = ?, channel_name = ?, last_synced = CURRENT_TIMESTAMP WHERE id = 'c1'", (body.name, body.channel_name))
    if cursor.rowcount == 0:
        cursor.execute("INSERT INTO channels (id, name, channel_name, avatar, connected) VALUES ('c1', ?, ?, ?, 1)", (body.name, body.channel_name, body.name[0] if body.name else 'C'))

    conn.commit()
    conn.close()
    return {"message": "Channel settings updated successfully"}
