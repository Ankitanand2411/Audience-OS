from typing import List, Dict, Any

class OpportunityScorerAgent:
    """
    Ranks audience demand clusters into priority Content Opportunities (0-100 score).
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

    def score_opportunities(self, gap_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        opportunities = []
        
        for idx, gap in enumerate(gap_results, 1):
            cov_penalty = 30 if gap["coverage"] == "High" else 15 if gap["coverage"] == "Medium" else 0
            # Formula: (Demand * 0.6) + GrowthBonus - CoveragePenalty
            raw_score = int(gap["demand"] * 0.8 + gap["count"] * 4 - cov_penalty)
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
