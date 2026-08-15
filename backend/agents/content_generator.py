import os
import json
from typing import Dict, Any

class ContentStudioAgent:
    """
    AI Content Studio Generator Agent.
    Converts a selected Content Opportunity into a complete multi-platform ready-to-publish content package.
    Uses Groq LLM (llama-3.3-70b-versatile) when GROQ_API_KEY is present.
    """

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY_GENERATOR") or os.getenv("GROQ_API_KEY")

    def generate_package(self, opportunity_title: str, opportunity_desc: str) -> Dict[str, Any]:
        if self.groq_api_key:
            groq_pkg = self._call_groq_generator(opportunity_title, opportunity_desc)
            if groq_pkg:
                return groq_pkg

        titles = [
            f"{opportunity_title}: What Every Developer Needs to Know",
            f"{opportunity_title} Explained: Complete 2026 Guide",
            f"The Real Truth About {opportunity_title}"
        ]

        hook = f"If you think {opportunity_title} is complicated, here's what you're missing. In this video, I'll break down everything step-by-step with practical code you can run today."

        script = f"""Let me start with a question: Why is everyone in AI talking about {opportunity_title}?

[Section 1: The Core Problem]
Most developers struggle with understanding the fundamental architecture. In simple terms: {opportunity_desc}

[Section 2: Practical Step-by-Step Walkthrough]
Let's look at the code implementation. We set up the environment, define our pipeline, and handle edge cases gracefully.

[Section 3: Production Pitfalls & Best Practices]
Avoid these 3 common mistakes when deploying to production:
1. Hardcoding parameters
2. Ignoring rate limits
3. Skipping evaluation

[Conclusion]
Key takeaway: Focus on autonomy and clean architecture."""

        description = f"""In this video, we dive deep into {opportunity_title}.

🔑 Key Topics Covered:
- Fundamental architecture overview
- Step-by-step code implementation
- Production best practices & common pitfalls

📚 Links & Resources:
- Code repository link in comments
- Documentation guide"""

        tags = [opportunity_title, "AI Tutorial", "Python", "FastAPI", "Machine Learning", "Software Engineering"]

        short_script = f"3 things you MUST know about {opportunity_title} in 60 seconds!\n1. It changes how LLMs communicate.\n2. Tool calling is step 1, autonomy is step 2.\n3. Subscribe for the full deep dive!"
        linkedin_post = f"🚀 High demand topic alert: {opportunity_title}\n\nHere is a breakdown of why this matters for modern software engineering teams...\n\n#AI #Engineering #Tech"
        x_thread = f"1/5 Why {opportunity_title} is taking over AI development 🧵👇"

        return {
            "titles": json.dumps(titles),
            "selected_title_index": 0,
            "hook": hook,
            "script": script,
            "description": description,
            "tags": json.dumps(tags),
            "short_script": short_script,
            "linkedin_post": linkedin_post,
            "x_thread": x_thread,
            "status": "ready"
        }

    def _call_groq_generator(self, title: str, desc: str) -> Dict[str, Any]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            prompt = f"""You are an expert Content Studio AI Agent for YouTube Creators.
Generate a complete ready-to-publish content package for:
Topic Title: {title}
Audience Description: {desc}

Return a valid JSON object with:
{{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "selected_title_index": 0,
  "hook": "Compelling 30-second video hook",
  "script": "Full structured YouTube video script with section headers",
  "description": "SEO friendly YouTube video description with timestamps and links",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "short_script": "60-second YouTube Short script",
  "linkedin_post": "Professional LinkedIn post breakdown",
  "x_thread": "Viral X/Twitter thread starting with 1/5",
  "status": "ready"
}}"""

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            res = json.loads(response.choices[0].message.content)
            res["titles"] = json.dumps(res.get("titles", [])) if isinstance(res.get("titles"), list) else res.get("titles", "[]")
            res["tags"] = json.dumps(res.get("tags", [])) if isinstance(res.get("tags"), list) else res.get("tags", "[]")
            res["selected_title_index"] = 0
            res["status"] = "ready"
            return res
        except Exception as e:
            print(f"[ContentStudioAgent] Groq API call failed: {e}")
            return None
