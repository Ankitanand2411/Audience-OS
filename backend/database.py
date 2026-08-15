import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "audienceos.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        avatar TEXT,
        connected INTEGER DEFAULT 1,
        last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_avatar TEXT,
        text TEXT NOT NULL,
        comment_type TEXT NOT NULL,
        topic TEXT NOT NULL,
        priority TEXT NOT NULL,
        time_ago TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        interactions INTEGER DEFAULT 0,
        growth TEXT DEFAULT '+0%',
        demand INTEGER DEFAULT 50,
        coverage TEXT DEFAULT 'Low',
        opportunity INTEGER DEFAULT 50
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        score INTEGER NOT NULL,
        questions INTEGER DEFAULT 0,
        growth TEXT DEFAULT '+0%',
        coverage TEXT DEFAULT 'Low',
        format TEXT NOT NULL,
        trending INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS content_packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER,
        titles TEXT NOT NULL, -- JSON array
        selected_title_index INTEGER DEFAULT 0,
        hook TEXT NOT NULL,
        script TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT NOT NULL, -- JSON array
        short_script TEXT,
        linkedin_post TEXT,
        x_thread TEXT,
        status TEXT DEFAULT 'draft',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day INTEGER NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'Draft',
        event_type TEXT DEFAULT 'yt',
        scheduled_date TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_views TEXT NOT NULL,
        engagement_rate TEXT NOT NULL,
        new_comments TEXT NOT NULL,
        avg_watch_time TEXT NOT NULL,
        ai_insight TEXT NOT NULL,
        recommendation TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()
    seed_if_empty()

