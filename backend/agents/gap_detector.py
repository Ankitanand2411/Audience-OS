import os
import json
from typing import List, Dict, Any
from collections import Counter

class ContentGapDetectorAgent:
    """
    Agent that analyzes identified audience topics against existing channel coverage.
    Determines coverage level (Low, Medium, High) and detects content gaps.
    Uses Groq LLM (llama-3.3-70b-versatile) when GROQ_API_KEY is present.
    """

    EXISTING_CHANNEL_VIDEOS = [
        "Getting Started with LangChain",
        "Prompt Engineering 101",
        "Vector Databases Explained",
        "FastAPI Quickstart"
    ]

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY_GAP_DETECTOR") or os.getenv("GROQ_API_KEY")

    def detect_gaps(self, classified_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if self.groq_api_key:
            groq_gaps = self._call_groq_detector(classified_comments)
            if groq_gaps:
                return groq_gaps

        topic_counts = Counter([c["topic"] for c in classified_comments if c["topic"] != "General"])

        results = []
        for topic, count in topic_counts.most_common():
            matching_videos = [v for v in self.EXISTING_CHANNEL_VIDEOS if topic.lower() in v.lower()]
            if not matching_videos:
                coverage = "Low"
            elif len(matching_videos) == 1:
                coverage = "Medium"
            else:
                coverage = "High"

            demand_score = min(98, 50 + count * 8)
            growth_pct = f"+{10 + count * 5}%"

            results.append({
                "name": topic,
                "interactions": count * 15 + 20,
                "growth": growth_pct,
                "demand": demand_score,
                "coverage": coverage,
                "count": count
            })

        return results

    def _call_groq_detector(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            prompt = f"""You are a Content Gap Detector Agent.
Given these classified audience comments:
{json.dumps(comments)}

And existing channel video titles:
{json.dumps(self.EXISTING_CHANNEL_VIDEOS)}

Detect topics, interaction volume, growth percentage, demand score (0-100), and existing coverage level ('Low', 'Medium', 'High').
Return JSON format:
{{
  "gaps": [
    {{
      "name": "Topic Name",
      "interactions": 150,
      "growth": "+34%",
      "demand": 96,
      "coverage": "Low",
      "count": 5
    }}
  ]
}}"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            res = json.loads(response.choices[0].message.content)
            return res.get("gaps", [])
        except Exception as e:
            print(f"[ContentGapDetectorAgent] Groq API call failed: {e}")
            return []
