import re
from typing import Dict, Any, List

class CommentClassifierAgent:
    """
    AI Agent that classifies raw YouTube audience comments into structured categories:
    - QUESTION: Audience seeking clarification or direct answers.
    - REQUEST: Explicit requests for new topics, tutorials, or guides.
    - CONFUSION: Viewers expressing difficulty, bugs, or friction.
    - FEEDBACK: General praise, criticism, or video comments.
    - IDEA: Suggestions for future videos or extensions.
    """
    
    KEYWORDS_REQUEST = ["can you make", "please make", "would love a video", "tutorial on", "cover next", "show us how"]
    KEYWORDS_QUESTION = ["how do i", "what is", "why does", "difference between", "is it possible", "how to"]
    KEYWORDS_CONFUSION = ["confused", "stuck", "error", "doesn't work", "struggling", "getting bad results", "issue"]
    KEYWORDS_IDEA = ["what if you", "suggestion", "feature request", "next idea", "project using"]

    def classify_comment(self, comment_text: str, author: str = "Viewer") -> Dict[str, Any]:
        text_lower = comment_text.lower()
        
        # Determine Type
        if any(k in text_lower for k in self.KEYWORDS_REQUEST):
            comment_type = "REQUEST"
            priority = "High"
        elif any(k in text_lower for k in self.KEYWORDS_CONFUSION):
            comment_type = "CONFUSION"
            priority = "High"
        elif any(k in text_lower for k in self.KEYWORDS_QUESTION):
            comment_type = "QUESTION"
            priority = "Medium"
        elif any(k in text_lower for k in self.KEYWORDS_IDEA):
            comment_type = "IDEA"
            priority = "Medium"
        else:
            comment_type = "FEEDBACK"
            priority = "Low"

        # Determine Topic
        topic = "General"
        if "agent" in text_lower:
            topic = "AI Agents"
        elif "mcp" in text_lower:
            topic = "MCP"
        elif "rag" in text_lower or "vector" in text_lower or "chunking" in text_lower:
            topic = "RAG"
        elif "fastapi" in text_lower:
            topic = "FastAPI"
        elif "ollama" in text_lower or "llama" in text_lower or "local" in text_lower:
            topic = "Ollama"
        elif "langchain" in text_lower or "langgraph" in text_lower:
            topic = "LangChain"

        author_initials = "".join([part[0].upper() for part in author.split()[:2]]) if author else "VW"
        
        return {
            "author_avatar": author_initials or "VW",
            "text": comment_text,
            "comment_type": comment_type,
            "topic": topic,
            "priority": priority,
            "time_ago": "Just now"
        }

    def process_batch(self, comments: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        results = []
        for c in comments:
            results.append(self.classify_comment(c.get("text", ""), c.get("author", "Creator Viewer")))
        return results
