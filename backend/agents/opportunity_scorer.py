import os
import json
from typing import List, Dict, Any

class OpportunityScorerAgent:
    """
    Ranks audience demand clusters into priority Content Opportunities (0-100 score).
    Uses Groq LLM (llama-3.3-70b-versatile) when GROQ_API_KEY is available.
    """

    FORMAT_MAP = {
        "AI Agents": "YouTube Short",
        "MCP": "Long-form Tutorial",
        "RAG": "Deep Dive Video",
        "FastAPI": "Tutorial Series",
        "Ollama": "How-to Video",
        "LangChain": "Comprehensive Guide"
    }

    DESC_MAP = {
        "AI Agents": "Your audience repeatedly asks for a clear explanation of how AI agents differ from traditional LLM applications like ChatGPT.",
        "MCP": "Multiple viewers are requesting a step-by-step walkthrough of the Model Context Protocol and how to build custom MCP servers.",
        "RAG": "Audience members are confused about chunking strategies, embedding selection, and retrieval optimization in RAG systems.",
        "FastAPI": "Growing demand for a practical guide on integrating LangChain agents with FastAPI for production deployments.",
        "Ollama": "Viewers want to know how to run LLMs locally with Ollama, vLLM, and llama.cpp for development and privacy."
    }

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")

    def score_opportunities(self, gap_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if self.groq_api_key:
            groq_opps = self._call_groq_scorer(gap_results)
            if groq_opps:
                return groq_opps

        opportunities = []
        for idx, gap in enumerate(gap_results, 1):
            cov_penalty = 30 if gap["coverage"] == "High" else 15 if gap["coverage"] == "Medium" else 0
            raw_score = int(gap["demand"] * 0.8 + gap.get("count", 1) * 4 - cov_penalty)
            final_score = max(50, min(99, raw_score))

            title_prefix = f"{gap['name']} Guide"
            if gap['name'] == 'AI Agents':
                title_prefix = "AI Agents vs ChatGPT"
            elif gap['name'] == 'MCP':
                title_prefix = "Complete MCP Tutorial"
            elif gap['name'] == 'RAG':
                title_prefix = "RAG Pipeline Best Practices"

            desc = self.DESC_MAP.get(gap['name'], f"High demand detected for {gap['name']} with {gap['coverage'].lower()} existing channel coverage.")

            opportunities.append({
                "id": idx,
                "title": title_prefix,
                "description": desc,
                "score": final_score,
                "questions": gap["interactions"] - 10,
                "growth": gap["growth"],
                "coverage": gap["coverage"],
                "format": self.FORMAT_MAP.get(gap['name'], "Video Tutorial"),
                "trending": 1 if final_score >= 85 else 0
            })

        opportunities.sort(key=lambda x: x["score"], reverse=True)
        return opportunities

    def _call_groq_scorer(self, gaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            prompt = f"""You are an Opportunity Scorer Agent.
Given these audience content gaps:
{json.dumps(gaps)}

Rank and generate Content Opportunities JSON:
{{
  "opportunities": [
    {{
      "id": 1,
      "title": "Clear Actionable Title",
      "description": "One sentence explaining audience demand and opportunity",
      "score": 96,
      "questions": 127,
      "growth": "+34%",
      "coverage": "Low",
      "format": "YouTube Short",
      "trending": 1
    }}
  ]
}}"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            res = json.loads(response.choices[0].message.content)
            return res.get("opportunities", [])
        except Exception as e:
            print(f"[OpportunityScorerAgent] Groq API call failed: {e}")
            return []
