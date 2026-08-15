import os
import httpx
from typing import List, Dict, Any

class YouTubeService:
    """
    Service to interface with YouTube Data API v3 or simulate live audience comments.
    Reads YOUTUBE_API_KEY from environment variables.
    """

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")

    def fetch_channel_comments(self, channel_id_or_handle: str = "demo", range_type: str = "Last 30 days") -> List[Dict[str, str]]:
        if self.api_key:
            comments = self._fetch_live_youtube_comments(channel_id_or_handle)
            if comments:
                return comments

        return self._get_fallback_comments()

    def _fetch_live_youtube_comments(self, channel_id: str) -> List[Dict[str, str]]:
        try:
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId={channel_id}&maxResults=100&key={self.api_key}"
            res = httpx.get(url, timeout=10.0).json()
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
            print(f"[YouTubeService] Live API call failed, using fallback comments: {e}")
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
