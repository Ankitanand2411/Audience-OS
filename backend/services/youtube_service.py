import os
import httpx
from typing import List, Dict, Any

class YouTubeService:
    """
    Service to interface with YouTube Data API v3.
    Reads YOUTUBE_API_KEY from environment variables.
    Supports resolving handles (@channel), full channel URLs, channel IDs, and live comment threads.
    """

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")

    def resolve_channel_id(self, query: str) -> str:
        if not self.api_key or not query or query == "demo":
            return None

        # Clean query
        query = query.strip()
        
        # Handle full URL like https://www.youtube.com/@MKBHD or https://youtube.com/channel/UC...
        if "youtube.com/" in query:
            parts = query.split("youtube.com/")[-1].strip("/").split("/")
            query = parts[-1]

        # Direct Channel ID check (24 chars starting with UC)
        if query.startswith("UC") and len(query) == 24:
            return query

        handle = query if query.startswith("@") else f"@{query}"
        
        # 1. Try resolving handle
        try:
            url = f"https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle={handle}&key={self.api_key}"
            res = httpx.get(url, timeout=5.0).json()
            items = res.get("items", [])
            if items:
                return items[0]["id"]
        except Exception as e:
            print(f"[YouTubeService] Handle resolution failed for {handle}: {e}")

        # 2. Fallback to search query
        try:
            url = f"https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q={query}&maxResults=1&key={self.api_key}"
            res = httpx.get(url, timeout=5.0).json()
            items = res.get("items", [])
            if items:
                return items[0]["id"]["channelId"]
        except Exception as e:
            print(f"[YouTubeService] Search resolution failed for {query}: {e}")

        return None

    def fetch_channel_comments(self, channel_handle: str = None, range_type: str = "Last 30 days") -> List[Dict[str, str]]:
        if self.api_key and channel_handle:
            real_channel_id = self.resolve_channel_id(channel_handle)
            if real_channel_id:
                print(f"[YouTubeService] Fetching LIVE YouTube comments for channel_id: {real_channel_id}")
                comments = self._fetch_live_youtube_comments(real_channel_id)
                if comments:
                    print(f"[YouTubeService] Successfully retrieved {len(comments)} LIVE YouTube comments!")
                    return comments

        print(f"[YouTubeService] Using fallback audience dataset for handle: {channel_handle}")
        return self._get_fallback_comments()

    def _fetch_live_youtube_comments(self, channel_id: str) -> List[Dict[str, str]]:
        try:
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId={channel_id}&maxResults=100&key={self.api_key}"
            res = httpx.get(url, timeout=8.0).json()
            items = res.get("items", [])
            comments = []
            for item in items:
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "author": snippet.get("authorDisplayName", "Viewer"),
                    "text": snippet.get("textDisplay", "")
                })
            return comments
        except Exception as e:
            print(f"[YouTubeService] Live API comment fetch failed: {e}")
            return []

    def _get_fallback_comments(self) -> List[Dict[str, str]]:
        return [
            {"author": "Siddharth K", "text": "Can you explain how AI agents actually work? Like the difference between tool-calling and autonomous agents?"},
            {"author": "Priya Sharma", "text": "Can you make a complete MCP tutorial? I'm struggling with the server setup and tool registration."},
            {"author": "Rahul T", "text": "I'm confused about when to use RAG vs fine-tuning. Your last video mentioned both but didn't compare them."},
            {"author": "Alex Lin", "text": "Would love to see a production-ready FastAPI + LangChain project. Most tutorials only show toy examples."},
            {"author": "Jacob D", "text": "What's the best way to run Llama 3 locally on a Mac? Ollama vs llama.cpp?"},
            {"author": "Michael K", "text": "The multi-agent pattern you showed was amazing. Can you do a full project using CrewAI or AutoGen?"},
            {"author": "Neha Roy", "text": "I keep getting bad results with my RAG pipeline. Chunking seems wrong but I don't know how to fix it."},
            {"author": "Vikram T", "text": "Great content on LangChain! Can you cover LangGraph next? The documentation is really confusing."}
        ]
