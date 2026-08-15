import httpx
from typing import List, Dict, Any

class YouTubeService:
    """
    Service to interface with YouTube Data API or simulate live comment fetching.
    """

    def fetch_channel_comments(self, channel_id_or_handle: str = "demo", range_type: str = "Last 30 days") -> List[Dict[str, str]]:
        # In live mode with API Key: could fetch via HTTPX YouTube v3 API.
        # Fallback simulator generates realistic audience comment stream for analysis agent.
        sample_comments = [
            {"author": "Siddharth K", "text": "Can you explain how AI agents actually work? Like the difference between tool-calling and autonomous agents?"},
            {"author": "Priya Sharma", "text": "Can you make a complete MCP tutorial? I'm struggling with the server setup and tool registration."},
            {"author": "Rahul T", "text": "I'm confused about when to use RAG vs fine-tuning. Your last video mentioned both but didn't compare them."},
            {"author": "Alex Lin", "text": "Would love to see a production-ready FastAPI + LangChain project. Most tutorials only show toy examples."},
            {"author": "Jacob D", "text": "What's the best way to run Llama 3 locally on a Mac? Ollama vs llama.cpp?"},
            {"author": "Michael K", "text": "The multi-agent pattern you showed was amazing. Can you do a full project using CrewAI or AutoGen?"},
            {"author": "Neha Roy", "text": "I keep getting bad results with my RAG pipeline. Chunking seems wrong but I don't know how to fix it."},
            {"author": "Vikram T", "text": "Great content on LangChain! Can you cover LangGraph next? The documentation is really confusing."}
        ]
        return sample_comments
