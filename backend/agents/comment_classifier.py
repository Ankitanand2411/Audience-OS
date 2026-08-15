import os
import json
from typing import Dict, Any, List

class CommentClassifierAgent:
    """
    AI Agent that classifies raw YouTube audience comments into structured categories:
    - QUESTION: Audience seeking clarification or direct answers.
    - REQUEST: Explicit requests for new topics, tutorials, or guides.
    - CONFUSION: Viewers expressing difficulty, bugs, or friction.
    - FEEDBACK: General praise, criticism, or video comments.
    - IDEA: Suggestions for future videos or extensions.

    Uses Groq LLM (llama-3.3-70b-versatile / llama-3.1-8b-instant) when GROQ_API_KEY is available.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")

    def _call_groq(self, comments: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            system_prompt = """You are an AI Audience Intelligence Agent for YouTube creators.
Analyze the provided list of audience comments and classify each into:
- comment_type: QUESTION, REQUEST, CONFUSION, FEEDBACK, or IDEA
- topic: The main technology or subject (e.g. AI Agents, MCP, RAG, FastAPI, LangChain, Ollama)
- priority: High, Medium, or Low
- author_avatar: 2-letter uppercase initials of author name

Return JSON array with objects matching:
[
  {
    "author_avatar": "SK",
    "text": "original comment text",
    "comment_type": "REQUEST",
    "topic": "AI Agents",
    "priority": "High",
    "time_ago": "Recent"
  }
]"""

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(comments)}
                ],
                response_format={"type": "json_object"}
            )

            res_content = response.choices[0].message.content
            parsed = json.loads(res_content)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for k in ["comments", "results", "data"]:
                    if k in parsed and isinstance(parsed[k], list):
                        return parsed[k]
            return []
        except Exception as e:
            print(f"[CommentClassifierAgent] Groq API call failed, using fallback: {e}")
            return []

    def classify_comment_rule_based(self, comment_text: str, author: str = "Viewer") -> Dict[str, Any]:
        text_lower = comment_text.lower()

        keywords_request = ["can you make", "please make", "would love a video", "tutorial on", "cover next", "show us how"]
        keywords_question = ["how do i", "what is", "why does", "difference between", "is it possible", "how to"]
        keywords_confusion = ["confused", "stuck", "error", "doesn't work", "struggling", "getting bad results", "issue"]
        keywords_idea = ["what if you", "suggestion", "feature request", "next idea", "project using"]

        if any(k in text_lower for k in keywords_request):
            comment_type = "REQUEST"
            priority = "High"
        elif any(k in text_lower for k in keywords_confusion):
            comment_type = "CONFUSION"
            priority = "High"
        elif any(k in text_lower for k in keywords_question):
            comment_type = "QUESTION"
            priority = "Medium"
        elif any(k in text_lower for k in keywords_idea):
            comment_type = "IDEA"
            priority = "Medium"
        else:
            comment_type = "FEEDBACK"
            priority = "Low"

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
        if self.groq_api_key:
            groq_results = self._call_groq(comments)
            if groq_results:
                return groq_results

        results = []
        for c in comments:
            results.append(self.classify_comment_rule_based(c.get("text", ""), c.get("author", "Creator Viewer")))
        return results