def seed_if_empty():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM channels")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO channels (id, name, channel_name, avatar, connected)
        VALUES ('c1', 'Ankit', 'AI Engineering Daily', 'A', 1)
        """)

    cursor.execute("SELECT COUNT(*) FROM opportunities")
    if cursor.fetchone()[0] == 0:
        opps = [
            ("AI Agents vs ChatGPT", "Your audience repeatedly asks for a clear explanation of how AI agents differ from traditional LLM applications like ChatGPT.", 96, 127, "+34%", "Low", "YouTube Short", 1),
            ("Complete MCP Tutorial", "Multiple viewers are requesting a step-by-step walkthrough of the Model Context Protocol and how to build custom MCP servers.", 91, 98, "+28%", "Low", "Long-form Tutorial", 1),
            ("RAG Pipeline Best Practices", "Audience members are confused about chunking strategies, embedding selection, and retrieval optimization in RAG systems.", 84, 73, "+21%", "Medium", "Deep Dive Video", 0),
            ("Building with FastAPI + LangChain", "Growing demand for a practical guide on integrating LangChain agents with FastAPI for production deployments.", 78, 62, "+14%", "Medium", "Tutorial Series", 0),
            ("Local LLM Setup Guide", "Viewers want to know how to run LLMs locally with Ollama, vLLM, and llama.cpp for development and privacy.", 72, 54, "+11%", "Medium", "How-to Video", 0)
        ]
        cursor.executemany("""
        INSERT INTO opportunities (title, description, score, questions, growth, coverage, format, trending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, opps)

    cursor.execute("SELECT COUNT(*) FROM comments")
    if cursor.fetchone()[0] == 0:
        cmts = [
            ('SK', 'Can you explain how AI agents actually work? Like the difference between tool-calling and autonomous agents?', 'REQUEST', 'AI Agents', 'High', '2 hours ago'),
            ('PM', 'Can you make a complete MCP tutorial? I\'m struggling with the server setup and tool registration.', 'REQUEST', 'MCP', 'High', '3 hours ago'),
            ('RT', 'I\'m confused about when to use RAG vs fine-tuning. Your last video mentioned both but didn\'t compare them.', 'CONFUSION', 'RAG', 'Medium', '5 hours ago'),
            ('AL', 'Would love to see a production-ready FastAPI + LangChain project. Most tutorials only show toy examples.', 'REQUEST', 'FastAPI', 'Medium', '8 hours ago'),
            ('JD', 'What\'s the best way to run Llama 3 locally on a Mac? Ollama vs llama.cpp?', 'QUESTION', 'Ollama', 'Medium', '12 hours ago'),
            ('MK', 'The multi-agent pattern you showed was amazing. Can you do a full project using CrewAI or AutoGen?', 'IDEA', 'AI Agents', 'High', '1 day ago'),
            ('NR', 'I keep getting bad results with my RAG pipeline. Chunking seems wrong but I don\'t know how to fix it.', 'CONFUSION', 'RAG', 'High', '1 day ago'),
            ('VT', 'Great content on LangChain! Can you cover LangGraph next? The documentation is really confusing.', 'FEEDBACK', 'LangChain', 'Low', '2 days ago')
        ]
        cursor.executemany("""
        INSERT INTO comments (author_avatar, text, comment_type, topic, priority, time_ago)
        VALUES (?, ?, ?, ?, ?, ?)
        """, cmts)

    cursor.execute("SELECT COUNT(*) FROM topics")
    if cursor.fetchone()[0] == 0:
        tpcs = [
            ('AI Agents', 184, '+34%', 96, 'Low', 96),
            ('MCP', 91, '+28%', 88, 'Low', 91),
            ('RAG', 73, '+21%', 82, 'Medium', 84),
            ('FastAPI', 62, '+14%', 71, 'Medium', 78),
            ('LangChain', 58, '+12%', 68, 'High', 62),
            ('Ollama', 54, '+11%', 65, 'Medium', 72),
            ('Vector Databases', 47, '+9%', 58, 'Medium', 61),
            ('Prompt Engineering', 43, '+6%', 52, 'High', 48),
            ('Fine-tuning', 38, '+8%', 55, 'Low', 67),
            ('Multi-agent Systems', 35, '+19%', 61, 'Low', 74)
        ]
        cursor.executemany("""
        INSERT INTO topics (name, interactions, growth, demand, coverage, opportunity)
        VALUES (?, ?, ?, ?, ?, ?)
        """, tpcs)

    cursor.execute("SELECT COUNT(*) FROM calendar_events")
    if cursor.fetchone()[0] == 0:
        events = [
            (18, 'YouTube', 'AI Agents Explained', 'Ready', 'yt'),
            (19, 'Short', 'AI Agents vs ChatGPT', 'Draft', 'short'),
            (20, 'LinkedIn', 'Why AI agents matter', 'Ready', 'linkedin'),
            (21, 'X', 'Agent thread breakdown', 'Draft', 'x'),
            (25, 'YouTube', 'MCP Tutorial Part 1', 'Draft', 'yt'),
            (26, 'Short', 'MCP in 60 seconds', 'Draft', 'short'),
            (27, 'LinkedIn', 'MCP overview post', 'Ready', 'linkedin')
        ]
        cursor.executemany("""
        INSERT INTO calendar_events (day, platform, title, status, event_type)
        VALUES (?, ?, ?, ?, ?)
        """, events)

    cursor.execute("SELECT COUNT(*) FROM content_packages")
    if cursor.fetchone()[0] == 0:
        titles_json = json.dumps([
            "AI Agents vs ChatGPT: What Every Developer Needs to Know",
            "AI Agents Explained: Beyond Simple Chatbots",
            "The Real Difference Between AI Agents and ChatGPT"
        ])
        tags_json = json.dumps(['AI Agents', 'ChatGPT', 'LLM', 'AI Tutorial', 'LangChain', 'Autonomous AI', 'Tool Calling'])
        hook = "If you think an AI agent is just ChatGPT with tools, here's what you're missing. In this video, I'll break down the fundamental difference between a chatbot, a tool-calling workflow, and an autonomous agent — with practical examples you can build today."
        script = """Let me start with a question: When someone says "AI agent," what do you picture?

Most people imagine ChatGPT with access to the internet. But that's like saying a self-driving car is just a regular car with GPS. The difference is fundamental.

[Section 1: What is a Chatbot?]
A chatbot takes your input, processes it through a language model, and gives you an output. It's stateless — each conversation is independent. Think of it as a very sophisticated autocomplete.

[Section 2: Tool-Calling Workflows]
When we add tools — web search, code execution, database queries — we get something more powerful. The LLM decides which tool to use, calls it, and incorporates the result. This is what most people call an "AI agent" today. But it's not quite there yet.

[Section 3: Autonomous Agents]
A true agent has a goal, can plan multi-step actions, maintain state across interactions, and adapt its strategy based on results. It doesn't just respond — it acts with purpose.

[Conclusion]
The key insight? It's about autonomy, not capability. A chatbot responds. A tool-caller executes. An agent decides."""

        description = """In this video, I break down the real differences between AI chatbots, tool-calling LLMs, and autonomous AI agents.

🔑 Key Topics:
- What makes a chatbot different from an agent
- How tool-calling works under the hood  
- The autonomy spectrum in AI systems
- Practical examples of each approach

📚 Resources mentioned in this video:
- LangChain Agents documentation
- AutoGen framework
- CrewAI for multi-agent systems"""

        cursor.execute("""
        INSERT INTO content_packages (opportunity_id, titles, selected_title_index, hook, script, description, tags, status)
        VALUES (1, ?, 0, ?, ?, ?, ?, 'draft')
        """, (titles_json, hook, script, description, tags_json))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    print(f"Initializing SQLite database at: {DB_PATH}")
    init_db()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"Database setup complete! Created {len(tables)} tables: {', '.join(tables)}")
    conn.close()
