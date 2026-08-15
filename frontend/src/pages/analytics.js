import { ANALYTICS_METRICS as DEMO_METRICS, VIEWS_DATA, TOPICS } from '../data/demo.js';

function renderBarChart(data, w = 500, h = 160) {
  const max = Math.max(...data);
  const barW = (w - (data.length - 1) * 4) / data.length;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bars = data.map((v, i) => {
    const bh = (v / max) * (h - 30);
    const x = i * (barW + 4);
    const y = h - bh - 20;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="var(--accent-primary)" opacity="${i === data.length - 1 ? '1' : '0.5'}"/>
    <text x="${x + barW / 2}" y="${h - 4}" text-anchor="middle" fill="var(--text-muted)" font-size="10">${months[i]}</text>`;
  }).join('');
  return `<div class="chart-area"><svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${bars}</svg></div>`;
}

function renderHorizBar(items) {
  const max = Math.max(...items.map(i => i.value));
  return items.map(item => `
    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-secondary);flex-shrink:0;text-align:right">${item.label}</span>
      <div style="flex:1;height:24px;background:var(--bg-primary);border-radius:var(--radius-sm);overflow:hidden">
        <div style="height:100%;width:${(item.value / max) * 100}%;background:var(--accent-primary);border-radius:var(--radius-sm);opacity:${0.4 + (item.value / max) * 0.6}"></div>
      </div>
      <span style="font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);color:var(--text-primary);width:40px">${item.value}</span>
    </div>
  `).join('');
}

export function renderAnalytics(apiData) {
  const metrics = apiData?.metrics || DEMO_METRICS;
  const aiInsight = apiData?.ai_insight || {
    insight: "AI-agent content is currently outperforming your channel average by 2.4×. Audience interaction around practical tutorials has increased 31% this month.",
    recommendation: "Create more practical AI-agent tutorials."
  };

  const topicPerf = TOPICS.slice(0, 6).map(t => ({ label: t.name, value: t.demand }));
  const formatPerf = [
    { label: 'Long-form', value: 85 },
    { label: 'Shorts', value: 72 },
    { label: 'Tutorial', value: 91 },
    { label: 'Deep Dive', value: 68 },
  ];

  return `
    <div class="page-header">
      <h1 class="page-title">Performance</h1>
      <p class="page-desc">Understand what content is working and what your audience responds to.</p>
    </div>

    <section class="section">
      <div class="ai-insight">
        <div class="ai-insight-label"><i data-lucide="sparkles" style="width:14px;height:14px"></i>AI Insight</div>
        <p class="ai-insight-text">${aiInsight.insight}</p>
        <p class="ai-insight-text" style="font-size:var(--font-size-sm);color:var(--text-secondary)"><strong>Recommendation:</strong> ${aiInsight.recommendation}</p>
        <button class="btn btn-primary btn-sm" style="align-self:flex-start" onclick="_navigate('opportunities')"><i data-lucide="sparkles"></i>Create Recommended Content</button>
      </div>
    </section>

    <section class="section">
      <div class="grid-4">
        ${metrics.map(m => `
          <div class="card card-sm metric-card">
            <span class="metric-card-label">${m.label}</span>
            <span class="metric-card-value">${m.value}</span>
            <span class="metric-card-trend ${m.up ? 'up' : 'down'}">${m.up ? '↑' : '↓'} ${m.trend}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Views Over Time</h3></div>
          ${renderBarChart(VIEWS_DATA)}
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Topic Performance</h3></div>
          ${renderHorizBar(topicPerf)}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="card">
        <div class="card-header"><h3 class="card-title">Content Format Performance</h3></div>
        ${renderHorizBar(formatPerf)}
      </div>
    </section>
  `;
}
