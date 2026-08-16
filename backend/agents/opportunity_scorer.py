import os
import json
from typing import List, Dict, Any
try:
    from .groq_utils import groq_is_available, note_groq_error, run_groq_completion
except ImportError:
    from groq_utils import groq_is_available, note_groq_error, run_groq_completion

class OpportunityScorerAgent:
    """
    Ranks audience demand clusters into priority Content Opportunities (0-100 score).
    Uses deterministic scoring by default. Groq is an optional enhancement,
    enabled only with GROQ_ENABLE_ANALYSIS=true.
    """

    FORMAT_HEURISTICS = {
        "short": "YouTube Short",
        "quick": "YouTube Short",
        "guide": "Comprehensive Guide",
        "tutorial": "Long-form Tutorial",
        "how": "How-to Video",
        "deep": "Deep Dive Video",
        "series": "Tutorial Series",
        "comparison": "Comparison Video",
        "vs": "Comparison Video",
        "review": "Review Video",
        "best": "Listicle Video",
    }

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY_SCORER") or os.getenv("GROQ_API_KEY")
        self.use_groq = os.getenv("GROQ_ENABLE_ANALYSIS", "false").lower() == "true"

    def score_opportunities(self, gap_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if self.groq_api_key and self.use_groq and groq_is_available():
            groq_opps = self._call_groq_scorer(gap_results)
            if groq_opps:
                return groq_opps

        opportunities = []
        for idx, gap in enumerate(gap_results, 1):
            cov_penalty = 30 if gap["coverage"] == "High" else 15 if gap["coverage"] == "Medium" else 0
            raw_score = int(gap["demand"] * 0.8 + gap.get("count", 1) * 4 - cov_penalty)
            final_score = max(50, min(99, raw_score))

            topic_name = gap.get("name", "Unknown Topic")
            coverage = gap.get("coverage", "Low")

            # Generate a meaningful description based on coverage level
            if coverage == "Low":
                desc = (
                    f"Your audience is actively asking about {topic_name} but your channel "
                    f"has no dedicated content on this yet. With {gap.get('interactions', 0)} "
                    f"audience interactions and {gap.get('growth', '+0%')} mention growth, "
                    f"this is a high-priority gap to fill."
                )
            elif coverage == "Medium":
                desc = (
                    f"You've touched on {topic_name} before, but your audience wants "
                    f"more depth. {gap.get('interactions', 0)} recent interactions show "
                    f"growing demand for a comprehensive breakdown."
                )
            else:
                desc = (
                    f"While you've covered {topic_name}, audience comments indicate "
                    f"ongoing confusion and unanswered questions. A follow-up or FAQ-style "
                    f"video could address remaining pain points."
                )

            # Determine format from topic name heuristics
            fmt = "Video Tutorial"
            topic_lower = topic_name.lower()
            for keyword, format_name in self.FORMAT_HEURISTICS.items():
                if keyword in topic_lower:
                    fmt = format_name
                    break
            # High score + low coverage → Short can work for virality
            if final_score >= 90 and coverage == "Low":
                fmt = "YouTube Short + Long-form Tutorial"

            opportunities.append({
                "id": idx,
                "title": topic_name,
                "description": desc,
                "score": final_score,
                "questions": max(1, gap.get("interactions", 10) - 5),
                "growth": gap.get("growth", "+0%"),
                "coverage": coverage,
                "format": fmt,
                "trending": 1 if final_score >= 85 else 0
            })

        opportunities.sort(key=lambda x: x["score"], reverse=True)
        return opportunities

    def _call_groq_scorer(self, gaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            prompt = f"""You are an Opportunity Scorer Agent for a YouTube content creator.

Given these audience content gaps detected from real YouTube comments:
{json.dumps(gaps, indent=2)}

For each gap, create a scored Content Opportunity:

1. **title**: A clear, specific topic title (not a video title — e.g. "RAG Pipeline Optimization" not "How to Build RAG")
2. **description**: ONE compelling sentence explaining why this is an opportunity, referencing the audience demand data (interactions, growth, coverage). Be specific, not generic.
3. **score**: 0-100 opportunity score. High demand + Low coverage = high score. High demand + High coverage = medium score.
4. **questions**: The number of audience questions/interactions on this topic
5. **growth**: Trend percentage (e.g. "+34%")
6. **coverage**: "Low", "Medium", or "High" — how well the creator currently covers this
7. **format**: Best content format for this topic: "YouTube Short", "Long-form Tutorial", "Deep Dive Video", "How-to Video", "Tutorial Series", "Comparison Video", or "Comprehensive Guide"
8. **trending**: 1 if score >= 85, else 0

Return JSON:
{{
  "opportunities": [
    {{
      "id": 1,
      "title": "Topic Name",
      "description": "One sentence explaining the opportunity",
      "score": 96,
      "questions": 127,
      "growth": "+34%",
      "coverage": "Low",
      "format": "YouTube Short",
      "trending": 1
    }}
  ]
}}

Sort by score descending. Return at most 8 opportunities."""

            response = run_groq_completion(
                client,
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=700,
            )

            res = json.loads(response.choices[0].message.content)
            return res.get("opportunities", [])
        except Exception as e:
            note_groq_error(e, model="llama-3.1-8b-instant")
            print(f"[OpportunityScorerAgent] Groq API call failed: {e}")
            return []
