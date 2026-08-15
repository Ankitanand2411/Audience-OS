import json
from typing import Dict, Any

class ContentStudioAgent:
    """
    AI Content Studio Generator Agent.
    Converts a selected Content Opportunity into a complete multi-platform ready-to-publish content package.
    """

    def generate_package(self, opportunity_title: str, opportunity_desc: str) -> Dict[str, Any]:
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
