// AudienceOS Demo Data — AI Engineering Daily
export const DEMO_CHANNEL = {
  name: 'Ankit',
  channelName: 'AI Engineering Daily',
  avatar: 'A',
  connected: true,
};

export const KPI = [
  { label: 'Comments Analyzed', value: '8,421', trend: '+12% this month', up: true, icon: 'message-square' },
  { label: 'Topics Discovered', value: '127', trend: '18 new this week', up: true, icon: 'layers' },
  { label: 'Content Gaps', value: '23', trend: '7 high priority', up: null, icon: 'target' },
  { label: 'High-Priority Opportunities', value: '7', trend: '3 trending now', up: true, icon: 'trending-up' },
];

export const OPPORTUNITIES = [
  {
    id: 1,
    title: 'AI Agents vs ChatGPT',
    desc: 'Your audience repeatedly asks for a clear explanation of how AI agents differ from traditional LLM applications like ChatGPT.',
    score: 96,
    questions: 127,
    growth: '+34%',
    coverage: 'Low',
    format: 'YouTube Short',
    trending: true,
  },
  {
    id: 2,
    title: 'Complete MCP Tutorial',
    desc: 'Multiple viewers are requesting a step-by-step walkthrough of the Model Context Protocol and how to build custom MCP servers.',
    score: 91,
    questions: 98,
    growth: '+28%',
    coverage: 'Low',
    format: 'Long-form Tutorial',
    trending: true,
  },
  {
    id: 3,
    title: 'RAG Pipeline Best Practices',
    desc: 'Audience members are confused about chunking strategies, embedding selection, and retrieval optimization in RAG systems.',
    score: 84,
    questions: 73,
    growth: '+21%',
    coverage: 'Medium',
    format: 'Deep Dive Video',
    trending: false,
  },
  {
    id: 4,
    title: 'Building with FastAPI + LangChain',
    desc: 'Growing demand for a practical guide on integrating LangChain agents with FastAPI for production deployments.',
    score: 78,
    questions: 62,
    growth: '+14%',
    coverage: 'Medium',
    format: 'Tutorial Series',
    trending: false,
  },
  {
    id: 5,
    title: 'Local LLM Setup Guide',
    desc: 'Viewers want to know how to run LLMs locally with Ollama, vLLM, and llama.cpp for development and privacy.',
    score: 72,
    questions: 54,
    growth: '+11%',
    coverage: 'Medium',
    format: 'How-to Video',
    trending: false,
  },
];

export const TOPICS = [
  { name: 'AI Agents', interactions: 184, growth: '+34%', demand: 96, coverage: 'Low', opportunity: 96 },
  { name: 'MCP', interactions: 91, growth: '+28%', demand: 88, coverage: 'Low', opportunity: 91 },
  { name: 'RAG', interactions: 73, growth: '+21%', demand: 82, coverage: 'Medium', opportunity: 84 },
  { name: 'FastAPI', interactions: 62, growth: '+14%', demand: 71, coverage: 'Medium', opportunity: 78 },
  { name: 'LangChain', interactions: 58, growth: '+12%', demand: 68, coverage: 'High', opportunity: 62 },
  { name: 'Ollama', interactions: 54, growth: '+11%', demand: 65, coverage: 'Medium', opportunity: 72 },
  { name: 'Vector Databases', interactions: 47, growth: '+9%', demand: 58, coverage: 'Medium', opportunity: 61 },
  { name: 'Prompt Engineering', interactions: 43, growth: '+6%', demand: 52, coverage: 'High', opportunity: 48 },
  { name: 'Fine-tuning', interactions: 38, growth: '+8%', demand: 55, coverage: 'Low', opportunity: 67 },
  { name: 'Multi-agent Systems', interactions: 35, growth: '+19%', demand: 61, coverage: 'Low', opportunity: 74 },
];

export const COMMENTS = [
  { id: 1, avatar: 'SK', text: 'Can you explain how AI agents actually work? Like the difference between tool-calling and autonomous agents?', type: 'REQUEST', topic: 'AI Agents', priority: 'High', time: '2 hours ago' },
  { id: 2, avatar: 'PM', text: 'Can you make a complete MCP tutorial? I\'m struggling with the server setup and tool registration.', type: 'REQUEST', topic: 'MCP', priority: 'High', time: '3 hours ago' },
  { id: 3, avatar: 'RT', text: 'I\'m confused about when to use RAG vs fine-tuning. Your last video mentioned both but didn\'t compare them.', type: 'CONFUSION', topic: 'RAG', priority: 'Medium', time: '5 hours ago' },
  { id: 4, avatar: 'AL', text: 'Would love to see a production-ready FastAPI + LangChain project. Most tutorials only show toy examples.', type: 'REQUEST', topic: 'FastAPI', priority: 'Medium', time: '8 hours ago' },
  { id: 5, avatar: 'JD', text: 'What\'s the best way to run Llama 3 locally on a Mac? Ollama vs llama.cpp?', type: 'QUESTION', topic: 'Ollama', priority: 'Medium', time: '12 hours ago' },
  { id: 6, avatar: 'MK', text: 'The multi-agent pattern you showed was amazing. Can you do a full project using CrewAI or AutoGen?', type: 'IDEA', topic: 'AI Agents', priority: 'High', time: '1 day ago' },
  { id: 7, avatar: 'NR', text: 'I keep getting bad results with my RAG pipeline. Chunking seems wrong but I don\'t know how to fix it.', type: 'CONFUSION', topic: 'RAG', priority: 'High', time: '1 day ago' },
  { id: 8, avatar: 'VT', text: 'Great content on LangChain! Can you cover LangGraph next? The documentation is really confusing.', type: 'FEEDBACK', topic: 'LangChain', priority: 'Low', time: '2 days ago' },
];

