from typing import List, Dict, Any
from collections import Counter

class ContentGapDetectorAgent:
    """
    Agent that analyzes identified audience topics against existing channel coverage.
    Determines coverage level (Low, Medium, High) and detects content gaps.
    """

    # Simulated channel library indexed titles
    EXISTING_CHANNEL_VIDEOS = [
        "Getting Started with LangChain",
        "Prompt Engineering 101",
        "Vector Databases Explained",
        "FastAPI Quickstart"
    ]

    def detect_gaps(self, classified_comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        topic_counts = Counter([c["topic"] for c in classified_comments if c["topic"] != "General"])
        
        results = []
        for topic, count in topic_counts.most_common():
            # Check how many existing videos match
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
