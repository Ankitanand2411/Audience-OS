import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DB_PATH = os.path.join(os.path.dirname(__file__), "audienceos.db")


class PostgresCursor:
    """Keep the route SQL portable while psycopg2 uses %s placeholders."""

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        query = query.replace("?", "%s")
        return self._cursor.execute(query, params) if params is not None else self._cursor.execute(query)

    def executemany(self, query, params):
        return self._cursor.executemany(query.replace("?", "%s"), params)

    def __getattr__(self, name):
        return getattr(self._cursor, name)


import threading

_db_pool = None
_pool_lock = threading.Lock()

def get_pool():
    global _db_pool
    if _db_pool is None:
        with _pool_lock:
            if _db_pool is None:
                if DATABASE_URL and DATABASE_URL.startswith("postgres"):
                    try:
                        from psycopg2.pool import ThreadedConnectionPool
                        url = DATABASE_URL.replace("postgres://", "postgresql://")
                        _db_pool = ThreadedConnectionPool(1, 20, url, connect_timeout=10)
                    except Exception as e:
                        print(f"[Database Pool Error] Failed to create pool: {e}")
    return _db_pool

class PostgresConnection:
    """Expose a sqlite-like cursor interface to the rest of the application."""

    is_postgres = True

    def __init__(self, connection, pool=None):
        self._connection = connection
        self._pool = pool

    def cursor(self, *args, **kwargs):
        return PostgresCursor(self._connection.cursor(*args, **kwargs))

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        if self._pool:
            try:
                self._pool.putconn(self._connection)
            except Exception:
                try:
                    self._connection.close()
                except Exception:
                    pass
        else:
            self._connection.close()

    def __getattr__(self, name):
        return getattr(self._connection, name)


def is_postgres(conn) -> bool:
    return bool(getattr(conn, "is_postgres", False))


def last_insert_id(cursor, conn) -> int:
    """Return the generated primary key for SQLite or PostgreSQL."""
    if is_postgres(conn):
        cursor.execute("SELECT LASTVAL() AS id")
        return cursor.fetchone()["id"]
    return cursor.lastrowid

def get_db():
    if DATABASE_URL and DATABASE_URL.startswith("postgres"):
        pool = get_pool()
        if pool:
            try:
                conn = pool.getconn()
                if conn.closed:
                    pool.putconn(conn, close=True)
                    conn = pool.getconn()
                from psycopg2.extras import RealDictCursor
                conn.cursor_factory = RealDictCursor
                return PostgresConnection(conn, pool)
            except Exception as e:
                raise RuntimeError(f"Could not connect to DATABASE_URL: {e}") from e

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()

        postgres = is_postgres(conn)
        pk_auto = "SERIAL PRIMARY KEY" if postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            channel_name TEXT NOT NULL,
            avatar TEXT,
            connected INTEGER DEFAULT 1,
            last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS comments (
            id {pk_auto},
            author_avatar TEXT,
            text TEXT NOT NULL,
            comment_type TEXT NOT NULL,
            topic TEXT NOT NULL,
            priority TEXT NOT NULL,
            time_ago TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS topics (
            id {pk_auto},
            name TEXT UNIQUE NOT NULL,
            interactions INTEGER DEFAULT 0,
            growth TEXT DEFAULT '+0%',
            demand INTEGER DEFAULT 50,
            coverage TEXT DEFAULT 'Low',
            opportunity INTEGER DEFAULT 50
        )
        """)

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS opportunities (
            id {pk_auto},
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

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS content_packages (
            id {pk_auto},
            opportunity_id INTEGER,
            titles TEXT NOT NULL,
            selected_title_index INTEGER DEFAULT 0,
            hook TEXT NOT NULL,
            script TEXT NOT NULL,
            description TEXT NOT NULL,
            tags TEXT NOT NULL,
            short_script TEXT,
            linkedin_post TEXT,
            x_thread TEXT,
            status TEXT DEFAULT 'draft',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS calendar_events (
            id {pk_auto},
            channel_handle TEXT,
            day INTEGER NOT NULL,
            platform TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'Draft',
            event_type TEXT DEFAULT 'yt',
            scheduled_date TEXT
        )
        """)

        # Existing local databases predate channel-scoped calendar events.
        # Older events intentionally remain unassigned and are never shown for a channel.
        if postgres:
            cursor.execute("ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS channel_handle TEXT")
        else:
            try:
                cursor.execute("ALTER TABLE calendar_events ADD COLUMN channel_handle TEXT")
            except sqlite3.OperationalError:
                pass

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS analytics (
            id {pk_auto},
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
    except Exception as e:
        if DATABASE_URL:
            raise
        print(f"[Database Initialization Warning] {e}")

def seed_if_empty():
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) AS count FROM channels")
        res = cursor.fetchone()
        count = res["count"] if res else 0

        if count == 0:
            cursor.execute("""
            INSERT INTO channels (id, name, channel_name, avatar, connected)
            VALUES ('c1', 'Ankit', 'AI Engineering Daily', 'A', 1)
            """)

        cursor.execute("SELECT COUNT(*) AS count FROM opportunities")
        res = cursor.fetchone()
        count = res["count"] if res else 0

        if count == 0:
            opps = [
                ("AI Agents vs ChatGPT", "Your audience repeatedly asks for a clear explanation of how AI agents differ from traditional LLM applications like ChatGPT.", 96, 127, "+34%", "Low", "YouTube Short", 1),
                ("Complete MCP Tutorial", "Multiple viewers are requesting a step-by-step walkthrough of the Model Context Protocol and how to build custom MCP servers.", 91, 98, "+28%", "Low", "Long-form Tutorial", 1),
                ("RAG Pipeline Best Practices", "Audience members are confused about chunking strategies, embedding selection, and retrieval optimization in RAG systems.", 84, 73, "+21%", "Medium", "Deep Dive Video", 0),
                ("Building with FastAPI + LangChain", "Growing demand for a practical guide on integrating LangChain agents with FastAPI for production deployments.", 78, 62, "+14%", "Medium", "Tutorial Series", 0),
                ("Local LLM Setup Guide", "Viewers want to know how to run LLMs locally with Ollama, vLLM, and llama.cpp for development and privacy.", 72, 54, "+11%", "Medium", "How-to Video", 0)
            ]
            postgres = is_postgres(conn)
            cursor.executemany("""
            INSERT INTO opportunities (title, description, score, questions, growth, coverage, format, trending)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """ if postgres else """
            INSERT INTO opportunities (title, description, score, questions, growth, coverage, format, trending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, opps)

        cursor.execute("SELECT COUNT(*) AS count FROM comments")
        res = cursor.fetchone()
        count = res["count"] if res else 0

        if count == 0:
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
            postgres = is_postgres(conn)
            cursor.executemany("""
            INSERT INTO comments (author_avatar, text, comment_type, topic, priority, time_ago)
            VALUES (%s, %s, %s, %s, %s, %s)
            """ if postgres else """
            INSERT INTO comments (author_avatar, text, comment_type, topic, priority, time_ago)
            VALUES (?, ?, ?, ?, ?, ?)
            """, cmts)

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[Database Seed Warning] {e}")

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database setup complete!")