export const AUDIENCE_STATS = [
  { label: 'Questions', count: '1,284', color: 'info' },
  { label: 'Requests', count: '742', color: 'accent' },
  { label: 'Confusion', count: '391', color: 'warning' },
  { label: 'Feedback', count: '284', color: 'success' },
  { label: 'Ideas', count: '178', color: 'default' },
];

export const CONTENT_TITLES = [
  'AI Agents vs ChatGPT: What Every Developer Needs to Know',
  'AI Agents Explained: Beyond Simple Chatbots',
  'The Real Difference Between AI Agents and ChatGPT',
];

export const CONTENT_HOOK = `If you think an AI agent is just ChatGPT with tools, here's what you're missing. In this video, I'll break down the fundamental difference between a chatbot, a tool-calling workflow, and an autonomous agent — with practical examples you can build today.`;

export const CONTENT_SCRIPT = `Let me start with a question: When someone says "AI agent," what do you picture?

Most people imagine ChatGPT with access to the internet. But that's like saying a self-driving car is just a regular car with GPS. The difference is fundamental.

[Section 1: What is a Chatbot?]
A chatbot takes your input, processes it through a language model, and gives you an output. It's stateless — each conversation is independent. Think of it as a very sophisticated autocomplete.

[Section 2: Tool-Calling Workflows]
When we add tools — web search, code execution, database queries — we get something more powerful. The LLM decides which tool to use, calls it, and incorporates the result. This is what most people call an "AI agent" today. But it's not quite there yet.

[Section 3: Autonomous Agents]
A true agent has a goal, can plan multi-step actions, maintain state across interactions, and adapt its strategy based on results. It doesn't just respond — it acts with purpose.

[Conclusion]
The key insight? It's about autonomy, not capability. A chatbot responds. A tool-caller executes. An agent decides.`;

export const CONTENT_DESCRIPTION = `In this video, I break down the real differences between AI chatbots, tool-calling LLMs, and autonomous AI agents.

🔑 Key Topics:
- What makes a chatbot different from an agent
- How tool-calling works under the hood  
- The autonomy spectrum in AI systems
- Practical examples of each approach

📚 Resources mentioned in this video:
- LangChain Agents documentation
- AutoGen framework
- CrewAI for multi-agent systems`;

export const CONTENT_TAGS = ['AI Agents', 'ChatGPT', 'LLM', 'AI Tutorial', 'LangChain', 'Autonomous AI', 'Tool Calling'];

export const CALENDAR_ITEMS = [
  { day: 18, platform: 'YouTube', title: 'AI Agents Explained', status: 'Ready', type: 'yt' },
  { day: 19, platform: 'Short', title: 'AI Agents vs ChatGPT', status: 'Draft', type: 'short' },
  { day: 20, platform: 'LinkedIn', title: 'Why AI agents matter', status: 'Ready', type: 'linkedin' },
  { day: 21, platform: 'X', title: 'Agent thread breakdown', status: 'Draft', type: 'x' },
  { day: 25, platform: 'YouTube', title: 'MCP Tutorial Part 1', status: 'Draft', type: 'yt' },
  { day: 26, platform: 'Short', title: 'MCP in 60 seconds', status: 'Draft', type: 'short' },
  { day: 27, platform: 'LinkedIn', title: 'MCP overview post', status: 'Ready', type: 'linkedin' },
];

export const ANALYTICS_METRICS = [
  { label: 'Total Views', value: '142.8K', trend: '+18% vs last month', up: true },
  { label: 'Engagement Rate', value: '8.4%', trend: '+2.1% vs last month', up: true },
  { label: 'New Comments', value: '1,247', trend: '+31% vs last month', up: true },
  { label: 'Avg. Watch Time', value: '6m 42s', trend: '+12% vs last month', up: true },
];

// SVG chart data points for mini sparkline-style charts
export const TREND_DATA = {
  'AI Agents': [20, 28, 35, 42, 50, 58, 72, 85, 92, 96],
  'MCP': [10, 14, 18, 22, 30, 38, 48, 55, 68, 82],
  'RAG': [30, 32, 38, 42, 48, 52, 55, 60, 65, 71],
};

export const VIEWS_DATA = [32, 45, 38, 52, 48, 67, 72, 58, 85, 91, 78, 95];
