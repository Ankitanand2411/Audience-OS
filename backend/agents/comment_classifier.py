import os
import json
from typing import Dict, Any, List
try:
    from .groq_utils import groq_is_available, note_groq_error, run_groq_completion
except ImportError:
    from groq_utils import groq_is_available, note_groq_error, run_groq_completion

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
        self.groq_api_key = os.getenv("GROQ_API_KEY_CLASSIFIER") or os.getenv("GROQ_API_KEY_1") or os.getenv("GROQ_API_KEY")

    def _call_groq(self, comments: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            # Only send comment id and text to save tokens
            payload = [{"id": idx, "text": c.get("text", "")} for idx, c in enumerate(comments)]

            system_prompt = """You are an AI Audience Intelligence Agent for YouTube creators.
Analyze the provided list of comments (each has an 'id' and 'text') and classify each comment into:
- comment_type: QUESTION, REQUEST, CONFUSION, FEEDBACK, or IDEA
- topic: The main technology or subject (e.g. AI Agents, MCP, RAG, FastAPI, LangChain, Ollama)
- priority: High, Medium, or Low

Return a JSON object with a 'classifications' key containing an array of objects matching:
{
  "classifications": [
    {
      "id": 0,
      "comment_type": "REQUEST",
      "topic": "AI Agents",
      "priority": "High"
    }
  ]
}"""

            response = run_groq_completion(
                client,
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(payload)}
                ],
                response_format={"type": "json_object"},
                max_tokens=1000,
            )

            res_content = response.choices[0].message.content
            parsed = json.loads(res_content)
            if isinstance(parsed, dict) and "classifications" in parsed:
                return parsed["classifications"]
            if isinstance(parsed, list):
                return parsed
            return []
        except Exception as e:
            note_groq_error(e, model="llama-3.1-8b-instant")
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
        # Pre-populate all comments using rule-based classification
        results = [
            self.classify_comment_rule_based(c.get("text", ""), c.get("author", "Creator Viewer"))
            for c in comments
        ]

        if self.groq_api_key and groq_is_available():
            # Cap the number of comments sent to the LLM to avoid daily limit exhaustion
            max_llm_comments = 25
            llm_comments = comments[:max_llm_comments]
            
            groq_results = self._call_groq(llm_comments)
            if groq_results:
                # Merge the LLM classifications into our pre-populated results
                for item in groq_results:
                    idx = item.get("id")
                    if idx is not None and 0 <= idx < len(results):
                        results[idx]["comment_type"] = item.get("comment_type", results[idx]["comment_type"])
                        topic_val = item.get("topic")
                        if topic_val and str(topic_val).strip().lower() not in ["none", "general", "unknown", "n/a", "", "other", "others", "null"]:
                            results[idx]["topic"] = str(topic_val).strip()
                        else:
                            results[idx]["topic"] = "General"
                        results[idx]["priority"] = item.get("priority", results[idx]["priority"])

        return results
