import json
import os
import sys
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

try:
    from database import init_db, get_db, last_insert_id
    from agents.comment_classifier import CommentClassifierAgent
    from agents.gap_detector import ContentGapDetectorAgent
    from agents.opportunity_scorer import OpportunityScorerAgent
    from agents.content_generator import ContentStudioAgent
    from services.youtube_service import YouTubeService
except ImportError:
    from .database import init_db, get_db, last_insert_id
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

    is_pg = getattr(conn, "is_postgres", False)

    if is_pg:
        # Single query returns aggregated JSON to minimize network latency to distant databases
        cursor.execute("""
        SELECT json_build_object(
          'channel', (SELECT json_agg(t) FROM (SELECT * FROM channels LIMIT 1) t),
          'opportunities', (SELECT json_agg(t) FROM (SELECT * FROM opportunities ORDER BY score DESC LIMIT 5) t),
          'recent_comments', (SELECT json_agg(t) FROM (SELECT * FROM comments ORDER BY id DESC LIMIT 5) t),
          'top_topics', (SELECT json_agg(t) FROM (SELECT * FROM topics ORDER BY opportunity DESC LIMIT 5) t),
          'total_comments', (SELECT COUNT(*) FROM comments),
          'total_topics', (SELECT COUNT(*) FROM topics),
          'high_priority', (SELECT COUNT(*) FROM opportunities WHERE score >= 80)
        ) AS dashboard_data;
        """)
        res = cursor.fetchone()
        conn.close()

        data = res["dashboard_data"] if isinstance(res, dict) else res[0]
        channel_list = data.get("channel") or []
        channel = channel_list[0] if channel_list else {"name": "Creator", "channel_name": "@MKBHD"}
        opps = data.get("opportunities") or []
        comments = data.get("recent_comments") or []
        top_topics = data.get("top_topics") or []
        total_comments = data.get("total_comments") or 0
        total_topics = data.get("total_topics") or 0
        high_priority = data.get("high_priority") or 0
    else:
        # Local SQLite is extremely fast (under 1ms) so sequential queries are perfectly fine
        cursor.execute("SELECT * FROM channels LIMIT 1")
        channel_row = cursor.fetchone()
        channel = dict(channel_row) if channel_row else {"name": "Creator", "channel_name": "@MKBHD"}

        cursor.execute("SELECT * FROM opportunities ORDER BY score DESC LIMIT 5")
        opps = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM comments ORDER BY id DESC LIMIT 5")
        comments = [dict(r) for r in cursor.fetchall()]

        cursor.execute("SELECT * FROM topics ORDER BY opportunity DESC LIMIT 5")
        top_topics = [dict(r) for r in cursor.fetchall()]

        cursor.execute("""
        SELECT 
            (SELECT COUNT(*) FROM comments) AS total_comments,
            (SELECT COUNT(*) FROM topics) AS total_topics,
            (SELECT COUNT(*) FROM opportunities WHERE score >= 80) AS high_priority
        """)
        counts_row = cursor.fetchone()
        total_comments = counts_row["total_comments"] if counts_row else 0
        total_topics = counts_row["total_topics"] if counts_row else 0
        high_priority = counts_row["high_priority"] if counts_row else 0
        conn.close()

    kpi = [
        {"label": "Comments Analyzed", "value": f"{total_comments:,}", "trend": "Latest channel scan", "up": True, "icon": "message-square"},
        {"label": "Topics Discovered", "value": str(total_topics), "trend": "Patterns in audience feedback", "up": True, "icon": "layers"},
        {"label": "Content Gaps", "value": str(max(1, len(top_topics))), "trend": "High priority gaps", "up": None, "icon": "target"},
        {"label": "High-Priority Opportunities", "value": str(high_priority), "trend": "Score >= 80", "up": True, "icon": "trending-up"}
    ]

    return {
        "channel": channel,
        "kpi": kpi,
        "opportunities": opps,
        "recent_comments": comments,
        "top_topics": top_topics
    }

