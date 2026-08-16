import os
import json
from typing import List, Dict, Any
from collections import Counter
try:
    from .groq_utils import groq_is_available, note_groq_error, run_groq_completion
except ImportError:
    from groq_utils import groq_is_available, note_groq_error, run_groq_completion

class ContentGapDetectorAgent:
    """
    Agent that analyzes identified audience topics against existing channel coverage.
    Determines coverage level (Low, Medium, High) and detects content gaps.
    Uses deterministic analysis by default. Groq is an optional enhancement,
    enabled only with GROQ_ENABLE_ANALYSIS=true.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY_GAP_DETECTOR") or os.getenv("GROQ_API_KEY")
        self.use_groq = os.getenv("GROQ_ENABLE_ANALYSIS", "false").lower() == "true"

    def detect_gaps(self, classified_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if self.groq_api_key and self.use_groq and groq_is_available():
            groq_gaps = self._call_groq_detector(classified_comments)
            if groq_gaps:
                return groq_gaps

        topic_counts = Counter([c["topic"] for c in classified_comments if c.get("topic") and c["topic"] != "General"])

        if not topic_counts:
            return []

        results = []
        max_count = max(topic_counts.values())

        for topic, count in topic_counts.most_common():
            # Without an actual video list, estimate coverage from comment types
            # Topics with lots of CONFUSION/QUESTION comments → Low coverage
            topic_comments = [c for c in classified_comments if c.get("topic") == topic]
            confusion_ratio = len([c for c in topic_comments if c.get("comment_type") in ("CONFUSION", "QUESTION")]) / max(len(topic_comments), 1)

            if confusion_ratio > 0.6:
                coverage = "Low"
            elif confusion_ratio > 0.3:
                coverage = "Medium"
            else:
                coverage = "High"

            # Demand score: weighted by count relative to max, with a floor
            demand_score = min(98, int(55 + (count / max(max_count, 1)) * 40 + len(topic_comments) * 2))
            growth_pct = f"+{min(50, 8 + count * 6)}%"

            results.append({
                "name": topic,
                "interactions": count * 12 + len(topic_comments) * 3,
                "growth": growth_pct,
                "demand": demand_score,
                "coverage": coverage,
                "count": count
            })

        results.sort(key=lambda x: x["demand"], reverse=True)
        return results

    def _call_groq_detector(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            # Summarize comments for a more focused prompt
            topic_summary = Counter([c.get("topic", "General") for c in comments if c.get("topic") != "General"])
            type_summary = Counter([c.get("comment_type", "FEEDBACK") for c in comments])

            comment_samples = []
            for c in comments[:12]:
                comment_samples.append(f"[{c.get('comment_type', '?')}] ({c.get('topic', '?')}) \"{c.get('text', '')[:120]}\"")

            prompt = f"""You are a Content Gap Detector Agent for a YouTube creator.

Analyze these audience comments and identify content topics where there is HIGH audience demand but LOW existing channel coverage.

## AUDIENCE COMMENT SAMPLES
{chr(10).join(comment_samples)}

## TOPIC FREQUENCY
{json.dumps(dict(topic_summary))}

## COMMENT TYPE DISTRIBUTION
{json.dumps(dict(type_summary))}

For each topic, evaluate:
- **interactions**: estimated total engagement volume (realistic number based on comment frequency)
- **growth**: trend percentage showing how fast this topic is growing (e.g. "+28%")
- **demand**: score 0-100 based on how urgently the audience wants this content
- **coverage**: "Low" if the creator clearly hasn't covered this adequately, "Medium" if partially covered, "High" if well covered
- **count**: number of comments related to this topic

Return JSON:
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
}}

Sort by demand score descending. Return at most 8 topics."""

            response = run_groq_completion(
                client,
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=700,
            )

            res = json.loads(response.choices[0].message.content)
            return res.get("gaps", [])
        except Exception as e:
            note_groq_error(e, model="llama-3.1-8b-instant")
            print(f"[ContentGapDetectorAgent] Groq API call failed: {e}")
            return []
