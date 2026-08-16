import os
import json
from typing import Dict, Any, List, Optional
try:
    from .groq_utils import groq_is_available, note_groq_error, run_groq_completion
except ImportError:
    from groq_utils import groq_is_available, note_groq_error, run_groq_completion

class ContentStudioAgent:
    """
    AI Content Studio Generator Agent.
    Converts a selected Content Opportunity into a complete multi-platform
    ready-to-publish content package using real audience signals.
    Uses Groq LLM (llama-3.3-70b-versatile) when GROQ_API_KEY is present.
    """

    def __init__(self):
        self.groq_api_key = (
            os.getenv("GROQ_API_KEY_GENERATOR")
            or os.getenv("GROQ_API_KEY_2")
            or os.getenv("GROQ_API_KEY")
        )

    def generate_package(
        self,
        opportunity_title: str,
        opportunity_desc: str,
        audience_comments: Optional[List[Dict[str, Any]]] = None,
        channel_name: str = "",
        channel_handle: str = "",
        coverage_level: str = "Low",
        growth: str = "+0%",
        questions_count: int = 0,
        suggested_format: str = "Long-form Tutorial",
    ) -> Dict[str, Any]:
        """Generate a full content package. Prefers Groq LLM; falls back to a
        richer template engine when no API key is available."""

        if self.groq_api_key and groq_is_available():
            groq_pkg = self._call_groq_generator(
                opportunity_title,
                opportunity_desc,
                audience_comments or [],
                channel_name,
                channel_handle,
                coverage_level,
                growth,
                questions_count,
                suggested_format,
            )
            if groq_pkg:
                return groq_pkg

        # ── Rich template fallback ──────────────────────────────────
        return self._build_template_package(
            opportunity_title,
            opportunity_desc,
            audience_comments or [],
            channel_name,
            suggested_format,
        )

    # ─── Groq LLM generation ───────────────────────────────────────

    def _call_groq_generator(
        self,
        title: str,
        desc: str,
        comments: List[Dict[str, Any]],
        channel_name: str,
        channel_handle: str,
        coverage: str,
        growth: str,
        questions_count: int,
        suggested_format: str,
    ) -> Optional[Dict[str, Any]]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_api_key)

            # Build a rich, audience-aware comment block
            comment_block = ""
            if comments:
                top_comments = comments[:8]
                formatted = []
                for c in top_comments:
                    ctype = c.get("comment_type", c.get("type", ""))
                    text = c.get("text", "")
                    topic = c.get("topic", "")
                    formatted.append(f"- [{ctype}] ({topic}) \"{text}\"")
                comment_block = "\n".join(formatted)
            else:
                comment_block = "(No audience comments available — generate based on topic expertise)"

            creator_line = ""
            if channel_name or channel_handle:
                creator_line = f"Creator Channel: {channel_name} ({channel_handle})"

            prompt = f"""You are a world-class YouTube content strategist and scriptwriter working for a tech creator.

## CONTEXT
{creator_line}
Topic: {title}
Audience Demand: {desc}
Content Gap Coverage: {coverage} (meaning {'the creator has NOT covered this topic yet — this is a fresh opportunity' if coverage == 'Low' else 'there is some existing coverage but the audience wants more depth' if coverage == 'Medium' else 'the topic has been covered but audience still has unanswered questions'})
Audience Growth Trend: {growth}
Number of Audience Questions on this Topic: {questions_count}
Suggested Format: {suggested_format}

## REAL AUDIENCE COMMENTS (what people are actually asking)
{comment_block}

## YOUR TASK
Create a COMPLETE, production-ready YouTube content package. This must feel like it was written by a professional content strategist who deeply understands the audience. Every section must be specific to the topic, reference real audience pain points from the comments above, and provide genuinely useful structure.

## REQUIREMENTS

### 1. TITLES (3 options)
- Each title must be specific, not generic. Include the actual topic name.
- Use proven title formulas: curiosity gap, number-based, "How I...", challenge, or myth-busting.
- Titles should be 50–70 characters and optimized for YouTube CTR.
- Do NOT use generic templates like "What Every Developer Needs to Know".

### 2. HOOK (first 30 seconds of the video)
- Must immediately address the #1 pain point from the audience comments.
- Open with a bold claim, a relatable problem, or a surprising fact.
- Include a "stay until the end" promise.
- 3–5 sentences maximum. Written in first person, conversational tone.

### 3. SCRIPT (full video script, 800–1200 words)
- Write the ACTUAL script the creator would read/follow, not an outline.
- Use clear section headers with timestamps: # Introduction (0:00), # Section Name (2:30), etc.
- Each section must have:
  * A transition sentence connecting to the previous section
  * Concrete examples, code snippets (if technical), or analogies
  * Specific talking points (not "discuss X" — actually discuss it)
- Address at least 3 specific audience questions from the comments above.
- Include moments marked [B-ROLL], [SCREEN RECORDING], [CODE ON SCREEN] for visual guidance.
- End with a clear call-to-action and a teaser for the next video.

### 4. YOUTUBE DESCRIPTION (SEO-optimized, 800–1200 characters)
- First line: compelling one-sentence summary (appears in search results).
- Timestamps matching the script sections.
- 3–5 relevant resource links (use placeholder URLs).
- Social media links section.
- 2–3 relevant hashtags at the end.

### 5. TAGS (8–12 tags)
- Mix of broad and long-tail keywords.
- Include the exact topic name, related technologies, and audience search terms.

### 6. YOUTUBE SHORT SCRIPT (60 seconds, ~150 words)
- Pick ONE specific insight from the full script.
- Hook in the first 3 seconds.
- Deliver one clear takeaway.
- End with "Full breakdown on the channel."

### 7. LINKEDIN POST (150–250 words)
- Professional tone. Lead with a contrarian take or surprising insight.
- Include 3 bullet points of key takeaways.
- End with a question to drive engagement.
- 3–5 relevant hashtags.

### 8. X/TWITTER THREAD (5 tweets)
- Tweet 1: Bold hook with 🧵 emoji.
- Tweets 2–4: One key insight per tweet with supporting detail.
- Tweet 5: CTA to the full video with link placeholder.

Return ONLY a valid JSON object with these exact keys:
{{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "selected_title_index": 0,
  "hook": "...",
  "script": "...",
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "short_script": "...",
  "linkedin_post": "...",
  "x_thread": "...",
  "status": "ready"
}}"""

            response = run_groq_completion(
                client,
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=2200,
            )

            res = json.loads(response.choices[0].message.content)

            # Normalize list fields to JSON strings for DB storage
            if isinstance(res.get("titles"), list):
                res["titles"] = json.dumps(res["titles"])
            if isinstance(res.get("tags"), list):
                res["tags"] = json.dumps(res["tags"])
            res["selected_title_index"] = 0
            res["status"] = "ready"
            return res

        except Exception as e:
            note_groq_error(e, model="llama-3.3-70b-versatile")
            print(f"[ContentStudioAgent] Groq API call failed: {e}")
            return None

    # ─── Rich template fallback ─────────────────────────────────────

    def _build_template_package(
        self,
        title: str,
        desc: str,
        comments: List[Dict[str, Any]],
        channel_name: str,
        suggested_format: str,
    ) -> Dict[str, Any]:
        """Produce a structured, topic-aware content package without an LLM."""

        # Extract real audience questions to weave into the script
        real_questions = []
        for c in comments[:10]:
            text = c.get("text", "")
            if text and len(text) > 15:
                real_questions.append(text)

        questions_block = ""
        if real_questions:
            questions_block = "\n".join(
                f"  - \"{q}\"" for q in real_questions[:5]
            )
        else:
            questions_block = "  - (Audience questions will appear here after channel analysis)"

        titles = [
            f"{title}: The Complete Hands-On Guide ({suggested_format})",
            f"I Built a {title} From Scratch — Here's What I Learned",
            f"Stop Getting {title} Wrong — 5 Mistakes Everyone Makes",
        ]

        hook = (
            f"I've seen hundreds of comments asking about {title}, and most of you "
            f"are making the same 3 mistakes. In the next 10 minutes, I'm going to "
            f"show you exactly how to do this right — with real code, real examples, "
            f"and the production patterns nobody talks about. "
            f"Stay until the end because I'll share the architecture that changed everything for me."
        )

        script = f"""# Introduction (0:00)
{f'{channel_name} here.' if channel_name else 'Hey everyone.'} So I've been reading through your comments, and there's one topic that keeps coming up over and over again — {title}.

Here are some of the actual questions you've been asking:
{questions_block}

And honestly? Most of the tutorials out there get this completely wrong. So today, we're going to fix that.

[B-ROLL: Topic title card with key stats]

# Why {title} Matters Right Now (1:30)
Let me give you the 30-second context. {desc}

The reason this matters is that most developers either overcomplicate this or skip the fundamentals entirely. And that's where the bugs and performance issues come from.

[SCREEN RECORDING: Show a quick demo of the end result]

# The Architecture You Need to Understand (4:00)
Before we write a single line of code, let's understand what's actually happening under the hood.

Think of it like this — you have three layers:
1. **The Interface Layer** — where your users interact with the system
2. **The Processing Layer** — where the actual logic and orchestration happens  
3. **The Data Layer** — where state is managed and persisted

Most tutorials only show you layer 1 and pretend the other two don't exist. That's why your projects break in production.

[CODE ON SCREEN: Architecture diagram]

# Hands-On Implementation (7:00)
Alright, let's build this step by step.

First, set up your environment. I'm using Python here but the concepts apply everywhere:

```
# Step 1: Project structure
mkdir {title.lower().replace(' ', '-')}-project
cd {title.lower().replace(' ', '-')}-project
```

Now here's where it gets interesting. The key insight that most people miss is that you need to handle the edge cases FIRST, not last.

[SCREEN RECORDING: Live coding walkthrough]

Let me show you what happens when you don't handle errors properly...

And now compare that with the correct approach:

```
# The production-ready pattern
# (Actual implementation details would be filled in by the creator)
```

[CODE ON SCREEN: Side-by-side comparison of naive vs production approach]

# The 5 Mistakes Everyone Makes (12:00)
Based on your comments, here are the patterns I see failing over and over:

1. **Hardcoding configuration** — Use environment variables and config files instead
2. **Ignoring rate limits and retries** — Always implement exponential backoff
3. **No evaluation pipeline** — You can't improve what you can't measure
4. **Skipping error handling** — Production code needs graceful degradation
5. **Not testing with real data** — Synthetic data hides the real problems

[B-ROLL: Each mistake shown with a before/after code comparison]

# Production Best Practices (15:00)
Now that you know what NOT to do, let me show you my production checklist:

- Set up proper logging and monitoring from day one
- Use typed configuration (Pydantic models, TypeScript interfaces)
- Implement health checks and graceful shutdown
- Version your APIs from the start
- Write integration tests, not just unit tests

This is the stuff that separates a tutorial project from something you can actually deploy.

# What's Next? (17:00)
If you found this useful, I've got a follow-up video planned where we take this exact architecture and add [related advanced topic]. Drop a comment below if that's something you want to see.

And if you're still stuck on any of this — leave your specific question in the comments. I read every single one.

Like, subscribe, and I'll see you in the next one."""

        description = f"""{title}: Complete hands-on guide with production-ready patterns and real-world examples.

In this video, I break down {title} from the ground up — covering architecture, implementation, common mistakes, and the production patterns that actually work.

⏱ Timestamps:
0:00 — Introduction & your questions
1:30 — Why {title} matters right now
4:00 — The architecture you need to understand
7:00 — Hands-on implementation walkthrough
12:00 — 5 mistakes everyone makes
15:00 — Production best practices & checklist
17:00 — What's next + your questions answered

📚 Resources:
- Code repository: [LINK]
- Official documentation: [LINK]
- My production template: [LINK]

🔗 Connect:
- Twitter/X: [LINK]
- LinkedIn: [LINK]
- Discord community: [LINK]

#{'#'.join(title.split()[:2])} #{title.replace(' ', '')} #Tutorial #Programming"""

        tags = [
            title,
            f"{title} tutorial",
            f"{title} explained",
            f"how to use {title}",
            f"{title} for beginners",
            f"{title} production",
            "programming tutorial",
            "software engineering",
            "tech",
            f"{title} 2026",
            "coding",
            suggested_format.lower(),
        ]

        short_script = f"""HOOK: "Everyone is getting {title} wrong. Here's why."

Most developers make these 3 critical mistakes with {title}:

Mistake 1: They skip the architecture and jump straight to code.
Mistake 2: They ignore error handling until production breaks.
Mistake 3: They test with fake data and wonder why it fails on real users.

Here's the fix in 30 seconds:
Build your architecture FIRST. Handle errors BEFORE the happy path. Test with REAL data from day one.

I just dropped a full breakdown on the channel. Link in bio.

Full breakdown on the channel."""

        linkedin_post = f"""I spent the last week analyzing audience data, and one topic keeps coming up: {title}.

After building this in production and reading hundreds of developer comments, here are the 3 things most teams get wrong:

→ They treat it as a library problem when it's actually an architecture problem
→ They copy tutorial code without understanding the tradeoffs
→ They skip evaluation entirely and ship blindly

The fix isn't complicated — it's about fundamentals:

• Design your data flow before writing code
• Implement proper error boundaries at every layer
• Build an evaluation pipeline alongside your main feature

I just published a deep-dive video breaking this down with real code and production patterns.

What's the biggest challenge you've faced with {title}? 👇

#SoftwareEngineering #Programming #{title.replace(' ', '')} #TechCareers #BuildInPublic"""

        x_thread = f"""1/5 🧵 {title} — everything I learned building this in production (thread)

2/5 The #1 mistake I see: treating {title} as a plug-and-play library.

It's not. It's an architecture pattern. And if you don't design your system around it, you'll hit scaling walls fast.

3/5 Here's my production checklist:
- Environment-based config (never hardcode)
- Exponential backoff on all external calls
- Structured logging from day 1
- Health checks on every service

4/5 The thing nobody tells you: evaluation matters more than implementation.

You can build {title} in a weekend. Making it WORK reliably takes measurement, iteration, and real user feedback.

5/5 I just published a full video walkthrough with code, architecture diagrams, and the 5 mistakes everyone makes.

Watch it here: [VIDEO LINK]

Drop a 🔥 if you want more production deep-dives."""

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
            "status": "ready",
        }