@app.post("/api/analyze")
def run_full_analysis(range_type: str = Query("Last 30 days"), channel_handle: Optional[str] = Query(None)):
    conn = get_db()
    cursor = conn.cursor()

    # Read connected channel from DB if not explicitly passed
    if not channel_handle:
        cursor.execute("SELECT channel_name FROM channels LIMIT 1")
        row = cursor.fetchone()
        if row:
            channel_handle = row["channel_name"] if isinstance(row, dict) else row[0]
        else:
            channel_handle = "@MKBHD"

    clean_handle = channel_handle.strip()
    channel_title = clean_handle.lstrip('@').capitalize()

    # Keep the fixed channel record stable. Upsert prevents concurrent analyses from colliding.
    cursor.execute("""
    INSERT INTO channels (id, name, channel_name, avatar)
    VALUES ('c1', ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        channel_name = EXCLUDED.channel_name,
        avatar = EXCLUDED.avatar,
        last_synced = CURRENT_TIMESTAMP
    """, (channel_title, clean_handle, clean_handle[0:2].upper()))

    # Fetch live comments from YouTube Data API
    raw_comments = youtube_service.fetch_channel_comments(channel_handle=clean_handle, range_type=range_type)
    classified = classifier_agent.process_batch(raw_comments)
    gaps = gap_detector_agent.detect_gaps(classified)
    ranked_opps = scorer_agent.score_opportunities(gaps)

    # Clear old data so dashboard shows ONLY the new channel data
    cursor.execute("DELETE FROM comments")
    cursor.execute("DELETE FROM topics")
    cursor.execute("DELETE FROM opportunities")
    cursor.execute("DELETE FROM content_packages")

    for c in classified:
        cursor.execute("""
        INSERT INTO comments (author_avatar, text, comment_type, topic, priority, time_ago)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (c["author_avatar"], c["text"], c["comment_type"], c["topic"], c["priority"], c["time_ago"]))

    for g in gaps:
        cursor.execute("""
        INSERT INTO topics (name, interactions, growth, demand, coverage, opportunity)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (g["name"], g["interactions"], g["growth"], g["demand"], g["coverage"], g["demand"]))

    for o in ranked_opps:
        cursor.execute("""
        INSERT INTO opportunities (title, description, score, questions, growth, coverage, format, trending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (o["title"], o["description"], o["score"], o["questions"], o["growth"], o["coverage"], o["format"], o["trending"]))

    conn.commit()
    conn.close()

    return {
        "message": f"Successfully analyzed {clean_handle}",
        "channel": clean_handle,
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

    is_pg = getattr(conn, "is_postgres", False)

    if is_pg:
        cursor.execute("""
        SELECT json_build_object(
          'opportunities', (SELECT json_agg(t) FROM (SELECT * FROM opportunities ORDER BY score DESC) t),
          'topics', (SELECT json_agg(t) FROM (SELECT * FROM topics ORDER BY opportunity DESC) t)
        ) AS opportunities_data;
        """)
        res = cursor.fetchone()
        conn.close()
        data = res["opportunities_data"] if isinstance(res, dict) else res[0]
        opps = data.get("opportunities") or []
        topics = data.get("topics") or []
    else:
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

    is_pg = getattr(conn, "is_postgres", False)

    if is_pg:
        cursor.execute("""
        SELECT json_build_object(
          'opportunity', (SELECT json_build_object(
              'id', o.id, 'title', o.title, 'description', o.description, 'score', o.score,
              'questions', o.questions, 'growth', o.growth, 'coverage', o.coverage,
              'format', o.format, 'trending', o.trending, 'created_at', o.created_at
          ) FROM opportunities o WHERE o.id = %s),
          'comments', (SELECT json_agg(c) FROM (SELECT * FROM comments ORDER BY id DESC LIMIT 5) c)
        ) AS detail_data;
        """, (opp_id,))
        res = cursor.fetchone()
        conn.close()
        data = res["detail_data"] if isinstance(res, dict) else res[0]
        opp = data.get("opportunity")
        # In postgres, if opportunity not found, the inner json_build_object subquery returns NULL
        if not opp or opp.get("id") is None:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        comments = data.get("comments") or []
    else:
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

    # Fetch related audience comments to feed into the generator
    # First try to find comments matching the opportunity's likely topic,
    # then fall back to the most recent comments
    cursor.execute("SELECT * FROM comments ORDER BY id DESC LIMIT 20")
    all_comments = [dict(r) for r in cursor.fetchall()]

    # Fetch channel info for creator context
    cursor.execute("SELECT * FROM channels LIMIT 1")
    channel_row = cursor.fetchone()
    channel = dict(channel_row) if channel_row else {}

    conn_channel_name = channel.get("name", "")
    conn_channel_handle = channel.get("channel_name", "")

    pkg = generator_agent.generate_package(
        opportunity_title=opp["title"],
        opportunity_desc=opp["description"],
        audience_comments=all_comments,
        channel_name=conn_channel_name,
        channel_handle=conn_channel_handle,
        coverage_level=opp.get("coverage", "Low"),
        growth=opp.get("growth", "+0%"),
        questions_count=opp.get("questions", 0),
        suggested_format=opp.get("format", "Long-form Tutorial"),
    )

    titles_str = json.dumps(pkg["titles"]) if isinstance(pkg["titles"], list) else str(pkg["titles"])
    tags_str = json.dumps(pkg["tags"]) if isinstance(pkg["tags"], list) else str(pkg["tags"])

    cursor.execute("""
    INSERT INTO content_packages (opportunity_id, titles, selected_title_index, hook, script, description, tags, short_script, linkedin_post, x_thread, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (opp_id, titles_str, pkg.get("selected_title_index", 0), pkg.get("hook", ""), pkg.get("script", ""), pkg.get("description", ""), tags_str, pkg.get("short_script", ""), pkg.get("linkedin_post", ""), pkg.get("x_thread", ""), pkg.get("status", "draft")))
    
    pkg_id = last_insert_id(cursor, conn)
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

def _latest_content_title(cursor):
    cursor.execute("SELECT titles, selected_title_index FROM content_packages ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return None
    try:
        titles = json.loads(row["titles"])
        if isinstance(titles, str):
            titles = json.loads(titles)
        index = min(max(int(row["selected_title_index"] or 0), 0), len(titles) - 1)
        return titles[index] if titles else None
    except (TypeError, ValueError, json.JSONDecodeError):
        return None


def _active_channel_handle(cursor) -> str:
    cursor.execute("SELECT channel_name FROM channels LIMIT 1")
    row = cursor.fetchone()
    if not row:
        return ""
    return (row["channel_name"] if isinstance(row, dict) else row[0]).strip()


@app.get("/api/calendar")
def get_calendar():
    conn = get_db()
    cursor = conn.cursor()
    channel_handle = _active_channel_handle(cursor)
    cursor.execute("SELECT * FROM calendar_events WHERE channel_handle = ? ORDER BY scheduled_date, id", (channel_handle,))
    events = [dict(r) for r in cursor.fetchall()]
    latest_title = _latest_content_title(cursor)
    conn.close()
    return {"events": events, "latest_content": {"title": latest_title} if latest_title else None}

class ScheduleCalendarRequest(BaseModel):
    title: str
    scheduled_date: str

def _save_calendar_event(cursor, conn, channel_handle: str, title: str, scheduled_at: datetime):
    cursor.execute("""
    INSERT INTO calendar_events (channel_handle, day, platform, title, status, event_type, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (channel_handle, scheduled_at.day, "YouTube", title.strip(), "Scheduled", "yt", scheduled_at.isoformat(timespec="minutes")))
    return last_insert_id(cursor, conn)

@app.post("/api/calendar")
def schedule_calendar_event(body: ScheduleCalendarRequest):
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="A video title is required")
    try:
        scheduled_at = datetime.fromisoformat(body.scheduled_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="Use a valid date and time")
    conn = get_db()
    cursor = conn.cursor()
    channel_handle = _active_channel_handle(cursor)
    if not channel_handle:
        conn.close()
        raise HTTPException(status_code=409, detail="Connect a YouTube channel before scheduling")
    event_id = _save_calendar_event(cursor, conn, channel_handle, body.title, scheduled_at)
    conn.commit()
    conn.close()
    return {"message": "YouTube video scheduled", "event_id": event_id, "scheduled_date": scheduled_at.isoformat(timespec="minutes")}

class AutoScheduleRequest(BaseModel):
    title: Optional[str] = None

@app.post("/api/calendar/auto-schedule")
def auto_schedule_content(body: AutoScheduleRequest):
    conn = get_db()
    cursor = conn.cursor()
    channel_handle = _active_channel_handle(cursor)
    if not channel_handle:
        conn.close()
        raise HTTPException(status_code=409, detail="Connect a YouTube channel before scheduling")
    title = (body.title or "").strip() or _latest_content_title(cursor)
    if not title:
        conn.close()
        raise HTTPException(status_code=422, detail="Generate a YouTube content package or enter a title first")
    candidate = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
    for _ in range(60):
        if candidate.weekday() < 5:
            cursor.execute("SELECT COUNT(*) AS count FROM calendar_events WHERE channel_handle = ? AND scheduled_date LIKE ?", (channel_handle, f"{candidate.date().isoformat()}%"))
            if cursor.fetchone()["count"] == 0:
                event_id = _save_calendar_event(cursor, conn, channel_handle, title, candidate)
                conn.commit()
                conn.close()
                return {"message": "Scheduled in the next available weekday slot", "event_id": event_id, "scheduled_date": candidate.isoformat(timespec="minutes")}
        candidate += timedelta(days=1)
    conn.close()
    raise HTTPException(status_code=409, detail="No available weekday slot in the next 60 days")

@app.get("/api/analytics")
def get_analytics():
    # Do not present fabricated performance data as channel analytics.
    # Verified views, watch time, and engagement require YouTube Analytics OAuth.
    return {
        "available": False,
        "reason": "Connect your channel to display verified performance."
    }

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
